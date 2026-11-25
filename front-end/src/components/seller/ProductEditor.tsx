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
    variants: (product?.variants ?? []).map((v) => ({
      size: v.size,
      stock: String(v.stock),
    })),
  });
  const [form, setForm] = useState(initialForm);
  const confirmDiscard = useUnsavedChanges(
    JSON.stringify(form) !== JSON.stringify(initialForm),
  );
  function close() {
    if (!submitting.current && confirmDiscard()) onClose();
  }
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);
  const sizeSuggestions =
    form.category === "Calzado"
      ? Array.from({ length: 31 }, (_, i) => `EU ${i + 20}`)
      : form.category === "Pantalones"
        ? [
            "XS",
            "S",
            "M",
            "L",
            "XL",
            "XXL",
            "28",
            "30",
            "32",
            "34",
            "36",
            "38",
            "40",
            "42",
          ]
        : form.category === "Ropa infantil"
          ? [
              "0-3 M",
              "3-6 M",
              "6-12 M",
              "12-18 M",
              "2 A",
              "4 A",
              "6 A",
              "8 A",
              "10 A",
              "12 A",
            ]
          : ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "UNICA"];
  const variantStock = form.variants.reduce(
    (sum, v) => sum + (Number(v.stock) || 0),
    0,
  );
  function updateVariant(index: number, name: "size" | "stock", value: string) {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((v, i) =>
        i === index ? { ...v, [name]: value } : v,
      ),
    }));
  }
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
    if (submitting.current) return;
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
    if (!form.variants.length && !/^\d+$/.test(form.stock)) {
      setInvalidField("stock");
      setError("El stock debe ser un número entero positivo o cero.");
      formRef.current
        ?.querySelector<HTMLInputElement>('[name="stock"]')
        ?.focus();
      return;
    }
    const variants = form.variants.map((v) => ({
      size: v.size.trim().toUpperCase(),
      stock: Number(v.stock),
    }));
    if (
      variants.some(
        (v, i) =>
          !/^[A-Z0-9][A-Z0-9 ./-]{0,19}$/.test(v.size) ||
          !/^\d+$/.test(form.variants[i].stock) ||
          !Number.isSafeInteger(v.stock) ||
          v.stock < 0 ||
          v.stock > 99999,
      ) ||
      new Set(variants.map((v) => v.size)).size !== variants.length ||
      variantStock > 99999
    ) {
      setError(
        "Completa cada talla sin repetirla y usa cantidades enteras. Máximo total: 99999 unidades.",
      );
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    submitting.current = true;
    setSaving(true);
    try {
      await onSave({
        id: identity.id,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        priceCents,
        stock: variants.length ? variantStock : Number(form.stock),
        variants,
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
    } finally {
      submitting.current = false;
      setSaving(false);
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
            placeholder="Material, colores y detalles para tu comprador"
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
        <fieldset className={styles.sizeFieldset} disabled={saving}>
          <legend>Tallas y unidades</legend>
          <p className={styles.muted}>
            Añade cada talla disponible y su stock. En calzado indica el
            sistema, por ejemplo EU 38 o US 8. Sin tallas, usa el stock general.
          </p>
          <datalist id="product-size-suggestions">
            {sizeSuggestions.map((size) => (
              <option key={size} value={size} />
            ))}
          </datalist>
          {form.variants.map((variant, index) => (
            <div className={styles.sizeRow} key={index}>
              <label>
                Talla {index + 1}
                <input
                  aria-label={`Talla ${index + 1}`}
                  required
                  maxLength={20}
                  list="product-size-suggestions"
                  placeholder={sizeSuggestions[0]}
                  value={variant.size}
                  onChange={(e) => updateVariant(index, "size", e.target.value)}
                />
              </label>
              <label>
                Unidades
                <input
                  aria-label={`Unidades talla ${index + 1}`}
                  required
                  type="number"
                  min={0}
                  max={99999}
                  step={1}
                  value={variant.stock}
                  onChange={(e) =>
                    updateVariant(index, "stock", e.target.value)
                  }
                />
              </label>
              <button
                type="button"
                className={styles.secondary}
                aria-label={`Quitar talla ${index + 1}`}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    variants: current.variants.filter((_, i) => i !== index),
                  }))
                }
              >
                Quitar
              </button>
            </div>
          ))}
          <button
            type="button"
            className={styles.secondary}
            disabled={form.variants.length >= 40}
            onClick={() =>
              setForm((current) => ({
                ...current,
                variants: [...current.variants, { size: "", stock: "0" }],
              }))
            }
          >
            + Añadir talla
          </button>
          {form.variants.length > 0 && (
            <p role="status" className={styles.muted}>
              Stock total: {variantStock} unidades. El precio es el mismo para
              todas las tallas.
            </p>
          )}
        </fieldset>
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
            {form.variants.length
              ? "Stock total por tallas"
              : "Unidades disponibles"}
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
              readOnly={form.variants.length > 0}
              value={form.variants.length ? variantStock : form.stock}
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
          <button type="submit" className={styles.primary} disabled={saving}>
            {saving
              ? "Guardando…"
              : product
                ? "Guardar cambios"
                : "Guardar borrador"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
