"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { type SellerAction, type SellerState } from "./model";
import { decodeSnapshot } from "./codec";

export function useSellerStore() {
  const [state, setState] = useState<SellerState | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const client = useRef<SupabaseClient | null>(null);
  const mounted = useRef(false);
  const generation = useRef(0);
  const requests = useRef(
    new Map<string, { requestId: string; action: SellerAction }>(),
  );

  const api = useCallback(async (path: string, body?: unknown) => {
    const url = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (!url)
      throw new Error("Configura NEXT_PUBLIC_API_URL en front-end/.env.local.");
    if (!client.current) throw new Error("No se pudo configurar Supabase.");
    const { data, error: sessionError } =
      await client.current.auth.getSession();
    if (sessionError || !data.session)
      throw new Error("Inicia sesión con tu cuenta de vendedor.");
    const response = await fetch(`${url}/api/seller/${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${data.session.access_token}`,
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
    const current = ++generation.current;
    try {
      const result = await api("state");
      const next = decodeSnapshot(JSON.stringify(result.state));
      if (mounted.current && generation.current === current) {
        setState(next);
        setError("");
      }
    } catch (err) {
      if (mounted.current && generation.current === current) {
        setError(
          err instanceof Error ? err.message : "No se pudo cargar tu tienda.",
        );
        setState(null);
      }
      throw err;
    } finally {
      if (mounted.current && generation.current === current) setLoading(false);
    }
  }, [api]);
  useEffect(() => {
    mounted.current = true;
    try {
      client.current = createClient();
    } catch (err) {
      queueMicrotask(() => {
        if (mounted.current) {
          setError(err instanceof Error ? err.message : "Configura Supabase.");
          setLoading(false);
        }
      });
      return () => {
        mounted.current = false;
      };
    }
    const { data } = client.current.auth.onAuthStateChange((event) => {
      // Do not await Supabase calls inside its Auth callback.
      if (event === "TOKEN_REFRESHED") return;
      generation.current++;
      setState(null);
      if (event === "SIGNED_OUT") requests.current.clear();
      queueMicrotask(() => {
        if (mounted.current) void refresh().catch(() => {});
      });
    });
    void refresh().catch(() => {});
    const generationRef = generation;
    return () => {
      mounted.current = false;
      generationRef.current++;
      data.subscription.unsubscribe();
    };
  }, [refresh]);
  return {
    state,
    error,
    loading,
    refresh,
    async dispatch(action: SellerAction) {
      const signature = JSON.stringify(action, (key, value) =>
        key === "at" ||
        (key === "id" && ["startLive", "requestPayout"].includes(action.type))
          ? undefined
          : value,
      );
      const request = requests.current.get(signature) ?? {
        requestId: crypto.randomUUID(),
        action,
      };
      requests.current.set(signature, request);
      await api("actions", request);
      // Keep the original payload only while the write outcome is uncertain.
      requests.current.delete(signature);
      try {
        await refresh();
      } catch {
        throw new Error(
          "El cambio se guardó, pero no se pudo actualizar la pantalla. Pulsa Actualizar datos.",
        );
      }
    },
    async logout() {
      const { error: logoutError } = await client.current!.auth.signOut();
      if (logoutError) throw logoutError;
    },
  };
}
