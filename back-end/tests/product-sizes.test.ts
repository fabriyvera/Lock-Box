import { test } from "node:test";
import assert from "node:assert/strict";
import { actionRequestSchema } from "../src/schemas/seller.schema.js";
import { buyerRequestSchema } from "../src/routes/buyer.js";

const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const product = {
  id,
  title: "Zapato",
  description: "",
  category: "Calzado",
  priceCents: 15000,
  stock: 5,
  sku: "",
  imageUrl: "",
  tags: [],
  status: "draft",
  createdAt: new Date().toISOString(),
  variants: [
    { size: "EU 38", stock: 2 },
    { size: "EU 39", stock: 3 },
  ],
};
const parse = (p: unknown) =>
  actionRequestSchema.safeParse({
    requestId: id,
    action: { type: "saveProduct", product: p },
  });
test("product schema accepts categories and sizes, normalizes size labels", () => {
  for (const category of [
    "Calzado",
    "Camisas",
    "Pantalones",
    "Ropa infantil",
    "Deportes",
    "Moda",
    "Hogar",
  ])
    assert.equal(parse({ ...product, category }).success, true);
  const result = parse({ ...product, variants: [{ size: " m ", stock: 5 }] });
  assert.equal(result.success, true);
  if (result.success && result.data.action.type === "saveProduct")
    assert.equal(result.data.action.product.variants?.[0].size, "M");
  const { variants: _, ...legacy } = product;
  assert.equal(parse(legacy).success, true);
});
test("product schema rejects duplicate, malformed and inconsistent per-size inventory", () => {
  for (const variants of [
    [
      { size: "M", stock: 2 },
      { size: " m ", stock: 3 },
    ],
    [{ size: "", stock: 5 }],
    [{ size: "M", stock: -1 }],
    [{ size: "M", stock: 1.5 }],
    [{ size: "M", stock: 4 }],
    [{ size: "M", stock: 5, price: 0 }],
    Array.from({ length: 41 }, (_, i) => ({ size: String(i), stock: 0 })),
  ])
    assert.equal(parse({ ...product, variants }).success, false);
});
test("buyer requests carry selected size without accepting client inventory or prices", () => {
  for (const type of ["addToCart", "setCartQuantity", "removeFromCart"]) {
    const action = {
      type,
      productId: id,
      size: "EU 38",
      ...(type !== "removeFromCart" ? { quantity: 1 } : {}),
    };
    assert.equal(
      buyerRequestSchema.safeParse({ requestId: id, action }).success,
      true,
    );
    assert.equal(
      buyerRequestSchema.safeParse({
        requestId: id,
        action: { ...action, stock: 99 },
      }).success,
      false,
    );
    assert.equal(
      buyerRequestSchema.safeParse({
        requestId: id,
        action: { ...action, size: "X".repeat(21) },
      }).success,
      false,
    );
  }
});
