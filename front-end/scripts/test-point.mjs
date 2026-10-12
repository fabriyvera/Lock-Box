import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Module from "node:module";
import ts from "typescript";

function load(path) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const fixture = new Module("point-model-test");
  fixture.require = () => ({});
  fixture._compile(compiled, "point-model-test.cjs");
  return fixture.exports;
}
const { nextPointStatus } = load("../src/lib/collection-point/model.ts");
const { accountPath } = load("../src/lib/auth/account.ts");
test("point UI only proposes the next physical fulfillment state", () => {
  assert.equal(nextPointStatus("dispatched").status, "in_lockbox");
  assert.equal(nextPointStatus("in_lockbox").status, "ready");
  assert.equal(nextPointStatus("ready").status, "delivered");
  for (const status of [
    "pending",
    "paid",
    "delivered",
    "released",
    "cancelled",
    "refunded",
    "disputed",
    "unknown",
  ])
    assert.equal(nextPointStatus(status), null);
});
test("login preserves buyer and seller paths and routes staff to the point", () => {
  assert.equal(accountPath("comprador"), "/dashboard");
  assert.equal(accountPath("vendedor"), "/vendedor");
  assert.equal(accountPath("admin"), "/admin");
  assert.equal(accountPath("despachador"), "/admin");
  assert.throws(() => accountPath("unknown"));
});
