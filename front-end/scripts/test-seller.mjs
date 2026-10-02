import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

// Compile the actual pure domain modules, so no browser, database or extra runner is required.
const directory = mkdtempSync(join(tmpdir(), 'lockbox-seller-tests-'));
for (const name of ['model', 'domain', 'seed', 'codec']) {
  const source = readFileSync(new URL(`../src/lib/seller/${name}.ts`, import.meta.url), 'utf8');
  writeFileSync(
    join(directory, `${name}.js`),
    ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
  );
}
const require = createRequire(import.meta.url);
const { applySellerAction, balances, parsePrice } = require(join(directory, 'domain.js'));
const { createDemoState } = require(join(directory, 'seed.js'));
const { decodeSnapshot } = require(join(directory, 'codec.js'));
after(() => rmSync(directory, { recursive: true, force: true }));
const now = Date.parse('2026-10-01T16:00:00Z');
const at = new Date(now).toISOString();
const fixture = () => createDemoState(now);

test('prices are parsed as integer cents, including decimal comma', () => {
  assert.equal(parsePrice('185,75'), 18575);
  assert.equal(parsePrice('0.10'), 10);
  for (const value of ['-1', '0', '12.999', 'abc', '1e3', 'Infinity', '100000000'])
    assert.throws(() => parsePrice(value));
});
test('publishing requires stock and keeps the source state immutable', () => {
  const state = fixture();
  state.products[3].stock = 0;
  assert.throws(
    () =>
      applySellerAction(state, {
        type: 'setProductStatus',
        id: state.products[3].id,
        status: 'published',
      }),
    /stock/,
  );
  assert.equal(state.products[3].status, 'draft');
});
test('duplicate SKUs, fractional stock and unsafe image URLs are rejected', () => {
  const state = fixture();
  const product = { ...state.products[0], id: 'new', sku: 'mod-001' };
  assert.throws(() => applySellerAction(state, { type: 'saveProduct', product }), /SKU/);
  assert.throws(
    () =>
      applySellerAction(state, {
        type: 'saveProduct',
        product: { ...product, sku: 'NEW', stock: 1.5 },
      }),
    /stock/,
  );
  assert.throws(
    () =>
      applySellerAction(state, {
        type: 'saveProduct',
        product: { ...product, sku: 'NEW', imageUrl: 'javascript:alert(1)' },
      }),
    /HTTPS/,
  );
});
test('catalog editing and archiving preserve historical orders', () => {
  const state = fixture();
  const next = applySellerAction(state, {
    type: 'saveProduct',
    product: { ...state.products[0], priceCents: 22000, title: 'Nueva chaqueta' },
  });
  const archived = applySellerAction(next, {
    type: 'setProductStatus',
    id: state.products[0].id,
    status: 'archived',
  });
  assert.equal(archived.products[0].status, 'archived');
  assert.deepEqual(archived.orders, state.orders);
  assert.throws(
    () => applySellerAction(archived, { type: 'saveProduct', product: state.products[0] }),
    /archivado/,
  );
});
test('live requires a title and published products with stock', () => {
  const state = fixture();
  const action = { type: 'startLive', id: 'live-1', title: 'Favoritos', productIds: [], at };
  assert.throws(() => applySellerAction(state, action), /productos/);
  assert.throws(
    () => applySellerAction(state, { ...action, productIds: ['demo-product-4'] }),
    /productos/,
  );
  assert.throws(
    () => applySellerAction(state, { ...action, title: ' ', productIds: ['demo-product-1'] }),
    /título/,
  );
});
test('one active live; active products cannot be changed until it ends', () => {
  const state = fixture();
  const action = {
    type: 'startLive',
    id: 'live-1',
    title: 'Favoritos',
    productIds: ['demo-product-1', 'demo-product-1'],
    at,
  };
  const live = applySellerAction(state, action);
  assert.equal(live.sessions[0].productIds.length, 1);
  assert.throws(() => applySellerAction(live, { ...action, id: 'live-2' }), /curso/);
  assert.throws(
    () =>
      applySellerAction(live, { type: 'setProductStatus', id: 'demo-product-1', status: 'paused' }),
    /Finaliza/,
  );
  const ended = applySellerAction(live, { type: 'endLive', at });
  assert.equal(
    applySellerAction(ended, { type: 'setProductStatus', id: 'demo-product-1', status: 'paused' })
      .products[0].status,
    'paused',
  );
});
test('only paid orders can be dispatched; repeated dispatch cannot duplicate history', () => {
  const state = fixture();
  const next = applySellerAction(state, { type: 'dispatchOrder', id: 'LB-1048', at });
  assert.equal(next.orders[0].status, 'dispatched');
  assert.equal(next.orders[0].history.length, 2);
  assert.equal(next.orders[0].releasedAt, null);
  assert.throws(
    () => applySellerAction(next, { type: 'dispatchOrder', id: 'LB-1048', at }),
    /confirmado/,
  );
  assert.throws(
    () => applySellerAction(state, { type: 'dispatchOrder', id: 'LB-1043', at }),
    /confirmado/,
  );
});
test('wallet separates escrow, settlement delay and available proceeds', () => {
  const balance = balances(fixture(), now);
  assert.equal(balance.heldCents, (18500 + 12000 + 9500) * 0.94);
  assert.equal(balance.availableCents, 18500 * 0.94);
  assert.equal(balance.settlingCents, 12000 * 0.94);
});
test('Emprende becomes available at exactly 48 hours; Pro is immediate', () => {
  const state = fixture();
  state.orders = [{ ...state.orders[3], releasedAt: at }];
  assert.equal(balances(state, now + 48 * 3600000 - 1).availableCents, 0);
  assert.equal(balances(state, now + 48 * 3600000).availableCents, 17390);
  state.orders[0].settlementDelayHours = 0;
  assert.equal(balances(state, now).availableCents, 17390);
});
test('changing plans never alters existing order commissions or settlement delays', () => {
  const state = fixture();
  const next = applySellerAction(state, { type: 'changePlan', plan: 'pro' });
  assert.equal(next.plan, 'pro');
  assert.deepEqual(next.orders, state.orders);
  assert.deepEqual(balances(next, now), balances(state, now));
});
test('a payout request reserves only available funds and cannot spend twice', () => {
  const next = applySellerAction(fixture(), { type: 'requestPayout', id: 'payout-1', at });
  assert.equal(next.payouts[0].amountCents, 17390);
  assert.equal(next.payouts[0].status, 'pending');
  assert.equal(balances(next, now).availableCents, 0);
  assert.throws(
    () => applySellerAction(next, { type: 'requestPayout', id: 'payout-2', at }),
    /saldo/,
  );
});
test('snapshot round trip preserves edited catalog, live, plans and payout requests', () => {
  let state = applySellerAction(fixture(), {
    type: 'startLive',
    id: 'live-1',
    title: 'Favoritos',
    productIds: ['demo-product-1'],
    at,
  });
  state = applySellerAction(state, { type: 'changePlan', plan: 'pro' });
  state = applySellerAction(state, { type: 'requestPayout', id: 'payout-1', at });
  assert.deepEqual(decodeSnapshot(JSON.stringify(state)), state);
});
test('corrupt/obsolete browser snapshots are rejected rather than trusted', () => {
  assert.throws(() => decodeSnapshot('{'));
  assert.throws(() => decodeSnapshot(JSON.stringify({ ...fixture(), version: 2 })));
  const state = fixture();
  state.orders[0].commissionCents = -1;
  assert.throws(() => decodeSnapshot(JSON.stringify(state)), /Pedido/);
  const duplicate = fixture();
  duplicate.products.push(duplicate.products[0]);
  assert.throws(() => decodeSnapshot(JSON.stringify(duplicate)), /duplicados/);
});
test('seller store profiles are validated', () => {
  const state = fixture();
  assert.throws(() =>
    applySellerAction(state, {
      type: 'saveProfile',
      profile: { ...state.profile, handle: 'ADMIN/../' },
    }),
  );
  assert.equal(
    applySellerAction(state, {
      type: 'saveProfile',
      profile: { ...state.profile, storeName: 'Nueva tienda' },
    }).profile.storeName,
    'Nueva tienda',
  );
});
