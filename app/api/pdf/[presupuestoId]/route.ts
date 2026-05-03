import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'
import PresupuestoPDF from '@/lib/pdf/PresupuestoPDF'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ presupuestoId: string }> },
) {
  try {
    const { presupuestoId: _presupuestoId } = await params

    // Modo demo: el server no puede generar el PDF (los datos viven en localStorage del cliente)
    const isDemoMode =
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
    if (isDemoMode) {
      return NextResponse.json(
        {
          error:
            'Modo demo: la generación de PDF requiere un Supabase real configurado. La plantilla está lista, pero los datos viven en tu navegador y no son accesibles desde el servidor.',
        },
        { status: 501 },
      )
    }

    const presupuestoId = _presupuestoId

    // Auth check
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Use service role for full data access
    const serviceClient = await createServiceRoleClient()

    // Fetch presupuesto with relations (incluyendo capítulos para Sesión 2+)
    const { data: presupuesto, error: presError } = await serviceClient
      .from('presupuestos')
      .select(
        '*, clientes(nombre, apellidos, razon_social, nif, direccion, telefono), presupuesto_partidas(*), presupuesto_capitulos(*), empresas!presupuestos_empresa_id_fkey(razon_social, nif, direccion, codigo_postal, municipio, provincia, email, telefono, logo_url)'
      )
      .eq('id', presupuestoId)
      .single()

    if (presError || !presupuesto) {
      return NextResponse.json(
        { error: 'Presupuesto no encontrado' },
        { status: 404 },
      )
    }

    // Verify access: user must be member of this empresa
    const { data: miembro } = await serviceClient
      .from('miembros')
      .select('empresa_id')
      .eq('user_id', user.id)
      .eq('empresa_id', presupuesto.empresa_id)
      .single()

    if (!miembro) {
      return NextResponse.json(
        { error: 'Sin acceso a este presupuesto' },
        { status: 403 },
      )
    }

    // Build props for PDF
    const empresa = presupuesto.empresas as unknown as {
      razon_social: string
      nif: string
      direccion?: string | null
      codigo_postal?: string | null
      municipio?: string | null
      provincia?: string | null
      email?: string | null
      telefono?: string | null
      logo_url?: string | null
    }

    const cliente = (presupuesto.clientes ?? {}) as {
      nombre?: string | null
      apellidos?: string | null
      razon_social?: string | null
      nif?: string | null
      direccion?: string | null
      telefono?: string | null
    }

    const partidas = (
      (presupuesto.presupuesto_partidas as unknown as Array<{
        descripcion: string
        unidad: string
        cantidad: number
        precio_unitario: number
        importe: number
        orden: number
        capitulo_id: string | null
      }>) ?? []
    )
      .sort((a, b) => a.orden - b.orden)
      .map((p) => ({
        descripcion: p.descripcion,
        unidad: p.unidad,
        cantidad: p.cantidad,
        precio_unitario: p.precio_unitario,
        importe: p.importe,
        capitulo_id: p.capitulo_id,
      }))

    const capitulos = (
      (presupuesto.presupuesto_capitulos as unknown as Array<{
        id: string
        nombre: string
        orden: number
      }>) ?? []
    ).map((c) => ({ id: c.id, nombre: c.nombre, orden: c.orden }))

    const pdfProps = {
      empresa,
      cliente,
      presupuesto: {
        numero: presupuesto.numero,
        titulo: presupuesto.titulo,
        direccion_obra: presupuesto.direccion_obra,
        fecha_emision: presupuesto.fecha_emision,
        fecha_validez: presupuesto.fecha_validez,
        tipo_iva_default: presupuesto.tipo_iva_default ?? 21,
        motivo_iva_reducido: presupuesto.motivo_iva_reducido,
        base_imponible: presupuesto.base_imponible ?? 0,
        cuota_iva: presupuesto.cuota_iva ?? 0,
        total: presupuesto.total ?? 0,
        notas_cliente: presupuesto.notas_cliente,
        exclusiones: presupuesto.exclusiones,
        forma_pago: presupuesto.forma_pago,
        plazo_ejecucion_dias: presupuesto.plazo_ejecucion_dias,
        garantia_meses: presupuesto.garantia_meses,
      },
      partidas,
      capitulos,
    }

    // Render PDF to buffer
    const pdfBuffer = await renderToBuffer(
      createElement(PresupuestoPDF, pdfProps) as any,
    )

    // Upload to Supabase Storage
    const timestamp = Date.now()
    const fileName = `${presupuesto.numero.replace(/\//g, '-')}-v${timestamp}.pdf`
    const storagePath = `${presupuesto.empresa_id}/${presupuestoId}/${fileName}`

    const { error: uploadError } = await serviceClient.storage
      .from('presupuestos-pdf')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError)
      return NextResponse.json(
        { error: 'Error al subir el PDF' },
        { status: 500 },
      )
    }

    // Update presupuesto with pdf_url
    await serviceClient
      .from('presupuestos')
      .update({ pdf_url: storagePath })
      .eq('id', presupuestoId)

    // Create signed URL (1 hour)
    const { data: signedData, error: signedError } = await serviceClient.storage
      .from('presupuestos-pdf')
      .createSignedUrl(storagePath, 3600)

    if (signedError || !signedData) {
      return NextResponse.json(
        { error: 'Error generando URL de descarga' },
        { status: 500 },
      )
    }

    return NextResponse.json({ url: signedData.signedUrl })
  } catch (err) {
    console.error('PDF generation error:', err)
    return NextResponse.json(
      { error: 'Error interno generando el PDF' },
      { status: 500 },
    )
  }
}
