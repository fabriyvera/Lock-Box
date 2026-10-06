import "dotenv/config";
import { parseEnvironment } from "./environment.js";

export const env = (() => {
  try {
    return parseEnvironment(process.env);
  } catch {
    console.error(
      "Configura back-end/.env: SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY (o SUPABASE_ANON_KEY). Revisa también PORT y FRONTEND_URL.",
    );
    process.exit(1);
  }
})();
