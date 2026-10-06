import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types/database.js";
import type { Environment } from "./config/environment.js";
import { clientFactory } from "./services/supabase-client.js";
import { verifyTurnstileToken } from "./services/turnstile.service.js";
import { loginSchema } from "./schemas/auth.schema.js";
import { actionRequestSchema } from "./schemas/seller.schema.js";

export interface Dependencies {
  createClient: (token?: string) => SupabaseClient<Database>;
  verifyCaptcha: typeof verifyTurnstileToken;
}

function databaseError(
  res: Response,
  error: { code?: string; message?: string },
) {
  const status =
    error.code === "42501"
      ? 403
      : error.code === "23505"
        ? 409
        : ["22023", "22P02", "23514", "23502"].includes(error.code ?? "")
          ? 400
          : 500;
  res.status(status).json({
    message:
      status === 500
        ? "No se pudo consultar Supabase. Revisa la migración y la conexión."
        : error.message,
  });
}

export function createApp(
  config: Environment,
  overrides: Partial<Dependencies> = {},
) {
  const dependencies: Dependencies = {
    createClient: clientFactory(config),
    verifyCaptcha: verifyTurnstileToken,
    ...overrides,
  };
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ origin: config.FRONTEND_URL, credentials: true }));
  app.use(express.json({ limit: "64kb" }));
  app.get("/api/health", (_req, res) =>
    res.json({ status: "ok", timestamp: new Date().toISOString() }),
  );
  app.post("/api/auth/login", async (req, res, next) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ message: "Revisa correo, contraseña y captcha." });
        return;
      }
      if (!config.TURNSTILE_SECRET_KEY) {
        res.status(503).json({
          message:
            "Configura TURNSTILE_SECRET_KEY en el backend para iniciar sesión.",
        });
        return;
      }
      const { email, password, captchaToken } = parsed.data;
      const captcha = await dependencies.verifyCaptcha(
        config.TURNSTILE_SECRET_KEY,
        captchaToken,
        req.socket.remoteAddress,
      );
      if (!captcha.success) {
        res.status(400).json({ message: "Verificación de seguridad fallida." });
        return;
      }
      const client = dependencies.createClient();
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      });
      if (error || !data.session) {
        res.status(401).json({ message: "Credenciales inválidas." });
        return;
      }
      const { data: profile, error: profileError } = await client
        .from("profiles")
        .select("id,username,role,is_active,full_name")
        .eq("id", data.user.id)
        .single();
      if (profileError || !profile?.is_active) {
        res.status(403).json({
          message:
            "Tu perfil no está habilitado. Contacta al equipo de LockBox.",
        });
        return;
      }
      res.set("Cache-Control", "no-store").json({
        success: true,
        user: {
          id: profile.id,
          email: data.user.email,
          name: profile.full_name,
          role: profile.role,
        },
        session: data.session,
      });
    } catch (error) {
      next(error);
    }
  });
  const seller = express.Router();
  seller.use(async (req, res, next) => {
    try {
      const match = /^Bearer\s+(\S+)$/i.exec(req.headers.authorization ?? "");
      if (!match) {
        res
          .status(401)
          .json({ message: "Inicia sesión para acceder a tu tienda." });
        return;
      }
      const client = dependencies.createClient(match[1]);
      const { data, error } = await client.auth.getUser(match[1]);
      if (error || !data.user) {
        res.status(401).json({ message: "Sesión inválida o vencida." });
        return;
      }
      const { data: profile, error: profileError } = await client
        .from("profiles")
        .select("id,role,is_active")
        .eq("id", data.user.id)
        .single();
      if (profileError || profile?.role !== "vendedor" || !profile.is_active) {
        res.status(403).json({ message: "Se requiere un vendedor activo." });
        return;
      }
      res.locals.client = client;
      res.set("Cache-Control", "no-store");
      next();
    } catch (error) {
      next(error);
    }
  });
  seller.get("/state", async (_req, res, next) => {
    try {
      const client = res.locals.client as SupabaseClient<Database>;
      const { data, error } = await client.rpc("seller_state");
      if (error) {
        databaseError(res, error);
        return;
      }
      res.json({ state: data });
    } catch (error) {
      next(error);
    }
  });
  seller.post("/actions", async (req, res, next) => {
    try {
      const parsed = actionRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          message: "Acción de vendedor no válida.",
          errors: parsed.error.flatten().fieldErrors,
        });
        return;
      }
      const client = res.locals.client as SupabaseClient<Database>;
      const { error } = await client.rpc("seller_action", {
        action: parsed.data.action,
        request_id: parsed.data.requestId,
      });
      if (error) {
        databaseError(res, error);
        return;
      }
      // Mutations return only a receipt. Reads always run with the caller's RLS.
      res.json({ success: true, requestId: parsed.data.requestId });
    } catch (error) {
      next(error);
    }
  });
  app.use("/api/seller", seller);
  app.use((_req, res) =>
    res.status(404).json({ message: "Ruta no encontrada" }),
  );
  app.use(
    (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
      if (error instanceof SyntaxError) {
        res.status(400).json({ message: "JSON no válido" });
        return;
      }
      console.error(
        "Error de API:",
        error instanceof Error ? error.name : "Unknown",
      );
      res.status(500).json({ message: "Error interno del servidor" });
    },
  );
  return app;
}
