import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Module from "node:module";
import ts from "typescript";

const root = fileURLToPath(new URL("../src/lib/buyer/", import.meta.url));
function fixture() {
  const cache = new Map();
  function load(path) {
    const file = resolve(root, path);
    if (cache.has(file)) return cache.get(file).exports;
    const source = readFileSync(file, "utf8");
    const compiled = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText;
    const mod = new Module(file);
    cache.set(file, mod);
    mod.require = (id) =>
      id === "react"
        ? { useSyncExternalStore: (_subscribe, snapshot) => snapshot() }
        : load(resolve(dirname(file), `${id}.ts`));
    mod._compile(compiled, file);
    return mod.exports;
  }
  const store = load("store.ts");
  return {
    read: () => store.useBuyerStore()[0],
    actions: store.buyerActions,
    codec: load("codec.ts"),
    domain: load("domain.ts"),
    seed: load("seed.ts"),
  };
}
test("buyer seed is deterministic for server and browser rendering", () => {
  const { seed } = fixture();
  assert.deepEqual(
    seed.createInitialBuyerState(),
    seed.createInitialBuyerState(),
  );
});
test("buyer cart caps stock and rejects fractional or negative quantities", () => {
  const f = fixture();
  const product = f.read().catalog[0];
  for (const quantity of [-1, 0, 0.5, NaN, Infinity])
    f.actions.addToCart(product, quantity);
  assert.equal(f.read().cart.length, 0);
  f.actions.addToCart(product, product.stock + 10);
  assert.equal(f.read().cart[0].quantity, product.stock);
  f.actions.updateCartQuantity(product.id, 0.5);
  assert.equal(f.read().cart[0].quantity, product.stock);
  f.actions.updateCartQuantity(product.id, 0);
  assert.equal(f.read().cart.length, 0);
});
test("checkout creates a local demo order, clears cart and decrements inventory", () => {
  const f = fixture();
  const product = f.read().catalog[0];
  const before = product.stock;
  f.actions.addToCart(product, 2);
  assert.equal(f.actions.checkout("unknown", "yape"), null);
  const order = f.actions.checkout(f.read().lockBoxPoints[0].id, "yape");
  assert.equal(order.subtotalCents, product.priceCents * 2);
  assert.equal(order.status, "paid");
  assert.ok(order.qrCode.startsWith("LBX-DEMO-"));
  assert.equal(f.read().cart.length, 0);
  assert.equal(f.read().catalog[0].stock, before - 2);
  assert.equal(f.actions.checkout(f.read().lockBoxPoints[0].id, "yape"), null);
});
test("orders with a common prefix receive distinct demo tokens", () => {
  const { domain } = fixture();
  assert.notEqual(
    domain.generateOrderQR("ord-1791808000000").code,
    domain.generateOrderQR("ord-1791808000001").code,
  );
});
test("cancellation restores inventory once and cannot be undone by delivery simulation", () => {
  const f = fixture();
  const product = f.read().catalog[0];
  f.actions.addToCart(product);
  const order = f.actions.checkout(f.read().lockBoxPoints[0].id, "bcp");
  assert.equal(f.actions.cancelOrder(order.id), true);
  assert.equal(f.actions.cancelOrder(order.id), false);
  f.actions.simulateDelivery(order.id);
  assert.equal(f.read().orders[0].status, "cancelled");
  assert.equal(f.read().catalog[0].stock, product.stock);
});
test("reviews and disputes validate eligibility and reject repeat submissions", () => {
  const f = fixture();
  const id = f.read().orders[0].id;
  assert.equal(f.actions.reviewOrder(id, 5, "Bien"), false);
  f.actions.simulateDelivery(id);
  assert.equal(f.actions.reviewOrder(id, NaN, "Bien"), false);
  assert.equal(f.actions.reviewOrder(id, 5, ""), false);
  assert.equal(f.actions.reviewOrder(id, 5, "Bien"), true);
  assert.equal(f.actions.reviewOrder(id, 5, "Otra"), false);
  assert.equal(f.actions.openDispute(id, "", "detalle"), false);
  assert.equal(f.actions.openDispute(id, "Falla", "Producto incompleto"), true);
  assert.equal(f.actions.openDispute(id, "Falla", "Otra"), false);
});
test("buyer snapshots reject missing filters and malformed nested records", () => {
  const f = fixture();
  const valid = JSON.parse(JSON.stringify(f.read()));
  assert.equal(f.codec.isBuyerStateValid(valid), true);
  for (const mutate of [
    (s) => delete s.searchQuery,
    (s) => (s.catalog[0].priceCents = NaN),
    (s) => (s.orders[0].lockBoxPoint = null),
    (s) => s.cart.push({ product: s.catalog[0], quantity: 0 }),
    (s) => (s.orders[0].createdAt = "broken"),
  ]) {
    const value = structuredClone(valid);
    mutate(value);
    assert.equal(f.codec.isBuyerStateValid(value), false);
  }
});
