import { apiUrl } from "@/lib/auth/account";
import { createClient } from "@/lib/supabase/client";

export async function pointRequest<T>(
  path: string,
  init: RequestInit = {},
  signal?: AbortSignal,
): Promise<T> {
  const client = createClient();
  const {
    data: { session },
    error,
  } = await client.auth.getSession();
  if (error || !session)
    throw new Error("Inicia sesión para administrar tu punto.");
  const response = await fetch(apiUrl(`/api/collection-point${path}`), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    cache: "no-store",
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(20000)])
      : AbortSignal.timeout(20000),
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.message || "No se pudo consultar el punto.");
  return result as T;
}
