'use client';

import React, { useState } from 'react';
import { useBuyerStore } from '@/lib/buyer/store';
import { calculateCartSubtotal, formatBOB } from '@/lib/buyer/domain';
import { Modal } from './ui';
import { ShieldCheck, MapPin, QrCode, CheckCircle2 } from 'lucide-react';
import { BuyerOrder } from '@/lib/buyer/model';

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
    state.lockBoxPoints[0]?.id || ''
  );
  const [paymentMethod, setPaymentMethod] = useState<'yape' | 'bcp'>('yape');
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
    <Modal isOpen={isOpen} onClose={onClose} title="Checkout Phygital con Escrow">
      <div className="space-y-5">
        {/* Banner de protección Escrow */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3.5 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#00E59B] shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-[#00E59B] uppercase tracking-wider">
              Pago 100% Protegido (Escrow LockBox)
            </p>
            <p className="text-slate-300 leading-relaxed">
              Tu dinero no se transfiere al vendedor hasta que recojas y verifiques tu producto con tu código QR en el Punto LockBox.
            </p>
          </div>
        </div>

        {/* Selección de Punto LockBox */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            1. Selecciona tu Punto LockBox de entrega (La Paz)
          </label>
          <div className="space-y-2">
            {state.lockBoxPoints.map((point) => (
              <label
                key={point.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedPointId === point.id
                    ? 'border-[#00E59B] bg-[#101b33]'
                    : 'border-[#1C263A] bg-[#060B14] hover:border-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="lockbox_point"
                  checked={selectedPointId === point.id}
                  onChange={() => setSelectedPointId(point.id)}
                  className="mt-1 accent-[#00E59B]"
                />
                <div className="flex-1 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <MapPin className="w-3.5 h-3.5 text-[#00E59B]" />
                    {point.name}
                  </div>
                  <p className="text-slate-400 mt-0.5">{point.address}</p>
                  <p className="text-slate-500 text-[10px] mt-1 font-mono">
                    Tel: {point.phone} • Capacidad: {point.capacity} casilleros
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Método de Pago */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            2. Método de pago en garantía
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('yape')}
              className={`p-3 rounded-lg border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                paymentMethod === 'yape'
                  ? 'border-[#00E59B] bg-[#101b33] text-white'
                  : 'border-[#1C263A] bg-[#060B14] text-slate-400'
              }`}
            >
              <span className="text-sm">📱 Yape Bolivia</span>
              <span className="text-[10px] text-slate-500 font-normal">QR Simple</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('bcp')}
              className={`p-3 rounded-lg border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                paymentMethod === 'bcp'
                  ? 'border-[#00E59B] bg-[#101b33] text-white'
                  : 'border-[#1C263A] bg-[#060B14] text-slate-400'
              }`}
            >
              <span className="text-sm">🏦 BCP Banca Móvil</span>
              <span className="text-[10px] text-slate-500 font-normal">Transferencia QR</span>
            </button>
          </div>
        </div>

        {/* Resumen Final */}
        <div className="border-t border-[#1C263A] pt-4 space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Productos ({state.cart.length})</span>
            <span>{formatBOB(subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Custodia Escrow</span>
            <span className="text-[#00E59B] font-bold">Gratis</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-[#1C263A]/60">
            <span>Total a Retener</span>
            <span className="text-[#00E59B] font-mono text-base">{formatBOB(subtotal)}</span>
          </div>
        </div>

        {/* Botón de Confirmación */}
        <button
          type="button"
          disabled={isProcessing || state.cart.length === 0}
          onClick={handleConfirmPayment}
          className="w-full bg-[#00E59B] hover:bg-[#00C988] text-[#060B14] font-black text-xs uppercase tracking-wider py-3.5 rounded flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          {isProcessing ? (
            'Reteniendo fondos en Escrow...'
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Confirmar y Bloquear Fondos
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}