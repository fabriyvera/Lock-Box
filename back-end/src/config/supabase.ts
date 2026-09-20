import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

/**
 * Cliente público: respeta las políticas RLS.
 * Úsalo para operaciones en nombre de un usuario (con su JWT).
 */
export const supabasePublic = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Cliente admin: BYPASSA RLS. Solo para operaciones del servidor.
 * ⚠️ Nunca exponer al cliente.
 */
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Crea un cliente que actúa en nombre de un usuario específico,
 * pasando su JWT. Ideal para endpoints autenticados.
 */
export function supabaseAsUser(accessToken: string) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}