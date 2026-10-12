"use client";

import React from "react";
import Dialog from "@/components/seller/Dialog";
import { OrderStatus } from "@/lib/buyer/model";

export function StatusBadge({ status }: { status: OrderStatus }) {
  const styles: Record<
    OrderStatus,
    { label: string; bg: string; text: string; border: string }
  > = {
    pending: {
      label: "Pendiente",
      bg: "bg-warning-strong/10",
      text: "text-warning",
      border: "border-warning-strong/30",
    },
    paid: {
      label: "Pago en Garantía (Escrow)",
      bg: "bg-accent/10",
      text: "text-accent",
      border: "border-accent/30",
    },
    dispatched: {
      label: "En Camino a LockBox",
      bg: "bg-info-strong/10",
      text: "text-info",
      border: "border-info-strong/30",
    },
    in_lockbox: {
      label: "Listo para Recojo",
      bg: "bg-info-strong/10",
      text: "text-info",
      border: "border-info-strong/30",
    },
    delivered: {
      label: "Entregado",
      bg: "bg-accent/20",
      text: "text-on-success",
      border: "border-accent/40",
    },
    released: {
      label: "Fondos Liberados",
      bg: "bg-accent/10",
      text: "text-accent",
      border: "border-accent/30",
    },
    cancelled: {
      label: "Cancelado y Reembolsado",
      bg: "bg-danger-strong/10",
      text: "text-danger",
      border: "border-danger-strong/30",
    },
    disputed: {
      label: "En Disputa / Reclamo",
      bg: "bg-warning-strong/20",
      text: "text-warning",
      border: "border-warning-strong/40",
    },
  };

  const config = styles[status] || styles.pending;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${config.bg} ${config.text} ${config.border}`}
    >
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
    <Dialog title={title} onClose={onClose}>
      {children}
    </Dialog>
  );
}
