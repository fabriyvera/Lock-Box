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
