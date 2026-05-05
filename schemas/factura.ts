/**
 * Obralia - Facturas OCR - Zod Schemas
 *
 * Define el contrato para:
 *  - Upload de facturas (validación de archivo)
 *  - Salida estructurada del LLM (extracción de cabecera y líneas)
 *  - Forma persistida en BD
 */

import { z } from 'zod'

export const ESTADO_FACTURA_VALUES = [
  'pendiente',
  'procesando',
  'procesada',
  'error',
] as const

export type EstadoFactura = (typeof ESTADO_FACTURA_VALUES)[number]

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const

export const MAX_FACTURA_BYTES = 20 * 1024 * 1024 // 20 MB

/** Validación al subir un archivo */
export const subirFacturaSchema = z.object({
  filename: z.string().min(1).max(200),
  mime_type: z.enum(ALLOWED_MIME_TYPES, {
    message: 'Formato no admitido (PDF, JPG, PNG o WEBP)',
  }),
  size_bytes: z.number().int().positive().max(MAX_FACTURA_BYTES),
})

export type SubirFacturaInput = z.infer<typeof subirFacturaSchema>

/**
 * Esquema de la salida del LLM. Es el contrato que el modelo debe respetar.
 * Mantenemos campos opcionales/null porque las facturas reales no siempre
 * tienen todos los datos legibles.
 */
export const facturaExtraidaLineaSchema = z.object({
  codigo_articulo: z.string().nullable(),
  descripcion: z.string().min(1),
  cantidad: z.number().nullable(),
  unidad: z.string().nullable(),
  precio_unitario: z.number().nullable(),
  importe_linea: z.number().nullable(),
  tipo_iva: z.union([z.literal(0), z.literal(4), z.literal(10), z.literal(21)]).nullable(),
})

export type FacturaExtraidaLinea = z.infer<typeof facturaExtraidaLineaSchema>

export const facturaExtraidaSchema = z.object({
  proveedor_nombre: z.string().nullable(),
  proveedor_nif: z.string().nullable(),
  numero_factura: z.string().nullable(),
  fecha_factura: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD')
    .nullable(),
  total_sin_iva: z.number().nullable(),
  total_iva: z.number().nullable(),
  total_con_iva: z.number().nullable(),
  moneda: z.string().nullable(),
  lineas: z.array(facturaExtraidaLineaSchema).max(500),
})

export type FacturaExtraida = z.infer<typeof facturaExtraidaSchema>
