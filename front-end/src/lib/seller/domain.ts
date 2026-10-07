import { CATEGORIES, type SellerAction, type SellerProduct, type SellerState } from './model';

export function money(cents: number): string {
  return `Bs. ${(cents / 100).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function parsePrice(value: string): number {
  if (!/^\d{1,7}([.,]\d{1,2})?$/.test(value.trim()))
    throw new Error('Ingresa un precio válido con hasta dos decimales.');
  const cents = Math.round(Number(value.replace(',', '.')) * 100);
  if (cents <= 0 || cents > 999999999) throw new Error('El precio debe ser mayor que cero.');
  return cents;
}

export function validateProduct(product: SellerProduct, products: SellerProduct[]): void {
  if (!product.title.trim() || product.title.length > 100)
    throw new Error('El nombre es obligatorio y admite hasta 100 caracteres.');
  if (
    !Number.isSafeInteger(product.priceCents) ||
    product.priceCents <= 0 ||
    product.priceCents > 999999999
  )
    throw new Error('El precio debe ser mayor que cero.');
  if (!Number.isSafeInteger(product.stock) || product.stock < 0 || product.stock > 99999)
    throw new Error('El stock debe ser un entero entre 0 y 99999.');
  if (!CATEGORIES.includes(product.category)) throw new Error('Selecciona una categoría válida.');
  if (
    product.description.length > 2000 ||
    product.sku.length > 40 ||
    product.tags.length > 8 ||
    product.tags.some((tag) => tag.length > 30)
  )
    throw new Error('Revisa los límites de descripción, SKU y etiquetas.');
  if (product.imageUrl && !/^https:\/\//i.test(product.imageUrl))
    throw new Error('La imagen debe tener una URL HTTPS.');
  if (product.imageUrl) {
    try {
      new URL(product.imageUrl);
    } catch {
      throw new Error('La URL de la imagen no es válida.');
    }
  }
  if (
    product.sku &&
    products.some(
      (p) =>
        p.id !== product.id &&
        p.status !== 'archived' &&
        p.sku.toLowerCase() === product.sku.toLowerCase(),
    )
  )
    throw new Error('Ya tienes un producto con ese SKU.');
  if (product.status === 'published' && product.stock === 0)
    throw new Error('Agrega stock antes de publicar el producto.');
}

export function activeLive(state: SellerState) {
  return state.sessions.find((session) => !session.endedAt);
}

export function balances(state: SellerState, now: number) {
  let heldCents = 0,
    settlingCents = 0,
    releasedCents = 0,
    commissionCents = 0;
  for (const order of state.orders) {
    const net = order.subtotalCents - order.commissionCents;
    if (
      ['paid', 'dispatched', 'in_lockbox', 'ready', 'delivered', 'disputed'].includes(order.status)
    )
      heldCents += net;
    if (order.status === 'released' && order.releasedAt) {
      commissionCents += order.commissionCents;
      if (Date.parse(order.releasedAt) + order.settlementDelayHours * 3600000 <= now)
        releasedCents += net;
      else settlingCents += net;
    }
  }
  const reservedCents = state.payouts.reduce((sum, payout) => sum + payout.amountCents, 0);
  return {
    heldCents,
    settlingCents,
    releasedCents,
    commissionCents,
    reservedCents,
    availableCents: Math.max(0, releasedCents - reservedCents),
  };
}

/** Pure demo rules. Escrow/QR state changes are intentionally not seller actions. */
export function applySellerAction(state: SellerState, action: SellerAction): SellerState {
  const live = activeLive(state);
  switch (action.type) {
    case 'saveProduct': {
      validateProduct(action.product, state.products);
      const old = state.products.find((p) => p.id === action.product.id);
      if (old?.status === 'archived') throw new Error('No puedes editar un producto archivado.');
      if (live?.productIds.includes(action.product.id))
        throw new Error('Finaliza el live antes de editar este producto.');
      return {
        ...state,
        products: old
          ? state.products.map((p) => (p.id === action.product.id ? action.product : p))
          : [action.product, ...state.products],
      };
    }
    case 'setProductStatus': {
      const product = state.products.find((p) => p.id === action.id);
      if (!product || product.status === 'archived')
        throw new Error('El producto ya no está disponible.');
      if (live?.productIds.includes(action.id))
        throw new Error('Finaliza el live antes de modificar este producto.');
      const updated = { ...product, status: action.status };
      validateProduct(updated, state.products);
      return { ...state, products: state.products.map((p) => (p.id === action.id ? updated : p)) };
    }
    case 'startLive': {
      if (live) throw new Error('Ya tienes una transmisión en curso.');
      if (!action.title.trim() || action.title.length > 100)
        throw new Error('El título del live es obligatorio (máximo 100 caracteres).');
      const ids = [...new Set(action.productIds)];
      if (
        !ids.length ||
        ids.some(
          (id) =>
            !state.products.some((p) => p.id === id && p.status === 'published' && p.stock > 0),
        )
      )
        throw new Error('Selecciona productos publicados con stock.');
      return {
        ...state,
        sessions: [
          {
            id: action.id,
            title: action.title.trim(),
            productIds: ids,
            startedAt: action.at,
            endedAt: null,
          },
          ...state.sessions,
        ],
      };
    }
    case 'endLive':
      if (!live) throw new Error('No hay una transmisión en curso.');
      return {
        ...state,
        sessions: state.sessions.map((s) => (s.id === live.id ? { ...s, endedAt: action.at } : s)),
      };
    case 'dispatchOrder': {
      const order = state.orders.find((o) => o.id === action.id);
      if (!order || order.status !== 'paid')
        throw new Error('Solo puedes despachar pedidos con pago confirmado.');
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.id
            ? {
                ...o,
                status: 'dispatched',
                history: [...o.history, { status: 'dispatched', at: action.at }],
              }
            : o,
        ),
      };
    }
    case 'changePlan':
      if (!['emprende', 'pro'].includes(action.plan)) throw new Error('Plan no válido.');
      return { ...state, plan: action.plan };
    case 'saveProfile':
      if (
        !action.profile.storeName.trim() ||
        action.profile.storeName.length > 80 ||
        !/^[a-z0-9._]{3,30}$/.test(action.profile.handle) ||
        /^\.|\.$|\.\.|__/.test(action.profile.handle) ||
        action.profile.bio.length > 500
      )
        throw new Error(
          'Revisa el nombre y usuario. Usa 3–30 minúsculas, números, puntos o guiones bajos; sin puntos al inicio/final ni .. o __.',
        );
      return { ...state, profile: action.profile };
    case 'requestPayout': {
      const amountCents = balances(state, Date.parse(action.at)).availableCents;
      if (!amountCents) throw new Error('No tienes saldo disponible para liquidar.');
      return {
        ...state,
        payouts: [
          { id: action.id, amountCents, createdAt: action.at, status: 'pending' },
          ...state.payouts,
        ],
      };
    }
  }
}
