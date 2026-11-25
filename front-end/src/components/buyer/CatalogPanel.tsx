"use client";

import React from "react";
import Image from "next/image";
import { useBuyerStore } from "@/lib/buyer/connected-store";
import { formatBOB } from "@/lib/buyer/domain";
import { Search, Radio, ShoppingCart, Check } from "lucide-react";

export function CatalogPanel() {
  const [state, actions, meta] = useBuyerStore();
  const [selectedSizes, setSelectedSizes] = React.useState<
    Record<string, string>
  >({});
  const [addedId, setAddedId] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!addedId) return;
    const timer = setTimeout(() => setAddedId(null), 1200);
    return () => clearTimeout(timer);
  }, [addedId]);

  // Extraer categorías únicas
  const categories = Array.from(
    new Set(
      state.catalog.map((p) =>
        JSON.stringify({ id: p.categoryId, name: p.categoryName }),
      ),
    ),
  ).map((c) => JSON.parse(c) as { id: string; name: string });

  // Filtrado reactivo (B1 y B2)
  const filteredProducts = state.catalog.filter((prod) => {
    const matchesSearch =
      prod.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      prod.description
        .toLowerCase()
        .includes(state.searchQuery.toLowerCase()) ||
      prod.sellerName.toLowerCase().includes(state.searchQuery.toLowerCase());

    const matchesCategory =
      !state.selectedCategory || prod.categoryId === state.selectedCategory;

    const matchesLive = !state.activeLiveSession || prod.isLiveFeatured;

    return matchesSearch && matchesCategory && matchesLive;
  });

  const handleAddToCart = async (product: (typeof state.catalog)[0]) => {
    if (
      product.variants?.length &&
      !product.variants.some(
        (v) => v.size === selectedSizes[product.id] && v.stock > 0,
      )
    )
      return;
    if (!(await actions.addToCart(product, 1, selectedSizes[product.id] ?? "")))
      return;
    setAddedId(product.id);
  };

  return (
    <div className="space-y-6">
      {/* BANNER EN VIVO (B2) */}
      <div className="bg-gradient-to-r from-surface via-surface-raised to-surface border border-border rounded-xl p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="relative flex h-3 w-3 shrink-0">
            <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-accent-soft text-accent font-black text-xs px-2 py-0.5 rounded tracking-wider uppercase">
                Catálogo LockBox
              </span>
              <h2 className="text-sm sm:text-base font-black text-foreground">
                Productos de nuestras tiendas
              </h2>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Explora productos publicados y filtra los destacados en un live de
              prueba.
            </p>
          </div>
        </div>

        <button
          onClick={() => actions.toggleLiveSessionFilter()}
          aria-pressed={state.activeLiveSession}
          className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold transition-colors cursor-pointer ${
            state.activeLiveSession
              ? "bg-danger-strong text-white shadow-lg shadow-danger-strong/20"
              : "bg-surface-raised border border-border text-text-secondary hover:border-border-strong"
          }`}
        >
          <Radio aria-hidden="true" className="w-4 h-4" />
          {state.activeLiveSession
            ? "Mostrando productos en directo"
            : "Filtrar productos en live"}
        </button>
      </div>

      {/* CONTROLES DE FILTRADO (B1) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Barra de búsqueda */}
        <div className="relative flex-1 max-w-md">
          <Search
            aria-hidden="true"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle"
          />
          <input
            autoComplete="off"
            name="searchQuery"
            type="search"
            value={state.searchQuery}
            onChange={(e) => actions.setSearchQuery(e.target.value)}
            placeholder="Buscar productos, marcas o tiendas…"
            aria-label="Buscar productos, marcas o tiendas"
            className="w-full bg-surface border border-border text-foreground text-xs pl-10 pr-4 py-2.5 rounded focus:border-accent transition-colors placeholder:text-text-subtle"
          />
        </div>

        {/* Chips de categorías */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          <button
            onClick={() => actions.setSelectedCategory(null)}
            aria-pressed={state.selectedCategory === null}
            className={`px-3 py-1.5 rounded-full font-bold transition-colors whitespace-nowrap cursor-pointer ${
              state.selectedCategory === null
                ? "bg-accent text-on-accent"
                : "bg-surface text-text-muted border border-border hover:text-foreground"
            }`}
          >
            Todas
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => actions.setSelectedCategory(cat.id)}
              aria-pressed={state.selectedCategory === cat.id}
              className={`px-3 py-1.5 rounded-full font-bold transition-colors whitespace-nowrap cursor-pointer ${
                state.selectedCategory === cat.id
                  ? "bg-accent text-on-accent"
                  : "bg-surface text-text-muted border border-border hover:text-foreground"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <p role="status" className="sr-only">
        {addedId
          ? "Producto agregado al carrito."
          : `${filteredProducts.length} productos encontrados.`}
      </p>
      {/* GRILLA DE PRODUCTOS */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border rounded-xl">
          <p className="text-text-muted text-sm">
            No se encontraron productos con estos criterios de búsqueda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const variants = product.variants ?? [];
            const selectedSize = selectedSizes[product.id] ?? "";
            const selectedVariant = variants.find(
              (v) => v.size === selectedSize,
            );
            const requiresSize = variants.length > 0;
            const isOutOfStock =
              product.stock <= 0 ||
              (requiresSize && !!selectedSize && !selectedVariant?.stock);
            const needsSize = requiresSize && !selectedSize;
            const isJustAdded = addedId === product.id;

            return (
              <div
                key={product.id}
                className="bg-surface border border-border rounded-lg overflow-hidden flex flex-col justify-between hover:border-border-emphasis transition-colors group"
              >
                <div>
                  <div className="relative aspect-video w-full bg-canvas overflow-hidden">
                    <Image
                      width={500}
                      height={280}
                      unoptimized
                      src={product.imageUrl || "/product-placeholder.svg"}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.isLiveFeatured && (
                      <span className="absolute top-2 left-2 bg-danger-strong/90 text-white font-bold text-xs px-2 py-0.5 rounded tracking-wide uppercase backdrop-blur-sm">
                        En Vivo
                      </span>
                    )}
                    <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded font-mono">
                      Stock: {product.stock}
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-text-muted">
                      <span>{product.categoryName}</span>
                      <span className="text-accent font-semibold">
                        @{product.sellerName}
                      </span>
                    </div>

                    {requiresSize && (
                      <label className="block text-xs font-semibold text-text-secondary">
                        Talla
                        <select
                          aria-label={`Talla de ${product.title}`}
                          value={selectedSize}
                          onChange={(e) =>
                            setSelectedSizes((current) => ({
                              ...current,
                              [product.id]: e.target.value,
                            }))
                          }
                          className="mt-1 w-full rounded border border-border bg-surface p-2 text-foreground"
                        >
                          <option value="">Elige una talla</option>
                          {variants.map((v) => (
                            <option
                              key={v.size}
                              value={v.size}
                              disabled={v.stock <= 0}
                            >
                              {v.size} —{" "}
                              {v.stock > 0
                                ? `${v.stock} disponibles`
                                : "Agotada"}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    <h3 className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-accent transition-colors">
                      {product.title}
                    </h3>
                    <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-border/60 flex items-center justify-between mt-3">
                  <div>
                    <span className="text-xs text-text-subtle uppercase tracking-wider block">
                      Precio
                    </span>
                    <span className="text-base font-black text-accent">
                      {formatBOB(product.priceCents)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleAddToCart(product)}
                    aria-label={`${isOutOfStock ? "Sin stock:" : "Agregar al carrito:"} ${product.title}`}
                    disabled={
                      isOutOfStock || needsSize || meta.busy || meta.loading
                    }
                    className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-bold transition-colors cursor-pointer ${
                      isOutOfStock
                        ? "bg-border text-text-subtle cursor-not-allowed"
                        : isJustAdded
                          ? "bg-accent text-on-accent"
                          : "bg-accent hover:bg-accent-hover text-on-accent"
                    }`}
                  >
                    {isJustAdded ? (
                      <>
                        <Check aria-hidden="true" className="w-3.5 h-3.5" />
                        Agregado
                      </>
                    ) : (
                      <>
                        <ShoppingCart
                          aria-hidden="true"
                          className="w-3.5 h-3.5"
                        />
                        {isOutOfStock
                          ? "Agotado"
                          : needsSize
                            ? "Elige talla"
                            : "Agregar"}
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
