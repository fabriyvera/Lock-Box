import { Router } from "express";
import { z } from "zod";
import type { Dependencies } from "../create-app.js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/database.js";

const uuid = z.string().uuid();
export const buyerRequestSchema = z
  .object({
    requestId: uuid,
    action: z.discriminatedUnion("type", [
      z
        .object({
          type: z.literal("addToCart"),
          productId: uuid,
          quantity: z.number().int().min(1).max(99999),
        })
        .strict(),
      z
        .object({
          type: z.literal("setCartQuantity"),
          productId: uuid,
          quantity: z.number().int().min(0).max(99999),
        })
        .strict(),
      z.object({ type: z.literal("removeFromCart"), productId: uuid }).strict(),
      z.object({ type: z.literal("clearCart") }).strict(),
      z
        .object({
          type: z.literal("checkout"),
          pointId: uuid,
          paymentMethod: z.enum(["yape", "bcp"]),
        })
        .strict(),
      z.object({ type: z.literal("cancelOrder"), orderId: uuid }).strict(),
      z
        .object({
          type: z.literal("reviewOrder"),
          orderId: uuid,
          rating: z.number().int().min(1).max(5),
          comment: z.string().trim().min(1).max(1000),
        })
        .strict(),
      z
        .object({
          type: z.literal("openDispute"),
          orderId: uuid,
          reason: z.string().trim().min(1).max(160),
          description: z.string().trim().min(1).max(2000),
        })
        .strict(),
    ]),
  })
  .strict();

export function createBuyerRouter(
  dependencies: Pick<Dependencies, "createClient">,
) {
  const router = Router();
  router.use(async (req, res, next) => {
    res.set("Cache-Control", "no-store");
    try {
      const token = /^Bearer\s+(\S+)$/i.exec(
        req.headers.authorization ?? "",
      )?.[1];
      if (!token) {
        res.status(401).json({ message: "Inicia sesión." });
        return;
      }
      const client = dependencies.createClient(token);
      const { data, error } = await client.auth.getUser(token);
      if (error || !data.user) {
        res.status(401).json({ message: "Sesión inválida o vencida." });
        return;
      }
      const profile = await client
        .from("profiles")
        .select("id,role,is_active")
        .eq("id", data.user.id)
        .single();
      if (
        profile.error ||
        !profile.data?.is_active ||
        profile.data.role !== "comprador"
      ) {
        res.status(403).json({ message: "Se requiere un comprador activo." });
        return;
      }
      res.locals.client = client;
      next();
    } catch (error) {
      next(error);
    }
  });
  function failure(
    res: import("express").Response,
    error: { code?: string; message: string },
  ) {
    const status =
      error.code === "42501"
        ? 403
        : error.code === "P0002"
          ? 404
          : ["P0001", "23505"].includes(error.code ?? "")
            ? 409
            : ["22023", "22P02", "23514", "23502"].includes(error.code ?? "")
              ? 400
              : 500;
    res
      .status(status)
      .json({
        message:
          status === 500
            ? "No se pudo completar la operación del comprador."
            : error.message,
      });
  }
  router.get("/state", async (_req, res, next) => {
    try {
      const client = res.locals.client as SupabaseClient<Database>;
      const { data, error } = await client.rpc("buyer_state");
      if (error) {
        failure(res, error);
        return;
      }
      res.json({ state: data });
    } catch (error) {
      next(error);
    }
  });
  router.post("/actions", async (req, res, next) => {
    try {
      const parsed = buyerRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ message: "Acción de comprador no válida." });
        return;
      }
      const client = res.locals.client as SupabaseClient<Database>;
      const { data, error } = await client.rpc("buyer_action", {
        action: parsed.data.action,
        request_id: parsed.data.requestId,
      });
      if (error) {
        failure(res, error);
        return;
      }
      res.json({ result: data });
    } catch (error) {
      next(error);
    }
  });
  return router;
}
