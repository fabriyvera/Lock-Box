'use client';

import { useState, type FormEvent } from 'react';
import { CATEGORIES, type SellerProduct } from '@/lib/seller/model';
import { parsePrice } from '@/lib/seller/domain';
import Dialog from './Dialog';
import styles from './seller.module.css';

export default function ProductEditor({
  product,
  onSave,
  onClose,
}: {
  product: SellerProduct | null;
  onSave: (product: SellerProduct) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: product?.title ?? '',
    description: product?.description ?? '',
    category: product?.category ?? 'Moda',
    price: product ? (product.priceCents / 100).toFixed(2) : '',
    stock: String(product?.stock ?? 0),
    sku: product?.sku ?? '',
    imageUrl: product?.imageUrl ?? '',
    tags: product?.tags.join(', ') ?? '',
  });
  const [error, setError] = useState('');
  const field = (name: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [name]: value }));
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (!/^\d+$/.test(form.stock))
        throw new Error('El stock debe ser un número entero positivo o cero.');
      onSave({
        id: product?.id ?? crypto.randomUUID(),
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        priceCents: parsePrice(form.price),
        stock: Number(form.stock),
        sku: form.sku.trim(),
        imageUrl: form.imageUrl.trim(),
        tags: [
          ...new Set(
            form.tags
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean),
          ),
        ],
        status: product?.status ?? 'draft',
        createdAt: product?.createdAt ?? new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el producto.');
    }
  }
  return (
    <Dialog title={product ? 'Editar producto' : 'Nuevo producto'} onClose={onClose}>
      <form className={styles.form} onSubmit={submit}>
        <p className={styles.muted}>
          Los nuevos productos se guardan como borrador. Publícalos cuando estén listos.
        </p>
        <label>
          Nombre del producto
          <input
            autoFocus
            required
            maxLength={100}
            value={form.title}
            onChange={(e) => field('title', e.target.value)}
            placeholder="Ej. Chaqueta urbana oversize"
          />
        </label>
        <label>
          Descripción
          <textarea
            rows={3}
            maxLength={2000}
            value={form.description}
            onChange={(e) => field('description', e.target.value)}
            placeholder="Material, tallas, colores y detalles para tu comprador"
          />
        </label>
        <div className={styles.formGrid}>
          <label>
            Categoría
            <select value={form.category} onChange={(e) => field('category', e.target.value)}>
              {CATEGORIES.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <label>
            SKU (opcional)
            <input
              maxLength={40}
              value={form.sku}
              onChange={(e) => field('sku', e.target.value)}
              placeholder="MOD-001"
            />
          </label>
        </div>
        <div className={styles.formGrid}>
          <label>
            Precio en Bs.
            <input
              required
              inputMode="decimal"
              value={form.price}
              onChange={(e) => field('price', e.target.value)}
              placeholder="185.00"
            />
          </label>
          <label>
            Unidades disponibles
            <input
              required
              type="number"
              min={0}
              max={99999}
              step={1}
              value={form.stock}
              onChange={(e) => field('stock', e.target.value)}
            />
          </label>
        </div>
        <label>
          URL de imagen (opcional)
          <input
            type="url"
            maxLength={1500}
            value={form.imageUrl}
            onChange={(e) => field('imageUrl', e.target.value)}
            placeholder="https://…"
          />
          <small>
            Usa una imagen pública en HTTPS. Sin imagen mostraremos un icono de categoría.
          </small>
        </label>
        <label>
          Etiquetas (opcional)
          <input
            maxLength={250}
            value={form.tags}
            onChange={(e) => field('tags', e.target.value)}
            placeholder="urbano, denim, unisex"
          />
          <small>Hasta 8 etiquetas de 30 caracteres, separadas por comas.</small>
        </label>
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className={styles.primary}>
            Guardar {product ? 'cambios' : 'borrador'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
