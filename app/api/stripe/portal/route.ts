import { NextResponse } from 'next/server'
import { createBillingPortalSession } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: miembro } = await supabase
      .from('miembros')
      .select('empresa_id')
      .eq('user_id', user.id)
      .single()

    if (!miembro) {
      return NextResponse.json(
        { error: 'Sin empresa asociada' },
        { status: 403 },
      )
    }

    const { data: empresa } = await supabase
      .from('empresas')
      .select('stripe_customer_id')
      .eq('id', miembro.empresa_id)
      .single()

    if (!empresa?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No se encontro cliente de Stripe' },
        { status: 404 },
      )
    }

    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/ajustes/facturacion`

    const session = await createBillingPortalSession(
      empresa.stripe_customer_id,
      returnUrl,
    )

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Error creando sesion de portal:', err)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    )
  }
}
