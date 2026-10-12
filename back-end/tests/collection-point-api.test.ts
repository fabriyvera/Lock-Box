import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database.js";
import { createApp } from "../src/app.js";
import { parseEnvironment } from "../src/config/environment.js";

const config = parseEnvironment({
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "test",
});
const id = "12345678-1234-4123-8123-123456789abc";
async function withServer(
  options: { invalid?: boolean; inactive?: boolean; code?: string } = {},
  run: (url: string, calls: unknown[], tokens: string[]) => Promise<void>,
) {
  const calls: unknown[] = [];
  const tokens: string[] = [];
  const client = {
    auth: {
      getUser: async (token: string) => {
        tokens.push(token);
        return {
          data: {
            user: options.invalid
              ? null
              : { id, user_metadata: { role: "admin" } },
          },
          error: null,
        };
      },
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: { id, is_active: !options.inactive },
            error: null,
          }),
        }),
      }),
    }),
    rpc: async (name: string, args: unknown) => {
      calls.push({ name, args });
      return {
        data: { id, status: "delivered" },
        error: options.code
          ? { code: options.code, message: "Database refusal" }
          : null,
      };
    },
  } as unknown as SupabaseClient<Database>;
  const server = createApp(config, {
    createClient: (token) => {
      if (token) tokens.push(token);
      return client;
    },
  }).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  try {
    await run(
      `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
      calls,
      tokens,
    );
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}
const headers = {
  Authorization: "Bearer real-token",
  "Content-Type": "application/json",
};
test("point API rejects unauthenticated requests before touching data", async () => {
  await withServer({}, async (url, calls, tokens) => {
    for (const path of [
      "/api/collection-point/state",
      "/orders/scan/LBX-123456",
    ])
      assert.equal((await fetch(url + path)).status, 401);
    assert.deepEqual(calls, []);
    assert.deepEqual(tokens, []);
  });
});
test("invalid sessions and inactive profiles cannot call point RPC", async () => {
  for (const options of [{ invalid: true }, { inactive: true }])
    await withServer(options, async (url, calls) => {
      assert.equal(
        (await fetch(url + "/api/collection-point/state", { headers })).status,
        options.invalid ? 401 : 403,
      );
      assert.deepEqual(calls, []);
    });
});
test("state and scan forward the verified JWT to guarded RPC", async () => {
  await withServer({}, async (url, calls, tokens) => {
    const state = await fetch(url + "/api/collection-point/state", { headers });
    assert.equal(state.status, 200);
    assert.equal(state.headers.get("cache-control"), "no-store");
    assert.equal(
      (await fetch(url + "/orders/scan/LBX-123456", { headers })).status,
      200,
    );
    assert.deepEqual(calls, [
      { name: "collection_point_action", args: { action: { type: "state" } } },
      {
        name: "collection_point_action",
        args: { action: { type: "scan", qrCode: "LBX-123456" } },
      },
    ]);
    assert.ok(tokens.every((token) => token === "real-token"));
  });
});
test("only valid point transitions reach the database", async () => {
  await withServer({}, async (url, calls) => {
    const send = (order: string, body: unknown) =>
      fetch(`${url}/api/collection-point/${order}/status`, {
        headers,
        method: "PATCH",
        body: JSON.stringify(body),
      });
    for (const status of [
      "released",
      "paid",
      "cancelled",
      "ready_for_pickup",
      "completed",
    ])
      assert.equal(
        (await send(id, { status, qrCode: "LBX-123456" })).status,
        400,
      );
    assert.equal(
      (await send("LBX-123456", { status: "delivered", qrCode: "LBX-123456" }))
        .status,
      400,
    );
    assert.equal((await send(id, { status: "delivered" })).status, 400);
    assert.equal(
      (
        await send(id, {
          status: "delivered",
          qrCode: "LBX-123456",
          buyer_id: "forged",
        })
      ).status,
      400,
    );
    assert.deepEqual(calls, []);
    assert.equal(
      (await send(id, { status: "delivered", qrCode: "LBX-123456" })).status,
      200,
    );
    assert.deepEqual(calls, [
      {
        name: "collection_point_action",
        args: {
          action: {
            type: "transition",
            orderId: id,
            status: "delivered",
            qrCode: "LBX-123456",
          },
        },
      },
    ]);
  });
});
test("point ownership, expiration and stale state errors remain actionable", async () => {
  for (const [code, status] of [
    ["42501", 403],
    ["P0002", 404],
    ["22023", 400],
    ["P0001", 409],
    ["unexpected", 500],
  ] as const)
    await withServer({ code }, async (url) => {
      const response = await fetch(
        url + "/api/collection-point/scan/LBX-123456",
        { headers },
      );
      assert.equal(response.status, status);
      assert.equal(
        ((await response.json()) as { message: string }).message,
        status === 500 ? "No se pudo consultar el pedido." : "Database refusal",
      );
    });
});
test("prototype checkout cannot create orders using fixed identities", async () => {
  await withServer({}, async (url, calls) => {
    assert.equal(
      (
        await fetch(url + "/orders/checkout", {
          headers,
          method: "POST",
          body: JSON.stringify({ product_id: id, unit_price: 1, quantity: 1 }),
        })
      ).status,
      501,
    );
    assert.deepEqual(calls, []);
  });
});
