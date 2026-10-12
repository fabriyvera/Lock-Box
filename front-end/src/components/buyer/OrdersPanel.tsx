"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useBuyerStore } from "@/lib/buyer/store";
import {
  formatBOB,
  formatBuyerDate,
  canCancelOrder,
  canReviewOrder,
  canDisputeOrder,
} from "@/lib/buyer/domain";
import { StatusBadge, Modal } from "./ui";
import { BuyerOrder } from "@/lib/buyer/model";
import {
  QrCode,
  Package,
  MapPin,
  Clock,
  Ban,
  Star,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";

export function OrdersPanel() {
  const [state, actions] = useBuyerStore();
  const [activeQRModalOrder, setActiveQRModalOrder] =
    useState<BuyerOrder | null>(null);
  const [reviewOrderTarget, setReviewOrderTarget] = useState<BuyerOrder | null>(
    null,
  );
  const [disputeOrderTarget, setDisputeOrderTarget] =
    useState<BuyerOrder | null>(null);

  // Estado para el modal personalizado de cancelación
  const [orderToCancel, setOrderToCancel] = useState<BuyerOrder | null>(null);

  // Form states
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [disputeReason, setDisputeReason] = useState(
    "Producto con fallas o incompleto",
  );
  const [disputeDesc, setDisputeDesc] = useState("");

  const confirmCancelOrder = () => {
    if (orderToCancel) {
      actions.cancelOrder(orderToCancel.id);
      setOrderToCancel(null);
    }
  };

  const submitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewOrderTarget) return;
    actions.reviewOrder(reviewOrderTarget.id, rating, reviewComment);
    setReviewOrderTarget(null);
    setReviewComment("");
  };

  const submitDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeOrderTarget) return;
    actions.openDispute(disputeOrderTarget.id, disputeReason, disputeDesc);
    setDisputeOrderTarget(null);
    setDisputeDesc("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h2 className="text-lg font-black text-white uppercase tracking-wider">
            Mis pedidos de demostración
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Historial de compras en lives y retiros en Puntos LockBox de La Paz.
          </p>
        </div>
        <div className="text-xs font-mono text-accent bg-accent/10 border border-accent/20 px-3 py-1.5 rounded">
          {state.orders.length} pedidos registrados
        </div>
      </div>

      {state.orders.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border rounded-xl space-y-2">
          <Package className="w-10 h-10 text-text-subtle mx-auto" />
          <p className="text-text-muted text-sm">
            Aún no tienes pedidos registrados.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {state.orders.map((order) => {
            const cancellable = canCancelOrder(order);
            const reviewable = canReviewOrder(order);
            const disputable = canDisputeOrder(order);

            return (
              <div
                key={order.id}
                className="bg-surface border border-border rounded-xl p-5 space-y-4 shadow-xl"
              >
                {/* Header de la orden */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/70">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-black text-white">
                      {order.orderNumber}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatBuyerDate(order.createdAt)}</span>
                  </div>
                </div>

                {/* Items y Punto LockBox */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                  <div className="md:col-span-7 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-subtle block">
                      Artículos
                    </span>
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 bg-canvas p-2.5 rounded border border-border"
                      >
                        <Image
                          width={40}
                          height={40}
                          unoptimized
                          src={item.product.imageUrl}
                          alt={item.product.title}
                          className="w-10 h-10 object-cover rounded bg-surface"
                        />
                        <div className="flex-1 min-w-0 text-xs">
                          <p className="font-bold text-white truncate">
                            {item.product.title}
                          </p>
                          <p className="text-text-muted text-[11px]">
                            Cant: {item.quantity} • @{item.product.sellerName}
                          </p>
                        </div>
                        <span className="text-xs font-mono font-bold text-accent">
                          {formatBOB(item.product.priceCents * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="md:col-span-5 bg-canvas border border-border rounded-lg p-3.5 text-xs space-y-2">
                    <div className="flex items-center gap-1.5 text-white font-bold">
                      <MapPin className="w-3.5 h-3.5 text-accent" />
                      <span>Retiro en: {order.lockBoxPoint.name}</span>
                    </div>
                    <p className="text-text-muted text-[11px]">
                      {order.lockBoxPoint.address}
                    </p>
                    <div className="pt-2 border-t border-border flex justify-between font-mono">
                      <span className="text-text-muted">Total retenido:</span>
                      <span className="font-bold text-accent">
                        {formatBOB(order.totalCents)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones del Comprador */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border/70">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Botón QR (B6) */}
                    <button
                      onClick={() => setActiveQRModalOrder(order)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-raised border border-border text-foreground hover:text-white hover:border-accent text-xs font-bold transition-all cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5 text-accent" />
                      Ver QR de Recojo
                    </button>

                    {/* Botón Cancelar (B7) - Abre modal en lugar de confirm() */}
                    {cancellable && (
                      <button
                        onClick={() => setOrderToCancel(order)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-danger-strong/10 border border-danger-strong/30 text-danger hover:bg-danger-strong/20 text-xs font-bold transition-all cursor-pointer"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        Cancelar Pedido
                      </button>
                    )}

                    {/* Botón Calificar (B9) */}
                    {reviewable && (
                      <button
                        onClick={() => setReviewOrderTarget(order)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-warning-strong/10 border border-warning-strong/30 text-warning hover:bg-warning-strong/20 text-xs font-bold transition-all cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5 text-warning" />
                        Calificar
                      </button>
                    )}

                    {/* Botón Abrir Disputa (B10) */}
                    {disputable && (
                      <button
                        onClick={() => setDisputeOrderTarget(order)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-warning-strong/10 border border-warning-strong/30 text-warning hover:bg-warning-strong/20 text-xs font-bold transition-all cursor-pointer"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Abrir Reclamo
                      </button>
                    )}
                  </div>

                  {/* Simulación para demo: marcar como entregado */}
                  {order.status !== "delivered" &&
                    order.status !== "cancelled" &&
                    order.status !== "disputed" && (
                      <button
                        onClick={() => actions.simulateDelivery(order.id)}
                        className="text-[11px] text-accent/80 hover:text-accent underline cursor-pointer"
                      >
                        [Simular validación QR y entrega]
                      </button>
                    )}
                </div>

                {/* Reseña desplegada si existe */}
                {order.review && (
                  <div className="bg-warning-strong/5 border border-warning-strong/20 rounded p-3 text-xs space-y-1">
                    <div className="flex items-center gap-1 text-warning font-bold">
                      <Star className="w-3.5 h-3.5 fill-warning" />
                      <span>{order.review.rating} / 5 estrellas</span>
                    </div>
                    <p className="text-text-secondary italic">
                      &quot;{order.review.comment}&quot;
                    </p>
                  </div>
                )}

                {/* Disputa desplegada si existe */}
                {order.dispute && (
                  <div className="bg-warning-strong/10 border border-warning-strong/20 rounded p-3 text-xs space-y-1">
                    <p className="font-bold text-warning">
                      Disputa Activa: {order.dispute.reason}
                    </p>
                    <p className="text-text-secondary">
                      {order.dispute.description}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL CANCELAR PEDIDO (Personalizado dentro de la app) */}
      <Modal
        isOpen={!!orderToCancel}
        onClose={() => setOrderToCancel(null)}
        title="Cancelar pedido de demostración"
      >
        <div className="space-y-4">
          <div className="bg-danger-strong/10 border border-danger-strong/20 rounded-lg p-3.5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-danger">Cancelación de prueba</p>
              <p className="text-text-secondary leading-relaxed">
                ¿Seguro que deseas cancelar el pedido{" "}
                <span className="font-mono text-white font-bold">
                  {orderToCancel?.orderNumber}
                </span>
                ? Se restaurará el inventario de demostración; no se mueve
                dinero real.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setOrderToCancel(null)}
              className="px-4 py-2.5 rounded text-xs font-bold text-text-secondary hover:text-white bg-surface-raised border border-border transition-colors cursor-pointer"
            >
              Mantener Pedido
            </button>
            <button
              type="button"
              onClick={confirmCancelOrder}
              className="px-4 py-2.5 rounded text-xs font-bold text-white bg-danger-strong hover:bg-danger-strong transition-colors cursor-pointer"
            >
              Sí, Cancelar y Reembolsar
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL QR (B6) */}
      <Modal
        isOpen={!!activeQRModalOrder}
        onClose={() => setActiveQRModalOrder(null)}
        title="Código de demostración"
      >
        {activeQRModalOrder && (
          <div className="text-center space-y-4">
            <div className="bg-white p-6 rounded-xl inline-block mx-auto border-4 border-accent">
              <div className="w-48 h-48 bg-foreground flex flex-col items-center justify-center rounded">
                <QrCode className="w-28 h-28 text-canvas" />
                <span className="font-mono text-[10px] text-text-subtle mt-2 font-bold tracking-wider">
                  {activeQRModalOrder.qrCode}
                </span>
              </div>
            </div>

            <div className="text-xs space-y-1">
              <p className="font-bold text-white text-sm">
                Este código no permite retirar paquetes reales
              </p>
              <p className="text-text-muted">
                Punto:{" "}
                <span className="text-accent">
                  {activeQRModalOrder.lockBoxPoint.name}
                </span>
              </p>
              <p className="text-text-subtle text-[11px]">
                Válido hasta: {formatBuyerDate(activeQRModalOrder.qrExpiresAt)}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL CALIFICACIÓN (B9) */}
      <Modal
        isOpen={!!reviewOrderTarget}
        onClose={() => setReviewOrderTarget(null)}
        title="Calificar Vendedor y Producto"
      >
        <form onSubmit={submitReview} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-text-secondary mb-2">
              Puntuación
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 text-warning hover:scale-110 transition-transform cursor-pointer"
                >
                  <Star
                    className={`w-6 h-6 ${star <= rating ? "fill-warning" : "text-text-subtle"}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-text-secondary mb-1.5">
              Comentario sobre la entrega
            </label>
            <textarea
              required
              rows={3}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="¿Cómo fue el estado del producto y la atención en el Punto LockBox?"
              className="w-full bg-canvas border border-border rounded p-2.5 text-xs text-white outline-none focus:border-accent"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-accent text-canvas font-black text-xs uppercase tracking-wider rounded cursor-pointer"
          >
            Enviar Reseña
          </button>
        </form>
      </Modal>

      {/* MODAL DISPUTA (B10) */}
      <Modal
        isOpen={!!disputeOrderTarget}
        onClose={() => setDisputeOrderTarget(null)}
        title="Abrir Disputa / Reclamo Escrow"
      >
        <form onSubmit={submitDispute} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-text-secondary mb-1.5">
              Motivo del reclamo
            </label>
            <select
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              className="w-full bg-canvas border border-border rounded p-2.5 text-xs text-white outline-none focus:border-accent"
            >
              <option>Producto no coincide con el live</option>
              <option>Producto dañado o defectuoso</option>
              <option>Paquete incompleto en Punto LockBox</option>
              <option>El paquete nunca llegó a la tienda aliada</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-text-secondary mb-1.5">
              Detalle del problema
            </label>
            <textarea
              required
              rows={3}
              value={disputeDesc}
              onChange={(e) => setDisputeDesc(e.target.value)}
              placeholder="Explica qué sucedió para que el equipo administrativo congele los fondos..."
              className="w-full bg-canvas border border-border rounded p-2.5 text-xs text-white outline-none focus:border-accent"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-warning-strong text-white font-black text-xs uppercase tracking-wider rounded cursor-pointer"
          >
            Presentar Disputa y Retener Fondos
          </button>
        </form>
      </Modal>
    </div>
  );
}
