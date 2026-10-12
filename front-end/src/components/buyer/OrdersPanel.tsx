'use client';

import React, { useState } from 'react';
import { useBuyerStore } from '@/lib/buyer/store';
import { formatBOB, canCancelOrder, canReviewOrder, canDisputeOrder } from '@/lib/buyer/domain';
import { StatusBadge, Modal } from './ui';
import { BuyerOrder } from '@/lib/buyer/model';
import {
  QrCode,
  Package,
  MapPin,
  Clock,
  Ban,
  Star,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';

export function OrdersPanel() {
  const [state, actions] = useBuyerStore();
  const [activeQRModalOrder, setActiveQRModalOrder] = useState<BuyerOrder | null>(null);
  const [reviewOrderTarget, setReviewOrderTarget] = useState<BuyerOrder | null>(null);
  const [disputeOrderTarget, setDisputeOrderTarget] = useState<BuyerOrder | null>(null);

  // Estado para el modal personalizado de cancelación
  const [orderToCancel, setOrderToCancel] = useState<BuyerOrder | null>(null);

  // Form states
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [disputeReason, setDisputeReason] = useState('Producto con fallas o incompleto');
  const [disputeDesc, setDisputeDesc] = useState('');

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
    setReviewComment('');
  };

  const submitDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeOrderTarget) return;
    actions.openDispute(disputeOrderTarget.id, disputeReason, disputeDesc);
    setDisputeOrderTarget(null);
    setDisputeDesc('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#1C263A] pb-4">
        <div>
          <h2 className="text-lg font-black text-white uppercase tracking-wider">
            Mis Pedidos Protegidos (B5 / B8)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Historial de compras en lives y retiros en Puntos LockBox de La Paz.
          </p>
        </div>
        <div className="text-xs font-mono text-[#00E59B] bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded">
          {state.orders.length} pedidos registrados
        </div>
      </div>

      {state.orders.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-[#1C263A] rounded-xl space-y-2">
          <Package className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-slate-400 text-sm">Aún no tienes pedidos registrados.</p>
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
                className="bg-[#0B1221] border border-[#1C263A] rounded-xl p-5 space-y-4 shadow-xl"
              >
                {/* Header de la orden */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1C263A]/70">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-black text-white">
                      {order.orderNumber}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Items y Punto LockBox */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                  <div className="md:col-span-7 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Artículos
                    </span>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-[#060B14] p-2.5 rounded border border-[#1C263A]">
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.title}
                          className="w-10 h-10 object-cover rounded bg-[#0B1221]"
                        />
                        <div className="flex-1 min-w-0 text-xs">
                          <p className="font-bold text-white truncate">{item.product.title}</p>
                          <p className="text-slate-400 text-[11px]">
                            Cant: {item.quantity} • @{item.product.sellerName}
                          </p>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#00E59B]">
                          {formatBOB(item.product.priceCents * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="md:col-span-5 bg-[#060B14] border border-[#1C263A] rounded-lg p-3.5 text-xs space-y-2">
                    <div className="flex items-center gap-1.5 text-white font-bold">
                      <MapPin className="w-3.5 h-3.5 text-[#00E59B]" />
                      <span>Retiro en: {order.lockBoxPoint.name}</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">{order.lockBoxPoint.address}</p>
                    <div className="pt-2 border-t border-[#1C263A] flex justify-between font-mono">
                      <span className="text-slate-400">Total retenido:</span>
                      <span className="font-bold text-[#00E59B]">{formatBOB(order.totalCents)}</span>
                    </div>
                  </div>
                </div>

                {/* Acciones del Comprador */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#1C263A]/70">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Botón QR (B6) */}
                    <button
                      onClick={() => setActiveQRModalOrder(order)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#131B2F] border border-[#1C263A] text-slate-200 hover:text-white hover:border-[#00E59B] text-xs font-bold transition-all cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5 text-[#00E59B]" />
                      Ver QR de Recojo
                    </button>

                    {/* Botón Cancelar (B7) - Abre modal en lugar de confirm() */}
                    {cancellable && (
                      <button
                        onClick={() => setOrderToCancel(order)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-all cursor-pointer"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        Cancelar Pedido
                      </button>
                    )}

                    {/* Botón Calificar (B9) */}
                    {reviewable && (
                      <button
                        onClick={() => setReviewOrderTarget(order)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-bold transition-all cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5 text-amber-400" />
                        Calificar
                      </button>
                    )}

                    {/* Botón Abrir Disputa (B10) */}
                    {disputable && (
                      <button
                        onClick={() => setDisputeOrderTarget(order)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 text-xs font-bold transition-all cursor-pointer"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Abrir Reclamo
                      </button>
                    )}
                  </div>

                  {/* Simulación para demo: marcar como entregado */}
                  {order.status !== 'delivered' && order.status !== 'cancelled' && order.status !== 'disputed' && (
                    <button
                      onClick={() => actions.simulateDelivery(order.id)}
                      className="text-[11px] text-[#00E59B]/80 hover:text-[#00E59B] underline cursor-pointer"
                    >
                      [Simular validación QR y entrega]
                    </button>
                  )}
                </div>

                {/* Reseña desplegada si existe */}
                {order.review && (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded p-3 text-xs space-y-1">
                    <div className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{order.review.rating} / 5 estrellas</span>
                    </div>
                    <p className="text-slate-300 italic">"{order.review.comment}"</p>
                  </div>
                )}

                {/* Disputa desplegada si existe */}
                {order.dispute && (
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded p-3 text-xs space-y-1">
                    <p className="font-bold text-orange-400">
                      Disputa Activa: {order.dispute.reason}
                    </p>
                    <p className="text-slate-300">{order.dispute.description}</p>
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
        title="Cancelar Pedido y Liberar Escrow"
      >
        <div className="space-y-4">
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3.5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-rose-300">
                Reembolso inmediato garantizado
              </p>
              <p className="text-slate-300 leading-relaxed">
                ¿Seguro que deseas cancelar el pedido <span className="font-mono text-white font-bold">{orderToCancel?.orderNumber}</span>? Tu dinero retenido en Escrow será liberado y reembolsado de inmediato a tu método de pago.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setOrderToCancel(null)}
              className="px-4 py-2.5 rounded text-xs font-bold text-slate-300 hover:text-white bg-[#131B2F] border border-[#1C263A] transition-colors cursor-pointer"
            >
              Mantener Pedido
            </button>
            <button
              type="button"
              onClick={confirmCancelOrder}
              className="px-4 py-2.5 rounded text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors cursor-pointer"
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
        title="Token QR de Canje Físico"
      >
        {activeQRModalOrder && (
          <div className="text-center space-y-4">
            <div className="bg-white p-6 rounded-xl inline-block mx-auto border-4 border-[#00E59B]">
              <div className="w-48 h-48 bg-slate-100 flex flex-col items-center justify-center rounded">
                <QrCode className="w-28 h-28 text-slate-900" />
                <span className="font-mono text-[10px] text-slate-600 mt-2 font-bold tracking-wider">
                  {activeQRModalOrder.qrCode}
                </span>
              </div>
            </div>

            <div className="text-xs space-y-1">
              <p className="font-bold text-white text-sm">Presenta este QR al encargado</p>
              <p className="text-slate-400">
                Punto: <span className="text-[#00E59B]">{activeQRModalOrder.lockBoxPoint.name}</span>
              </p>
              <p className="text-slate-500 text-[11px]">
                Válido hasta: {new Date(activeQRModalOrder.qrExpiresAt).toLocaleDateString()}
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
            <label className="block text-xs font-bold uppercase text-slate-300 mb-2">
              Puntuación
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                >
                  <Star
                    className={`w-6 h-6 ${star <= rating ? 'fill-amber-400' : 'text-slate-600'}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
              Comentario sobre la entrega
            </label>
            <textarea
              required
              rows={3}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="¿Cómo fue el estado del producto y la atención en el Punto LockBox?"
              className="w-full bg-[#060B14] border border-[#1C263A] rounded p-2.5 text-xs text-white outline-none focus:border-[#00E59B]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#00E59B] text-[#060B14] font-black text-xs uppercase tracking-wider rounded cursor-pointer"
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
            <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
              Motivo del reclamo
            </label>
            <select
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              className="w-full bg-[#060B14] border border-[#1C263A] rounded p-2.5 text-xs text-white outline-none focus:border-[#00E59B]"
            >
              <option>Producto no coincide con el live</option>
              <option>Producto dañado o defectuoso</option>
              <option>Paquete incompleto en Punto LockBox</option>
              <option>El paquete nunca llegó a la tienda aliada</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
              Detalle del problema
            </label>
            <textarea
              required
              rows={3}
              value={disputeDesc}
              onChange={(e) => setDisputeDesc(e.target.value)}
              placeholder="Explica qué sucedió para que el equipo administrativo congele los fondos..."
              className="w-full bg-[#060B14] border border-[#1C263A] rounded p-2.5 text-xs text-white outline-none focus:border-[#00E59B]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-orange-500 text-white font-black text-xs uppercase tracking-wider rounded cursor-pointer"
          >
            Presentar Disputa y Retener Fondos
          </button>
        </form>
      </Modal>
    </div>
  );
}