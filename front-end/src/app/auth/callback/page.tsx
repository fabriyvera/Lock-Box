"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { openAccount } from "@/lib/auth/account";

export default function AuthCallback() {
  const started = useRef(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    async function confirm() {
      try {
        const client = createClient();
        const hash = new URLSearchParams(window.location.hash.slice(1));
        const query = new URLSearchParams(window.location.search);
        // Capture then remove credentials from the address bar before any navigation.
        window.history.replaceState(null, "", "/auth/callback");
        if (hash.has("error") || query.has("error"))
          throw new Error(
            "El enlace de confirmación venció o ya fue utilizado. Inicia sesión o solicita uno nuevo.",
          );
        const access_token = hash.get("access_token");
        const refresh_token = hash.get("refresh_token");
        if (access_token && refresh_token) {
          await openAccount({ access_token, refresh_token });
          return;
        }
        const code = query.get("code");
        if (code) {
          const { data, error } =
            await client.auth.exchangeCodeForSession(code);
          if (error || !data.session)
            throw new Error(
              "No se pudo confirmar la cuenta en este navegador. Intenta iniciar sesión.",
            );
          await openAccount(data.session);
          return;
        }
        const { data, error } = await client.auth.getSession();
        if (error || !data.session)
          throw new Error(
            "No se encontró una sesión. Si confirmaste tu correo, inicia sesión para continuar.",
          );
        await openAccount(data.session);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo confirmar tu cuenta.",
        );
      }
    }
    void confirm();
  }, []);
  return (
    <main className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <div className="w-full max-w-md p-6 bg-surface border border-border rounded-lg">
        <h1 className="text-xl font-bold text-accent mb-4">
          Confirmación de cuenta
        </h1>
        <p
          role={error ? "alert" : "status"}
          className="text-sm text-text-secondary"
        >
          {error || "Confirmando tu cuenta…"}
        </p>
        {error && (
          <Link href="/login" className="block mt-6 text-accent underline">
            Ir a iniciar sesión
          </Link>
        )}
      </div>
    </main>
  );
}
