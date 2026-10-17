import { randomBytes, scrypt, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";
const deriveAsync = promisify(scrypt);
let activeHashes = 0;
async function derive(...args) {
  if (activeHashes >= 4)
    reject("The sign-in service is busy. Please try again shortly.", 429);
  activeHashes++;
  try {
    return await deriveAsync(...args);
  } finally {
    activeHashes--;
  }
}
const hashToken = (token) => createHash("sha256").update(token).digest("hex");
const reject = (message, status = 401) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};

export function createAuth(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS merchants (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, password_hash TEXT NOT NULL, salt TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, merchant_id TEXT NOT NULL REFERENCES merchants(id), expires_at INTEGER NOT NULL);`);
  const attempts = new Map();
  function limit(req, email) {
    const ipKey = `ip:${req.socket.remoteAddress}`;
    let ipState = attempts.get(ipKey);
    if (!ipState || ipState.until < Date.now())
      ipState = { count: 0, until: Date.now() + 15 * 60 * 1000 };
    ipState.count++;
    attempts.set(ipKey, ipState);
    if (ipState.count > 50)
      reject("Too many sign-in attempts. Please wait 15 minutes.", 429);
    const key = `${req.socket.remoteAddress}:${email}`;
    let state = attempts.get(key);
    if (!state || state.until < Date.now())
      state = { count: 0, until: Date.now() + 15 * 60 * 1000 };
    state.count++;
    attempts.set(key, state);
    if (attempts.size > 10000) attempts.delete(attempts.keys().next().value);
    if (state.count > 20)
      reject("Too many sign-in attempts. Please wait 15 minutes.", 429);
  }
  function current(req) {
    const token = req.headers.cookie?.match(
      /(?:^|;\s*)forma_session=([a-f0-9]{64})(?:;|$)/,
    )?.[1];
    if (!token) return null;
    return (
      db
        .prepare(
          "SELECT m.id,m.email,m.name FROM sessions s JOIN merchants m ON m.id=s.merchant_id WHERE s.token_hash=? AND s.expires_at>?",
        )
        .get(hashToken(token), Date.now()) || null
    );
  }
  function requireUser(req) {
    return current(req) || reject("Please sign in to your merchant workspace.");
  }
  function cookie(res, token, maxAge) {
    res.setHeader(
      "Set-Cookie",
      `forma_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
    );
  }
  function signIn(res, user) {
    const token = randomBytes(32).toString("hex");
    db.prepare("DELETE FROM sessions WHERE expires_at<=?").run(Date.now());
    db.prepare("INSERT INTO sessions VALUES (?,?,?)").run(
      hashToken(token),
      user.id,
      Date.now() + 7 * 86400000,
    );
    cookie(res, token, 7 * 86400);
    return { id: user.id, email: user.email, name: user.name };
  }
  async function handle(req, res, path, send, body) {
    if (!path.startsWith("/api/auth/")) return false;
    if (path === "/api/auth/me" && req.method === "GET") {
      const user = requireUser(req);
      send(200, user);
      return true;
    }
    if (path === "/api/auth/logout" && req.method === "POST") {
      const token = req.headers.cookie?.match(
        /(?:^|;\s*)forma_session=([a-f0-9]{64})(?:;|$)/,
      )?.[1];
      if (token)
        db.prepare("DELETE FROM sessions WHERE token_hash=?").run(
          hashToken(token),
        );
      cookie(res, "", 0);
      send(200, { ok: true });
      return true;
    }
    if (
      ["/api/auth/login", "/api/auth/register"].includes(path) &&
      req.method === "POST"
    ) {
      const input = await body(req),
        email =
          typeof input.email === "string"
            ? input.email.trim().toLowerCase().slice(0, 254)
            : "";
      const password = typeof input.password === "string" ? input.password : "";
      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        password.length < 10 ||
        password.length > 256
      )
        reject(
          "Enter a valid email and a password between 10 and 256 characters.",
          400,
        );
      limit(req, email);
      if (path.endsWith("register")) {
        const name =
          typeof input.name === "string" ? input.name.trim().slice(0, 80) : "";
        if (!name) reject("Enter your name.", 400);
        const salt = randomBytes(16).toString("hex");
        const passwordHash = (await derive(password, salt, 64)).toString("hex");
        if (db.prepare("SELECT id FROM merchants WHERE email=?").get(email))
          reject("This email is already registered. Sign in instead.", 409);
        const user = { id: randomBytes(16).toString("hex"), email, name };
        db.prepare(
          "INSERT INTO merchants (id,email,name,password_hash,salt) VALUES (?,?,?,?,?)",
        ).run(user.id, email, name, passwordHash, salt);
        send(201, signIn(res, user));
        return true;
      }
      const user = db
        .prepare("SELECT * FROM merchants WHERE email=?")
        .get(email);
      const provided = await derive(
        password,
        user?.salt || "forma-login-check",
        64,
      );
      const expected = user
        ? Buffer.from(user.password_hash, "hex")
        : Buffer.alloc(64);
      if (!timingSafeEqual(provided, expected) || !user)
        reject("Email or password is incorrect.");
      send(200, signIn(res, user));
      return true;
    }
    reject("Authentication endpoint not found.", 404);
  }
  return { current, requireUser, handle };
}
