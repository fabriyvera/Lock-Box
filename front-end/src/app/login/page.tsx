"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { Lock, Mail, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    console.log("Iniciando sesión con:", email, password);
  };

  return (
    <div className="min-h-screen bg-[#060B14] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* LOGO */}
        <div className="mb-8 flex justify-center">
          <div className="flex">
            <span className="bg-[#00E59B] text-[#060B14] font-black text-2xl px-3 py-1 tracking-wider">
              LOCK
            </span>
            <span className="bg-[#131B2F] text-white font-black text-2xl px-3 py-1 tracking-wider">
              BOX
            </span>
          </div>
        </div>

        {/* CARD */}
        <div className="relative bg-[#0B1221] border border-[#1C263A] p-8 shadow-2xl">
          {/* Barra verde lateral */}
          <div className="absolute top-0 left-0 w-1 h-full bg-[#00E59B]" />

          {/* Header */}
          <div className="mb-8 pl-2">
            <p className="text-[10px] font-bold text-[#00E59B] uppercase tracking-[0.2em] mb-2">
              Sección de Acceso
            </p>
            <h1 className="text-3xl font-black text-white tracking-tight mb-2">
              INICIAR SESIÓN
            </h1>
            <p className="text-sm text-slate-400">
              Ingresar tu correo electrónico y contraseña para acceder a tu
              cuenta.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* EMAIL */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@gmail.com"
                  className="w-full h-12 bg-[#060B14] border border-[#1C263A] focus:border-[#00E59B] focus:ring-1 focus:ring-[#00E59B] text-white text-sm pl-12 pr-4 rounded outline-none transition-colors placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Contraseña
                </label>
                <Link
                  href="#"
                  className="text-[10px] font-bold text-[#00E59B] hover:underline"
                >
                  ¿OLVIDASTE TU CONTRASEÑA?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 bg-[#060B14] border border-[#1C263A] focus:border-[#00E59B] focus:ring-1 focus:ring-[#00E59B] text-white text-sm pl-12 pr-4 rounded outline-none transition-colors placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* BOTÓN */}
            <button
              type="submit"
              className="w-full h-14 bg-[#00E59B] hover:bg-[#00C988] text-[#060B14] font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 rounded transition-colors mt-2"
            >
              Ingresar a mi cuenta
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* FOOTER */}
          <div className="mt-8 pt-6 border-t border-[#1C263A] text-center">
            <p className="text-sm text-slate-400">
              ¿Aún no eres parte de la red Phygital?{" "}
              <Link
                href="/registro"
                className="text-[#00E59B] font-bold hover:underline"
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