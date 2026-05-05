/**
 * Obralia - Auth Zod Schemas
 */

import { z } from "zod";

/**
 * Spanish phone number regex.
 * Matches:
 * - 9 digits starting with 6, 7, 8, or 9 (e.g. 612345678)
 * - With +34 prefix (e.g. +34612345678)
 * - With optional spaces/dashes for readability
 */
const telefonoEspanolRegex = /^(\+34)?[\s-]?[6-9][0-9]{8}$/;

/**
 * Schema for phone number input (login step 1).
 */
export const telefonoSchema = z.object({
  telefono: z
    .string()
    .min(1, "El telefono es obligatorio")
    .transform((v) => v.replace(/[\s-]/g, ""))
    .pipe(
      z.string().regex(telefonoEspanolRegex, "Telefono espanol no valido (9 digitos o con prefijo +34)"),
    ),
});

export type TelefonoFormData = z.infer<typeof telefonoSchema>;

/**
 * Schema for OTP verification (login step 2).
 */
export const otpSchema = z.object({
  telefono: z
    .string()
    .min(1, "El telefono es obligatorio")
    .transform((v) => v.replace(/[\s-]/g, ""))
    .pipe(
      z.string().regex(telefonoEspanolRegex, "Telefono no valido"),
    ),
  token: z
    .string()
    .length(6, "El codigo debe tener 6 digitos")
    .regex(/^[0-9]{6}$/, "El codigo debe ser numerico"),
});

export type OtpFormData = z.infer<typeof otpSchema>;

/**
 * Login con email + contraseña (sin SMS).
 */
export const emailPasswordSchema = z.object({
  email: z.string().min(1, "El email es obligatorio").email("Email no válido"),
  password: z
    .string()
    .min(6, "Mínimo 6 caracteres")
    .max(72, "Máximo 72 caracteres"),
});

export type EmailPasswordFormData = z.infer<typeof emailPasswordSchema>;
