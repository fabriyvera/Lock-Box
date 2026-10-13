"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShoppingCart, Store, MapPin } from "lucide-react";
import RegistrationForm from "@/components/auth/RegistrationForm";
import { DecorativeIcon } from "@/components/ui/DecorativeIcon";
import { ACCOUNT_LABELS, type AccountRole } from "@/lib/auth/account";

const roles = [
  {
    role: "comprador" as const,
    title: "Comprador",
    icon: ShoppingCart,
    description:
      "Encuentra productos y recoge tus pedidos en un Punto LockBox.",
    benefits: [
      "Tu perfil de comprador",
      "Catálogo y carrito",
      "Seguimiento de tus compras",
    ],
  },
  {
    role: "vendedor" as const,
    title: "Vendedor",
    icon: Store,
    description:
      "Administra tu tienda, catálogo y pedidos desde un mismo lugar.",
    benefits: [
      "Tu tienda y catálogo",
      "Gestión de lives y productos",
      "Despacho de pedidos a la red de puntos",
    ],
  },
  {
    role: "operador_punto" as const,
    title: "Punto LockBox",
    icon: MapPin,
    description:
      "Registra tu punto y administra la recepción y el retiro de paquetes.",
    benefits: [
      "Un punto asociado a tu cuenta",
      "Recepción y entrega mediante código QR",
      "Capacidad, pedidos e historial de tus puntos",
    ],
  },
];

export default function RegisterPage() {
  const [role, setRole] = useState<AccountRole>("vendedor");
  const selected = roles.find((item) => item.role === role) ?? roles[1];
  return (
    <div className="min-h-screen bg-canvas text-foreground flex flex-col">
      <header className="border-b border-border px-4 sm:px-6 py-4 flex flex-wrap gap-4 justify-between items-center">
        <Link
          href="/"
          className="flex items-center"
          aria-label="LockBox, inicio"
        >
          <span className="bg-accent text-on-accent font-black px-2 py-1 text-sm rounded-l">
            LOCK
          </span>
          <span className="bg-surface-deep border border-border font-bold px-2 py-1 text-sm rounded-r tracking-wider">
            BOX
          </span>
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-text-muted hover:text-accent"
        >
          <DecorativeIcon icon={ArrowLeft} size={16} /> Volver al inicio
        </Link>
      </header>
      <main className="flex-1 py-8 sm:py-10 px-4 md:px-12 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <p className="text-accent font-mono text-xs tracking-wider mb-2">
            SECCIÓN DE REGISTRO
          </p>
          <h1 className="text-3xl md:text-4xl font-black tracking-wide uppercase mb-2">
            Crea tu cuenta
          </h1>
          <p className="text-text-muted text-sm">
            Elige cómo quieres participar en LockBox.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          <section
            className="min-w-0 lg:col-span-5 space-y-6"
            aria-label="Elige tu perfil"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {roles.map((item) => (
                <button
                  key={item.role}
                  type="button"
                  aria-pressed={role === item.role}
                  onClick={() => setRole(item.role)}
                  className={`text-left cursor-pointer p-5 rounded-lg border transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 ${item.role === "operador_punto" ? "sm:col-span-2" : ""} ${role === item.role ? "border-accent bg-surface" : "border-border bg-surface-deep hover:border-border-strong"}`}
                >
                  <DecorativeIcon
                    icon={item.icon}
                    size={28}
                    className="text-accent mb-3"
                  />
                  <h2 className="font-bold text-base mb-1">{item.title}</h2>
                  <p className="text-xs text-text-muted leading-relaxed">
                    {item.description}
                  </p>
                </button>
              ))}
            </div>
            <div className="p-5 rounded-lg border border-border bg-surface-deep">
              <h2 className="text-xs font-bold tracking-wider text-accent uppercase mb-3">
                Tu perfil de {selected.title}
              </h2>
              <ul className="space-y-3 text-sm text-text-secondary">
                {selected.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-accent rounded-sm"
                      aria-hidden="true"
                    />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </section>
          <section
            className="min-w-0 lg:col-span-7 bg-surface-deep border border-border rounded-xl p-5 sm:p-6 md:p-8 relative shadow-2xl overflow-hidden"
            aria-label={`Registro como ${ACCOUNT_LABELS[role]}`}
          >
            <div
              className="absolute top-0 left-0 w-1 h-full bg-accent"
              aria-hidden="true"
            />
            <RegistrationForm key={role} role={role} />
          </section>
        </div>
      </main>
    </div>
  );
}
