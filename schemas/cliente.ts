/**
 * Obralia - Cliente Zod Schemas
 */

import { z } from "zod";

/**
 * Schema for cliente CRUD forms.
 * Validates conditional fields based on tipo (particular vs empresa).
 */
export const TIPO_FISCAL_VALUES = [
  "particular",
  "autonomo",
  "empresa",
  "comunidad",
  "administracion",
] as const;

export const clienteSchema = z
  .object({
    tipo: z.enum(["particular", "empresa"], {
      message: "El tipo de cliente es obligatorio",
    }),
    tipo_fiscal: z.enum(TIPO_FISCAL_VALUES).default("particular"),
    aplica_retencion_irpf: z.boolean().default(false),
    aplica_isp_construccion: z.boolean().default(false),
    nombre: z.string().min(1, "El nombre es obligatorio").max(200),
    apellidos: z.string().max(200).optional().or(z.literal("")),
    razon_social: z.string().max(200).optional().or(z.literal("")),
    nif: z.string().max(20).optional().or(z.literal("")),
    email: z.string().email("Email no valido").optional().or(z.literal("")),
    telefono: z.string().max(20).optional().or(z.literal("")),
    direccion: z.string().max(300).optional().or(z.literal("")),
    codigo_postal: z
      .string()
      .regex(/^[0-9]{5}$/, "El codigo postal debe tener 5 digitos")
      .optional()
      .or(z.literal("")),
    municipio: z.string().max(100).optional().or(z.literal("")),
    provincia: z.string().max(100).optional().or(z.literal("")),
    // Comunidad de propietarios: presidente / administrador
    contacto_nombre: z.string().max(200).optional().or(z.literal("")),
    contacto_telefono: z.string().max(20).optional().or(z.literal("")),
    contacto_email: z
      .string()
      .email("Email no valido")
      .optional()
      .or(z.literal("")),
    administrador_nombre: z.string().max(200).optional().or(z.literal("")),
    administrador_email: z
      .string()
      .email("Email no valido")
      .optional()
      .or(z.literal("")),
    // Dirección de facturación distinta
    direccion_facturacion: z.string().max(300).optional().or(z.literal("")),
    cp_facturacion: z
      .string()
      .regex(/^[0-9]{5}$/, "El codigo postal debe tener 5 digitos")
      .optional()
      .or(z.literal("")),
    municipio_facturacion: z.string().max(100).optional().or(z.literal("")),
    provincia_facturacion: z.string().max(100).optional().or(z.literal("")),
    notas: z.string().max(2000).optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.tipo === "particular") {
        return !!data.apellidos && data.apellidos.trim().length > 0;
      }
      return true;
    },
    {
      message: "Los apellidos son obligatorios para clientes particulares",
      path: ["apellidos"],
    },
  )
  .refine(
    (data) => {
      if (data.tipo === "empresa") {
        return !!data.razon_social && data.razon_social.trim().length > 0;
      }
      return true;
    },
    {
      message: "La razon social es obligatoria para clientes empresa",
      path: ["razon_social"],
    },
  );

export type ClienteFormData = z.infer<typeof clienteSchema>;
