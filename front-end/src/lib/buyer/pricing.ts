import type { CartItem } from "./model";

// Preview only. PostgreSQL revalidates prices, stock and fees at checkout.
export function previewCheckout(cart: CartItem[], feeCentsPerOrder: number) {
  const subtotals = new Map<string, number>();
  for (const item of cart) {
    subtotals.set(item.product.sellerId, (subtotals.get(item.product.sellerId) ?? 0) + item.product.priceCents * item.quantity);
  }
  const merchandise = [...subtotals.values()].reduce((sum, value) => sum + value, 0);
  const fee = subtotals.size * feeCentsPerOrder;
  const reservedMerchandise = [...subtotals.values()].reduce((sum, value) => sum + Math.round(value / 2), 0);
  return { orderCount: subtotals.size, merchandise, fee, total: merchandise + fee, deposit: reservedMerchandise + fee, balance: merchandise - reservedMerchandise };
}
