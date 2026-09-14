import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
  captchaToken: z.string().min(1, 'Token de verificación faltante'),
});

export type LoginInput = z.infer<typeof loginSchema>;