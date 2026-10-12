'use client';

import React from 'react';
import { OrderStatus } from '@/lib/buyer/model';

export function StatusBadge({ status }: { status: OrderStatus }) {
  const styles: Record<OrderStatus, { label: string; bg: string; text: string; border: string }> = {
    pending: { label: 'Pendiente', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    paid: { label: 'Pago en Garantía (Escrow)', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    dispatched: { label: 'En Camino a LockBox', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
    in_lockbox: { label: 'Listo para Recojo', bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    delivered: { label: 'Entregado', bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/40' },
    released: { label: 'Fondos Liberados', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
    cancelled: { label: 'Cancelado y Reembolsado', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
    disputed: { label: 'En Disputa / Reclamo', bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/40' },
  };

  const config = styles[status] || styles.pending;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${config.bg} ${config.text} ${config.border}`}>
      {config.label}
    </span>
  );
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0B1221] border border-[#1C263A] rounded-lg shadow-2xl p-6 text-white max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#1C263A]">
          <h3 className="text-base font-black uppercase tracking-wider text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 text-sm font-bold"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}