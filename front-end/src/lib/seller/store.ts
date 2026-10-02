'use client';

import { useSyncExternalStore } from 'react';
import { applySellerAction } from './domain';
import { type SellerAction, type SellerState } from './model';
import { decodeSnapshot } from './codec';
import { createDemoState } from './seed';

const STORAGE_KEY = 'lockbox.seller.demo.v1';
let snapshot: SellerState | null = null;
let initialized = false;
let storageWarning = '';
const listeners = new Set<() => void>();

function readStorage(): SellerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return decodeSnapshot(raw);
  } catch {
    storageWarning =
      'No se pudieron leer los datos guardados. La demo original está visible; reinicia la demo para recuperar el almacenamiento.';
  }
  return createDemoState();
}

function getSnapshot() {
  if (typeof window === 'undefined') return null;
  if (!initialized) {
    snapshot = readStorage();
    initialized = true;
  }
  return snapshot;
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      snapshot = readStorage();
      callback();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', onStorage);
  };
}

function persist(state: SellerState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    throw new Error(
      'No se pudo guardar. Comprueba el espacio o los permisos de almacenamiento del navegador.',
    );
  }
  snapshot = state;
  storageWarning = '';
  listeners.forEach((callback) => callback());
}

export function useSellerStore() {
  const state = useSyncExternalStore(subscribe, getSnapshot, () => null);
  return {
    state,
    storageWarning,
    dispatch(action: SellerAction) {
      if (storageWarning) throw new Error('Reinicia la demo antes de guardar nuevos cambios.');
      // Re-read before writes, so sequential actions from different tabs keep each other's changes.
      const current = readStorage();
      if (storageWarning) throw new Error(storageWarning);
      persist(applySellerAction(current, action));
    },
    reset() {
      persist(createDemoState());
    },
  };
}
