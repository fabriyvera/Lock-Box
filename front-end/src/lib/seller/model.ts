export type PlanCode = 'emprende' | 'pro';
export type ProductStatus = 'draft' | 'published' | 'paused' | 'archived';
export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'dispatched'
  | 'in_lockbox'
  | 'ready'
  | 'delivered'
  | 'released'
  | 'cancelled'
  | 'refunded'
  | 'disputed';

export interface SellerProduct {
  id: string;
  title: string;
  description: string;
  category: string;
  priceCents: number;
  stock: number;
  sku: string;
  imageUrl: string;
  tags: string[];
  status: ProductStatus;
  createdAt: string;
}

export interface SellerOrder {
  id: string;
  buyer: string;
  productTitle: string;
  quantity: number;
  subtotalCents: number;
  commissionCents: number;
  settlementDelayHours: number;
  status: OrderStatus;
  point: string;
  address: string;
  createdAt: string;
  releasedAt: string | null;
  history: { status: OrderStatus; at: string }[];
}

export interface LiveSession {
  id: string;
  title: string;
  productIds: string[];
  startedAt: string;
  endedAt: string | null;
}

export interface SellerState {
  version: 1;
  profile: { storeName: string; handle: string; city: string; bio: string };
  plan: PlanCode;
  products: SellerProduct[];
  orders: SellerOrder[];
  sessions: LiveSession[];
  payouts: { id: string; amountCents: number; createdAt: string; status: 'pending' }[];
}

export type SellerAction =
  | { type: 'saveProduct'; product: SellerProduct }
  | { type: 'setProductStatus'; id: string; status: ProductStatus }
  | { type: 'startLive'; id: string; title: string; productIds: string[]; at: string }
  | { type: 'endLive'; at: string }
  | { type: 'dispatchOrder'; id: string; at: string }
  | { type: 'changePlan'; plan: PlanCode }
  | { type: 'saveProfile'; profile: SellerState['profile'] }
  | { type: 'requestPayout'; id: string; at: string };

export const CATEGORIES = ['Moda', 'Tecnología', 'Hogar', 'Belleza', 'Accesorios', 'Otros'];
// MVP assumptions inside the business document's ranges. Real rates come from plans.
export const PLANS = {
  emprende: { name: 'Emprende', commissionPercent: 6, settlementHours: 48 },
  pro: { name: 'Pro', commissionPercent: 2, settlementHours: 0 },
} as const;

export const ORDER_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente de pago',
  paid: 'Por despachar',
  dispatched: 'En camino al punto',
  in_lockbox: 'En Punto LockBox',
  ready: 'Listo para recoger',
  delivered: 'Entrega confirmada',
  released: 'Pago liberado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
  disputed: 'En disputa',
};
export const PRODUCT_LABELS: Record<ProductStatus, string> = {
  draft: 'Borrador',
  published: 'Publicado',
  paused: 'Pausado',
  archived: 'Archivado',
};
