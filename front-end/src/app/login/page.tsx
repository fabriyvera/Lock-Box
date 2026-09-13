"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, Mail, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Logica de autenticación para mas adelante xd
    console.log("Iniciando sesión con:", email, password);
  };

  return (
    <div className="min-h-screen bg-[#060B14] flex flex-col items-center justify-center p-4 font-sans text-slate-200">
      
      {/* LOGO LOCKBOX */}
      <div className="mb-10 flex items-center transform scale-110">
        <span className="bg-[#00E59B] text-[#060B14] font-black text-2xl px-3 py-1 tracking-wider">
          LOCK
        </span>
        <span className="bg-[#131B2F] text-white font-black text-2xl px-3 py-1 tracking-wider">
          BOX
        </span>
      </div>

      {/* CONTENEDOR DEL FORMULARIO */}
      <div className="w-full max-w-md bg-[#0B1221] border border-[#1C263A] p-8 md:p-10 shadow-2xl relative overflow-hidden">
        
        {/* Detalle visual de la esquina (similar a las capturas) */}
        <div className="absolute top-0 left-0 w-1 h-full bg-[#00E59B]"></div>

        <div className="mb-8">
          <p className="text-[10px] font-bold text-[#00E59B] uppercase tracking-[0.2em] mb-2">
            Sección de Acceso
          </p>
          <h1 className="text-3xl font-black text-white tracking-tight">
            INICIAR SESIÓN
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Ingresar tu correo electrónico y contraseña para acceder a tu cuenta.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* INPUT CORREO */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@gmail.com"
                className="w-full bg-[#060B14] border border-[#1C263A] focus:border-[#00E59B] focus:ring-1 focus:ring-[#00E59B] text-white pl-12 pr-4 py-3 outline-none transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* INPUT CONTRASEÑA */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Contraseña
              </label>
              <Link href="#" className="text-[10px] font-bold text-[#00E59B] hover:underline">
                ¿OLVIDASTE TU CONTRASEÑA?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#060B14] border border-[#1C263A] focus:border-[#00E59B] focus:ring-1 focus:ring-[#00E59B] text-white pl-12 pr-4 py-3 outline-none transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* BOTÓN PRINCIPAL */}
          <button
            type="submit"
            className="w-full bg-[#00E59B] hover:bg-[#00C988] text-[#060B14] font-black text-sm uppercase tracking-wider py-4 mt-4 flex items-center justify-center transition-colors"
          >
            Ingresar a mi cuenta <ArrowRight className="ml-2 w-4 h-4" />
          </button>
        </form>

        {/* ENLACE DE REGISTRO */}
        <div className="mt-8 pt-6 border-t border-[#1C263A] text-center">
          <p className="text-sm text-slate-400">
            ¿Aún no eres parte de la red Phygital?{" "}
            <Link href="/registro" className="text-[#00E59B] font-bold hover:underline">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}