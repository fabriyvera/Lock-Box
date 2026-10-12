"use client";

import React from "react";
import Image from "next/image";
import styles from "./workspace.module.css";
import { useBuyerStore } from "@/lib/buyer/store";
import { calculateCartSubtotal, formatBOB } from "@/lib/buyer/domain";
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  X,
} from "lucide-react";

export function CartDrawer({
  isOpen,
  onClose,
  onOpenCheckout,
}: {
  isOpen: boolean;
  onClose: () => void;
  onOpenCheckout: () => void;
}) {
  const [state, actions] = useBuyerStore();
  const subtotal = calculateCartSubtotal(state.cart);
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  React.useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className={styles.drawer}
      aria-labelledby="buyer-cart-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md bg-surface border-l border-border h-full flex flex-col justify-between text-white shadow-2xl">
        {/* ENCABEZADO */}
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-accent" />
            <h2
              id="buyer-cart-title"
              className="text-base font-black uppercase tracking-wider"
            >
              Tu Carrito
            </h2>
            <span className="bg-border text-text-secondary text-xs px-2 py-0.5 rounded-full font-mono">
              {state.cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar carrito"
            className="text-text-muted hover:text-white p-1 text-sm font-bold"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* LISTA DE ITEMS */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {state.cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <ShoppingBag className="w-12 h-12 text-text-subtle" />
              <p className="text-text-muted text-sm">Tu carrito está vacío.</p>
              <button
                onClick={onClose}
                className="text-xs text-accent font-bold hover:underline"
              >
                Explorar catálogo de la transmisión
              </button>
            </div>
          ) : (
            state.cart.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="bg-canvas border border-border rounded-lg p-3.5 flex gap-3 items-center justify-between"
              >
                <Image
                  width={64}
                  height={64}
                  unoptimized
                  src={product.imageUrl}
                  alt={product.title}
                  className="w-16 h-16 object-cover rounded bg-surface"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">
                    {product.title}
                  </h4>
                  <p className="text-[11px] text-accent font-mono mt-0.5">
                    {formatBOB(product.priceCents)} c/u
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() =>
                        actions.updateCartQuantity(product.id, quantity - 1)
                      }
                      aria-label={`Reducir cantidad de ${product.title}`}
                      className="p-1 rounded bg-surface-raised border border-border text-text-secondary hover:text-white"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-mono font-bold px-1.5">
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        actions.updateCartQuantity(product.id, quantity + 1)
                      }
                      aria-label={`Aumentar cantidad de ${product.title}`}
                      disabled={quantity >= product.stock}
                      className="p-1 rounded bg-surface-raised border border-border text-text-secondary hover:text-white disabled:opacity-40"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between self-stretch">
                  <button
                    onClick={() => actions.removeFromCart(product.id)}
                    aria-label={`Eliminar ${product.title} del carrito`}
                    className="text-text-subtle hover:text-danger transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold font-mono text-white">
                    {formatBOB(product.priceCents * quantity)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* FOOTER RESUMEN Y CHECKOUT */}
        {state.cart.length > 0 && (
          <div className="p-5 border-t border-border bg-canvas space-y-4">
            <div className="flex items-center gap-2 text-[11px] text-text-muted bg-accent/10 border border-accent/20 p-2.5 rounded">
              <ShieldCheck className="w-4 h-4 text-accent shrink-0" />
              <span>
                Tu dinero se mantendrá protegido en garantía hasta que retires
                el paquete en el Punto LockBox.
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted uppercase font-semibold">
                Subtotal
              </span>
              <span className="text-lg font-black text-accent">
                {formatBOB(subtotal)}
              </span>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenCheckout();
              }}
              className="w-full bg-accent hover:bg-accent-hover text-canvas font-black text-xs uppercase tracking-wider py-3.5 rounded flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              Continuar al Pago Escrow
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
}
