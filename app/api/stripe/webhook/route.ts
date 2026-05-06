import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceRoleClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

export const runtime = 'nodejs'

function getPriceToPlan(): Record<string, string> {
  const map: Record<string, string> = {}
  const pairs: [string | undefined, string][] = [
    [process.env.STRIPE_PRICE_BASICO_MONTHLY, 'basico'],
    [process.env.STRIPE_PRICE_BASICO_YEARLY, 'basico'],
    [process.env.STRIPE_PRICE_PRO_MONTHLY, 'pro'],
    [process.env.STRIPE_PRICE_PRO_YEARLY, 'pro'],
    [process.env.STRIPE_PRICE_EQUIPO_MONTHLY, 'equipo'],
    [process.env.STRIPE_PRICE_EQUIPO_YEARLY, 'equipo'],
  ]
  for (const [priceId, plan] of pairs) {
    if (priceId) map[priceId] = plan
  }
  return map
}

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!sig || !webhookSecret) {
    return NextResponse.json(
      { error: 'Falta la firma de Stripe' },
      { status: 400 },
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('Error al verificar webhook de Stripe:', err)
    return NextResponse.json(
      { error: 'Firma de webhook invalida' },
      { status: 400 },
    )
  }

  const supabase = await createServiceRoleClient()

  try {
    switch (event.type) {
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer.id
        const priceId = subscription.items.data[0]?.price.id
        const plan = getPriceToPlan()[priceId] || 'basico'

        const { error } = await supabase
          .from('empresas')
          .update({
            plan: plan as 'basico' | 'pro' | 'equipo',
            stripe_subscription_id: subscription.id,
          })
          .eq('stripe_customer_id', customerId)

        if (error) {
          console.error('Error actualizando empresa (subscription.created):', error)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer.id
        const priceId = subscription.items.data[0]?.price.id
        const plan = getPriceToPlan()[priceId] || 'basico'

        const { error } = await supabase
          .from('empresas')
          .update({
            plan: plan as 'basico' | 'pro' | 'equipo',
            stripe_subscription_id: subscription.id,
          })
          .eq('stripe_customer_id', customerId)

        if (error) {
          console.error('Error actualizando empresa (subscription.updated):', error)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer.id

        const { error } = await supabase
          .from('empresas')
          .update({
            plan: 'trial',
            stripe_subscription_id: null,
          })
          .eq('stripe_customer_id', customerId)

        if (error) {
          console.error('Error actualizando empresa (subscription.deleted):', error)
        }
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('Factura pagada:', invoice.id)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.error('Pago fallido para factura:', invoice.id)
        break
      }

      default:
        console.log(`Evento de Stripe no gestionado: ${event.type}`)
    }
  } catch (err) {
    console.error('Error procesando evento de webhook:', err)
    // Return 200 to avoid Stripe retries for processing errors
    return NextResponse.json({ received: true })
  }

  return NextResponse.json({ received: true })
}
