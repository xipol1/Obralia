/**
 * Obralia - Biblioteca de partidas (Sesión 2 - ADR-002)
 *
 * Capa de acceso a datos para `partidas_biblioteca`. Búsqueda con ILIKE +
 * tags. Filtrado por capítulo del sistema. Soporta partidas de sistema
 * (empresa_id NULL) y propias de cada empresa.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { PartidaBiblioteca } from '@/types/domain'
import {
  type ActualizarPartidaFormData,
  type BuscarPartidasParams,
  type CrearPartidaFormData,
  actualizarPartidaSchema,
  buscarPartidasSchema,
  crearPartidaSchema,
} from '@/schemas/biblioteca'

type Client = SupabaseClient<Database>

interface BuscarOptions extends Partial<BuscarPartidasParams> {
  empresaId: string
}

/**
 * Busca partidas en la biblioteca aplicando filtros.
 *
 * - SELECT donde empresa_id IS NULL (sistema) OR empresa_id = empresaId.
 * - Si se pasa query: filtra descripcion ILIKE, codigo ILIKE o tags @> [query].
 * - Si se pasa capitulo: filtra por enum capitulo_sistema.
 * - Si soloMias: solo origen='empresa'.
 * - Ordena: 'empresa' primero, luego 'sistema', alfabético dentro de cada.
 */
export async function buscarPartidas(
  supabase: Client,
  opts: BuscarOptions,
): Promise<PartidaBiblioteca[]> {
  const params = buscarPartidasSchema.parse({
    query: opts.query,
    capitulo: opts.capitulo,
    soloMias: opts.soloMias,
    limit: opts.limit ?? 30,
  })

  let q = supabase
    .from('partidas_biblioteca')
    .select('*')
    .eq('activo', true)
    .limit(params.limit * 2) // pedimos más para ordenar nosotros mías-primero

  if (params.soloMias) {
    q = q.eq('empresa_id', opts.empresaId)
  } else {
    // sistema (NULL) o de mi empresa
    q = q.or(`empresa_id.is.null,empresa_id.eq.${opts.empresaId}`)
  }

  if (params.capitulo) {
    q = q.eq('capitulo', params.capitulo)
  }

  if (params.query && params.query.trim().length > 0) {
    const term = params.query.trim()
    const safe = term.replace(/[%_]/g, '\\$&')
    // Normalizamos en cliente igual que la columna generada `descripcion_norm`
    // (lowercase + sin acentos) para que la comparación encuentre tanto
    // "demolicion" como "Demolición".
    const norm = safe
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
    q = q.or(
      `descripcion_norm.ilike.%${norm}%,codigo.ilike.%${safe}%,tags.cs.{${term}}`,
    )
  }

  const { data, error } = await q
  if (error) throw new Error(`Error buscando partidas: ${error.message}`)

  const rows = (data ?? []) as PartidaBiblioteca[]
  // Ordenar: mías primero, luego alfabético
  return rows
    .sort((a, b) => {
      if (a.origen !== b.origen) return a.origen === 'empresa' ? -1 : 1
      return a.descripcion.localeCompare(b.descripcion, 'es')
    })
    .slice(0, params.limit)
}

/** Crea una partida personal nueva en la biblioteca de la empresa */
export async function crearPartidaPersonal(
  supabase: Client,
  empresaId: string,
  input: CrearPartidaFormData,
): Promise<PartidaBiblioteca> {
  const data = crearPartidaSchema.parse(input)

  const { data: row, error } = await supabase
    .from('partidas_biblioteca')
    .insert({
      empresa_id: empresaId,
      origen: 'empresa',
      capitulo: data.capitulo,
      codigo: data.codigo || null,
      descripcion: data.descripcion,
      unidad: data.unidad,
      precio_unitario_orientativo: data.precio_unitario_orientativo,
      tipo_iva_sugerido: data.tipo_iva_sugerido,
      tags: data.tags,
      notas: data.notas || null,
      activo: true,
    })
    .select('*')
    .single()

  if (error || !row) throw new Error(`Error creando partida: ${error?.message}`)
  return row as PartidaBiblioteca
}

/** Actualiza una partida personal de la empresa (RLS impide tocar las de sistema) */
export async function actualizarPartidaPersonal(
  supabase: Client,
  partidaId: string,
  input: ActualizarPartidaFormData,
): Promise<PartidaBiblioteca> {
  const data = actualizarPartidaSchema.parse(input)

  const patch: Record<string, unknown> = {}
  if (data.capitulo !== undefined) patch.capitulo = data.capitulo
  if (data.codigo !== undefined) patch.codigo = data.codigo || null
  if (data.descripcion !== undefined) patch.descripcion = data.descripcion
  if (data.unidad !== undefined) patch.unidad = data.unidad
  if (data.precio_unitario_orientativo !== undefined)
    patch.precio_unitario_orientativo = data.precio_unitario_orientativo
  if (data.tipo_iva_sugerido !== undefined) patch.tipo_iva_sugerido = data.tipo_iva_sugerido
  if (data.tags !== undefined) patch.tags = data.tags
  if (data.notas !== undefined) patch.notas = data.notas || null
  if (data.activo !== undefined) patch.activo = data.activo

  const { data: row, error } = await supabase
    .from('partidas_biblioteca')
    .update(patch as never)
    .eq('id', partidaId)
    .select('*')
    .single()

  if (error || !row) throw new Error(`Error actualizando partida: ${error?.message}`)
  return row as PartidaBiblioteca
}

/** Soft-delete: marca la partida como inactiva (preserva referencias en presupuestos) */
export async function eliminarPartidaPersonal(
  supabase: Client,
  partidaId: string,
): Promise<void> {
  const { error } = await supabase
    .from('partidas_biblioteca')
    .update({ activo: false })
    .eq('id', partidaId)

  if (error) throw new Error(`Error eliminando partida: ${error.message}`)
}

/**
 * Duplica una partida del sistema a la biblioteca de la empresa ("hacer mía").
 * Invoca la RPC duplicar_partida_a_empresa que valida membresía con SECURITY DEFINER.
 */
export async function duplicarPartidaSistema(
  supabase: Client,
  partidaId: string,
  empresaId: string,
): Promise<string> {
  const { data, error } = await supabase.rpc('duplicar_partida_a_empresa', {
    p_partida_id: partidaId,
    p_empresa_id: empresaId,
  })

  if (error) throw new Error(`Error duplicando partida: ${error.message}`)
  if (!data) throw new Error('La RPC no devolvió un ID')
  return data as string
}

/** Lee una partida concreta (de sistema o propia, RLS gestiona acceso) */
export async function obtenerPartida(
  supabase: Client,
  partidaId: string,
): Promise<PartidaBiblioteca | null> {
  const { data, error } = await supabase
    .from('partidas_biblioteca')
    .select('*')
    .eq('id', partidaId)
    .maybeSingle()

  if (error) throw new Error(`Error leyendo partida: ${error.message}`)
  return (data as PartidaBiblioteca | null) ?? null
}
