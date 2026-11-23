import { Router } from "express";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Dependencies } from "../create-app.js";
import type { Database } from "../types/database.js";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
});
const period = z.object({ from: date, to: date, includeTests: z.enum(["true", "false"]).default("false") }).strict()
  .refine(({ from, to }) => {
    const days = (Date.parse(to) - Date.parse(from)) / 86400000;
    return days >= 0 && days <= 365;
  });
const change = z.object({ entity: z.enum(["profile", "point"]), id: z.string().uuid(), active: z.boolean() }).strict();

export function createAdminRouter(dependencies: Pick<Dependencies, "createClient">) {
  const router = Router();
  router.use(async (req, res, next) => {
    res.set("Cache-Control", "no-store");
    try {
      const token = /^Bearer\s+(\S+)$/i.exec(req.headers.authorization ?? "")?.[1];
      if (!token) { res.status(401).json({ message: "Inicia sesión." }); return; }
      const client = dependencies.createClient(token);
      const { data, error } = await client.auth.getUser(token);
      if (error || !data.user) { res.status(401).json({ message: "Sesión inválida o vencida." }); return; }
      const profile = await client.from("profiles").select("id,role,is_active").eq("id", data.user.id).single();
      if (profile.error || profile.data?.role !== "admin" || !profile.data.is_active) {
        res.status(403).json({ message: "Se requiere un administrador activo." }); return;
      }
      res.locals.client = client;
      next();
    } catch (error) { next(error); }
  });
  function failure(res: import("express").Response, error: { code?: string; message: string }) {
    const status = error.code === "42501" ? 403 : error.code === "P0002" ? 404 : error.code === "P0001" ? 409 : ["22023", "22P02"].includes(error.code ?? "") ? 400 : 500;
    res.status(status).json({ message: status === 500 ? "No se pudo completar la operación administrativa." : error.message });
  }
  router.get("/state", async (req, res, next) => {
    try {
      const parsed = period.safeParse(req.query);
      if (!parsed.success) { res.status(400).json({ message: "Selecciona fechas válidas y un periodo de hasta 366 días." }); return; }
      const client = res.locals.client as SupabaseClient<Database>;
      const { data, error } = await client.rpc("admin_state", { p_start: parsed.data.from, p_end: parsed.data.to, p_include_tests: parsed.data.includeTests === "true" });
      if (error) { failure(res, error); return; }
      res.json({ state: data });
    } catch (error) { next(error); }
  });
  router.post("/active", async (req, res, next) => {
    try {
      const parsed = change.safeParse(req.body);
      if (!parsed.success) { res.status(400).json({ message: "Selecciona el perfil o punto y su nuevo estado." }); return; }
      const client = res.locals.client as SupabaseClient<Database>;
      const { data, error } = await client.rpc("admin_set_active", { p_entity: parsed.data.entity, p_id: parsed.data.id, p_active: parsed.data.active });
      if (error) { failure(res, error); return; }
      res.json({ result: data });
    } catch (error) { next(error); }
  });
  return router;
}
