/**
 * Obralia - Biblioteca de partidas - Zod Schemas (Sesión 2)
 */

import { z } from 'zod'

const CAPITULO_VALUES = [
  'demolicion',
  'albanileria',
  'fontaneria',
  'electricidad',
  'pintura',
  'solado_alicatado',
  'carpinteria',
  'pladur_falsos_techos',
  'climatizacion',
  'cubiertas_fachadas',
  'sanitarios_griferia',
  'otros',
] as const

const UNIDAD_VALUES = ['m2', 'm3', 'ml', 'ud', 'h', 'kg', 'pa'] as const

export const capituloSistemaSchema = z.enum(CAPITULO_VALUES, {
  message: 'Capítulo no válido',
})

export const unidadSchema = z.enum(UNIDAD_VALUES, {
  message: 'Unidad no válida',
})

export const tipoIvaSchema = z.coerce
  .number()
  .refine((v): v is 0 | 4 | 10 | 21 => [0, 4, 10, 21].includes(v), {
    message: 'Tipo de IVA no válido',
  })

/** Forma completa de una partida en biblioteca (lo que viene de la BD) */
export const partidaBibliotecaSchema = z.object({
  id: z.string().uuid(),
  empresa_id: z.string().uuid().nullable(),
  origen: z.enum(['sistema', 'empresa']),
  capitulo: capituloSistemaSchema,
  codigo: z.string().max(50).nullable().optional(),
  descripcion: z.string().min(3, 'La descripción es obligatoria').max(500),
  unidad: unidadSchema,
  precio_unitario_orientativo: z.coerce.number().min(0),
  tipo_iva_sugerido: tipoIvaSchema,
  tags: z.array(z.string().max(30)).default([]),
  notas: z.string().max(1000).nullable().optional(),
  activo: z.boolean(),
  origen_biblioteca_id: z.string().uuid().nullable().optional(),
})

/** Schema para crear una partida personal nueva */
export const crearPartidaSchema = z.object({
  capitulo: capituloSistemaSchema,
  codigo: z.string().max(50).optional().or(z.literal('')),
  descripcion: z.string().min(3, 'Mínimo 3 caracteres').max(500),
  unidad: unidadSchema,
  precio_unitario_orientativo: z.coerce
    .number()
    .min(0, 'El precio no puede ser negativo'),
  tipo_iva_sugerido: tipoIvaSchema.default(21),
  tags: z.array(z.string().max(30)).default([]),
  notas: z.string().max(1000).optional().or(z.literal('')),
})

export type CrearPartidaFormData = z.infer<typeof crearPartidaSchema>

/** Schema para editar una partida personal existente */
export const actualizarPartidaSchema = crearPartidaSchema.partial().extend({
  activo: z.boolean().optional(),
})

export type ActualizarPartidaFormData = z.infer<typeof actualizarPartidaSchema>

/** Parámetros de búsqueda en biblioteca */
export const buscarPartidasSchema = z.object({
  query: z.string().max(200).optional(),
  capitulo: capituloSistemaSchema.optional(),
  soloMias: z.boolean().optional(),
  limit: z.number().int().positive().max(100).default(30),
})

export type BuscarPartidasParams = z.infer<typeof buscarPartidasSchema>
