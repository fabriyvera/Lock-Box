export type PointStatus = "dispatched" | "in_lockbox" | "ready" | "delivered";
export type Point = {
  id: string;
  name: string;
  address: string;
  capacity: number;
  occupied: number;
  pending: number;
  deliveredToday: number;
};
export type PointOrder = {
  id: string;
  pointId: string;
  status: PointStatus;
  buyerLabel: string;
  productTitle: string;
  updatedAt?: string;
};
export type PointState = {
  points: Point[];
  orders: PointOrder[];
  activity: {
    id: string;
    orderId: string;
    pointId: string;
    status: string;
    at: string;
  }[];
};
export const STATUS_LABELS: Record<string, string> = {
  dispatched: "En camino",
  in_lockbox: "Recibido en el punto",
  ready: "Listo para retiro",
  delivered: "Entregado",
  paid: "Pagado",
  pending: "Pendiente",
  released: "Liquidado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
  disputed: "En disputa",
};
export function nextPointStatus(
  status: string,
): { status: PointStatus; label: string } | null {
  if (status === "dispatched")
    return { status: "in_lockbox", label: "Confirmar recepción" };
  if (status === "in_lockbox")
    return { status: "ready", label: "Marcar listo para retiro" };
  if (status === "ready")
    return { status: "delivered", label: "Confirmar entrega al comprador" };
  return null;
}
