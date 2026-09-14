import { Request, Response } from 'express';
import { verifyTurnstileToken } from '../services/turnstile.service.js';
import type { LoginInput } from '../schemas/auth.schema.js';

export async function loginController(req: Request, res: Response) {
  const { email, password, captchaToken } = req.body as LoginInput;

  const remoteIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress;

  const result = await verifyTurnstileToken(captchaToken, remoteIp);

  if (!result.success) {
    console.warn('Turnstile falló:', result.errorCodes);
    return res.status(400).json({
      message: 'Verificación de seguridad fallida. Intenta de nuevo.',
      errors: result.errorCodes,
    });
  }

  // TODO: Aquí va la lógica real de login (DB, bcrypt, JWT)
  const fakeUser = {
    id: 'usr_' + Math.random().toString(36).slice(2, 10),
    email,
    name: email.split('@')[0],
  };

  return res.status(200).json({
    success: true,
    message: 'Login exitoso',
    user: fakeUser,
    token: 'fake-jwt-' + Date.now(),
  });
}