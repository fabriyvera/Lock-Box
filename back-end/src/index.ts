import { env } from "./config/env.js";
import { createApp } from "./app.js";
const app = createApp(env);

// ─── Arranque ───
app.listen(env.PORT, () => {
  console.log(`   Backend corriendo en http://localhost:${env.PORT}`);
  console.log(`   Entorno: ${env.NODE_ENV}`);
  console.log(`   Frontend permitido: ${env.FRONTEND_URL}`);
});
