"use client";

import { useState, useRef, type FormEvent } from "react";
import {
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  ShoppingCart,
  Store,
  QrCode,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import DeferredCaptcha from "@/components/auth/DeferredCaptcha";
import { loginComplete } from "@/lib/auth/form-readiness";
import { apiUrl, openAccount, type AccountRole } from "@/lib/auth/account";

const loginModules = [
  {
    role: "comprador",
    icon: ShoppingCart,
    label: "Comprador",
    tag: "COMPRA SEGURA",
    features: ["Catálogo Live", "Pago Escrow", "Recogida con QR"],
  },
  {
    role: "vendedor",
    icon: Store,
    label: "Vendedor",
    tag: "LIQUIDACIÓN 48H",
    features: ["Ventas en Vivo", "Cobro Garantizado", "Retiro Yape / BCP"],
  },
  {
    role: "operador_punto",
    icon: QrCode,
    label: "Punto LockBox",
    tag: "TIENDA ALIADA",
    features: ["Recepción Paquetes", "Escaneo QR", "Liberación de Pago"],
  },
] as const;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [selectedRole, setSelectedRole] = useState<AccountRole | null>(null);
  const emailField = useRef<HTMLInputElement>(null);
  const pending = useRef(false);
  const complete = loginComplete(email, password);
  const selectedModule = loginModules.find(({ role }) => role === selectedRole);

  function selectModule(role: AccountRole) {
    setSelectedRole(role);
    emailField.current?.focus();
  }

  function changed() {
    setCaptchaToken(null);
    setRevision((value) => value + 1);
    setError(null);
  }

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (pending.current) return;
    if (!complete) {
      setError("Completa un correo válido y tu contraseña.");
      return;
    }
    if (!captchaToken) {
      setError("Completa la verificación de seguridad.");
      return;
    }

    pending.current = true;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(20000),
        body: JSON.stringify({ email: email.trim(), password, captchaToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Error al iniciar sesión.");
        return;
      }

      if (!data.session?.access_token || !data.session?.refresh_token) {
        throw new Error("El backend no devolvió una sesión de Supabase.");
      }
      await openAccount({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
    } catch (err) {
      setError(
        err instanceof Error &&
          err.name !== "TypeError" &&
          err.name !== "TimeoutError"
          ? err.message
          : "Error de conexión con el servidor.",
      );
    } finally {
      pending.current = false;
      setLoading(false);
      setCaptchaToken(null);
      setRevision((value) => value + 1);
    }
  };

  return (
    <div className="min-h-screen w-full bg-canvas flex flex-col justify-between px-4 py-4 sm:px-10 lg:px-14 box-border">
      {/* BARRA SUPERIOR COMPACTA A ANCHO COMPLETO */}
      <div className="w-full max-w-[1600px] mx-auto flex items-center justify-between mb-3 shrink-0">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Public navigation should work while the App Router initializes. */}
        <a
          href="/"
          className="inline-flex items-center gap-2.5 bg-surface border-2 border-border hover:border-accent px-4 py-2 text-base font-extrabold text-white hover:text-accent transition-all"
        >
          <ArrowLeft size={20} className="text-accent" aria-hidden="true" />
          VOLVER AL INICIO
        </a>

        <div className="flex shadow-lg">
          <span className="bg-accent text-canvas font-black text-xl sm:text-2xl px-3.5 py-1 tracking-wider">
            LOCK
          </span>
          <span className="bg-surface-raised text-white font-black text-xl sm:text-2xl px-3.5 py-1 tracking-wider border border-border">
            BOX
          </span>
        </div>
      </div>

      {/* CONTENEDOR QUE ENCAJA AL 100% EN LA PANTALLA SIN CORTARSE */}
      <div className="w-full max-w-[1600px] mx-auto flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* ── COLUMNA IZQUIERDA (7 COLUMNAS): VISUAL, LLAMATIVA Y COMPACTA EN ALTURA ── */}
        <div className="lg:col-span-7 relative bg-surface border-2 border-border px-7 py-6 sm:px-9 sm:py-7 shadow-2xl flex flex-col justify-between overflow-hidden">
          {/* Barra superior verde neón */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-accent" />
          
          {/* Esquinas decorativas */}
          <div className="w-6 h-6 border-b-4 border-l-4 border-accent absolute bottom-3 left-3 pointer-events-none" />
          <div className="w-6 h-6 border-t-4 border-r-4 border-accent absolute top-4 right-3 pointer-events-none" />

          <div>
            <div className="inline-flex items-center gap-2 bg-accent text-canvas font-black text-xs sm:text-sm uppercase tracking-[0.2em] px-3.5 py-1 mb-2.5">
              <Sparkles size={16} />
              ECOSISTEMA LOCKBOX · 2026
            </div>

            <h2 className="text-3xl sm:text-4xl xl:text-5xl font-black text-white tracking-tight leading-[0.95] uppercase mb-2">
              ¿A QUÉ SISTEMA <span className="text-accent">INGRESAS?</span>
            </h2>
            <p className="text-base sm:text-lg text-white font-semibold mb-4">
              Selecciona el módulo al que quieres ingresar. Tu cuenta determina qué panel puedes abrir.
            </p>

            {/* 3 TARJETAS DIDÁCTICAS CALIBRADAS PARA ENTRAR COMPLETAS */}
            <div className="grid grid-cols-1 gap-3">
              {loginModules.map((item, index) => {
                const Icon = item.icon;
                const selected = selectedRole === item.role;
                return (
                  <button
                    key={item.role}
                    type="button"
                    aria-label={item.label}
                    aria-pressed={selected}
                    aria-controls="login-form"
                    disabled={loading}
                    onClick={() => selectModule(item.role)}
                    className={`text-left border-2 hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent px-3 sm:px-5 py-3.5 transition-colors flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 cursor-pointer disabled:cursor-wait ${selected ? "border-accent bg-accent/10" : "border-border bg-canvas"}`}
                  >
                    <span className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <span className="w-13 h-13 bg-accent/15 border-2 border-accent flex items-center justify-center shrink-0 p-2.5">
                        <Icon className="w-7 h-7 text-accent" aria-hidden="true" />
                      </span>

                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2 mb-0.5">
                          <span className="text-xs sm:text-sm font-black text-accent tracking-widest uppercase">
                            MÓDULO 0{index + 1}
                          </span>
                          <span className="bg-surface-raised border border-accent/40 text-accent text-xs font-black px-2 py-0.5 uppercase tracking-wider">
                            {item.tag}
                          </span>
                        </span>
                        <span className="block text-xl sm:text-2xl font-black text-white tracking-tight leading-tight uppercase">
                          {item.label}
                        </span>
                      </span>
                    </span>

                    {/* Puntos clave alineados y legibles */}
                    <span className="flex flex-wrap xl:flex-col items-start xl:items-end gap-1 w-full xl:w-auto border-t xl:border-t-0 border-border pt-2 xl:pt-0">
                      {item.features.map((p) => (
                        <span
                          key={p}
                          className="flex items-center gap-1.5 text-sm sm:text-base font-bold text-white leading-snug"
                        >
                          <span aria-hidden="true" className="text-accent font-black">✔</span>
                          <span>{p}</span>
                        </span>
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BARRA INFERIOR DE MÉTRICAS SIEMPRE VISIBLE */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-3.5 border-t-2 border-border">
            <div className="bg-canvas border border-accent/50 py-2.5 px-3 text-center">
              <div className="text-xl sm:text-2xl font-black text-accent leading-none">100%</div>
              <div className="text-[11px] sm:text-xs font-extrabold text-white uppercase tracking-wider mt-1">
                PAGO PROTEGIDO
              </div>
            </div>
            <div className="bg-canvas border border-accent/50 py-2.5 px-3 text-center">
              <div className="text-xl sm:text-2xl font-black text-accent leading-none">QR</div>
              <div className="text-[11px] sm:text-xs font-extrabold text-white uppercase tracking-wider mt-1">
                ENTREGA VERIFICADA
              </div>
            </div>
            <div className="bg-canvas border border-accent/50 py-2.5 px-3 text-center">
              <div className="text-xl sm:text-2xl font-black text-accent leading-none">48H</div>
              <div className="text-[11px] sm:text-xs font-extrabold text-white uppercase tracking-wider mt-1">
                LIQUIDACIÓN YAPE/BCP
              </div>
            </div>
          </div>
        </div>

        {/* ── COLUMNA DERECHA (5 COLUMNAS): INICIAR SESIÓN COMPLETO EN PANTALLA ── */}
        <div className="lg:col-span-5 relative bg-surface border-2 border-border px-7 py-6 sm:px-9 sm:py-7 shadow-2xl flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-2 h-full bg-accent" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="bg-accent/15 border border-accent text-accent text-xs sm:text-sm font-black uppercase tracking-[0.2em] px-3 py-1">
                ACCESO DIRECTO
              </span>
              <span className="text-xs sm:text-sm font-bold text-white">
                <span className="text-accent font-black text-base">*</span> Obligatorio
              </span>
            </div>

            <h1 id="login-title" className="text-3xl sm:text-4xl xl:text-5xl font-black text-white tracking-tight uppercase leading-none mb-2">
              INICIAR <span className="text-accent">SESIÓN</span>
              {selectedModule && (
                <span className="block mt-2 text-xl sm:text-2xl normal-case tracking-normal">
                  {selectedModule.label}
                </span>
              )}
            </h1>
            <p id="login-destination" aria-live="polite" className="text-base sm:text-lg text-white font-medium mb-5">
              {selectedModule
                ? `Estás intentando ingresar al módulo ${selectedModule.label}.`
                : "Ingresa tus datos para abrir tu panel."}
            </p>

            <form
              id="login-form"
              aria-labelledby="login-title"
              aria-describedby="login-destination"
              onSubmit={handleLogin}
              className="space-y-4"
              aria-busy={loading}
            >
              {/* EMAIL */}
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-sm sm:text-base font-extrabold text-white uppercase tracking-wider mb-2"
                >
                  CORREO ELECTRÓNICO{" "}
                  <span className="text-accent font-black text-lg" aria-hidden="true">
                    *
                  </span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-accent pointer-events-none" />
                  <input
                    id="login-email"
                    ref={emailField}
                    autoComplete="email"
                    type="email"
                    required
                    disabled={loading}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      changed();
                    }}
                    placeholder="tucorreo@gmail.com"
                    className="w-full h-13 bg-canvas border-2 border-border focus:border-accent focus:ring-2 focus:ring-accent text-white text-base sm:text-lg font-semibold pl-12 pr-4 rounded outline-none transition-colors placeholder:text-text-disabled"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <div className="flex flex-wrap gap-2 justify-between items-center mb-2">
                  <label
                    htmlFor="login-password"
                    className="block text-sm sm:text-base font-extrabold text-white uppercase tracking-wider"
                  >
                    CONTRASEÑA{" "}
                    <span className="text-accent font-black text-lg" aria-hidden="true">
                      *
                    </span>
                  </label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-accent pointer-events-none" />
                  <input
                    id="login-password"
                    autoComplete="current-password"
                    type="password"
                    required
                    disabled={loading}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      changed();
                    }}
                    placeholder="••••••••"
                    className="w-full h-13 bg-canvas border-2 border-border focus:border-accent focus:ring-2 focus:ring-accent text-white text-base sm:text-lg font-semibold pl-12 pr-4 rounded outline-none transition-colors placeholder:text-text-disabled"
                  />
                </div>
              </div>

              {/* TURNSTILE */}
              <div className="flex justify-center py-1">
                <DeferredCaptcha
                  key={revision}
                  ready={complete && !loading}
                  onToken={setCaptchaToken}
                />
              </div>

              {/* ERROR */}
              {error && (
                <div
                  role="alert"
                  className="text-danger-strong text-sm sm:text-base font-extrabold text-center bg-danger-strong/15 border-2 border-danger-strong rounded py-2 px-3"
                >
                  {error}
                </div>
              )}

              {/* BOTÓN */}
              <button
                type="submit"
                disabled={!complete || !captchaToken || loading}
                className={`w-full h-14 font-black text-base sm:text-lg uppercase tracking-wider flex items-center justify-center gap-3 rounded transition-all ${
                  captchaToken && !loading
                    ? "bg-accent hover:bg-accent-hover text-canvas cursor-pointer shadow-lg"
                    : "bg-border text-white/50 cursor-not-allowed"
                }`}
              >
                {loading ? "VERIFICANDO ACCESO..." : selectedModule ? `ENTRAR A ${selectedModule.label}` : "ENTRAR AL SISTEMA"}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
            </form>
          </div>

          {/* PIE DE REGISTRO SIEMPRE VISIBLE */}
          <div className="mt-4 pt-3.5 border-t-2 border-border text-center">
            <p className="text-base sm:text-lg text-white font-semibold">
              ¿Aún no tienes cuenta?{" "}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Use a document navigation to the registration section. */}
              <a
                href="/#registro"
                className="inline-flex min-h-11 items-center px-1 text-accent font-black hover:underline uppercase"
              >
                REGÍSTRATE GRATIS →
              </a>
            </p>
            <div className="mt-1.5 inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-white/80">
              <ShieldCheck className="w-4 h-4 text-accent" />
              <span>Conexión segura · LockBox Bolivia</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
