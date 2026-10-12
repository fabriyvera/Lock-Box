"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useBuyerStore } from "@/lib/buyer/store";
import { CatalogPanel } from "./CatalogPanel";
import { CartDrawer } from "./CartDrawer";
import { CheckoutModal } from "./CheckoutModal";
import { OrdersPanel } from "./OrdersPanel";
import { ShoppingBag, Package, RotateCcw, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import styles from "./workspace.module.css";

export function BuyerDashboard({ name }: { name: string }) {
  const [state, actions] = useBuyerStore();
  const [activeTab, setActiveTab] = useState<"catalog" | "orders">("catalog");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const totalCartItems = state.cart.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  const handleOrderSuccess = () => {
    setActiveTab("orders");
  };

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const { error } = await createClient().auth.signOut();
      if (error) throw error;
      window.location.replace("/login");
    } catch {
      setLogoutError("No se pudo cerrar sesión.");
      setLoggingOut(false);
    }
  }

  return (
    <div
      className={`${styles.workspace} min-h-screen bg-canvas text-foreground flex flex-col font-sans`}
    >
      {/* NAVBAR */}
      <header className="border-b border-border px-4 md:px-8 py-3.5 bg-canvas/90 backdrop-blur sticky top-0 z-40 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 sm:gap-6">
          <Link
            href="/"
            className="flex items-center"
            aria-label="LockBox, volver al inicio"
          >
            <span className="bg-accent text-canvas font-black px-2 py-0.5 text-sm rounded-l tracking-wider">
              LOCK
            </span>
            <span className="bg-surface border border-border text-white font-bold px-2 py-0.5 text-sm rounded-r tracking-wider">
              BOX
            </span>
          </Link>

          <nav
            className="flex flex-wrap items-center gap-1 text-xs"
            aria-label="Módulo del comprador"
          >
            <button
              onClick={() => setActiveTab("catalog")}
              aria-current={activeTab === "catalog" ? "page" : undefined}
              className={`px-3 py-1.5 rounded font-bold transition-colors cursor-pointer ${
                activeTab === "catalog"
                  ? "bg-surface-raised text-accent"
                  : "text-text-muted hover:text-white"
              }`}
            >
              Catálogo & Live
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              aria-current={activeTab === "orders" ? "page" : undefined}
              className={`px-3 py-1.5 rounded font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === "orders"
                  ? "bg-surface-raised text-accent"
                  : "text-text-muted hover:text-white"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Mis Pedidos ({state.orders.length})
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => actions.resetDemo()}
            title="Reiniciar datos iniciales de demo"
            aria-label="Reiniciar datos de demostración"
            className="p-2 text-text-subtle hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsCartOpen(true)}
            aria-label={`Abrir carrito, ${totalCartItems} artículos`}
            className="flex items-center gap-2 bg-surface border border-border hover:border-accent px-3.5 py-2 rounded text-xs font-bold text-white transition-colors cursor-pointer relative"
          >
            <ShoppingBag className="w-4 h-4 text-accent" />
            <span className="hidden sm:inline">Carrito</span>
            {totalCartItems > 0 && (
              <span className="bg-accent text-canvas text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {totalCartItems}
              </span>
            )}
          </button>
          <button
            disabled={loggingOut}
            onClick={() => void logout()}
            className="flex items-center gap-2 text-xs text-text-muted"
          >
            <LogOut size={16} aria-hidden="true" /> Cerrar sesión
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
        <div className="mb-5 rounded-lg border border-accent/25 bg-accent/5 p-4 text-sm text-text-secondary">
          <strong className="text-accent">
            Hola, {name}. Entorno de demostración.
          </strong>{" "}
          El catálogo, carrito y pedidos se guardan en este navegador. Los
          pagos, retiros, reseñas y disputas son simulados y no modifican
          Supabase ni dinero real.
        </div>
        {logoutError && (
          <p role="alert" className="mb-4 text-danger">
            {logoutError}
          </p>
        )}
        {activeTab === "catalog" ? <CatalogPanel /> : <OrdersPanel />}
      </main>

      {/* DRAWERS Y MODALES */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOpenCheckout={() => setIsCheckoutOpen(true)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={handleOrderSuccess}
      />
    </div>
  );
}

export default BuyerDashboard;
