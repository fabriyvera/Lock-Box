import type { OrderStatus, SellerState } from './model';

export function createDemoState(now = Date.now()): SellerState {
  const ago = (hours: number) => new Date(now - hours * 3600000).toISOString();
  const products: SellerState['products'] = [
    {
      id: 'demo-product-1',
      title: 'Chaqueta urbana oversize',
      description: 'Chaqueta de denim. Tallas S, M y L. Ideal para combinar todos los días.',
      category: 'Moda',
      priceCents: 18500,
      stock: 12,
      sku: 'MOD-001',
      imageUrl: '',
      tags: ['urbano', 'denim'],
      status: 'published',
      createdAt: ago(240),
    },
    {
      id: 'demo-product-2',
      title: 'Audífonos inalámbricos',
      description: 'Bluetooth, estuche de carga y controles táctiles. Color negro.',
      category: 'Tecnología',
      priceCents: 12000,
      stock: 8,
      sku: 'TEC-001',
      imageUrl: '',
      tags: ['bluetooth', 'audio'],
      status: 'published',
      createdAt: ago(192),
    },
    {
      id: 'demo-product-3',
      title: 'Mochila para tu día a día',
      description: 'Compartimento para laptop y tela resistente. Capacidad de 20 litros.',
      category: 'Accesorios',
      priceCents: 9500,
      stock: 3,
      sku: 'ACC-001',
      imageUrl: '',
      tags: ['mochila'],
      status: 'published',
      createdAt: ago(144),
    },
    {
      id: 'demo-product-4',
      title: 'Set de cuidado personal',
      description: 'Kit de tres piezas. Completa la descripción antes de publicarlo.',
      category: 'Belleza',
      priceCents: 7500,
      stock: 6,
      sku: 'BEL-001',
      imageUrl: '',
      tags: [],
      status: 'draft',
      createdAt: ago(24),
    },
  ];
  const orders: SellerState['orders'] = (
    [
      ['LB-1048', 'María C.', 'Chaqueta urbana oversize', 18500, 'paid', 2, null],
      ['LB-1047', 'Diego R.', 'Audífonos inalámbricos', 12000, 'paid', 5, null],
      ['LB-1046', 'Lucía V.', 'Mochila para tu día a día', 9500, 'ready', 20, null],
      ['LB-1045', 'Andrés M.', 'Chaqueta urbana oversize', 18500, 'released', 90, 72],
      ['LB-1044', 'Carla P.', 'Audífonos inalámbricos', 12000, 'released', 36, 12],
      ['LB-1043', 'José A.', 'Set de cuidado personal', 7500, 'pending', 1, null],
    ] as [string, string, string, number, OrderStatus, number, number | null][]
  ).map(([id, buyer, productTitle, subtotalCents, status, hours, releasedHours]) => ({
    id,
    buyer,
    productTitle,
    quantity: 1,
    subtotalCents,
    commissionCents: Math.round(subtotalCents * 0.06),
    settlementDelayHours: 48,
    status,
    point: 'LockBox · Sopocachi',
    address: 'Av. 20 de Octubre #2340, La Paz',
    createdAt: ago(hours),
    releasedAt: releasedHours === null ? null : ago(releasedHours),
    history: [{ status, at: ago(hours) }],
  }));
  return {
    version: 1,
    profile: {
      storeName: 'Mi tienda',
      handle: 'mi_tienda',
      bio: 'Productos elegidos para ti. Compra durante el live y recoge en un Punto LockBox.',
    },
    plan: 'emprende',
    products,
    orders,
    sessions: [],
    payouts: [],
  };
}
