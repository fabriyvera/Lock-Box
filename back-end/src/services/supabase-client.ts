import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database.js";
import type { Environment } from "../config/environment.js";

// A separate client for every request keeps user sessions isolated. RLS uses
// the caller's verified JWT; this API needs no service_role or secret key.
export function clientFactory(config: Environment) {
  return (accessToken?: string) =>
    createClient<Database>(config.SUPABASE_URL, config.SUPABASE_PUBLIC_KEY, {
      global: {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        fetch: (input, init) =>
          fetch(input, {
            ...init,
            signal: init?.signal ?? AbortSignal.timeout(15000),
          }),
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
}
export function getAdminClient() {
  const url = process.env.SUPABASE_URL as string;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  
  if (!serviceKey) {
    console.error("Falta SUPABASE_SERVICE_ROLE_KEY en el .env");
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      persistSession: false,
    },
  });
}
