import { applySellerAction, validateProduct } from "./domain";
import { ORDER_LABELS, PRODUCT_LABELS, type SellerState } from "./model";

function validDate(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

/** Validate API snapshots and legacy fixtures before rendering. */
export function decodeSnapshot(raw: string): SellerState {
  const state = JSON.parse(raw) as SellerState;
  if (
    !state ||
    state.version !== 1 ||
    !["emprende", "pro"].includes(state.plan) ||
    !state.profile ||
    !["storeName", "handle", "city", "bio"].every(
      (key) =>
        typeof state.profile[key as keyof SellerState["profile"]] === "string",
    ) ||
    !Array.isArray(state.products) ||
    !Array.isArray(state.orders) ||
    !Array.isArray(state.sessions) ||
    !Array.isArray(state.payouts)
  )
    throw new Error("Datos de vendedor incompatibles.");
  if (
    state.planSettings &&
    ["emprende", "pro"].some((code) => {
      const plan = state.planSettings![code as keyof typeof state.planSettings];
      return (
        !plan ||
        typeof plan.name !== "string" ||
        !Number.isFinite(plan.commissionPercent) ||
        plan.commissionPercent < 0 ||
        plan.commissionPercent > 100 ||
        ![0, 48].includes(plan.settlementHours)
      );
    })
  )
    throw new Error("Configuración de planes incompatible.");
  for (const product of state.products) {
    if (
      !product ||
      !["id", "title", "description", "category", "sku", "imageUrl"].every(
        (key) => typeof product[key as keyof typeof product] === "string",
      ) ||
      !Array.isArray(product.tags) ||
      !product.tags.every((tag) => typeof tag === "string") ||
      !Object.hasOwn(PRODUCT_LABELS, product.status) ||
      !validDate(product.createdAt)
    )
      throw new Error("Producto inválido.");
    // A published item may sell its last unit; stock=0 is valid on reads.
    validateProduct(
      {
        ...product,
        status: product.status === "published" ? "paused" : product.status,
      },
      state.products,
    );
  }
  for (const order of state.orders) {
    if (
      !order ||
      !["id", "buyer", "productTitle", "point", "address"].every(
        (key) => typeof order[key as keyof typeof order] === "string",
      ) ||
      !Object.hasOwn(ORDER_LABELS, order.status) ||
      !Number.isSafeInteger(order.quantity) ||
      order.quantity < 1 ||
      !Number.isSafeInteger(order.subtotalCents) ||
      order.subtotalCents < 0 ||
      !Number.isSafeInteger(order.commissionCents) ||
      order.commissionCents < 0 ||
      order.commissionCents > order.subtotalCents ||
      ![0, 48].includes(order.settlementDelayHours) ||
      !validDate(order.createdAt) ||
      (order.releasedAt !== null && !validDate(order.releasedAt)) ||
      (order.status === "released" && !order.releasedAt) ||
      !Array.isArray(order.history) ||
      order.history.some(
        (h) => !h || !Object.hasOwn(ORDER_LABELS, h.status) || !validDate(h.at),
      )
    )
      throw new Error("Pedido inválido.");
  }
  for (const live of state.sessions) {
    if (
      !live ||
      typeof live.id !== "string" ||
      typeof live.title !== "string" ||
      !Array.isArray(live.productIds) ||
      live.productIds.some((id) => !state.products.some((p) => p.id === id)) ||
      !validDate(live.startedAt) ||
      (live.endedAt !== null && !validDate(live.endedAt))
    )
      throw new Error("Live inválido.");
    if (
      !live.endedAt &&
      live.productIds.some(
        (id) =>
          !state.products.some((p) => p.id === id && p.status === "published"),
      )
    )
      throw new Error("Catálogo de live inválido.");
  }
  if (state.sessions.filter((s) => !s.endedAt).length > 1)
    throw new Error("Lives duplicados.");
  for (const payout of state.payouts) {
    if (
      !payout ||
      typeof payout.id !== "string" ||
      !Number.isSafeInteger(payout.amountCents) ||
      payout.amountCents <= 0 ||
      !["pending", "completed"].includes(payout.status) ||
      !validDate(payout.createdAt)
    )
      throw new Error("Liquidación inválida.");
  }
  for (const items of [
    state.products,
    state.orders,
    state.sessions,
    state.payouts,
  ])
    if (new Set(items.map((item) => item.id)).size !== items.length)
      throw new Error("Identificadores duplicados.");
  applySellerAction(state, { type: "saveProfile", profile: state.profile });
  return state;
}
