import { createHmac, timingSafeEqual } from "node:crypto";
const fail = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};
export function createPayments(db) {
  for (const [name, type] of [
    ["payment_status", "TEXT NOT NULL DEFAULT 'demo'"],
    ["stripe_session_id", "TEXT"],
    ["fulfillment_status", "TEXT NOT NULL DEFAULT 'unfulfilled'"],
    ["customer_email", "TEXT"],
    ["shipping_json", "TEXT"],
    ["subtotal", "INTEGER"],
  ]) {
    if (
      !db
        .prepare("PRAGMA table_info(orders)")
        .all()
        .some((c) => c.name === name)
    )
      db.exec(`ALTER TABLE orders ADD COLUMN ${name} ${type}`);
  }
  db.exec(
    "CREATE TABLE IF NOT EXISTS payment_events (id TEXT PRIMARY KEY, received_at TEXT NOT NULL)",
  );
  function account(storeId) {
    return db
      .prepare(
        "SELECT m.stripe_account_id FROM stores s JOIN merchants m ON m.id=s.owner_id WHERE s.id=?",
      )
      .get(storeId)?.stripe_account_id;
  }
  function mode(storeId) {
    return process.env.STRIPE_SECRET_KEY
      ? storeId && !account(storeId)
        ? "setup-required"
        : "stripe"
      : "demo";
  }
  function assertReady(store) {
    if (mode(store.id) === "setup-required")
      fail("This merchant has not connected payments yet.", 503);
    if (mode(store.id) === "stripe") {
      let url;
      try {
        url = new URL(process.env.PUBLIC_APP_URL);
      } catch {
        fail(
          "Secure checkout is not available yet. Please contact the merchant.",
          503,
        );
      }
      if (url.protocol !== "https:" || !process.env.STRIPE_WEBHOOK_SECRET)
        fail(
          "Secure checkout is not available yet. Please contact the merchant.",
          503,
        );
    }
  }
  function release(orderId, status) {
    db.exec("BEGIN IMMEDIATE");
    try {
      const order = db.prepare("SELECT * FROM orders WHERE id=?").get(orderId);
      if (order?.payment_status === "pending") {
        for (const item of db
          .prepare("SELECT * FROM order_items WHERE order_id=?")
          .all(orderId))
          db.prepare(
            "UPDATE products SET inventory=inventory+? WHERE id=? AND store_id=?",
          ).run(item.quantity, item.product_id, order.store_id);
        db.prepare("UPDATE orders SET payment_status=? WHERE id=?").run(
          status,
          orderId,
        );
      }
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  }
  async function checkout(order, store, items) {
    if (mode(store.id) === "demo")
      return {
        id: order.id,
        total: order.total,
        mode: "demo",
        message: "Demo order saved. No payment was collected.",
      };
    const origin = new URL(process.env.PUBLIC_APP_URL).origin;
    const data = new URLSearchParams({
      mode: "payment",
      client_reference_id: order.id,
      success_url: `${origin}/store/${store.slug}?checkout=success`,
      cancel_url: `${origin}/store/${store.slug}?checkout=cancelled`,
      expires_at: String(Math.floor(Date.now() / 1000) + 1800),
    });
    if (order.customer_email) data.set("customer_email", order.customer_email);
    data.set("shipping_options[0][shipping_rate_data][type]", "fixed_amount");
    data.set(
      "shipping_options[0][shipping_rate_data][fixed_amount][currency]",
      "usd",
    );
    data.set(
      "shipping_options[0][shipping_rate_data][fixed_amount][amount]",
      String(store.shipping_fee || 0),
    );
    data.set(
      "shipping_options[0][shipping_rate_data][display_name]",
      store.shipping_fee ? "Standard delivery" : "Complimentary delivery",
    );
    if (process.env.STRIPE_AUTOMATIC_TAX === "true")
      data.set("automatic_tax[enabled]", "true");
    const countries = (process.env.SHIPPING_COUNTRIES || "US")
      .split(",")
      .map((v) => v.trim().toUpperCase())
      .filter((v) => /^[A-Z]{2}$/.test(v));
    countries.forEach((country, i) =>
      data.set(`shipping_address_collection[allowed_countries][${i}]`, country),
    );
    items.forEach((p, i) => {
      data.set(`line_items[${i}][quantity]`, String(p.quantity));
      data.set(`line_items[${i}][price_data][currency]`, "usd");
      data.set(`line_items[${i}][price_data][unit_amount]`, String(p.price));
      data.set(`line_items[${i}][price_data][product_data][name]`, p.title);
    });
    try {
      const response = await fetch(
        "https://api.stripe.com/v1/checkout/sessions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
            "Stripe-Account": account(store.id),
            "Content-Type": "application/x-www-form-urlencoded",
            "Idempotency-Key": `myverse-${order.id}`,
          },
          body: data,
          signal: AbortSignal.timeout(20000),
        },
      );
      if (!response.ok) throw Error("provider");
      const session = await response.json();
      if (
        !session.id ||
        new URL(session.url).hostname !== "checkout.stripe.com"
      )
        throw Error("response");
      db.prepare("UPDATE orders SET stripe_session_id=? WHERE id=?").run(
        session.id,
        order.id,
      );
      return {
        id: order.id,
        total: order.total,
        mode: "stripe",
        checkoutUrl: session.url,
      };
    } catch {
      release(order.id, "failed");
      fail(
        "Checkout could not be opened. No payment was collected. Please try again.",
        502,
      );
    }
  }
  async function webhook(req) {
    if (!process.env.STRIPE_WEBHOOK_SECRET)
      fail("Payment webhooks are not configured.", 503);
    let raw = "";
    for await (const chunk of req) {
      raw += chunk;
      if (Buffer.byteLength(raw) > 262144) fail("Webhook too large.", 413);
    }
    const signature = req.headers["stripe-signature"] || "",
      timestamp = signature.match(/(?:^|,)t=(\d+)(?:,|$)/)?.[1];
    const signatures = [
      ...signature.matchAll(/(?:^|,)v1=([a-f0-9]{64})(?=,|$)/g),
    ].map((m) => m[1]);
    if (!timestamp || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300)
      fail("Invalid payment signature.");
    const expected = createHmac("sha256", process.env.STRIPE_WEBHOOK_SECRET)
      .update(`${timestamp}.${raw}`)
      .digest();
    if (
      !signatures.some((s) => timingSafeEqual(Buffer.from(s, "hex"), expected))
    )
      fail("Invalid payment signature.");
    let event;
    try {
      event = JSON.parse(raw);
    } catch {
      fail("Invalid webhook JSON.");
    }
    if (typeof event.id !== "string" || typeof event.type !== "string")
      fail("Invalid payment event.");
    if (db.prepare("SELECT id FROM payment_events WHERE id=?").get(event.id))
      return { received: true };
    const session = event.data?.object,
      order = session?.client_reference_id
        ? db
            .prepare("SELECT * FROM orders WHERE id=?")
            .get(session.client_reference_id)
        : null;
    if (
      order &&
      order.stripe_session_id === session.id &&
      event.account === account(order.store_id)
    ) {
      if (
        [
          "checkout.session.completed",
          "checkout.session.async_payment_succeeded",
        ].includes(event.type) &&
        session.payment_status === "paid"
      ) {
        if (
          session.currency !== "usd" ||
          session.amount_subtotal !== (order.subtotal ?? order.total) ||
          !Number.isSafeInteger(session.amount_total)
        )
          fail("Payment amount did not match the order.");
        if (order.payment_status === "pending")
          db.prepare(
            "UPDATE orders SET payment_status='paid',total=?,customer=?,customer_email=?,shipping_json=? WHERE id=?",
          ).run(
            session.amount_total,
            session.customer_details?.name || order.customer,
            session.customer_details?.email || order.customer_email,
            JSON.stringify(
              session.collected_information?.shipping_details ||
                session.shipping_details ||
                {},
            ),
            order.id,
          );
      } else if (
        [
          "checkout.session.expired",
          "checkout.session.async_payment_failed",
        ].includes(event.type)
      )
        release(
          order.id,
          event.type.endsWith("expired") ? "expired" : "failed",
        );
    }
    db.prepare("INSERT INTO payment_events VALUES (?,?)").run(
      event.id,
      new Date().toISOString(),
    );
    return { received: true };
  }
  return { mode, assertReady, checkout, webhook };
}
