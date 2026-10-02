'use client';

import { useState } from 'react';
import { Plus, Search, Pencil, Archive, Play, Pause } from 'lucide-react';
import {
  PRODUCT_LABELS,
  CATEGORIES,
  type ProductStatus,
  type SellerProduct,
} from '@/lib/seller/model';
import { activeLive, money } from '@/lib/seller/domain';
import ProductEditor from './ProductEditor';
import Dialog from './Dialog';
import { Badge, Empty, ProductVisual, type PanelProps } from './ui';
import styles from './seller.module.css';

export default function CatalogPanel({ state, act }: PanelProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [category, setCategory] = useState('all');
  const [editor, setEditor] = useState<{ product: SellerProduct | null } | null>(null);
  const [archive, setArchive] = useState<SellerProduct | null>(null);
  const live = activeLive(state);
  const products = state.products.filter(
    (p) =>
      p.status !== 'archived' &&
      (filter === 'all' || p.status === filter) &&
      (category === 'all' || p.category === category) &&
      `${p.title} ${p.sku} ${p.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()),
  );
  const changeStatus = (product: SellerProduct, status: ProductStatus) =>
    act(
      { type: 'setProductStatus', id: product.id, status },
      status === 'published' ? 'Producto publicado en tu catálogo.' : 'Producto pausado.',
    );
  return (
    <>
      <div className={styles.sectionHeading}>
        <div>
          <h2>Tu catálogo</h2>
          <p>Prepara tus productos. Publica cuando estén listos para vender.</p>
        </div>
        <button className={styles.primary} onClick={() => setEditor({ product: null })}>
          <Plus size={17} /> Nuevo producto
        </button>
      </div>
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <Search size={17} />
          <input
            aria-label="Buscar productos"
            placeholder="Buscar por nombre, SKU o etiqueta"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          aria-label="Filtrar por estado"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Todos los estados</option>
          {(['published', 'draft', 'paused'] as const).map((status) => (
            <option key={status} value={status}>
              {PRODUCT_LABELS[status]}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrar por categoría"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="all">Todas las categorías</option>
          {CATEGORIES.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </div>
      <div className={styles.productGrid}>
        {products.map((product) => {
          const inLive = live?.productIds.includes(product.id);
          return (
            <article className={styles.productCard} key={product.id}>
              <div className={styles.productImageWrap}>
                <ProductVisual product={product} />
                <div className={styles.productBadge}>
                  <Badge tone={product.status === 'published' ? 'green' : 'neutral'}>
                    {PRODUCT_LABELS[product.status]}
                  </Badge>
                  {inLive && <Badge tone="red">EN LIVE</Badge>}
                </div>
              </div>
              <div className={styles.productBody}>
                <span className={styles.eyebrow}>{product.category}</span>
                <h3>{product.title}</h3>
                <p className={styles.productDescription}>
                  {product.description || 'Sin descripción'}
                </p>
                <div className={styles.priceRow}>
                  <strong>{money(product.priceCents)}</strong>
                  <span data-low={product.stock <= 3}>{product.stock} unidades</span>
                </div>
                <div className={styles.tags}>
                  {product.tags.map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>
                <div className={styles.productActions}>
                  <button
                    className={styles.secondary}
                    disabled={inLive}
                    onClick={() => setEditor({ product })}
                  >
                    <Pencil size={14} /> Editar
                  </button>
                  <button
                    className={styles.secondary}
                    disabled={inLive}
                    onClick={() =>
                      changeStatus(product, product.status === 'published' ? 'paused' : 'published')
                    }
                  >
                    {product.status === 'published' ? <Pause size={14} /> : <Play size={14} />}
                    {product.status === 'published' ? 'Pausar' : 'Publicar'}
                  </button>
                  <button
                    className={styles.iconButton}
                    disabled={inLive}
                    aria-label={`Archivar ${product.title}`}
                    onClick={() => setArchive(product)}
                  >
                    <Archive size={16} />
                  </button>
                </div>
                {inLive && (
                  <small className={styles.muted}>Finaliza el live para editar o pausar.</small>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {!products.length && (
        <Empty title="Sin productos en esta vista">
          Cambia los filtros o crea tu primer producto.
        </Empty>
      )}
      {editor && (
        <ProductEditor
          product={editor.product}
          onClose={() => setEditor(null)}
          onSave={(product) => {
            // Throw to preserve the form and show validation inline when the store rejects the change.
            if (!act({ type: 'saveProduct', product }, 'Producto guardado.'))
              throw new Error('No se pudo guardar. Revisa el aviso del panel.');
            setEditor(null);
          }}
        />
      )}
      {archive && (
        <Dialog title="Archivar producto" onClose={() => setArchive(null)}>
          <div className={styles.form}>
            <p>
              ¿Archivar <strong>{archive.title}</strong>? Dejará de aparecer en tu catálogo. Los
              pedidos anteriores conservarán sus datos.
            </p>
            <div className={styles.actions}>
              <button className={styles.secondary} onClick={() => setArchive(null)}>
                Cancelar
              </button>
              <button
                className={styles.danger}
                onClick={() => {
                  if (
                    act(
                      { type: 'setProductStatus', id: archive.id, status: 'archived' },
                      'Producto archivado.',
                    )
                  )
                    setArchive(null);
                }}
              >
                Archivar producto
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}
