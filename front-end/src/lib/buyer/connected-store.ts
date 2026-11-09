"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { apiUrl } from "@/lib/auth/account";
import { isBuyerStateValid } from "./codec";
import type { BuyerProduct, BuyerState } from "./model";

const emptyState: BuyerState = {
  catalog: [],
  cart: [],
  orders: [],
  lockBoxPoints: [],
  selectedCategory: null,
  searchQuery: "",
  activeLiveSession: false,
};
function useConnectedBuyer() {
  const [state, setState] = useState<BuyerState>(emptyState);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const client = useRef<ReturnType<typeof createClient> | null>(null);
  const mounted = useRef(false);
  const writing = useRef(false);
  const generation = useRef(0);
  const sequence = useRef(0);
  const pending = useRef(new Map<string, string>());

  const api = useCallback(async (path: string, body?: unknown) => {
    if (!client.current) throw new Error("No se pudo configurar la conexión.");
    const session = await client.current.auth.getSession();
    if (session.error || !session.data.session)
      throw new Error("Tu sesión venció. Vuelve a entrar.");
    const response = await fetch(apiUrl(`/api/buyer/${path}`), {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${session.data.session.access_token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.message || "No se pudo completar la operación.");
    return result;
  }, []);
  const refresh = useCallback(async () => {
    const current = ++sequence.current;
    const actor = generation.current;
    const result = await api("state");
    if (!isBuyerStateValid(result.state))
      throw new Error("El servidor devolvió datos de compra no válidos.");
    const next: BuyerState = result.state;
    if (
      mounted.current &&
      actor === generation.current &&
      current === sequence.current
    ) {
      setState((previous) => ({
        ...next,
        selectedCategory: previous.selectedCategory,
        searchQuery: previous.searchQuery,
        activeLiveSession: previous.activeLiveSession,
      }));
      setError("");
      setLoading(false);
    }
    return next;
  }, [api]);
  useEffect(() => {
    mounted.current = true;
    const generationRef = generation;
    const report = (err: unknown) => {
      if (mounted.current) {
        setError(
          err instanceof Error ? err.message : "No se pudo cargar tu cuenta.",
        );
        setLoading(false);
      }
    };
    let unsubscribe = () => {};
    try {
      client.current = createClient();
      const { data } = client.current.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_OUT" || event === "SIGNED_IN") {
          generation.current++;
          sequence.current++;
          pending.current.clear();
          setState(emptyState);
          if (event === "SIGNED_IN")
            queueMicrotask(() => {
              if (mounted.current) void refresh().catch(report);
            });
        }
      });
      unsubscribe = () => data.subscription.unsubscribe();
      void refresh().catch(report);
    } catch (err) {
      queueMicrotask(() => report(err));
    }
    return () => {
      mounted.current = false;
      generationRef.current++;
      unsubscribe();
    };
  }, [refresh]);

  const mutate = useCallback(
    async (action: Record<string, unknown>) => {
      if (writing.current) return null;
      writing.current = true;
      setBusy(true);
      setError("");
      const actor = generation.current;
      const signature = JSON.stringify(action);
      const requestId = pending.current.get(signature) ?? crypto.randomUUID();
      pending.current.set(signature, requestId);
      try {
        const response = await api("actions", { action, requestId });
        const next = await refresh();
        pending.current.delete(signature);
        return mounted.current && actor === generation.current
          ? { result: response.result, state: next }
          : null;
      } catch (err) {
        if (mounted.current && actor === generation.current)
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo guardar el cambio.",
          );
        return null;
      } finally {
        writing.current = false;
        if (mounted.current) setBusy(false);
      }
    },
    [api, refresh],
  );
  const actions = useMemo(
    () => ({
      setSearchQuery: (searchQuery: string) =>
        setState((s) => ({ ...s, searchQuery })),
      setSelectedCategory: (selectedCategory: string | null) =>
        setState((s) => ({ ...s, selectedCategory })),
      toggleLiveSessionFilter: () =>
        setState((s) => ({ ...s, activeLiveSession: !s.activeLiveSession })),
      addToCart: async (product: BuyerProduct, quantity = 1) =>
        !!(await mutate({
          type: "addToCart",
          productId: product.id,
          quantity,
        })),
      updateCartQuantity: async (productId: string, quantity: number) =>
        !!(await mutate({ type: "setCartQuantity", productId, quantity })),
      removeFromCart: async (productId: string) =>
        !!(await mutate({ type: "removeFromCart", productId })),
      clearCart: async () => !!(await mutate({ type: "clearCart" })),
      checkout: async (pointId: string, paymentMethod: "yape" | "bcp") => {
        const response = await mutate({
          type: "checkout",
          pointId,
          paymentMethod,
        });
        return (
          response?.state.orders.find((o) =>
            response.result.orderIds?.includes(o.id),
          ) ?? null
        );
      },
      cancelOrder: async (orderId: string) =>
        !!(await mutate({ type: "cancelOrder", orderId })),
      reviewOrder: async (orderId: string, rating: number, comment: string) =>
        !!(await mutate({ type: "reviewOrder", orderId, rating, comment })),
      openDispute: async (
        orderId: string,
        reason: string,
        description: string,
      ) =>
        !!(await mutate({ type: "openDispute", orderId, reason, description })),
      refresh: async () => {
        try {
          await refresh();
        } catch (err) {
          if (mounted.current) {
            setError(
              err instanceof Error ? err.message : "No se pudo actualizar.",
            );
            setLoading(false);
          }
        }
      },
    }),
    [mutate, refresh],
  );
  return [state, actions, { error, loading, busy }] as const;
}
const BuyerContext = createContext<ReturnType<typeof useConnectedBuyer> | null>(
  null,
);
export function BuyerStoreProvider({ children }: { children: ReactNode }) {
  const value = useConnectedBuyer();
  return createElement(BuyerContext.Provider, { value }, children);
}
export function useBuyerStore() {
  const value = useContext(BuyerContext);
  if (!value) throw new Error("El comprador requiere su proveedor de datos.");
  return value;
}
