import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createStripeCustomer } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const { empresa_id } = await request.json()

    if (!empresa_id) {
      return NextResponse.json(
        { error: 'empresa_id es obligatorio' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: miembro } = await supabase
      .from('miembros')
      .select('empresa_id, rol')
      .eq('user_id', user.id)
      .eq('empresa_id', empresa_id)
      .single()

    if (!miembro) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('razon_social, email, telefono')
      .eq('id', empresa_id)
      .single()

    if (empresaError || !empresa) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      )
    }

    let stripeCustomerId: string | null = null
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const customer = await createStripeCustomer({
          name: empresa.razon_social,
          email: empresa.email || undefined,
          phone: empresa.telefono || undefined,
          metadata: { empresa_id },
        })
        stripeCustomerId = customer.id
      } catch (stripeErr) {
        console.warn('Stripe customer creation failed, continuing without it:', stripeErr)
      }
    }

    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 14)

    const { error: updateError } = await supabase
      .from('empresas')
      .update({
        trial_ends_at: trialEndsAt.toISOString(),
        plan: 'trial' as const,
        ...(stripeCustomerId && { stripe_customer_id: stripeCustomerId }),
      })
      .eq('id', empresa_id)

    if (updateError) {
      return NextResponse.json(
        { error: 'Error al actualizar la empresa' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error starting trial:', err)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
