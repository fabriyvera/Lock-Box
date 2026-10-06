import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database.js";
import { createApp, type Dependencies } from "../src/app.js";
import { parseEnvironment } from "../src/config/environment.js";

const config = parseEnvironment({
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "public-test-key",
  TURNSTILE_SECRET_KEY: "test-secret",
});
const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const requestId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const calls: Array<{ name: string; args?: unknown; token?: string }> = [];
function dependencies(
  options: {
    role?: string;
    active?: boolean;
    invalidToken?: boolean;
    rpcError?: { code: string; message: string };
    captcha?: boolean;
    invalidPassword?: boolean;
  } = {},
): Dependencies {
  return {
    verifyCaptcha: async () =>
      options.captcha === false
        ? { success: false, errorCodes: ["invalid-input-response"] }
        : { success: true },
    createClient(token) {
      return {
        auth: {
          getUser: async () => ({
            data: { user: options.invalidToken ? null : { id } },
            error: options.invalidToken ? { message: "expired" } : null,
          }),
          signInWithPassword: async () => ({
            data: {
              user: { id, email: "seller@example.invalid" },
              session: options.invalidPassword
                ? null
                : {
                    access_token: "real-session-fixture",
                    refresh_token: "refresh-fixture",
                  },
            },
            error: null,
          }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: {
                  id,
                  role: options.role ?? "vendedor",
                  is_active: options.active ?? true,
                  full_name: "Seller",
                },
                error: null,
              }),
            }),
          }),
        }),
        rpc: async (name: string, args?: unknown) => {
          calls.push({ name, args, token });
          return {
            data: name === "seller_state" ? { version: 1, products: [] } : null,
            error: options.rpcError ?? null,
          };
        },
      } as unknown as SupabaseClient<Database>;
    },
  };
}
async function withServer(
  deps: Dependencies,
  run: (url: string) => Promise<void>,
) {
  const server = createApp(config, deps).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  try {
    await run(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}
const headers = {
  Authorization: "Bearer verified-token",
  "Content-Type": "application/json",
};

test("seller routes require a verified session and an active seller profile", async () => {
  for (const options of [
    {},
    { invalidToken: true },
    { role: "comprador" },
    { active: false },
  ]) {
    await withServer(dependencies(options), async (url) => {
      const response = await fetch(`${url}/api/seller/state`, {
        headers: Object.keys(options).length ? headers : {},
      });
      assert.equal(
        response.status,
        "role" in options || "active" in options ? 403 : 401,
      );
    });
  }
});

test("reads carry the bearer token to Supabase and disable caching", async () => {
  calls.length = 0;
  await withServer(dependencies(), async (url) => {
    const response = await fetch(`${url}/api/seller/state`, { headers });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), {
      state: { version: 1, products: [] },
    });
    assert.deepEqual(calls, [
      { name: "seller_state", args: undefined, token: "verified-token" },
    ]);
  });
});

test("actions reject escrow transitions, forged owners, monetary amounts and malformed bodies", async () => {
  calls.length = 0;
  await withServer(dependencies(), async (url) => {
    const invalid = [
      { action: { type: "releaseOrder", id }, requestId },
      { action: { type: "changePlan", plan: "pro", seller_id: id }, requestId },
      {
        action: {
          type: "requestPayout",
          id,
          at: new Date().toISOString(),
          amountCents: 99999,
        },
        requestId,
      },
      {
        action: {
          type: "saveProfile",
          profile: {
            storeName: "Seller",
            handle: "seller",
            city: "La Paz",
            bio: "",
            role: "admin",
          },
        },
        requestId,
      },
      { action: { type: "changePlan", plan: "pro" }, requestId: "not-a-uuid" },
    ];
    for (const body of invalid)
      assert.equal(
        (
          await fetch(`${url}/api/seller/actions`, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
          })
        ).status,
        400,
      );
    assert.equal(
      (
        await fetch(`${url}/api/seller/actions`, {
          method: "POST",
          headers,
          body: "{bad json",
        })
      ).status,
      400,
    );
    assert.equal(calls.length, 0);
  });
});

test("validated actions return a receipt and database ownership/conflict errors reach the caller", async () => {
  const body = { action: { type: "changePlan", plan: "pro" }, requestId };
  for (const [code, expected] of [
    ["", 200],
    ["42501", 403],
    ["23505", 409],
    ["22023", 400],
    ["XX000", 500],
  ] as const) {
    calls.length = 0;
    await withServer(
      dependencies(
        code ? { rpcError: { code, message: "Database validation" } } : {},
      ),
      async (url) => {
        const response = await fetch(`${url}/api/seller/actions`, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });
        assert.equal(response.status, expected);
        assert.deepEqual(calls[0], {
          name: "seller_action",
          args: { action: body.action, request_id: requestId },
          token: "verified-token",
        });
        const result = (await response.json()) as { message: string };
        if (!code) assert.deepEqual(result, { success: true, requestId });
        if (code === "XX000")
          assert.ok(!result.message.includes("Database validation"));
      },
    );
  }
});

test("login verifies captcha and returns the Supabase session rather than a synthetic JWT", async () => {
  for (const [options, expected] of [
    [{ captcha: false }, 400],
    [{ invalidPassword: true }, 401],
    [{ active: false }, 403],
    [{}, 200],
  ] as const) {
    await withServer(dependencies(options), async (url) => {
      const response = await fetch(`${url}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "seller@example.invalid",
          password: "test-password",
          captchaToken: "test-captcha",
        }),
      });
      assert.equal(response.status, expected);
      if (expected === 200) {
        const result = (await response.json()) as {
          session: { access_token: string };
          user: { role: string };
        };
        assert.equal(result.session.access_token, "real-session-fixture");
        assert.equal(result.user.role, "vendedor");
        assert.equal(response.headers.get("cache-control"), "no-store");
      }
    });
  }
});

test("configuration accepts modern public keys and legacy anon keys; missing credentials fail clearly", () => {
  assert.equal(
    parseEnvironment({
      SUPABASE_URL: config.SUPABASE_URL,
      SUPABASE_ANON_KEY: "legacy",
    }).SUPABASE_PUBLIC_KEY,
    "legacy",
  );
  assert.equal(
    parseEnvironment({
      SUPABASE_URL: config.SUPABASE_URL,
      SUPABASE_ANON_KEY: "legacy",
      SUPABASE_PUBLISHABLE_KEY: " modern ",
    }).SUPABASE_PUBLIC_KEY,
    "modern",
  );
  assert.throws(
    () => parseEnvironment({ SUPABASE_URL: config.SUPABASE_URL }),
    /SUPABASE_PUBLISHABLE_KEY/,
  );
});
