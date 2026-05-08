/**
 * Obralia - Presupuesto Zod Schemas
 *
 * Sesión 2: añade soporte para capítulos y referencia opcional a biblioteca.
 */

import { z } from 'zod'
import { capituloSistemaSchema, tipoIvaSchema, unidadSchema } from './biblioteca'

/**
 * Schema para una partida del presupuesto.
 * partida_biblioteca_id es opcional: si la partida vino del catálogo, lo guarda
 * como referencia (con on delete set null en BD); siempre se copia el snapshot
 * de descripción/precio/IVA/unidad para preservar el documento histórico.
 */
export const partidaSchema = z.object({
  descripcion: z.string().min(1, 'La descripción es obligatoria').max(1000),
  unidad: unidadSchema,
  cantidad: z.coerce.number().positive('La cantidad debe ser mayor que 0'),
  precio_unitario: z.coerce.number().min(0, 'El precio no puede ser negativo'),
  tipo_iva: tipoIvaSchema,
  partida_biblioteca_id: z.string().uuid().optional().nullable(),
})

export type PartidaFormData = z.infer<typeof partidaSchema>

/**
 * Schema para un capítulo dentro de un presupuesto.
 * El nombre es texto libre (el constructor lo edita); capitulo_sistema vincula
 * opcionalmente al enum del sistema para filtrado coherente.
 */
export const capituloSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().min(1, 'El nombre es obligatorio').max(200),
  capitulo_sistema: capituloSistemaSchema.optional().nullable(),
  partidas: z.array(partidaSchema).default([]),
})

export type CapituloFormData = z.infer<typeof capituloSchema>

/**
 * Schema completo del presupuesto.
 *
 * Acepta dos modos:
 *   - capitulos: nuevo modo, partidas agrupadas (Sesión 2+)
 *   - partidas: legacy plano (compatibilidad transitoria con código viejo)
 *
 * Al menos uno debe traer alguna partida.
 */
export const presupuestoSchema = z
  .object({
    cliente_id: z.string().uuid('Selecciona un cliente').optional().or(z.literal('')),
    titulo: z.string().min(1, 'El título es obligatorio').max(300),
    direccion_obra: z.string().max(300).optional().or(z.literal('')),
    tipo_iva_default: tipoIvaSchema.default(21),
    motivo_iva_reducido: z.string().max(500).optional().or(z.literal('')),
    notas_cliente: z.string().max(5000).optional().or(z.literal('')),
    notas_internas: z.string().max(5000).optional().or(z.literal('')),
    exclusiones: z.string().max(5000).optional().or(z.literal('')),
    forma_pago: z.string().max(500).optional().or(z.literal('')),
    plazo_ejecucion_dias: z.coerce.number().int().positive().optional().or(z.literal('')),
    garantia_meses: z.coerce.number().int().positive().optional().or(z.literal('')),
    // Retención IRPF: 0 (cliente particular), 7 (autónomo nuevo), 15 (general)
    retencion_pct: z.coerce.number().min(0).max(100).default(0),
    // Inversión sujeto pasivo en construcción (art. 84.Uno.2.f LIVA)
    inversion_sujeto_pasivo: z.boolean().default(false),
    motivo_isp: z.string().max(500).optional().or(z.literal('')),
    capitulos: z.array(capituloSchema).default([]),
  })
  .refine(
    (v) => v.capitulos.some((c) => c.partidas.length > 0),
    { message: 'Debe haber al menos una partida en algún capítulo', path: ['capitulos'] },
  )

export type PresupuestoFormData = z.infer<typeof presupuestoSchema>

/** Schema para la pantalla de envío por WhatsApp. */
export const presupuestoEnvioSchema = z.object({
  mensaje: z.string().min(1, 'El mensaje es obligatorio').max(5000),
})

export type PresupuestoEnvioFormData = z.infer<typeof presupuestoEnvioSchema>
