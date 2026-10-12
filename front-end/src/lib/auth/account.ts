import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export type AccountRole = "comprador" | "vendedor";
export function accountPath(role: string): string {
  if (role === "admin" || role === "despachador") return "/admin";
  if (role === "vendedor") return "/vendedor";
  if (role === "comprador") return "/dashboard";
  throw new Error("Tu perfil no tiene acceso a estos módulos.");
}
export function apiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!base) throw new Error("El servicio de cuentas no está configurado.");
  return `${base.replace(/\/$/, "")}${path}`;
}
export async function openAccount(
  session: Pick<Session, "access_token" | "refresh_token">,
) {
  const client = createClient();
  const { error } = await client.auth.setSession(session);
  if (error)
    throw new Error("No se pudo guardar la sesión. Inicia sesión nuevamente.");
  const response = await fetch(apiUrl("/api/auth/me"), {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.message || "No se pudo cargar tu perfil.");
  window.location.replace(accountPath(result.user.role));
}
