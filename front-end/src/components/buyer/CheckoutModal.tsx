"use client";

import React, { useState } from "react";
import { useBuyerStore } from "@/lib/buyer/connected-store";
import { calculateCartSubtotal, formatBOB } from "@/lib/buyer/domain";
import { Modal } from "./ui";
import { PointsFinder } from "./PointsFinder";
import { ShieldCheck, Smartphone, Landmark, CheckCircle2 } from "lucide-react";
import { BuyerOrder } from "@/lib/buyer/model";
import { previewCheckout } from "@/lib/buyer/pricing";

export function CheckoutModal({
  isOpen,
  onClose,
  onOrderSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: BuyerOrder) => void;
}) {
  const [state, actions, meta] = useBuyerStore();
  const [selectedPointId, setSelectedPointId] = useState<string>(
    state.lockBoxPoints[0]?.id || "",
  );
  const [paymentMethod, setPaymentMethod] = useState<"yape" | "bcp">("yape");
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = calculateCartSubtotal(state.cart);
  const quote = previewCheckout(
    state.cart,
    state.serviceFeeCentsPerOrder ?? 800,
  );
  const pointId = state.lockBoxPoints.some(
    (point) => point.id === selectedPointId,
  )
    ? selectedPointId
    : (state.lockBoxPoints[0]?.id ?? "");

  const handleConfirmPayment = async () => {
    if (!pointId || isProcessing) return;
    setIsProcessing(true);
    try {
      const order = await actions.checkout(pointId, paymentMethod);
      setIsProcessing(false);
      if (order) {
        onClose();
        onOrderSuccess(order);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isProcessing) onClose();
      }}
      title="Compra de prueba conectada"
    >
      <div className="space-y-5">
        {/* Banner de protección Escrow */}
        <div className="bg-accent/10 border border-accent/30 rounded-lg p-3.5 flex items-start gap-3">
          <ShieldCheck
            aria-hidden="true"
            className="w-5 h-5 text-accent shrink-0 mt-0.5"
          />
          <div className="text-xs space-y-1">
            <p className="font-bold text-accent uppercase tracking-wider">
              Simulación de pago protegido
            </p>
            <p className="text-text-secondary leading-relaxed">
              Se creará un pedido de prueba en el sistema para que el vendedor
              lo despache y el punto confirme la entrega. No se retienen fondos.
            </p>
          </div>
        </div>

        {/* Selección de Punto LockBox */}
        <fieldset disabled={isProcessing || meta.busy}>
          <legend className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
            1. Selecciona tu Punto LockBox de entrega
          </legend>
          <PointsFinder
            points={state.lockBoxPoints}
            selectedId={pointId}
            onSelect={setSelectedPointId}
            disabled={isProcessing || meta.busy}
          />
        </fieldset>

        {/* Método de Pago */}
        <fieldset disabled={isProcessing || meta.busy}>
          <legend className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
            2. Método de pago simulado
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod("yape")}
              aria-pressed={paymentMethod === "yape"}
              className={`p-3 rounded-lg border text-xs font-bold flex flex-col items-center gap-1.5 transition-colors cursor-pointer ${
                paymentMethod === "yape"
                  ? "border-accent bg-surface-raised text-foreground"
                  : "border-border bg-canvas text-text-muted"
              }`}
            >
              <span className="text-sm flex items-center gap-2">
                <Smartphone size={16} aria-hidden="true" /> Yape Bolivia
              </span>
              <span className="text-xs text-text-subtle font-normal">
                QR Simple
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("bcp")}
              aria-pressed={paymentMethod === "bcp"}
              className={`p-3 rounded-lg border text-xs font-bold flex flex-col items-center gap-1.5 transition-colors cursor-pointer ${
                paymentMethod === "bcp"
                  ? "border-accent bg-surface-raised text-foreground"
                  : "border-border bg-canvas text-text-muted"
              }`}
            >
              <span className="text-sm flex items-center gap-2">
                <Landmark size={16} aria-hidden="true" /> BCP Banca Móvil
              </span>
              <span className="text-xs text-text-subtle font-normal">
                Transferencia QR
              </span>
            </button>
          </div>
        </fieldset>

        <div className="space-y-2" aria-label="Productos y tallas de tu compra">
          {state.cart.map((item) => (
            <p
              key={`${item.product.id}:${item.size ?? ""}`}
              className="text-xs text-text-secondary"
            >
              {item.quantity} × {item.product.title}
              {item.size ? ` · Talla ${item.size}` : ""}
            </p>
          ))}
        </div>
        {/* Resumen Final */}
        <div className="border-t border-border pt-4 space-y-2">
          <div className="flex justify-between text-xs text-text-muted">
            <span>Productos ({state.cart.length})</span>
            <span>{formatBOB(subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-text-muted">
            <span>
              Servicio LockBox ({quote.orderCount} pedido
              {quote.orderCount === 1 ? "" : "s"})
            </span>
            <span className="text-accent font-bold">
              {formatBOB(quote.fee)}
            </span>
          </div>
          <p className="text-xs text-text-secondary">
            Bs 8 por pedido y vendedor, a cargo del comprador. La reserva
            incluye 50% de los productos y toda la tarifa; el saldo al recoger
            es el otro 50% de los productos.
          </p>
          <div className="flex justify-between text-sm font-bold text-foreground pt-1 border-t border-border/60">
            <span>Total de prueba</span>
            <span className="text-accent font-mono text-base">
              {formatBOB(quote.total)}
            </span>
          </div>
          <div className="flex justify-between text-sm text-foreground">
            <span>Reserva simulada ahora</span>
            <strong>{formatBOB(quote.deposit)}</strong>
          </div>
          <div className="flex justify-between text-sm text-text-secondary">
            <span>Saldo al recoger</span>
            <strong>{formatBOB(quote.balance)}</strong>
          </div>
        </div>

        {meta.error && (
          <p role="alert" className="text-sm text-danger">
            {meta.error}
          </p>
        )}
        {!pointId && <p role="alert">No hay puntos de recojo disponibles.</p>}
        {/* Botón de Confirmación */}
        <button
          type="button"
          disabled={
            isProcessing || meta.busy || !pointId || state.cart.length === 0
          }
          onClick={handleConfirmPayment}
          aria-busy={isProcessing}
          className="w-full bg-accent hover:bg-accent-hover text-on-accent font-black text-xs uppercase tracking-wider py-3.5 rounded flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
        >
          {isProcessing ? (
            "Creando pedido de prueba…"
          ) : (
            <>
              <CheckCircle2 aria-hidden="true" className="w-4 h-4" />
              Confirmar compra de prueba
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}
