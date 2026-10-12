import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
  captchaToken: z.string().min(1, "Token de verificación faltante"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((value) => value.toLowerCase()),
    password: z.string().min(8).max(128),
    fullName: z.string().trim().min(2).max(80),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9._]{3,30}$/)
      .refine((value) => !/^\.|\.$|\.\.|__/.test(value), "Usuario inválido"),
    phone: z
      .string()
      .regex(
        /^[0-9]{8}$/,
        "El celular debe tener exactamente 8 dígitos, sin código de país",
      )
      .transform((value) => `+591${value}`),
    role: z.enum(["comprador", "vendedor"]),
    storeName: z.string().trim().min(2).max(80).optional(),
    captchaToken: z.string().min(1).max(4096),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.role === "vendedor" && !value.storeName) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["storeName"],
        message: "Ingresa el nombre de tu tienda",
      });
    }
  });
