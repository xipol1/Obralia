/**
 * Obralia - Plantillas de obra (Sesión 2 - ADR-002)
 *
 * Capa de acceso a datos para plantillas de presupuesto en BD.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { PlantillaCompleta, PlantillaObra } from '@/types/domain'

type Client = SupabaseClient<Database>

/** Resumen de plantilla con counts de capítulos y partidas (para tarjetas) */
export interface PlantillaResumen extends PlantillaObra {
  num_capitulos: number
  num_partidas: number
  total_estimado: number
}

/**
 * Lista plantillas disponibles para una empresa: las del sistema (empresa_id NULL)
 * + las propias de la empresa. Ordenadas: sistema primero por orden, luego propias.
 */
export async function listarPlantillas(
  supabase: Client,
  empresaId: string,
): Promise<PlantillaResumen[]> {
  const { data: plantillas, error: errPl } = await supabase
    .from('plantillas_obra')
    .select('*')
    .eq('activa', true)
    .or(`empresa_id.is.null,empresa_id.eq.${empresaId}`)
    .order('orden', { ascending: true })

  if (errPl) throw new Error(`Error listando plantillas: ${errPl.message}`)

  const ids = (plantillas ?? []).map((p) => p.id)
  if (ids.length === 0) return []

  // Cargar todas las partidas en una sola query y agrupar
  const { data: partidas, error: errPa } = await supabase
    .from('plantilla_partidas')
    .select('plantilla_id,plantilla_capitulo_id,cantidad_sugerida,precio_unitario_orientativo')
    .in('plantilla_id', ids)

  if (errPa) throw new Error(`Error contando partidas: ${errPa.message}`)

  const stats = new Map<string, { num_capitulos: Set<string>; num_partidas: number; total: number }>()
  for (const id of ids) stats.set(id, { num_capitulos: new Set(), num_partidas: 0, total: 0 })

  for (const p of partidas ?? []) {
    const s = stats.get(p.plantilla_id)
    if (!s) continue
    s.num_partidas += 1
    if (p.plantilla_capitulo_id) s.num_capitulos.add(p.plantilla_capitulo_id)
    s.total += Number(p.cantidad_sugerida) * Number(p.precio_unitario_orientativo)
  }

  return (plantillas ?? []).map((p) => {
    const s = stats.get(p.id)!
    return {
      ...(p as PlantillaObra),
      num_capitulos: s.num_capitulos.size,
      num_partidas: s.num_partidas,
      total_estimado: Math.round(s.total * 100) / 100,
    }
  })
}

/** Carga una plantilla con sus capítulos y partidas */
export async function obtenerPlantilla(
  supabase: Client,
  plantillaId: string,
): Promise<PlantillaCompleta | null> {
  const { data: plantilla, error } = await supabase
    .from('plantillas_obra')
    .select('*, plantilla_capitulos(*), plantilla_partidas(*)')
    .eq('id', plantillaId)
    .maybeSingle()

  if (error) throw new Error(`Error leyendo plantilla: ${error.message}`)
  if (!plantilla) return null

  const raw = plantilla as PlantillaObra & {
    plantilla_capitulos: PlantillaCompleta['capitulos']
    plantilla_partidas: PlantillaCompleta['partidas']
  }
  return {
    ...raw,
    capitulos: (raw.plantilla_capitulos ?? []).sort((a, b) => a.orden - b.orden),
    partidas: (raw.plantilla_partidas ?? []).sort((a, b) => a.orden - b.orden),
  }
}

/**
 * Carga una plantilla en un presupuesto existente: copia capítulos y partidas
 * a las tablas presupuesto_capitulos y presupuesto_partidas.
 *
 * IMPORTANTE: copia datos (snapshot), no crea FK fuerte. Si la plantilla cambia
 * mañana, el presupuesto no se ve afectado (documento histórico).
 *
 * @returns resumen { capitulosCreados, partidasCreadas, totalEstimado }
 */
export async function cargarPlantillaEnPresupuesto(
  supabase: Client,
  plantillaId: string,
  presupuestoId: string,
): Promise<{ capitulosCreados: number; partidasCreadas: number; totalEstimado: number }> {
  const plantilla = await obtenerPlantilla(supabase, plantillaId)
  if (!plantilla) throw new Error('Plantilla no encontrada')

  // Crear capítulos en el presupuesto, mapear plantilla_capitulo_id → presupuesto_capitulo_id
  const mapeoCapitulos = new Map<string, string>()
  let totalEstimado = 0

  // Si la plantilla no tiene capítulos definidos, crear uno "General"
  const capitulos = plantilla.capitulos.length > 0
    ? plantilla.capitulos
    : [{ id: '__default', orden: 1, nombre: 'General', capitulo_sistema: null, plantilla_id: plantillaId, created_at: '' }]

  for (let i = 0; i < capitulos.length; i++) {
    const c = capitulos[i]
    const { data: nuevo, error } = await supabase
      .from('presupuesto_capitulos')
      .insert({
        presupuesto_id: presupuestoId,
        orden: c.orden ?? i + 1,
        nombre: c.nombre,
        capitulo_sistema: c.capitulo_sistema ?? null,
      })
      .select('id')
      .single()
    if (error || !nuevo) throw new Error(`Error creando capítulo: ${error?.message}`)
    mapeoCapitulos.set(c.id, nuevo.id)
  }

  // Insertar partidas
  const partidasInsert = plantilla.partidas.map((p) => {
    const capId = p.plantilla_capitulo_id
      ? mapeoCapitulos.get(p.plantilla_capitulo_id) ?? null
      : (mapeoCapitulos.get('__default') ?? null)
    const cantidad = Number(p.cantidad_sugerida)
    const precio = Number(p.precio_unitario_orientativo)
    totalEstimado += cantidad * precio

    return {
      presupuesto_id: presupuestoId,
      capitulo_id: capId,
      partida_biblioteca_id: p.partida_biblioteca_id ?? null,
      orden: p.orden,
      descripcion: p.descripcion,
      unidad: p.unidad,
      cantidad,
      precio_unitario: precio,
      tipo_iva: p.tipo_iva_sugerido,
    }
  })

  if (partidasInsert.length > 0) {
    const { error } = await supabase
      .from('presupuesto_partidas')
      .insert(partidasInsert)
    if (error) throw new Error(`Error creando partidas: ${error.message}`)
  }

  return {
    capitulosCreados: mapeoCapitulos.size,
    partidasCreadas: partidasInsert.length,
    totalEstimado: Math.round(totalEstimado * 100) / 100,
  }
}
