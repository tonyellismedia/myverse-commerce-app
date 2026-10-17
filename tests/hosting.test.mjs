import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import { randomBytes } from "node:crypto";

test("hosted demo requires authentication for pages and API mutations", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "forma-hosting-"));
  const port = String(32000 + Math.floor(Math.random() * 20000));
  const password = randomBytes(24).toString("hex");
  const child = spawn(process.execPath, ["server/index.mjs"], {
    env: {
      ...process.env,
      NODE_ENV: "production",
      HOST: "127.0.0.1",
      PORT: port,
      DATABASE_PATH: join(directory, "test.sqlite"),
      DEMO_PASSWORD: password,
      AI_API_KEY: "",
      STRIPE_SECRET_KEY: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  t.after(async () => {
    if (child.exitCode === null) {
      const ended = once(child, "exit");
      child.kill("SIGTERM");
      await ended;
    }
    await rm(directory, { recursive: true, force: true });
  });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Hosting API startup timed out")),
      10000,
    );
    child.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Hosting API exited: ${code}`));
    });
    child.stdout.on("data", (chunk) => {
      if (chunk.toString().includes("API ready")) {
        clearTimeout(timer);
        resolve();
      }
    });
  });
  const base = `http://127.0.0.1:${port}`;
  const auth = "Basic " + Buffer.from(`demo:${password}`).toString("base64");
  assert.equal((await fetch(base + "/api/health")).status, 200);
  for (const path of [
    "/",
    "/store/studio-earth",
    "/api/stores",
    "/api/storefront?slug=studio-earth",
  ]) {
    const response = await fetch(base + path);
    assert.equal(response.status, 401, path);
    assert.match(response.headers.get("www-authenticate"), /Basic/);
  }
  assert.equal(
    (
      await fetch(base + "/api/stores", {
        headers: {
          Authorization:
            "Basic " + Buffer.from("demo:wrong").toString("base64"),
        },
      })
    ).status,
    401,
  );
  const registration = await fetch(base + "/api/auth/register", {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Hosted merchant",
      email: "hosted@example.test",
      password: "a-long-hosted-password",
    }),
  });
  assert.equal(registration.status, 201);
  const cookie = registration.headers.get("set-cookie").split(";")[0];
  assert.match(registration.headers.get("set-cookie"), /Secure/);
  assert.match(registration.headers.get("set-cookie"), /HttpOnly/);
  assert.equal(
    (
      await fetch(base + "/api/stores", {
        headers: { Authorization: auth, Cookie: cookie },
      })
    ).status,
    200,
  );
  const created = await fetch(base + "/api/stores", {
    method: "POST",
    headers: {
      Authorization: auth,
      Cookie: cookie,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Hosted",
      slug: "hosted",
      tagline: "",
      accent: "#112233",
    }),
  }).then((r) => r.json());
  assert.equal(
    (
      await fetch(base + "/api/stores/" + created.id, {
        method: "PATCH",
        headers: {
          Authorization: auth,
          Cookie: cookie,
          "Content-Type": "application/json",
          Origin: "https://unrelated.example",
        },
        body: JSON.stringify({
          name: "Unwanted edit",
          tagline: "",
          accent: "#112233",
        }),
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await fetch(base + "/api/stores/" + created.id, {
        method: "PATCH",
        headers: {
          Authorization: auth,
          Cookie: cookie,
          "Content-Type": "application/json",
          Origin: base,
        },
        body: JSON.stringify({
          name: "Protected demo",
          tagline: "",
          accent: "#112233",
        }),
      })
    ).status,
    200,
  );
});

test("a configured shared demo password must meet the minimum length", async () => {
  const child = spawn(process.execPath, ["server/index.mjs"], {
    env: {
      ...process.env,
      NODE_ENV: "production",
      HOST: "0.0.0.0",
      DEMO_PASSWORD: "short",
    },
    stdio: ["ignore", "ignore", "pipe"],
  });
  let message = "";
  child.stderr.on("data", (chunk) => {
    message += chunk;
  });
  const [code] = await once(child, "exit");
  assert.equal(code, 1);
  assert.match(message, /Hosted demos require DEMO_PASSWORD/);
});
