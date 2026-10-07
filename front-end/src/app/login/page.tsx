"use client";

import { useState, useRef, FormEvent } from "react";
import Link from "next/link";
import { Lock, Mail, ArrowRight } from "lucide-react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const captcha = useRef<TurnstileInstance>(undefined);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!captchaToken) {
      setError("Completa la verificación de seguridad.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(20000),
          body: JSON.stringify({ email, password, captchaToken }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Error al iniciar sesión.");
        setLoading(false);
        setCaptchaToken(null);
        captcha.current?.reset();
        return;
      }

      if (!data.session?.access_token || !data.session?.refresh_token) {
        throw new Error("El backend no devolvió una sesión de Supabase.");
      }
      const { error: sessionError } = await createClient().auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      if (sessionError) throw sessionError;
      window.location.href =
        data.user?.role === "vendedor" ? "/vendedor" : "/dashboard";
    } catch {
      setError("Error de conexión con el servidor.");
      setLoading(false);
      setCaptchaToken(null);
      captcha.current?.reset();
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* LOGO */}
        <div className="mb-8 flex justify-center">
          <div className="flex">
            <span className="bg-accent text-canvas font-black text-2xl px-3 py-1 tracking-wider">
              LOCK
            </span>
            <span className="bg-surface-raised text-white font-black text-2xl px-3 py-1 tracking-wider">
              BOX
            </span>
          </div>
        </div>

        {/* CARD */}
        <div className="relative bg-surface border border-border p-8 shadow-2xl">
          <div className="absolute top-0 left-0 w-1 h-full bg-accent" />

          <div className="mb-8 pl-2">
            <p className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] mb-2">
              Sección de Acceso
            </p>
            <h1 className="text-3xl font-black text-white tracking-tight mb-2">
              INICIAR SESIÓN
            </h1>
            <p className="text-sm text-text-muted">
              Ingresa tu correo electrónico y contraseña.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* EMAIL */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2"
              >
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-subtle pointer-events-none" />
                <input
                  id="login-email"
                  autoComplete="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@gmail.com"
                  className="w-full h-12 bg-canvas border border-border focus:border-accent focus:ring-1 focus:ring-accent text-white text-sm pl-12 pr-4 rounded outline-none transition-colors placeholder:text-text-disabled"
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold text-text-secondary uppercase tracking-wider"
                >
                  Contraseña
                </label>
                <Link
                  href="#"
                  className="text-[10px] font-bold text-accent hover:underline"
                >
                  ¿OLVIDASTE TU CONTRASEÑA?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-subtle pointer-events-none" />
                <input
                  id="login-password"
                  autoComplete="current-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 bg-canvas border border-border focus:border-accent focus:ring-1 focus:ring-accent text-white text-sm pl-12 pr-4 rounded outline-none transition-colors placeholder:text-text-disabled"
                />
              </div>
            </div>

            {/* TURNSTILE */}
            <div className="flex justify-center">
              <Turnstile
                ref={captcha}
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                options={{ theme: "dark", size: "flexible" }}
                onSuccess={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken(null)}
                onError={() => setCaptchaToken(null)}
              />
            </div>

            {/* ERROR */}
            {error && (
              <div className="text-danger-strong text-xs font-bold text-center bg-danger-strong/10 border border-danger-strong/30 rounded py-2">
                {error}
              </div>
            )}

            {/* BOTÓN */}
            <button
              type="submit"
              disabled={!captchaToken || loading}
              className={`w-full h-14 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 rounded transition-colors mt-2 ${
                captchaToken && !loading
                  ? "bg-accent hover:bg-accent-hover text-canvas cursor-pointer"
                  : "bg-border text-text-subtle cursor-not-allowed"
              }`}
            >
              {loading ? "Verificando..." : "Ingresar a mi cuenta"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-sm text-text-muted">
              ¿Aún no eres parte de la red Phygital?{" "}
              <Link
                href="/register"
                className="text-accent font-bold hover:underline"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
