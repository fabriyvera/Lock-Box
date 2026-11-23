import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createApp } from "../src/create-app.js";
import { parseEnvironment } from "../src/config/environment.js";
import type { Database } from "../src/types/database.js";

const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const headers = { Authorization: "Bearer admin-token", "Content-Type": "application/json" };
async function server(options: { role?: string; active?: boolean; invalid?: boolean; code?: string }, run: (base: string, calls: unknown[]) => Promise<void>) {
  const calls: unknown[] = [];
  const client = {
    auth: { getUser: async () => ({ data: { user: options.invalid ? null : { id } }, error: null }) },
    from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { id, role: options.role ?? "admin", is_active: options.active ?? true }, error: null }) }) }) }),
    rpc: async (name: string, args: unknown) => { calls.push({ name, args }); return { data: { success: true }, error: options.code ? { code: options.code, message: "Test refusal" } : null }; },
  } as unknown as SupabaseClient<Database>;
  const app = createApp(parseEnvironment({ SUPABASE_URL: "https://test.supabase.co", SUPABASE_PUBLISHABLE_KEY: "test" }), { createClient: (token) => { assert.equal(token, "admin-token"); return client; } }).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => app.once("listening", resolve));
  try { await run(`http://127.0.0.1:${(app.address() as AddressInfo).port}`, calls); }
  finally { await new Promise<void>((resolve) => app.close(() => resolve())); }
}
const period = "/api/admin/state?from=2026-11-01&to=2026-11-30";
test("admin API requires a verified active admin, not just any authenticated JWT", async () => {
  await server({}, async (base, calls) => { assert.equal((await fetch(base + period)).status, 401); assert.equal(calls.length, 0); });
  for (const options of [{ role: "comprador" }, { role: "vendedor" }, { role: "operador_punto" }, { role: "despachador" }, { active: false }, { invalid: true }]) {
    await server(options, async (base, calls) => { assert.equal((await fetch(base + period, { headers })).status, options.invalid ? 401 : 403); assert.equal(calls.length, 0); });
  }
});
test("reports reject invalid dates, reverse/oversized periods and untrusted extra fields", async () => {
  await server({}, async (base, calls) => {
    for (const query of ["from=2026-02-30&to=2026-03-01", "from=2026-12-01&to=2026-11-01", "from=2020-01-01&to=2026-11-01", "from=2026-11-01&to=2026-11-30&includeTests=1", "from=2026-11-01&to=2026-11-30&role=admin"]) assert.equal((await fetch(base + "/api/admin/state?" + query, { headers })).status, 400);
    assert.equal(calls.length, 0);
    const response = await fetch(base + period, { headers });
    assert.equal(response.status, 200); assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(calls, [{ name: "admin_state", args: { p_start: "2026-11-01", p_end: "2026-11-30", p_include_tests: false } }]);
  });
});
test("admin actions cannot assign roles, modify amounts or delete records", async () => {
  await server({}, async (base, calls) => {
    for (const body of [{ entity: "profile", id, active: true, role: "admin" }, { entity: "order", id, active: true }, { entity: "profile", id, active: "false" }, { entity: "point", id, active: true, fee: 0 }]) assert.equal((await fetch(base + "/api/admin/active", { method: "POST", headers, body: JSON.stringify(body) })).status, 400);
    assert.equal(calls.length, 0);
    assert.equal((await fetch(base + "/api/admin/active", { method: "POST", headers, body: JSON.stringify({ entity: "point", id, active: false }) })).status, 200);
    assert.deepEqual(calls[0], { name: "admin_set_active", args: { p_entity: "point", p_id: id, p_active: false } });
  });
});
test("admin conflicts and permission failures retain actionable HTTP status", async () => {
  for (const [code, status] of [["42501", 403], ["P0002", 404], ["P0001", 409], ["22023", 400], ["XX000", 500]] as const) await server({ code }, async (base) => { assert.equal((await fetch(base + period, { headers })).status, status); });
});
