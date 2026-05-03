/**
 * Obralia - Empresa Zod Schemas
 */

import { z } from "zod";

/**
 * Spanish NIF/CIF validation regex.
 * Matches:
 * - NIF: 8 digits + letter (e.g. 12345678A)
 * - NIE: X/Y/Z + 7 digits + letter (e.g. X1234567A)
 * - CIF: letter + 8 alphanumeric chars (e.g. B12345678)
 */
const nifCifRegex = /^([0-9]{8}[A-Z]|[XYZ][0-9]{7}[A-Z]|[A-Z][0-9]{7}[A-Z0-9])$/;

/**
 * Schema for empresa onboarding form.
 */
export const empresaSchema = z.object({
  razon_social: z
    .string()
    .min(1, "La razon social es obligatoria")
    .max(200, "Maximo 200 caracteres"),
  nif: z
    .string()
    .min(1, "El NIF/CIF es obligatorio")
    .regex(nifCifRegex, "NIF/CIF no valido")
    .transform((v) => v.toUpperCase()),
  nombre_comercial: z.string().max(200).optional(),
  direccion: z.string().max(300).optional(),
  codigo_postal: z
    .string()
    .regex(/^[0-9]{5}$/, "El codigo postal debe tener 5 digitos")
    .optional()
    .or(z.literal("")),
  municipio: z.string().max(100).optional(),
  provincia: z.string().max(100).optional(),
  email: z
    .string()
    .email("Email no valido")
    .optional()
    .or(z.literal("")),
  telefono: z.string().max(20).optional().or(z.literal("")),
  web: z.string().max(200).optional().or(z.literal("")),
});

export type EmpresaFormData = z.infer<typeof empresaSchema>;

/**
 * Schema for empresa settings update.
 * All fields optional since partial updates are allowed.
 */
export const empresaUpdateSchema = z.object({
  razon_social: z.string().min(1, "La razon social es obligatoria").max(200).optional(),
  nif: z
    .string()
    .regex(nifCifRegex, "NIF/CIF no valido")
    .transform((v) => v.toUpperCase())
    .optional(),
  nombre_comercial: z.string().max(200).optional().or(z.literal("")),
  direccion: z.string().max(300).optional().or(z.literal("")),
  codigo_postal: z
    .string()
    .regex(/^[0-9]{5}$/, "El codigo postal debe tener 5 digitos")
    .optional()
    .or(z.literal("")),
  municipio: z.string().max(100).optional().or(z.literal("")),
  provincia: z.string().max(100).optional().or(z.literal("")),
  email: z.string().email("Email no valido").optional().or(z.literal("")),
  telefono: z.string().max(20).optional().or(z.literal("")),
  web: z.string().max(200).optional().or(z.literal("")),
  iban: z.string().max(34).optional().or(z.literal("")),
  regimen_fiscal: z.enum(["estimacion_directa", "estimacion_objetiva"]).optional(),
});

export type EmpresaUpdateFormData = z.infer<typeof empresaUpdateSchema>;
