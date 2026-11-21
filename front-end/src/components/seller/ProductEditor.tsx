"use client";

import { useRef, useState, type FormEvent } from "react";
import { useUnsavedChanges } from "@/components/workspace/useUnsavedChanges";
import { CATEGORIES, type SellerProduct } from "@/lib/seller/model";
import { parsePrice } from "@/lib/seller/domain";
import Dialog from "./Dialog";
import styles from "./seller.module.css";

export default function ProductEditor({
  product,
  onSave,
  onClose,
}: {
  product: SellerProduct | null;
  onSave: (product: SellerProduct) => Promise<void>;
  onClose: () => void;
}) {
  const [initialForm] = useState({
    title: product?.title ?? "",
    description: product?.description ?? "",
    category: product?.category ?? "Moda",
    price: product ? (product.priceCents / 100).toFixed(2) : "",
    stock: String(product?.stock ?? 0),
    sku: product?.sku ?? "",
    imageUrl: product?.imageUrl ?? "",
    tags: product?.tags.join(", ") ?? "",
  });
  const [form, setForm] = useState(initialForm);
  const confirmDiscard = useUnsavedChanges(
    JSON.stringify(form) !== JSON.stringify(initialForm),
  );
  function close() {
    if (confirmDiscard()) onClose();
  }
  const [error, setError] = useState("");
  const [invalidField, setInvalidField] = useState<"price" | "stock" | null>(
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const [identity] = useState(() => ({
    id: product?.id ?? crypto.randomUUID(),
    createdAt: product?.createdAt ?? new Date().toISOString(),
  }));
  const field = (name: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [name]: value }));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setInvalidField(null);
    let priceCents: number;
    try {
      priceCents = parsePrice(form.price);
    } catch (err) {
      setInvalidField("price");
      setError(err instanceof Error ? err.message : "Revisa el precio.");
      formRef.current
        ?.querySelector<HTMLInputElement>('[name="price"]')
        ?.focus();
      return;
    }
    if (!/^\d+$/.test(form.stock)) {
      setInvalidField("stock");
      setError("El stock debe ser un número entero positivo o cero.");
      formRef.current
        ?.querySelector<HTMLInputElement>('[name="stock"]')
        ?.focus();
      return;
    }
    try {
      await onSave({
        id: identity.id,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        priceCents,
        stock: Number(form.stock),
        sku: form.sku.trim(),
        imageUrl: form.imageUrl.trim(),
        tags: [
          ...new Set(
            form.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean),
          ),
        ],
        status: product?.status ?? "draft",
        createdAt: identity.createdAt,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo guardar el producto.",
      );
      requestAnimationFrame(() => errorRef.current?.focus());
    }
  }
  return (
    <Dialog
      title={product ? "Editar producto" : "Nuevo producto"}
      onClose={close}
    >
      <form ref={formRef} className={styles.form} onSubmit={submit}>
        <p className={styles.muted}>
          Los nuevos productos se guardan como borrador. Publícalos cuando estén
          listos.
        </p>
        <label>
          Nombre del producto
          <input
            autoComplete="off"
            name="title"
            required
            maxLength={100}
            value={form.title}
            onChange={(e) => field("title", e.target.value)}
            placeholder="Ej. Chaqueta urbana oversize"
          />
        </label>
        <label>
          Descripción
          <textarea
            autoComplete="off"
            name="description"
            rows={3}
            maxLength={2000}
            value={form.description}
            onChange={(e) => field("description", e.target.value)}
            placeholder="Material, tallas, colores y detalles para tu comprador"
          />
        </label>
        <div className={styles.formGrid}>
          <label>
            Categoría
            <select
              name="category"
              value={form.category}
              onChange={(e) => field("category", e.target.value)}
            >
              {CATEGORIES.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <label>
            SKU (opcional)
            <input
              autoComplete="off"
              name="sku"
              maxLength={40}
              value={form.sku}
              onChange={(e) => field("sku", e.target.value)}
              placeholder="MOD-001"
            />
          </label>
        </div>
        <div className={styles.formGrid}>
          <label>
            Precio en Bs.
            <input
              autoComplete="off"
              name="price"
              aria-invalid={invalidField === "price" || undefined}
              aria-describedby={
                invalidField === "price" ? "product-price-error" : undefined
              }
              required
              inputMode="decimal"
              value={form.price}
              onChange={(e) => field("price", e.target.value)}
              placeholder="185.00"
            />
            {invalidField === "price" && (
              <small id="product-price-error" role="alert">
                {error}
              </small>
            )}
          </label>
          <label>
            Unidades disponibles
            <input
              autoComplete="off"
              name="stock"
              aria-invalid={invalidField === "stock" || undefined}
              aria-describedby={
                invalidField === "stock" ? "product-stock-error" : undefined
              }
              required
              type="number"
              min={0}
              max={99999}
              step={1}
              value={form.stock}
              onChange={(e) => field("stock", e.target.value)}
            />
            {invalidField === "stock" && (
              <small id="product-stock-error" role="alert">
                {error}
              </small>
            )}
          </label>
        </div>
        <label>
          URL de imagen (opcional)
          <input
            autoComplete="off"
            name="imageUrl"
            type="url"
            maxLength={1500}
            value={form.imageUrl}
            onChange={(e) => field("imageUrl", e.target.value)}
            placeholder="https://…"
          />
          <small>
            Usa una imagen pública en HTTPS. Sin imagen mostraremos un icono de
            categoría.
          </small>
        </label>
        <label>
          Etiquetas (opcional)
          <input
            autoComplete="off"
            name="tags"
            maxLength={250}
            value={form.tags}
            onChange={(e) => field("tags", e.target.value)}
            placeholder="urbano, denim, unisex"
          />
          <small>
            Hasta 8 etiquetas de 30 caracteres, separadas por comas.
          </small>
        </label>
        {error && !invalidField && (
          <p ref={errorRef} tabIndex={-1} role="alert" className={styles.error}>
            {error}
          </p>
        )}
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={close}>
            Cancelar
          </button>
          <button type="submit" className={styles.primary}>
            Guardar {product ? "cambios" : "borrador"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
