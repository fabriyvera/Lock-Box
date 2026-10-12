import { BuyerState } from './model';
import { createInitialBuyerState } from './seed';

export const BUYER_STORAGE_KEY = 'lockbox.buyer.demo.v1';

export function isBuyerStateValid(data: unknown): data is BuyerState {
  if (!data || typeof data !== 'object') return false;
  const s = data as Partial<BuyerState>;
  return (
    Array.isArray(s.catalog) &&
    Array.isArray(s.cart) &&
    Array.isArray(s.orders) &&
    Array.isArray(s.lockBoxPoints)
  );
}

export function loadBuyerState(): BuyerState {
  if (typeof window === 'undefined') {
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

    console.warn('[LockBox Buyer] Snapshot dañado en localStorage. Restaurando seed.');
    const fallback = createInitialBuyerState();
    saveBuyerState(fallback);
    return fallback;
  } catch (err) {
    console.error('[LockBox Buyer] Error accediendo a localStorage:', err);
    return createInitialBuyerState();
  }
}

export function saveBuyerState(state: BuyerState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(BUYER_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('[LockBox Buyer] Error guardando estado:', err);
  }
}

export function clearBuyerStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(BUYER_STORAGE_KEY);
  } catch (err) {
    console.error('[LockBox Buyer] Error limpiando almacenamiento:', err);
  }
}