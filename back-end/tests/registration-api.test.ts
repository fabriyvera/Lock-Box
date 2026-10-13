import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database.js";
import { createApp } from "../src/create-app.js";
import { parseEnvironment } from "../src/config/environment.js";

const config = parseEnvironment({
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "test",
  TURNSTILE_SECRET_KEY: "test-secret",
});
const input = {
  email: "person@example.invalid",
  password: "StrongPassword1",
  fullName: "Persona de prueba",
  username: "persona",
  phone: "71234567",
  role: "comprador",
  captchaToken: "token",
};
async function withServer(
  options: {
    confirmation?: boolean;
    captcha?: boolean;
    authError?: { status: number; code: string };
    role?: string;
    invalidToken?: boolean;
    missingCaptcha?: boolean;
  },
  run: (url: string, calls: unknown[]) => Promise<void>,
) {
  const calls: unknown[] = [];
  const client = {
    auth: {
      signUp: async (body: unknown) => {
        calls.push(body);
        return {
          data: {
            user: { id: "user-id" },
            session:
              options.confirmation === false
                ? { access_token: "real-token", refresh_token: "refresh-token" }
                : null,
          },
          error: options.authError ?? null,
        };
      },
      getUser: async () => ({
        data: {
          user: options.invalidToken
            ? null
            : { id: "user-id", user_metadata: { role: "admin" } },
        },
        error: null,
      }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: {
              id: "user-id",
              role: options.role ?? "comprador",
              is_active: true,
              username: "persona",
              full_name: "Persona de prueba",
            },
            error: null,
          }),
        }),
      }),
    }),
  } as unknown as SupabaseClient<Database>;
  const server = createApp(
    {
      ...config,
      TURNSTILE_SECRET_KEY: options.missingCaptcha
        ? ""
        : config.TURNSTILE_SECRET_KEY,
    },
    {
      createClient: () => client,
      verifyCaptcha: async () =>
        options.captcha === false
          ? { success: false, errorCodes: ["invalid-input-response"] }
          : { success: true },
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
const post = (url: string, body: unknown) =>
  fetch(`${url}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

test("signup accepts all public roles, sends validated metadata and handles email confirmation", async () => {
  for (const role of ["comprador", "vendedor", "operador_punto"]) {
    await withServer({}, async (url, calls) => {
      const response = await post(url, {
        ...input,
        role,
        email: " PERSON@example.invalid ",
        ...(role === "vendedor" ? { storeName: "Mi tienda" } : {}),
        ...(role === "operador_punto"
          ? {
              pointName: "Punto Central",
              pointAddress: "Av. Central 123, La Paz",
              pointCapacity: 40,
            }
          : {}),
      });
      assert.equal(response.status, 202);
      assert.equal(response.headers.get("cache-control"), "no-store");
      const result = (await response.json()) as Record<string, unknown>;
      assert.equal(result.requiresConfirmation, true);
      assert.equal(result.session, undefined);
      const body = calls[0] as {
        email: string;
        options: { emailRedirectTo: string; data: Record<string, unknown> };
      };
      assert.equal(body.email, "person@example.invalid");
      assert.equal(
        body.options.emailRedirectTo,
        "http://localhost:3000/auth/callback",
      );
      assert.equal(body.options.data.role, role);
      assert.equal(body.options.data.phone, "+59171234567");
      assert.equal(body.options.data.is_verified, undefined);
      assert.equal(
        body.options.data.store_name,
        role === "vendedor" ? "Mi tienda" : undefined,
      );
      assert.equal(
        body.options.data.point_name,
        role === "operador_punto" ? "Punto Central" : undefined,
      );
      assert.equal(
        body.options.data.point_address,
        role === "operador_punto" ? "Av. Central 123, La Paz" : undefined,
      );
      assert.equal(
        body.options.data.point_capacity,
        role === "operador_punto" ? 40 : undefined,
      );
      assert.equal(body.options.data.manager_id, undefined);
    });
  }
});
test("signup rejects privileged roles, injected fields, invalid data and missing store before Auth", async () => {
  await withServer({}, async (url, calls) => {
    for (const invalid of [
      { role: "admin" },
      { role: "despachador" },
      { is_verified: true },
      { username: "bad..user" },
      { phone: "7123456" },
      { phone: "712345678" },
      { phone: "+59171234567" },
      { phone: "7123a567" },
      { phone: "7123 567" },
      { password: "short" },
      { role: "vendedor" },
      { role: "operador_punto" },
      { pointName: "Punto ajeno" },
    ]) {
      assert.equal((await post(url, { ...input, ...invalid })).status, 400);
    }
    assert.equal(calls.length, 0);
  });
});

test("point registration validates location and capacity before creating an Auth account", async () => {
  await withServer({}, async (url, calls) => {
    const point = {
      ...input,
      role: "operador_punto",
      pointName: "Punto Central",
      pointAddress: "Av. Central 123, La Paz",
      pointCapacity: 40,
    };
    for (const invalid of [
      { pointName: "X" },
      { pointAddress: "corto" },
      { pointCapacity: 0 },
      { pointCapacity: 501 },
      { pointCapacity: 2.5 },
      { pointCapacity: "40" },
      { managerId: "other-user" },
      { pointId: "existing-point" },
      { storeName: "Tienda" },
    ])
      assert.equal((await post(url, { ...point, ...invalid })).status, 400);
    assert.equal(calls.length, 0);
  });
});

test("point signup returns its persisted role and immediate session", async () => {
  await withServer(
    { confirmation: false, role: "operador_punto" },
    async (url) => {
      const response = await post(url, {
        ...input,
        role: "operador_punto",
        pointName: "Punto Central",
        pointAddress: "Av. Central 123, La Paz",
        pointCapacity: 40,
      });
      assert.equal(response.status, 201);
      const body = (await response.json()) as {
        user: { role: string };
        session: { access_token: string };
      };
      assert.equal(body.user.role, "operador_punto");
      assert.equal(body.session.access_token, "real-token");
    },
  );
});
test("signup never bypasses captcha and handles Auth rate limits and database failures", async () => {
  for (const [options, status] of [
    [{ captcha: false }, 400],
    [{ missingCaptcha: true }, 503],
    [{ authError: { status: 429, code: "over_email_send_rate_limit" } }, 429],
    [{ authError: { status: 500, code: "unexpected_failure" } }, 503],
  ] as const) {
    await withServer(options, async (url, calls) => {
      assert.equal((await post(url, input)).status, status);
      if ("captcha" in options || "missingCaptcha" in options)
        assert.equal(calls.length, 0);
    });
  }
});
test("immediate sessions route by persisted profile rather than submitted metadata", async () => {
  await withServer({ confirmation: false, role: "vendedor" }, async (url) => {
    const response = await post(url, input);
    assert.equal(response.status, 201);
    const body = (await response.json()) as {
      user: { role: string };
      session: { access_token: string };
    };
    assert.equal(body.user.role, "vendedor");
    assert.equal(body.session.access_token, "real-token");
  });
});
test("account endpoint verifies session and returns stored role despite forged metadata", async () => {
  await withServer({}, async (url) => {
    assert.equal((await fetch(`${url}/api/auth/me`)).status, 401);
    const response = await fetch(`${url}/api/auth/me`, {
      headers: { Authorization: "Bearer token" },
    });
    assert.equal(response.status, 200);
    assert.equal(
      ((await response.json()) as { user: { role: string } }).user.role,
      "comprador",
    );
  });
  await withServer({ invalidToken: true }, async (url) => {
    assert.equal(
      (
        await fetch(`${url}/api/auth/me`, {
          headers: { Authorization: "Bearer token" },
        })
      ).status,
      401,
    );
  });
});
