/**
 * Obralia - Facturas OCR - Data access layer
 *
 * Acceso a las tablas facturas_subidas y factura_lineas. Las tablas todavía
 * no están presentes en types/database.ts (se regenerarán cuando se aplique
 * la migración 00003), por eso usamos `any` en el cliente Supabase aquí.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  EstadoFacturaSubida,
  FacturaLinea,
  FacturaSubida,
} from '@/types/domain'
import type { FacturaExtraida } from '@/schemas/factura'

// Las tablas nuevas no están en Database; usamos un cliente sin tipar para
// estas queries concretas.
type AnyClient = SupabaseClient<any, any, any>

const FACTURAS_BUCKET = 'facturas'

export function buildFacturaPath(
  empresaId: string,
  facturaId: string,
  filename: string,
): string {
  // Sanitiza filename para evitar path traversal y caracteres raros
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120)
  return `${empresaId}/${facturaId}/${safe}`
}

export async function uploadFacturaArchivo(
  supabase: AnyClient,
  path: string,
  file: File,
): Promise<void> {
  const { error } = await supabase.storage
    .from(FACTURAS_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })
  if (error) throw new Error(`No se pudo subir la factura: ${error.message}`)
}

export async function descargarFacturaArchivo(
  supabase: AnyClient,
  path: string,
): Promise<{ bytes: ArrayBuffer; mimeType: string }> {
  const { data, error } = await supabase.storage
    .from(FACTURAS_BUCKET)
    .download(path)
  if (error || !data) {
    throw new Error(`No se pudo descargar la factura: ${error?.message ?? 'desconocido'}`)
  }
  return { bytes: await data.arrayBuffer(), mimeType: data.type }
}

export async function getSignedUrl(
  supabase: AnyClient,
  path: string,
  ttlSeconds = 60 * 5,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(FACTURAS_BUCKET)
    .createSignedUrl(path, ttlSeconds)
  if (error || !data?.signedUrl) {
    throw new Error(`No se pudo firmar la URL: ${error?.message ?? 'desconocido'}`)
  }
  return data.signedUrl
}

export async function crearFacturaSubida(
  supabase: AnyClient,
  empresaId: string,
  input: {
    storage_path: string
    original_filename: string
    mime_type: string
    size_bytes: number
    subida_por: string | null
  },
): Promise<FacturaSubida> {
  const { data, error } = await supabase
    .from('facturas_subidas')
    .insert({
      empresa_id: empresaId,
      ...input,
      estado: 'pendiente',
    })
    .select('*')
    .single()
  if (error || !data) {
    throw new Error(`Error creando factura: ${error?.message}`)
  }
  return data as FacturaSubida
}

export async function listarFacturas(
  supabase: AnyClient,
  empresaId: string,
): Promise<FacturaSubida[]> {
  const { data, error } = await supabase
    .from('facturas_subidas')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw new Error(`Error listando facturas: ${error.message}`)
  return (data ?? []) as FacturaSubida[]
}

export async function obtenerFactura(
  supabase: AnyClient,
  facturaId: string,
): Promise<FacturaSubida | null> {
  const { data, error } = await supabase
    .from('facturas_subidas')
    .select('*')
    .eq('id', facturaId)
    .maybeSingle()
  if (error) throw new Error(`Error leyendo factura: ${error.message}`)
  return (data ?? null) as FacturaSubida | null
}

export async function listarLineas(
  supabase: AnyClient,
  facturaId: string,
): Promise<FacturaLinea[]> {
  const { data, error } = await supabase
    .from('factura_lineas')
    .select('*')
    .eq('factura_id', facturaId)
    .order('orden', { ascending: true })
  if (error) throw new Error(`Error listando líneas: ${error.message}`)
  return (data ?? []) as FacturaLinea[]
}

export async function actualizarEstado(
  supabase: AnyClient,
  facturaId: string,
  estado: EstadoFacturaSubida,
  patch: Partial<FacturaSubida> = {},
  errorMensaje: string | null = null,
): Promise<void> {
  const update: Record<string, unknown> = { estado, error_mensaje: errorMensaje }
  if (estado === 'procesada') update.procesada_at = new Date().toISOString()
  Object.assign(update, patch)
  const { error } = await supabase
    .from('facturas_subidas')
    .update(update)
    .eq('id', facturaId)
  if (error) throw new Error(`Error actualizando estado: ${error.message}`)
}

export async function guardarExtraccion(
  supabase: AnyClient,
  facturaId: string,
  empresaId: string,
  extraccion: FacturaExtraida,
): Promise<void> {
  // Primero borra líneas previas (re-procesos)
  await supabase.from('factura_lineas').delete().eq('factura_id', facturaId)

  // Cabecera
  await actualizarEstado(supabase, facturaId, 'procesada', {
    proveedor_nombre: extraccion.proveedor_nombre,
    proveedor_nif: extraccion.proveedor_nif,
    numero_factura: extraccion.numero_factura,
    fecha_factura: extraccion.fecha_factura,
    total_sin_iva: extraccion.total_sin_iva,
    total_iva: extraccion.total_iva,
    total_con_iva: extraccion.total_con_iva,
    moneda: extraccion.moneda ?? 'EUR',
  })

  if (extraccion.lineas.length === 0) return

  const rows = extraccion.lineas.map((linea, idx) => ({
    factura_id: facturaId,
    empresa_id: empresaId,
    orden: idx,
    codigo_articulo: linea.codigo_articulo,
    descripcion: linea.descripcion,
    cantidad: linea.cantidad,
    unidad: linea.unidad,
    precio_unitario: linea.precio_unitario,
    importe_linea: linea.importe_linea,
    tipo_iva: linea.tipo_iva,
  }))

  const { error } = await supabase.from('factura_lineas').insert(rows)
  if (error) throw new Error(`Error insertando líneas: ${error.message}`)
}

export async function eliminarFactura(
  supabase: AnyClient,
  facturaId: string,
): Promise<void> {
  // Recupera path antes de borrar la fila
  const factura = await obtenerFactura(supabase, facturaId)
  if (!factura) return

  // Borra archivo de storage (best effort)
  await supabase.storage.from(FACTURAS_BUCKET).remove([factura.storage_path])

  const { error } = await supabase
    .from('facturas_subidas')
    .delete()
    .eq('id', facturaId)
  if (error) throw new Error(`Error eliminando factura: ${error.message}`)
}

export async function importarLineaABiblioteca(
  supabase: AnyClient,
  lineaId: string,
  args: {
    capitulo?: string
    unidad?: string
    tipo_iva?: number
    descripcion?: string
  } = {},
): Promise<string> {
  const { data, error } = await supabase.rpc('importar_linea_a_biblioteca', {
    p_linea_id: lineaId,
    p_capitulo: args.capitulo ?? 'otros',
    p_unidad: args.unidad ?? null,
    p_tipo_iva: args.tipo_iva ?? null,
    p_descripcion: args.descripcion ?? null,
  })
  if (error) throw new Error(`Error importando: ${error.message}`)
  return data as string
}
