import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Module from "node:module";
import ts from "typescript";
const file = new URL("../src/lib/buyer/request.ts", import.meta.url);
const module = new Module(file.pathname);
module._compile(
  ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText,
  file.pathname,
);
const { buyerRequest, buyerErrorMessage } = module.exports;
test("buyer reads recover once from transient failures and server cold starts", async () => {
  for (const failure of [
    new DOMException("signal timed out", "TimeoutError"),
    new TypeError("fetch failed"),
    new Response("", { status: 503 }),
  ]) {
    let calls = 0;
    const result = await buyerRequest(
      "https://example.invalid/state",
      { method: "GET" },
      async () => {
        calls++;
        if (calls === 1) {
          if (failure instanceof Response) return failure;
          throw failure;
        }
        return Response.json({ state: "loaded" });
      },
    );
    assert.equal(calls, 2);
    assert.equal(result.state, "loaded");
  }
});
test("buyer writes are never automatically replayed and read retries are bounded", async () => {
  for (const method of ["POST", "GET"]) {
    let calls = 0;
    await assert.rejects(() =>
      buyerRequest("https://example.invalid/actions", { method }, async () => {
        calls++;
        throw new TypeError("fetch failed");
      }),
    );
    assert.equal(calls, method === "POST" ? 1 : 2);
  }
});
test("buyer messages explain timeouts without exposing browser error text", () => {
  assert.match(
    buyerErrorMessage(new DOMException("signal timed out", "TimeoutError")),
    /La conexión tardó demasiado/,
  );
  assert.match(
    buyerErrorMessage(new TypeError("Failed to fetch")),
    /No se pudo conectar/,
  );
  assert.equal(buyerErrorMessage(new Error("No hay stock")), "No hay stock");
});
