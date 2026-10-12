'use client';

import { useSyncExternalStore } from 'react';
import { BuyerProduct, BuyerState, CartItem, BuyerOrder } from './model';
import { calculateCartSubtotal, canCancelOrder, canDisputeOrder, canReviewOrder, generateOrderQR } from './domain';
import { createInitialBuyerState } from './seed';
import { loadBuyerState, saveBuyerState, clearBuyerStorage } from './codec';

let currentState: BuyerState = loadBuyerState();
const listeners = new Set<() => void>();

function emitChange() {
  saveBuyerState(currentState);
  listeners.forEach((listener) => listener());
}

function updateState(updater: (prev: BuyerState) => BuyerState) {
  currentState = updater(currentState);
  emitChange();
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'lockbox.buyer.demo.v1') {
      currentState = loadBuyerState();
      listeners.forEach((listener) => listener());
    }
  });
}

export const buyerActions = {
  // B1 y B2: Filtros y Búsqueda
  setSearchQuery(query: string) {
    updateState((prev) => ({ ...prev, searchQuery: query }));
  },

  setSelectedCategory(categoryId: string | null) {
    updateState((prev) => ({ ...prev, selectedCategory: categoryId }));
  },

  toggleLiveSessionFilter() {
    updateState((prev) => ({ ...prev, activeLiveSession: !prev.activeLiveSession }));
  },

  // B3: Carrito de compras
  addToCart(product: BuyerProduct, quantity = 1) {
    updateState((prev) => {
      const existing = prev.cart.find((item) => item.product.id === product.id);
      const currentQty = existing ? existing.quantity : 0;
      const nextQty = Math.min(product.stock, currentQty + quantity);

      if (nextQty <= currentQty) return prev;

      let nextCart: CartItem[];
      if (existing) {
        nextCart = prev.cart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: nextQty } : item
        );
      } else {
        nextCart = [...prev.cart, { product, quantity: nextQty }];
      }

      return { ...prev, cart: nextCart };
    });
  },

  updateCartQuantity(productId: string, quantity: number) {
    updateState((prev) => {
      if (quantity <= 0) {
        return {
          ...prev,
          cart: prev.cart.filter((item) => item.product.id !== productId),
        };
      }

      return {
        ...prev,
        cart: prev.cart.map((item) => {
          if (item.product.id === productId) {
            const capped = Math.min(item.product.stock, quantity);
            return { ...item, quantity: capped };
          }
          return item;
        }),
      };
    });
  },

  removeFromCart(productId: string) {
    updateState((prev) => ({
      ...prev,
      cart: prev.cart.filter((item) => item.product.id !== productId),
    }));
  },

  clearCart() {
    updateState((prev) => ({ ...prev, cart: [] }));
  },

  // B4: Pagar con Escrow (Checkout)
  checkout(lockBoxPointId: string, paymentMethod: 'yape' | 'bcp'): BuyerOrder | null {
    if (currentState.cart.length === 0) return null;

    const point = currentState.lockBoxPoints.find((p) => p.id === lockBoxPointId);
    if (!point) return null;

    const subtotal = calculateCartSubtotal(currentState.cart);
    const orderId = `ord-${Date.now()}`;
    const qrData = generateOrderQR(orderId);

    const newOrder: BuyerOrder = {
      id: orderId,
      orderNumber: `LB-${Math.floor(10000 + Math.random() * 90000)}`,
      items: [...currentState.cart],
      subtotalCents: subtotal,
      totalCents: subtotal,
      lockBoxPoint: point,
      paymentMethod,
      status: 'paid', // Retenido en garantía Escrow
      qrCode: qrData.code,
      qrExpiresAt: qrData.expiresAt,
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
    };

    updateState((prev) => {
      // Descontar inventario del catálogo local
      const updatedCatalog = prev.catalog.map((prod) => {
        const cartItem = prev.cart.find((ci) => ci.product.id === prod.id);
        if (cartItem) {
          return { ...prod, stock: Math.max(0, prod.stock - cartItem.quantity) };
        }
        return prod;
      });

      return {
        ...prev,
        catalog: updatedCatalog,
        orders: [newOrder, ...prev.orders],
        cart: [],
      };
    });

    return newOrder;
  },

  // B7: Cancelar pedido antes del despacho
  cancelOrder(orderId: string): boolean {
    const order = currentState.orders.find((o) => o.id === orderId);
    if (!order || !canCancelOrder(order)) return false;

    updateState((prev) => {
      // Reintegrar stock al catálogo
      const restoredCatalog = prev.catalog.map((prod) => {
        const item = order.items.find((i) => i.product.id === prod.id);
        if (item) {
          return { ...prod, stock: prod.stock + item.quantity };
        }
        return prod;
      });

      const updatedOrders = prev.orders.map((o) =>
        o.id === orderId
          ? { ...o, status: 'cancelled' as const, cancelledAt: new Date().toISOString() }
          : o
      );

      return { ...prev, catalog: restoredCatalog, orders: updatedOrders };
    });

    return true;
  },

  // B9: Calificar producto / vendedor
  reviewOrder(orderId: string, rating: number, comment: string): boolean {
    const order = currentState.orders.find((o) => o.id === orderId);
    if (!order || !canReviewOrder(order)) return false;

    updateState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              review: {
                rating: Math.max(1, Math.min(5, rating)),
                comment,
                createdAt: new Date().toISOString(),
              },
            }
          : o
      ),
    }));

    return true;
  },

  // B10: Abrir disputa
  openDispute(orderId: string, reason: string, description: string): boolean {
    const order = currentState.orders.find((o) => o.id === orderId);
    if (!order || !canDisputeOrder(order)) return false;

    updateState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'disputed' as const,
              dispute: {
                reason,
                description,
                status: 'open',
                createdAt: new Date().toISOString(),
              },
            }
          : o
      ),
    }));

    return true;
  },

  // Simulación: Avanzar pedido a retirado (para probar B6 y B9)
  simulateDelivery(orderId: string) {
    updateState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'delivered' as const,
              deliveredAt: new Date().toISOString(),
            }
          : o
      ),
    }));
  },

  // Reiniciar estado
  resetDemo() {
    clearBuyerStorage();
    currentState = createInitialBuyerState();
    emitChange();
  },
};

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): BuyerState {
  return currentState;
}

const serverSnapshot = createInitialBuyerState();
function getServerSnapshot(): BuyerState {
  return serverSnapshot;
}

export function useBuyerStore(): [BuyerState, typeof buyerActions] {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return [state, buyerActions];
}