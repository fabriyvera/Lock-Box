import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/create-app.js";
import { parseEnvironment } from "../src/config/environment.js";

const primary = "https://lock-box-d9wa.vercel.app";
const deployment = "https://lock-box-d9wa-9zdhgev77-fabriyveras-projects.vercel.app";
const source = {
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "public-test-key",
  FRONTEND_URL: primary,
};

test("CORS allows the primary and listed deployment origins, rejects other sites", async () => {
  const config = parseEnvironment({ ...source, CORS_ALLOWED_ORIGINS: ` ${deployment}/, ` });
  const server = createApp(config).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    for (const origin of [primary, deployment, "https://unrelated.vercel.app", `${primary}.attacker.invalid`]) {
      const expected = [primary, deployment].includes(origin) ? origin : null;
      const preflight = await fetch(`${base}/api/auth/login`, {
        method: "OPTIONS",
        headers: {
          Origin: origin,
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "content-type",
        },
      });
      assert.equal(preflight.status, 204);
      assert.equal(preflight.headers.get("access-control-allow-origin"), expected);
      assert.match(preflight.headers.get("vary") ?? "", /Origin/i);
      if (expected) {
        assert.equal(preflight.headers.get("access-control-allow-credentials"), "true");
        assert.match(preflight.headers.get("access-control-allow-headers") ?? "", /content-type/i);
      }
      const response = await fetch(`${base}/api/auth/login`, {
        method: "POST",
        headers: { Origin: origin, "Content-Type": "application/json" },
        body: "{}",
      });
      assert.equal(response.status, 400);
      assert.equal(response.headers.get("access-control-allow-origin"), expected);
      const profile = await fetch(`${base}/api/auth/me`, { headers: { Origin: origin } });
      assert.equal(profile.status, 401);
      assert.equal(profile.headers.get("access-control-allow-origin"), expected);
    }
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test("CORS configuration remains optional and rejects malformed or broad origins", () => {
  assert.deepEqual(parseEnvironment(source).CORS_ALLOWED_ORIGINS, []);
  for (const value of ["*", "https://*.vercel.app", "https://example.com/login", "https://user:pass@example.com", "ftp://example.com", "https://example.com?query=1"]) {
    assert.throws(() => parseEnvironment({ ...source, CORS_ALLOWED_ORIGINS: value }));
  }
});
