import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { Readable } from "node:stream";
import { randomBytes, createHmac } from "node:crypto";
import { createUsage } from "../server/usage.mjs";
import { createPayments } from "../server/payments.mjs";

test("AI allowances persist and stop requests at daily and monthly limits", () => {
  const db = new DatabaseSync(":memory:"),
    usage = createUsage(db);
  const id = usage.reserve("first");
  usage.settle(id, { prompt_tokens: 1000, completion_tokens: 100 });
  assert.equal(
    db.prepare("SELECT cost_micro_usd FROM ai_requests WHERE id=?").get(id)
      .cost_micro_usd,
    1120,
  );
  for (let i = 1; i < 20; i++) usage.reserve("first");
  assert.throws(() => usage.reserve("first"), /allowance/);
  for (let store = 0; store < 4; store++)
    for (let i = 0; i < 20; i++) usage.reserve(`other-${store}`);
  assert.throws(() => usage.reserve("sixth"), /allowance/);
  db.exec("DELETE FROM ai_requests");
  const day = new Date().toISOString().slice(0, 10);
  db.prepare("INSERT INTO ai_requests VALUES (?,?,?,?,?)").run(
    "budget",
    "first",
    day,
    day.slice(0, 7),
    4990000,
  );
  assert.throws(() => createUsage(db).reserve("new"), /allowance/);
  db.close();
});

test("Stripe signatures, payment state, and expired reservations are verified", async (t) => {
  const db = new DatabaseSync(":memory:");
  db.exec(
    `CREATE TABLE merchants(id TEXT PRIMARY KEY,stripe_account_id TEXT);CREATE TABLE stores(id TEXT PRIMARY KEY,owner_id TEXT);CREATE TABLE products(id TEXT PRIMARY KEY,store_id TEXT,inventory INTEGER);CREATE TABLE orders(id TEXT PRIMARY KEY,store_id TEXT,customer TEXT,total INTEGER);CREATE TABLE order_items(order_id TEXT,product_id TEXT,quantity INTEGER);INSERT INTO merchants VALUES ('owner','acct_example');INSERT INTO stores VALUES ('store','owner');INSERT INTO products VALUES ('product','store',3);`,
  );
  const payments = createPayments(db),
    original = process.env.STRIPE_WEBHOOK_SECRET;
  process.env.STRIPE_WEBHOOK_SECRET = randomBytes(24).toString("hex");
  t.after(() => {
    if (original === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
    else process.env.STRIPE_WEBHOOK_SECRET = original;
    db.close();
  });
  db.prepare(
    "INSERT INTO orders (id,store_id,customer,total,subtotal,payment_status,stripe_session_id) VALUES (?,?,?,?,?,?,?)",
  ).run(
    "paid-order",
    "store",
    "Customer",
    10000,
    10000,
    "pending",
    "cs_example",
  );
  const event = {
    id: "evt_paid",
    type: "checkout.session.completed",
    account: "acct_example",
    data: {
      object: {
        id: "cs_example",
        client_reference_id: "paid-order",
        currency: "usd",
        amount_subtotal: 10000,
        amount_total: 10800,
        payment_status: "paid",
        customer_details: { name: "Buyer", email: "buyer@example.test" },
        collected_information: {
          shipping_details: { address: { city: "Chicago" } },
        },
      },
    },
  };
  async function send(value, valid = true) {
    const raw = JSON.stringify(value),
      timestamp = Math.floor(Date.now() / 1000),
      signature = createHmac(
        "sha256",
        valid ? process.env.STRIPE_WEBHOOK_SECRET : "invalid-signature-key",
      )
        .update(`${timestamp}.${raw}`)
        .digest("hex");
    const req = Readable.from([raw]);
    req.headers = { "stripe-signature": `t=${timestamp},v1=${signature}` };
    return payments.webhook(req);
  }
  await assert.rejects(send(event, false), /signature/);
  assert.equal(
    db.prepare("SELECT payment_status FROM orders WHERE id='paid-order'").get()
      .payment_status,
    "pending",
  );
  await send(event);
  await send(event);
  assert.equal(
    db.prepare("SELECT payment_status FROM orders WHERE id='paid-order'").get()
      .payment_status,
    "paid",
  );
  assert.equal(
    db.prepare("SELECT total FROM orders WHERE id='paid-order'").get().total,
    10800,
  );
  await send({
    ...event,
    id: "evt_paid_again",
    type: "checkout.session.async_payment_succeeded",
  });
  const mismatch = {
    ...event,
    id: "evt_wrong_amount",
    data: { object: { ...event.data.object, amount_subtotal: 1 } },
  };
  await assert.rejects(send(mismatch), /amount/);
  db.prepare(
    "INSERT INTO orders (id,store_id,customer,total,payment_status,stripe_session_id) VALUES (?,?,?,?,?,?)",
  ).run("expired-order", "store", "Customer", 10000, "pending", "cs_expired");
  db.prepare("INSERT INTO order_items VALUES (?,?,?)").run(
    "expired-order",
    "product",
    2,
  );
  const expired = {
    id: "evt_expired",
    type: "checkout.session.expired",
    account: "acct_example",
    data: {
      object: { id: "cs_expired", client_reference_id: "expired-order" },
    },
  };
  await send(expired);
  await send({ ...expired, id: "evt_expired_duplicate" });
  assert.equal(
    db.prepare("SELECT inventory FROM products WHERE id='product'").get()
      .inventory,
    5,
  );
  assert.equal(
    db
      .prepare("SELECT payment_status FROM orders WHERE id='expired-order'")
      .get().payment_status,
    "expired",
  );
});
