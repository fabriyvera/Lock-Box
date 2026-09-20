import { Router } from 'express';
import authRoutes from './auth.routes.js';
import { supabaseAdmin } from '../config/supabase.js';

const router = Router();

router.use('/auth', authRoutes);

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/supabase-test', async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }

    return res.json({ ok: true, message: 'Conectado a Supabase', data });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

export default router;