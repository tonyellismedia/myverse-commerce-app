import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";

test("multi-store commerce: catalogs, branding, stock, orders, and assistant", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "forma-test-"));
  const port = String(32000 + Math.floor(Math.random() * 20000));
  const child = spawn(process.execPath, ["server/index.mjs"], {
    env: {
      ...process.env,
      NODE_ENV: "test",
      HOST: "127.0.0.1",
      DEMO_PASSWORD: "",
      PORT: port,
      DATABASE_PATH: join(directory, "test.sqlite"),
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
  let startupError = "";
  child.stderr.on("data", (chunk) => {
    startupError += chunk.toString();
  });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("API startup timed out")),
      10000,
    );
    child.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`API exited: ${code}: ${startupError}`));
    });
    child.stdout.on("data", (chunk) => {
      if (chunk.toString().includes("API ready")) {
        clearTimeout(timer);
        resolve();
      }
    });
  });
  let cookie = "";
  async function request(path, method = "GET", data) {
    const response = await fetch(`http://127.0.0.1:${port}/api${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
    });
    if (response.headers.get("set-cookie"))
      cookie = response.headers.get("set-cookie").split(";")[0];
    return { status: response.status, data: await response.json() };
  }
  assert.equal(
    (
      await request("/auth/register", "POST", {
        name: "First merchant",
        email: "first@example.test",
        password: "a-long-test-password",
      })
    ).status,
    201,
  );
  let created, item;
  await t.test("health and seeded stores are available", async () => {
    const health = await request("/health");
    assert.equal(health.status, 200);
    assert.equal(health.data.aiConfigured, false);
    const stores = await request("/stores");
    assert.equal(stores.data.length, 0);
    const storefront = await request("/storefront?slug=studio-earth");
    assert.equal(storefront.status, 200);
    assert.equal(storefront.data.orders, undefined);
  });
  await t.test(
    "create store, reject duplicates, and persist branding",
    async () => {
      const r = await request("/stores", "POST", {
        name: "Test Brand",
        slug: "test-brand",
        tagline: "Made for testing",
        accent: "#224466",
      });
      assert.equal(r.status, 201);
      created = r.data;
      assert.equal(created.products.length, 0);
      assert.equal(
        (
          await request("/stores", "POST", {
            name: "Duplicate",
            slug: "test-brand",
            accent: "#224466",
          })
        ).status,
        409,
      );
      assert.equal(
        (
          await request("/stores", "POST", {
            name: "Unsafe",
            slug: "../unsafe",
            accent: "#224466",
          })
        ).status,
        400,
      );
      const updated = await request("/stores/" + created.id, "PATCH", {
        name: "New identity",
        tagline: "A new chapter",
        accent: "#775533",
      });
      assert.equal(updated.data.name, "New identity");
      assert.equal(
        (await request("/storefront?slug=test-brand")).data.accent,
        "#775533",
      );
    },
  );
  await t.test("create products and enforce store-scoped updates", async () => {
    const r = await request(`/stores/${created.id}/products`, "POST", {
      title: "Linen tote",
      description: "A reusable everyday bag",
      price: 2500,
      inventory: 3,
      category: "Accessories",
      art: "bag",
    });
    assert.equal(r.status, 201);
    item = r.data;
    assert.equal(
      (
        await request(`/stores/store-field/products/${item.id}`, "PATCH", {
          price: 1,
        })
      ).status,
      404,
    );
    assert.equal(
      (
        await request(`/stores/${created.id}/products/${item.id}`, "PATCH", {
          price: -10,
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await request(`/stores/${created.id}/products/${item.id}`, "PATCH", {
          price: 2700,
        })
      ).data.price,
      2700,
    );
  });
  await t.test(
    "cross-store orders and duplicate-item overstock are rejected atomically",
    async () => {
      assert.equal(
        (
          await request(`/stores/${created.id}/orders`, "POST", {
            items: [{ productId: "p1", quantity: 1 }],
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await request(`/stores/${created.id}/orders`, "POST", {
            items: [
              { productId: item.id, quantity: 2 },
              { productId: item.id, quantity: 2 },
            ],
          })
        ).status,
        409,
      );
      const state = await request("/stores/" + created.id);
      assert.equal(state.data.products[0].inventory, 3);
      assert.equal(state.data.orders.length, 0);
    },
  );
  await t.test(
    "checkout uses authoritative prices and prevents overselling",
    async () => {
      const r = await request(`/stores/${created.id}/orders`, "POST", {
        customer: "Test customer",
        total: 1,
        items: [{ productId: item.id, quantity: 2, price: 1 }],
      });
      assert.equal(r.status, 201);
      assert.equal(r.data.total, 5400);
      assert.equal(r.data.mode, "demo");
      const competing = await Promise.all(
        [1, 2].map(() =>
          request(`/stores/${created.id}/orders`, "POST", {
            items: [{ productId: item.id, quantity: 1 }],
          }),
        ),
      );
      assert.deepEqual(competing.map((r) => r.status).sort(), [201, 409]);
      const state = await request("/stores/" + created.id);
      assert.equal(state.data.products[0].inventory, 0);
      assert.equal(state.data.orders.length, 2);
      assert.equal(
        state.data.orders.find((o) => o.customer === "Test customer").items[0]
          .price,
        2700,
      );
    },
  );
  await t.test(
    "catalog assistant recommendations remain in the selected store",
    async () => {
      const r = await request("/stores/store-field/assistant", "POST", {
        message: "Show me a journal",
      });
      assert.equal(r.status, 200);
      assert.equal(r.data.mode, "catalog");
      assert.deepEqual(r.data.products, ["p5"]);
      const soldOut = await request(`/stores/${created.id}/assistant`, "POST", {
        message: "tote",
      });
      assert.deepEqual(soldOut.data.products, []);
    },
  );
  await t.test("malformed requests fail usefully", async () => {
    assert.equal((await request("/stores", "POST", null)).status, 400);
    assert.equal(
      (await request(`/stores/${created.id}/orders`, "POST", { items: [null] }))
        .status,
      400,
    );
    assert.equal((await request("/storefront?slug=missing")).status, 404);
    assert.equal(
      (await request("/stores/store-field/assistant", "POST", { message: "" }))
        .status,
      400,
    );
  });
  await t.test("merchant sessions isolate catalogs and orders", async () => {
    assert.equal(
      (
        await request("/auth/register", "POST", {
          name: "Second merchant",
          email: "second@example.test",
          password: "another-long-test-password",
        })
      ).status,
      201,
    );
    assert.equal((await request("/stores")).data.length, 0);
    assert.equal((await request("/stores/" + created.id)).status, 404);
    assert.equal(
      (
        await request(`/stores/${created.id}/products/${item.id}`, "PATCH", {
          price: 1,
        })
      ).status,
      404,
    );
    assert.equal(
      (await request(`/stores/${created.id}/products/${item.id}`, "DELETE", {}))
        .status,
      404,
    );
    assert.equal(
      (
        await request(`/stores/${created.id}/orders/unknown`, "PATCH", {
          fulfillment_status: "fulfilled",
        })
      ).status,
      404,
    );
    await request("/auth/logout", "POST", {});
    assert.equal((await request("/stores")).status, 401);
    assert.equal(
      (
        await request("/auth/login", "POST", {
          email: "first@example.test",
          password: "wrong-but-long-password",
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await request("/auth/login", "POST", {
          email: "first@example.test",
          password: "a-long-test-password",
        })
      ).status,
      200,
    );
    const own = await request("/stores/" + created.id);
    assert.equal(own.status, 200);
    assert.equal(
      (
        await request(
          `/stores/${created.id}/orders/${own.data.orders[0].id}`,
          "PATCH",
          { fulfillment_status: "fulfilled" },
        )
      ).status,
      200,
    );
    assert.equal(
      (await request(`/stores/${created.id}/products/${item.id}`, "DELETE", {}))
        .status,
      200,
    );
  });
  await t.test(
    "photos, off-sale products, and delivery fees preserve commerce state",
    async () => {
      assert.equal(
        (
          await request(`/stores/${created.id}/products/${item.id}`, "PATCH", {
            image_url: "javascript:alert(1)",
          })
        ).status,
        400,
      );
      const changed = await request(
        `/stores/${created.id}/products/${item.id}`,
        "PATCH",
        {
          inventory: 2,
          active: true,
          image_url: "https://images.example.test/table.jpg",
        },
      );
      assert.equal(
        changed.data.image_url,
        "https://images.example.test/table.jpg",
      );
      await request(`/stores/${created.id}/products/${item.id}`, "DELETE", {});
      const hidden = await request("/storefront?slug=test-brand");
      assert.equal(
        hidden.data.products.some((p) => p.id === item.id),
        false,
      );
      const state = await request("/stores/" + created.id);
      assert.equal(state.data.products[0].inventory, 2);
      assert.equal(
        (
          await request(`/stores/${created.id}/orders`, "POST", {
            items: [{ productId: item.id, quantity: 1 }],
          })
        ).status,
        400,
      );
      await request(`/stores/${created.id}/products/${item.id}`, "PATCH", {
        active: true,
      });
      await request("/stores/" + created.id, "PATCH", {
        name: "New identity",
        tagline: "A new chapter",
        accent: "#775533",
        shipping_fee: 500,
      });
      const ordered = await request(`/stores/${created.id}/orders`, "POST", {
        items: [{ productId: item.id, quantity: 1 }],
      });
      assert.equal(ordered.data.total, 3200);
    },
  );
});
