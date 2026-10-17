import { randomBytes, createHash } from "node:crypto";
const fail = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};
export function createBilling(db, auth) {
  if (
    !db
      .prepare("PRAGMA table_info(merchants)")
      .all()
      .some((c) => c.name === "stripe_account_id")
  )
    db.exec("ALTER TABLE merchants ADD COLUMN stripe_account_id TEXT");
  db.exec(
    "CREATE TABLE IF NOT EXISTS stripe_states (state_hash TEXT PRIMARY KEY, merchant_id TEXT NOT NULL REFERENCES merchants(id), expires_at INTEGER NOT NULL)",
  );
  const digest = (value) => createHash("sha256").update(value).digest("hex");
  const configured = () =>
    Boolean(
      process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_CONNECT_CLIENT_ID &&
      process.env.PUBLIC_APP_URL,
    );
  async function handle(req, res, path, send) {
    if (!path.startsWith("/api/payments/")) return false;
    const user = auth.requireUser(req),
      merchant = db.prepare("SELECT * FROM merchants WHERE id=?").get(user.id);
    if (path === "/api/payments/status" && req.method === "GET") {
      send(200, {
        configured: configured(),
        connected: Boolean(merchant.stripe_account_id),
      });
      return true;
    }
    if (!configured())
      fail(
        "Stripe Connect needs to be configured securely by the platform owner before merchant payments can be connected.",
        503,
      );
    const origin = new URL(process.env.PUBLIC_APP_URL).origin;
    if (!origin.startsWith("https://"))
      fail("Stripe Connect requires an HTTPS public app URL.", 503);
    if (path === "/api/payments/connect" && req.method === "GET") {
      if (merchant.stripe_account_id)
        fail("A Stripe account is already connected to this workspace.", 409);
      const state = randomBytes(32).toString("hex");
      db.prepare("DELETE FROM stripe_states WHERE expires_at<=?").run(
        Date.now(),
      );
      db.prepare("INSERT INTO stripe_states VALUES (?,?,?)").run(
        digest(state),
        user.id,
        Date.now() + 10 * 60000,
      );
      const query = new URLSearchParams({
        response_type: "code",
        client_id: process.env.STRIPE_CONNECT_CLIENT_ID,
        scope: "read_write",
        state,
        redirect_uri: `${origin}/api/payments/callback`,
      });
      send(200, { url: `https://connect.stripe.com/oauth/authorize?${query}` });
      return true;
    }
    if (path === "/api/payments/callback" && req.method === "GET") {
      const params = new URL(req.url, origin).searchParams,
        state = params.get("state") || "";
      const pending = db
        .prepare(
          "SELECT * FROM stripe_states WHERE state_hash=? AND expires_at>?",
        )
        .get(digest(state), Date.now());
      if (!pending || pending.merchant_id !== user.id)
        fail("This payment connection has expired. Start again from Payments.");
      db.prepare("DELETE FROM stripe_states WHERE state_hash=?").run(
        digest(state),
      );
      if (params.has("error") || !params.get("code")) {
        res.writeHead(303, { Location: "/?payments=cancelled" });
        res.end();
        return true;
      }
      let response;
      try {
        response = await fetch("https://connect.stripe.com/oauth/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code: params.get("code"),
            client_secret: process.env.STRIPE_SECRET_KEY,
          }),
          signal: AbortSignal.timeout(20000),
        });
      } catch {
        fail("Stripe could not be reached. Try connecting again.", 502);
      }
      if (!response.ok)
        fail(
          "Stripe did not accept this connection. Try again from Payments.",
          502,
        );
      const result = await response.json();
      if (!/^acct_[A-Za-z0-9]+$/.test(result.stripe_user_id))
        fail("Invalid payment account response.", 502);
      db.prepare("UPDATE merchants SET stripe_account_id=? WHERE id=?").run(
        result.stripe_user_id,
        user.id,
      );
      res.writeHead(303, { Location: "/?payments=connected" });
      res.end();
      return true;
    }
    fail("Payment endpoint not found.", 404);
  }
  return { handle };
}
