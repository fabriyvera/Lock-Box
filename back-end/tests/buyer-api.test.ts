import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createApp } from "../src/create-app.js";
import { parseEnvironment } from "../src/config/environment.js";
import type { Database } from "../src/types/database.js";

const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const requestId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
async function withServer(
  options: {
    role?: string;
    active?: boolean;
    invalidSession?: boolean;
    rpcError?: string;
  },
  run: (base: string, calls: unknown[]) => Promise<void>,
) {
  const calls: unknown[] = [];
  const client = {
    auth: {
      getUser: async () => ({
        data: { user: options.invalidSession ? null : { id } },
        error: null,
      }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: {
              id,
              role: options.role ?? "comprador",
              is_active: options.active ?? true,
            },
            error: null,
          }),
        }),
      }),
    }),
    rpc: async (name: string, args: unknown) => {
      calls.push({ name, args });
      return {
        data: { success: true, orderIds: [id] },
        error: options.rpcError
          ? { code: options.rpcError, message: "Conflicto de prueba" }
          : null,
      };
    },
  } as unknown as SupabaseClient<Database>;
  const server = createApp(
    parseEnvironment({
      SUPABASE_URL: "https://test.supabase.co",
      SUPABASE_PUBLISHABLE_KEY: "test",
    }),
    {
      createClient: (token) => {
        assert.equal(token, "buyer-token");
        return client;
      },
    },
  ).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  try {
    await run(
      `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
      calls,
    );
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}
const headers = {
  Authorization: "Bearer buyer-token",
  "Content-Type": "application/json",
};
const checkout = { type: "checkout", pointId: id, paymentMethod: "bcp" };

test("buyer API verifies sessions and stored buyer roles before RPC", async () => {
  await withServer({}, async (base, calls) => {
    assert.equal((await fetch(`${base}/api/buyer/state`)).status, 401);
    assert.equal(calls.length, 0);
  });
  for (const options of [
    { role: "vendedor" },
    { role: "operador_punto" },
    { active: false },
    { invalidSession: true },
  ]) {
    await withServer(options, async (base, calls) => {
      assert.equal(
        (await fetch(`${base}/api/buyer/state`, { headers })).status,
        options.invalidSession ? 401 : 403,
      );
      assert.equal(calls.length, 0);
    });
  }
});
test("buyer API accepts only validated IDs, never client prices, owners, stock or delivery", async () => {
  await withServer({}, async (base, calls) => {
    for (const action of [
      { ...checkout, price: 1 },
      { ...checkout, buyerId: id },
      { ...checkout, status: "delivered" },
      { ...checkout, is_test: false },
      { type: "simulateDelivery", orderId: id },
      { type: "addToCart", productId: id, quantity: 0.5 },
      { type: "reviewOrder", orderId: id, rating: 6, comment: "QA" },
    ]) {
      const response = await fetch(`${base}/api/buyer/actions`, {
        method: "POST",
        headers,
        body: JSON.stringify({ action, requestId }),
      });
      assert.equal(response.status, 400);
    }
    assert.equal(calls.length, 0);
  });
});
test("buyer checkout forwards the idempotency key and reads disable caching", async () => {
  await withServer({}, async (base, calls) => {
    const response = await fetch(`${base}/api/buyer/actions`, {
      method: "POST",
      headers,
      body: JSON.stringify({ action: checkout, requestId }),
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), {
      result: { success: true, orderIds: [id] },
    });
    assert.deepEqual(calls[0], {
      name: "buyer_action",
      args: { action: checkout, request_id: requestId },
    });
    const read = await fetch(`${base}/api/buyer/state`, { headers });
    assert.equal(read.status, 200);
    assert.equal(read.headers.get("cache-control"), "no-store");
  });
});
test("buyer stock conflicts, ownership and missing orders remain actionable", async () => {
  for (const [code, expected] of [
    ["P0001", 409],
    ["42501", 403],
    ["P0002", 404],
    ["22023", 400],
  ] as const) {
    await withServer({ rpcError: code }, async (base) => {
      const response = await fetch(`${base}/api/buyer/actions`, {
        method: "POST",
        headers,
        body: JSON.stringify({ action: checkout, requestId }),
      });
      assert.equal(response.status, expected);
    });
  }
});
