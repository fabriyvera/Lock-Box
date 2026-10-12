"use client";

import React, { useState } from "react";
import { useBuyerStore } from "@/lib/buyer/store";
import { calculateCartSubtotal, formatBOB } from "@/lib/buyer/domain";
import { Modal } from "./ui";
import {
  ShieldCheck,
  MapPin,
  Smartphone,
  Landmark,
  CheckCircle2,
} from "lucide-react";
import { BuyerOrder } from "@/lib/buyer/model";

export function CheckoutModal({
  isOpen,
  onClose,
  onOrderSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: BuyerOrder) => void;
}) {
  const [state, actions] = useBuyerStore();
  const [selectedPointId, setSelectedPointId] = useState<string>(
    state.lockBoxPoints[0]?.id || "",
  );
  const [paymentMethod, setPaymentMethod] = useState<"yape" | "bcp">("yape");
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = calculateCartSubtotal(state.cart);

  const handleConfirmPayment = () => {
    if (!selectedPointId) return;

    setIsProcessing(true);
    setTimeout(() => {
      const order = actions.checkout(selectedPointId, paymentMethod);
      setIsProcessing(false);
      if (order) {
        onClose();
        onOrderSuccess(order);
      }
    }, 1000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Checkout de demostración">
      <div className="space-y-5">
        {/* Banner de protección Escrow */}
        <div className="bg-accent/10 border border-accent/30 rounded-lg p-3.5 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-accent uppercase tracking-wider">
              Simulación de pago protegido
            </p>
            <p className="text-text-secondary leading-relaxed">
              Esta compra es de prueba. No retiene fondos ni crea un pedido en
              la base de datos.
            </p>
          </div>
        </div>

        {/* Selección de Punto LockBox */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
            1. Selecciona tu Punto LockBox de entrega (La Paz)
          </label>
          <div className="space-y-2">
            {state.lockBoxPoints.map((point) => (
              <label
                key={point.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedPointId === point.id
                    ? "border-accent bg-surface-raised"
                    : "border-border bg-canvas hover:border-border-strong"
                }`}
              >
                <input
                  type="radio"
                  name="lockbox_point"
                  checked={selectedPointId === point.id}
                  onChange={() => setSelectedPointId(point.id)}
                  className="mt-1 accent-accent"
                />
                <div className="flex-1 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <MapPin className="w-3.5 h-3.5 text-accent" />
                    {point.name}
                  </div>
                  <p className="text-text-muted mt-0.5">{point.address}</p>
                  <p className="text-text-subtle text-[10px] mt-1 font-mono">
                    Tel: {point.phone} • Capacidad: {point.capacity} casilleros
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Método de Pago */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
            2. Método de pago en garantía
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod("yape")}
              className={`p-3 rounded-lg border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                paymentMethod === "yape"
                  ? "border-accent bg-surface-raised text-white"
                  : "border-border bg-canvas text-text-muted"
              }`}
            >
              <span className="text-sm flex items-center gap-2">
                <Smartphone size={16} aria-hidden="true" /> Yape Bolivia
              </span>
              <span className="text-[10px] text-text-subtle font-normal">
                QR Simple
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("bcp")}
              className={`p-3 rounded-lg border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                paymentMethod === "bcp"
                  ? "border-accent bg-surface-raised text-white"
                  : "border-border bg-canvas text-text-muted"
              }`}
            >
              <span className="text-sm flex items-center gap-2">
                <Landmark size={16} aria-hidden="true" /> BCP Banca Móvil
              </span>
              <span className="text-[10px] text-text-subtle font-normal">
                Transferencia QR
              </span>
            </button>
          </div>
        </div>

        {/* Resumen Final */}
        <div className="border-t border-border pt-4 space-y-2">
          <div className="flex justify-between text-xs text-text-muted">
            <span>Productos ({state.cart.length})</span>
            <span>{formatBOB(subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-text-muted">
            <span>Custodia Escrow</span>
            <span className="text-accent font-bold">Gratis</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-border/60">
            <span>Total a Retener</span>
            <span className="text-accent font-mono text-base">
              {formatBOB(subtotal)}
            </span>
          </div>
        </div>

        {/* Botón de Confirmación */}
        <button
          type="button"
          disabled={isProcessing || state.cart.length === 0}
          onClick={handleConfirmPayment}
          className="w-full bg-accent hover:bg-accent-hover text-canvas font-black text-xs uppercase tracking-wider py-3.5 rounded flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          {isProcessing ? (
            "Creando pedido de prueba..."
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Confirmar compra de prueba
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}
