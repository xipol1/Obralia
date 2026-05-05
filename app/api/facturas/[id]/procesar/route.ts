import { NextResponse } from 'next/server'
import {
  createServerSupabaseClient,
  createServiceRoleClient,
} from '@/lib/supabase/server'
import {
  actualizarEstado,
  descargarFacturaArchivo,
  guardarExtraccion,
  obtenerFactura,
} from '@/lib/facturas'
import { extraerFactura } from '@/lib/ocr/extract'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: facturaId } = await params

  // 1. Verificar acceso del usuario y obtener empresa_id
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const factura = await obtenerFactura(supabase, facturaId)
  if (!factura) {
    return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
  }

  // 2. Marcar como procesando con cliente del usuario (RLS)
  await actualizarEstado(supabase, facturaId, 'procesando', {}, null)

  try {
    // 3. Descargar archivo con service role (bypass RLS para storage)
    const service = await createServiceRoleClient()
    const { bytes, mimeType } = await descargarFacturaArchivo(
      service,
      factura.storage_path,
    )

    // 4. Llamar al OCR
    const extraccion = await extraerFactura(
      bytes,
      mimeType || factura.mime_type,
    )

    // 5. Guardar resultados con el cliente del usuario (respeta RLS)
    await guardarExtraccion(supabase, facturaId, factura.empresa_id, extraccion)

    return NextResponse.json({ success: true })
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : 'Error desconocido'
    await actualizarEstado(supabase, facturaId, 'error', {}, mensaje)
    return NextResponse.json({ error: mensaje }, { status: 500 })
  }
}
