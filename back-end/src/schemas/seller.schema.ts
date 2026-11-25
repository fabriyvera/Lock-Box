import { z } from "zod";

const uuid = z.string().uuid();
const at = z.string().datetime({ offset: true });
const status = z.enum(["draft", "published", "paused", "archived"]);
const product = z
  .object({
    id: uuid,
    title: z.string().trim().min(1).max(100),
    description: z.string().max(2000),
    category: z.enum([
      "Moda",
      "Calzado",
      "Camisas",
      "Pantalones",
      "Ropa infantil",
      "Deportes",

      "Tecnología",
      "Hogar",
      "Belleza",
      "Accesorios",
      "Otros",
    ]),
    priceCents: z.number().int().min(1).max(999999999),
    stock: z.number().int().min(0).max(99999),
    variants: z
      .array(
        z
          .object({
            size: z
              .string()
              .trim()
              .toUpperCase()
              .regex(/^[A-Z0-9][A-Z0-9 ./-]{0,19}$/),
            stock: z.number().int().min(0).max(99999),
          })
          .strict(),
      )
      .max(40)
      .optional(),
    sku: z.string().trim().max(40),
    imageUrl: z.union([
      z.literal(""),
      z.string().url().startsWith("https://").max(1500),
    ]),
    tags: z.array(z.string().trim().min(1).max(30)).max(8),
    status,
    createdAt: at,
  })
  .strict()
  .superRefine((value, ctx) => {
    const variants = value.variants ?? [];
    if (new Set(variants.map((v) => v.size)).size !== variants.length)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["variants"],
        message: "Tallas duplicadas.",
      });
    if (
      variants.length &&
      variants.reduce((sum, v) => sum + v.stock, 0) !== value.stock
    )
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["stock"],
        message: "Stock por talla inconsistente.",
      });
  });
const profile = z
  .object({
    storeName: z.string().trim().min(2).max(80),
    bio: z.string().max(500),
    handle: z
      .string()
      .regex(/^[a-z0-9._]{3,30}$/)
      .refine((value) => !/^\.|\.$|\.\.|__/.test(value)),
  })
  .strict();
export const actionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("saveProduct"), product }).strict(),
  z.object({ type: z.literal("setProductStatus"), id: uuid, status }).strict(),
  z
    .object({
      type: z.literal("startLive"),
      id: uuid,
      title: z.string().trim().min(1).max(100),
      productIds: z.array(uuid).min(1).max(50),
      at,
    })
    .strict(),
  z.object({ type: z.literal("endLive"), at }).strict(),
  z.object({ type: z.literal("dispatchOrder"), id: uuid, at }).strict(),
  z
    .object({
      type: z.literal("changePlan"),
      plan: z.enum(["emprende", "pro"]),
    })
    .strict(),
  z.object({ type: z.literal("saveProfile"), profile }).strict(),
  z.object({ type: z.literal("requestPayout"), id: uuid, at }).strict(),
]);
export const actionRequestSchema = z
  .object({ action: actionSchema, requestId: uuid })
  .strict();
