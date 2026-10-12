import { BuyerOrder, CartItem, BuyerProduct } from './model';

export function formatBOB(cents: number): string {
  return `Bs ${(cents / 100).toFixed(2)}`;
}

export function calculateCartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.product.priceCents * item.quantity, 0);
}

export function canCancelOrder(order: BuyerOrder): boolean {
  // Solo se puede cancelar si fue pagado pero aún no ha sido despachado
  return order.status === 'paid';
}

export function canReviewOrder(order: BuyerOrder): boolean {
  return order.status === 'delivered' && !order.review;
}

export function canDisputeOrder(order: BuyerOrder): boolean {
  return (
    (order.status === 'dispatched' || order.status === 'in_lockbox' || order.status === 'delivered') &&
    !order.dispute
  );
}

export function generateOrderQR(orderId: string): { code: string; expiresAt: string } {
  const expires = new Date();
  expires.setDate(expires.getDate() + 7); // 7 días de vigencia para recojo
  return {
    code: `LBX-QR-${orderId.slice(0, 8).toUpperCase()}`,
    expiresAt: expires.toISOString(),
  };
}