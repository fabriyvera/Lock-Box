import { z } from "zod";

const schema = z
  .object({
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    FRONTEND_URL: z.string().url().default("http://localhost:3000"),
    TURNSTILE_SECRET_KEY: z.string().optional(),
    SUPABASE_URL: z.string().url(),
    SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
    SUPABASE_ANON_KEY: z.string().optional(),
  })
  .transform((value) => ({
    ...value,
    SUPABASE_PUBLIC_KEY:
      value.SUPABASE_PUBLISHABLE_KEY?.trim() ||
      value.SUPABASE_ANON_KEY?.trim() ||
      "",
  }))
  .refine((value) => !!value.SUPABASE_PUBLIC_KEY, {
    message: "Configura SUPABASE_PUBLISHABLE_KEY o SUPABASE_ANON_KEY",
    path: ["SUPABASE_PUBLISHABLE_KEY"],
  });

export function parseEnvironment(source: Record<string, string | undefined>) {
  return schema.parse(source);
}
export type Environment = ReturnType<typeof parseEnvironment>;
