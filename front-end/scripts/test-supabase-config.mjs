import test, { after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import Module from "node:module";
import ts from "typescript";

const source = readFileSync(
  new URL("../src/lib/supabase/config.ts", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const module = new Module("supabase-config-test");
module.require = createRequire(import.meta.url);
module._compile(compiled, "supabase-config-test.cjs");
const { getSupabaseConfig, requireSupabaseConfig } = module.exports;
const names = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];
const original = names.map((name) => process.env[name]);
after(() =>
  names.forEach((name, index) => {
    if (original[index] === undefined) delete process.env[name];
    else process.env[name] = original[index];
  }),
);

test("Supabase configuration handles absent values, both public key names and invalid URLs", () => {
  names.forEach((name) => delete process.env[name]);
  assert.equal(getSupabaseConfig(), null);
  assert.throws(requireSupabaseConfig, /front-end\/\.env.local/);
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  assert.equal(getSupabaseConfig(), null);
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "legacy-public-test-key";
  assert.equal(getSupabaseConfig().key, "legacy-public-test-key");
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "  sb_publishable_test  ";
  assert.equal(getSupabaseConfig().key, "sb_publishable_test");
  process.env.NEXT_PUBLIC_SUPABASE_URL = "not-a-url";
  assert.equal(getSupabaseConfig(), null);
  process.env.NEXT_PUBLIC_SUPABASE_URL = "javascript:alert(1)";
  assert.equal(getSupabaseConfig(), null);
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
  assert.equal(requireSupabaseConfig().url, "http://127.0.0.1:54321");
});
