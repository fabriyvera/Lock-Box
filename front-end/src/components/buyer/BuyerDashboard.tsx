'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useBuyerStore } from '@/lib/buyer/store';
import { CatalogPanel } from './CatalogPanel';
import { CartDrawer } from './CartDrawer';
import { CheckoutModal } from './CheckoutModal';
import { OrdersPanel } from './OrdersPanel';
import { ShoppingBag, Package, RotateCcw } from 'lucide-react';
import { BuyerOrder } from '@/lib/buyer/model';

export function BuyerDashboard() {
  const [state, actions] = useBuyerStore();
  const [activeTab, setActiveTab] = useState<'catalog' | 'orders'>('catalog');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const totalCartItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleOrderSuccess = (order: BuyerOrder) => {
    setActiveTab('orders');
  };

  return (
    <div className="min-h-screen bg-[#060B14] text-slate-200 flex flex-col font-sans">
      {/* NAVBAR */}
      <header className="border-b border-[#1C263A] px-4 md:px-8 py-3.5 bg-[#060B14]/90 backdrop-blur sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center">
            <span className="bg-[#00E59B] text-[#060B14] font-black px-2 py-0.5 text-sm rounded-l tracking-wider">
              LOCK
            </span>
            <span className="bg-[#0B1221] border border-[#1C263A] text-white font-bold px-2 py-0.5 text-sm rounded-r tracking-wider">
              BOX
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-1 text-xs">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 rounded font-bold transition-colors cursor-pointer ${
                activeTab === 'catalog'
                  ? 'bg-[#131B2F] text-[#00E59B]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Catálogo & Live
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-[#131B2F] text-[#00E59B]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Mis Pedidos ({state.orders.length})
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => actions.resetDemo()}
            title="Reiniciar datos iniciales de demo"
            className="p-2 text-slate-500 hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 bg-[#0B1221] border border-[#1C263A] hover:border-[#00E59B] px-3.5 py-2 rounded text-xs font-bold text-white transition-colors cursor-pointer relative"
          >
            <ShoppingBag className="w-4 h-4 text-[#00E59B]" />
            <span className="hidden sm:inline">Carrito</span>
            {totalCartItems > 0 && (
              <span className="bg-[#00E59B] text-[#060B14] text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {totalCartItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
        {activeTab === 'catalog' ? (
          <CatalogPanel onOpenCart={() => setIsCartOpen(true)} />
        ) : (
          <OrdersPanel />
        )}
      </main>

      {/* DRAWERS Y MODALES */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOpenCheckout={() => setIsCheckoutOpen(true)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={handleOrderSuccess}
      />
    </div>
  );
}