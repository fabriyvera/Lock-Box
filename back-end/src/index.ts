import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

// ─── Rutas ───
app.use('/api', routes);

// ─── Manejo de errores ───
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Arranque ───
app.listen(env.PORT, () => {
  console.log(`   Backend corriendo en http://localhost:${env.PORT}`);
  console.log(`   Entorno: ${env.NODE_ENV}`);
  console.log(`   Frontend permitido: ${env.FRONTEND_URL}`);
});