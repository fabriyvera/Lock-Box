export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'dispatched'
  | 'in_lockbox'
  | 'delivered'
  | 'released'
  | 'cancelled'
  | 'disputed';

export interface BuyerProduct {
  id: string;
  sellerId: string;
  sellerName: string;
  categoryId: string;
  categoryName: string;
  title: string;
  description: string;
  priceCents: number; // Precio en centavos para precisión
  stock: number;
  sku: string;
  imageUrl: string;
  isLiveFeatured?: boolean; // Caso B2: Destacado en TikTok Live
}

export interface CartItem {
  product: BuyerProduct;
  quantity: number;
}

export interface LockBoxPoint {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  capacity: number;
}

export interface BuyerOrder {
  id: string;
  orderNumber: string;
  items: CartItem[];
  subtotalCents: number;
  totalCents: number;
  lockBoxPoint: LockBoxPoint;
  paymentMethod: 'yape' | 'bcp';
  status: OrderStatus;
  qrCode: string; // Token QR
  qrExpiresAt: string;
  createdAt: string;
  paidAt?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  review?: {
    rating: number;
    comment: string;
    createdAt: string;
  };
  dispute?: {
    reason: string;
    description: string;
    status: 'open' | 'resolved';
    createdAt: string;
  };
}

export interface BuyerState {
  catalog: BuyerProduct[];
  cart: CartItem[];
  orders: BuyerOrder[];
  lockBoxPoints: LockBoxPoint[];
  selectedCategory: string | null;
  searchQuery: string;
  activeLiveSession: boolean;
}