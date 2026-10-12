'use client';

import React from 'react';
import { useBuyerStore } from '@/lib/buyer/store';
import { formatBOB } from '@/lib/buyer/domain';
import { Search, Radio, ShoppingCart, Check } from 'lucide-react';

export function CatalogPanel({ onOpenCart }: { onOpenCart: () => void }) {
  const [state, actions] = useBuyerStore();
  const [addedId, setAddedId] = React.useState<string | null>(null);

  // Extraer categorías únicas
  const categories = Array.from(
    new Set(state.catalog.map((p) => JSON.stringify({ id: p.categoryId, name: p.categoryName })))
  ).map((c) => JSON.parse(c) as { id: string; name: string });

  // Filtrado reactivo (B1 y B2)
  const filteredProducts = state.catalog.filter((prod) => {
    const matchesSearch =
      prod.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      prod.description.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      prod.sellerName.toLowerCase().includes(state.searchQuery.toLowerCase());

    const matchesCategory =
      !state.selectedCategory || prod.categoryId === state.selectedCategory;

    const matchesLive = !state.activeLiveSession || prod.isLiveFeatured;

    return matchesSearch && matchesCategory && matchesLive;
  });

  const handleAddToCart = (product: typeof state.catalog[0]) => {
    actions.addToCart(product, 1);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  return (
    <div className="space-y-6">
      {/* BANNER EN VIVO (B2) */}
      <div className="bg-gradient-to-r from-[#0B1221] via-[#101a33] to-[#0B1221] border border-[#1C263A] rounded-xl p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-rose-500 text-white font-black text-[10px] px-2 py-0.5 rounded tracking-wider uppercase">
                TikTok Live Activo
              </span>
              <h2 className="text-sm sm:text-base font-black text-white">
                Transmisión Oficial LockBox La Paz
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Productos exclusivos comprados durante el streaming con entrega garantizada.
            </p>
          </div>
        </div>

        <button
          onClick={() => actions.toggleLiveSessionFilter()}
          className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold transition-all cursor-pointer ${
            state.activeLiveSession
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
              : 'bg-[#131B2F] border border-[#1C263A] text-slate-300 hover:border-slate-600'
          }`}
        >
          <Radio className="w-4 h-4" />
          {state.activeLiveSession ? 'Mostrando productos en directo' : 'Ver todos los productos'}
        </button>
      </div>

      {/* CONTROLES DE FILTRADO (B1) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Barra de búsqueda */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={state.searchQuery}
            onChange={(e) => actions.setSearchQuery(e.target.value)}
            placeholder="Buscar productos, marcas o tiendas..."
            className="w-full bg-[#0B1221] border border-[#1C263A] text-white text-xs pl-10 pr-4 py-2.5 rounded outline-none focus:border-[#00E59B] transition-colors placeholder:text-slate-500"
          />
        </div>

        {/* Chips de categorías */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          <button
            onClick={() => actions.setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-full font-bold transition-colors whitespace-nowrap cursor-pointer ${
              state.selectedCategory === null
                ? 'bg-[#00E59B] text-[#060B14]'
                : 'bg-[#0B1221] text-slate-400 border border-[#1C263A] hover:text-white'
            }`}
          >
            Todas
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => actions.setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full font-bold transition-colors whitespace-nowrap cursor-pointer ${
                state.selectedCategory === cat.id
                  ? 'bg-[#00E59B] text-[#060B14]'
                  : 'bg-[#0B1221] text-slate-400 border border-[#1C263A] hover:text-white'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* GRILLA DE PRODUCTOS */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-[#1C263A] rounded-xl">
          <p className="text-slate-400 text-sm">No se encontraron productos con estos criterios de búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const isOutOfStock = product.stock <= 0;
            const isJustAdded = addedId === product.id;

            return (
              <div
                key={product.id}
                className="bg-[#0B1221] border border-[#1C263A] rounded-lg overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all group"
              >
                <div>
                  <div className="relative aspect-video w-full bg-[#060B14] overflow-hidden">
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.isLiveFeatured && (
                      <span className="absolute top-2 left-2 bg-rose-600/90 text-white font-bold text-[9px] px-2 py-0.5 rounded tracking-wide uppercase backdrop-blur-sm">
                        En Vivo
                      </span>
                    )}
                    <span className="absolute bottom-2 right-2 bg-black/70 text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">
                      Stock: {product.stock}
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{product.categoryName}</span>
                      <span className="text-[#00E59B] font-semibold">@{product.sellerName}</span>
                    </div>

                    <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-[#00E59B] transition-colors">
                      {product.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-[#1C263A]/60 flex items-center justify-between mt-3">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Precio</span>
                    <span className="text-base font-black text-[#00E59B]">
                      {formatBOB(product.priceCents)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={isOutOfStock}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-bold transition-all cursor-pointer ${
                      isOutOfStock
                        ? 'bg-[#1C263A] text-slate-500 cursor-not-allowed'
                        : isJustAdded
                        ? 'bg-emerald-500 text-[#060B14]'
                        : 'bg-[#00E59B] hover:bg-[#00C988] text-[#060B14]'
                    }`}
                  >
                    {isJustAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Agregado
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-3.5 h-3.5" />
                        Agregar
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}