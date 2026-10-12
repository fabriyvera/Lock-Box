import { BuyerState } from "./model";
import { createInitialBuyerState } from "./seed";

export const BUYER_STORAGE_KEY = "lockbox.buyer.demo.v1";

function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function integer(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}
function strings(value: Record<string, unknown>, keys: string[]) {
  return keys.every((key) => typeof value[key] === "string");
}
function product(value: unknown) {
  return (
    object(value) &&
    strings(value, [
      "id",
      "sellerId",
      "sellerName",
      "categoryId",
      "categoryName",
      "title",
      "description",
      "sku",
      "imageUrl",
    ]) &&
    integer(value.priceCents) &&
    integer(value.stock) &&
    (value.isLiveFeatured === undefined ||
      typeof value.isLiveFeatured === "boolean")
  );
}
function items(value: unknown) {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        object(item) &&
        product(item.product) &&
        integer(item.quantity) &&
        item.quantity > 0,
    )
  );
}
function point(value: unknown) {
  return (
    object(value) &&
    strings(value, ["id", "name", "address", "city", "phone"]) &&
    integer(value.capacity)
  );
}
function date(value: unknown) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}
function order(value: unknown) {
  if (
    !object(value) ||
    !strings(value, ["id", "orderNumber", "qrCode"]) ||
    !items(value.items) ||
    !point(value.lockBoxPoint) ||
    !integer(value.subtotalCents) ||
    !integer(value.totalCents) ||
    !date(value.createdAt) ||
    !date(value.qrExpiresAt) ||
    !["yape", "bcp"].includes(String(value.paymentMethod)) ||
    ![
      "pending",
      "paid",
      "dispatched",
      "in_lockbox",
      "delivered",
      "released",
      "cancelled",
      "disputed",
    ].includes(String(value.status))
  )
    return false;
  if (
    value.review !== undefined &&
    (!object(value.review) ||
      !integer(value.review.rating) ||
      value.review.rating < 1 ||
      value.review.rating > 5 ||
      !strings(value.review, ["comment"]) ||
      !date(value.review.createdAt))
  )
    return false;
  if (
    value.dispute !== undefined &&
    (!object(value.dispute) ||
      !strings(value.dispute, ["reason", "description"]) ||
      !["open", "resolved"].includes(String(value.dispute.status)) ||
      !date(value.dispute.createdAt))
  )
    return false;
  return true;
}

export function isBuyerStateValid(data: unknown): data is BuyerState {
  if (!object(data)) return false;
  const s = data;
  return (
    Array.isArray(s.catalog) &&
    s.catalog.every(product) &&
    items(s.cart) &&
    Array.isArray(s.orders) &&
    s.orders.every(order) &&
    Array.isArray(s.lockBoxPoints) &&
    s.lockBoxPoints.every(point) &&
    typeof s.searchQuery === "string" &&
    typeof s.activeLiveSession === "boolean" &&
    (s.selectedCategory === null || typeof s.selectedCategory === "string")
  );
}

export function loadBuyerState(): BuyerState {
  if (typeof window === "undefined") {
    return createInitialBuyerState();
  }

  try {
    const raw = window.localStorage.getItem(BUYER_STORAGE_KEY);
    if (!raw) {
      const initial = createInitialBuyerState();
      saveBuyerState(initial);
      return initial;
    }

    const parsed = JSON.parse(raw);
    if (isBuyerStateValid(parsed)) {
      return parsed;
    }

    console.warn(
      "[LockBox Buyer] Snapshot dañado en localStorage. Restaurando seed.",
    );
    const fallback = createInitialBuyerState();
    saveBuyerState(fallback);
    return fallback;
  } catch (err) {
    console.error("[LockBox Buyer] Error accediendo a localStorage:", err);
    return createInitialBuyerState();
  }
}

export function saveBuyerState(state: BuyerState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BUYER_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("[LockBox Buyer] Error guardando estado:", err);
  }
}

export function clearBuyerStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(BUYER_STORAGE_KEY);
  } catch (err) {
    console.error("[LockBox Buyer] Error limpiando almacenamiento:", err);
  }
}
