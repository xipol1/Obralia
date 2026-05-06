import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
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

  await actualizarEstado(supabase, facturaId, 'procesando', {}, null)

  if (!process.env.GOOGLE_AI_API_KEY) {
    const mensaje = 'GOOGLE_AI_API_KEY no configurada. Configúrala en Vercel → Settings → Environment Variables.'
    await actualizarEstado(supabase, facturaId, 'error', {}, mensaje)
    return NextResponse.json({ error: mensaje }, { status: 500 })
  }

  try {
    const { bytes, mimeType } = await descargarFacturaArchivo(
      supabase,
      factura.storage_path,
    )

    const extraccion = await extraerFactura(
      bytes,
      mimeType || factura.mime_type,
    )

    await guardarExtraccion(supabase, facturaId, factura.empresa_id, extraccion)

    return NextResponse.json({ success: true })
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : 'Error desconocido'
    await actualizarEstado(supabase, facturaId, 'error', {}, mensaje)
    return NextResponse.json({ error: mensaje }, { status: 500 })
  }
}
