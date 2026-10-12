'use client';

import React from 'react';
import { useBuyerStore } from '@/lib/buyer/store';
import { calculateCartSubtotal, formatBOB } from '@/lib/buyer/domain';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0B1221] border-l border-[#1C263A] h-full flex flex-col justify-between text-white shadow-2xl">
        {/* ENCABEZADO */}
        <div className="p-5 border-b border-[#1C263A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#00E59B]" />
            <h2 className="text-base font-black uppercase tracking-wider">Tu Carrito</h2>
            <span className="bg-[#1C263A] text-slate-300 text-xs px-2 py-0.5 rounded-full font-mono">
              {state.cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 text-sm font-bold">
            ✕
          </button>
        </div>

        {/* LISTA DE ITEMS */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {state.cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-600" />
              <p className="text-slate-400 text-sm">Tu carrito está vacío.</p>
              <button
                onClick={onClose}
                className="text-xs text-[#00E59B] font-bold hover:underline"
              >
                Explorar catálogo de la transmisión
              </button>
            </div>
          ) : (
            state.cart.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="bg-[#060B14] border border-[#1C263A] rounded-lg p-3.5 flex gap-3 items-center justify-between"
              >
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="w-16 h-16 object-cover rounded bg-[#0B1221]"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{product.title}</h4>
                  <p className="text-[11px] text-[#00E59B] font-mono mt-0.5">
                    {formatBOB(product.priceCents)} c/u
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => actions.updateCartQuantity(product.id, quantity - 1)}
                      className="p-1 rounded bg-[#131B2F] border border-[#1C263A] text-slate-300 hover:text-white"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-mono font-bold px-1.5">{quantity}</span>
                    <button
                      onClick={() => actions.updateCartQuantity(product.id, quantity + 1)}
                      disabled={quantity >= product.stock}
                      className="p-1 rounded bg-[#131B2F] border border-[#1C263A] text-slate-300 hover:text-white disabled:opacity-40"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between self-stretch">
                  <button
                    onClick={() => actions.removeFromCart(product.id)}
                    className="text-slate-500 hover:text-rose-400 transition-colors p-1"
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
          <div className="p-5 border-t border-[#1C263A] bg-[#060B14] space-y-4">
            <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded">
              <ShieldCheck className="w-4 h-4 text-[#00E59B] shrink-0" />
              <span>Tu dinero se mantendrá protegido en garantía hasta que retires el paquete en el Punto LockBox.</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase font-semibold">Subtotal</span>
              <span className="text-lg font-black text-[#00E59B]">{formatBOB(subtotal)}</span>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenCheckout();
              }}
              className="w-full bg-[#00E59B] hover:bg-[#00C988] text-[#060B14] font-black text-xs uppercase tracking-wider py-3.5 rounded flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              Continuar al Pago Escrow
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}