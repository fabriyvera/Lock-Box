import { Router } from "express";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "../types/database.js";
import type { Dependencies } from "../create-app.js";

const qrCode = z
  .string()
  .trim()
  .min(6)
  .max(160)
  .regex(/^[A-Za-z0-9_-]+$/);
const transition = z
  .object({ qrCode, status: z.enum(["in_lockbox", "ready", "delivered"]) })
  .strict();

export function createOrdersRouter(
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
      const { data: profile, error: profileError } = await client
        .from("profiles")
        .select("id,is_active")
        .eq("id", data.user.id)
        .single();
      if (profileError || !profile?.is_active) {
        res.status(403).json({ message: "Tu perfil no está habilitado." });
        return;
      }
      res.locals.client = client;
      next();
    } catch (error) {
      next(error);
    }
  });
  async function invoke(client: SupabaseClient<Database>, action: Json) {
    return client.rpc("collection_point_action", { action });
  }
  function statusFor(code?: string) {
    if (code === "42501") return 403;
    if (code === "P0002") return 404;
    if (code === "P0001") return 409;
    if (["22023", "22P02"].includes(code ?? "")) return 400;
    return 500;
  }
  function failure(
    error: { code?: string; message: string },
    fallback: string,
  ) {
    const status = statusFor(error.code);
    return { status, message: status === 500 ? fallback : error.message };
  }
  router.get("/state", async (_req, res, next) => {
    try {
      const { data, error } = await invoke(res.locals.client, {
        type: "state",
      });
      if (error) {
        const result = failure(error, "No se pudo cargar el punto de recojo.");
        res.status(result.status).json({ message: result.message });
        return;
      }
      res.json({ state: data });
    } catch (error) {
      next(error);
    }
  });
  router.get("/scan/:qrCode", async (req, res, next) => {
    try {
      const parsed = qrCode.safeParse(req.params.qrCode);
      if (!parsed.success) {
        res.status(400).json({ message: "Código QR no válido." });
        return;
      }
      const { data, error } = await invoke(res.locals.client, {
        type: "scan",
        qrCode: parsed.data,
      });
      if (error) {
        const result = failure(error, "No se pudo consultar el pedido.");
        res.status(result.status).json({ message: result.message });
        return;
      }
      res.json({ order: data });
    } catch (error) {
      next(error);
    }
  });
  router.patch("/:orderId/status", async (req, res, next) => {
    try {
      const id = z.string().uuid().safeParse(req.params.orderId);
      const parsed = transition.safeParse(req.body);
      if (!id.success || !parsed.success) {
        res.status(400).json({ message: "Pedido, código o estado no válido." });
        return;
      }
      const { data, error } = await invoke(res.locals.client, {
        type: "transition",
        orderId: id.data,
        ...parsed.data,
      });
      if (error) {
        const result = failure(error, "No se pudo registrar el cambio.");
        res.status(result.status).json({ message: result.message });
        return;
      }
      res.json({ order: data });
    } catch (error) {
      next(error);
    }
  });
  // Checkout in the source branch used fixed identities and client prices.
  // Do not create real orders until an atomic checkout/payment flow exists.
  router.post("/checkout", (_req, res) =>
    res
      .status(501)
      .json({ message: "El checkout real aún no está habilitado." }),
  );
  return router;
}
