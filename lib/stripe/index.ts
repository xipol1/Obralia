import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
  typescript: true,
})

export async function createStripeCustomer(params: {
  email?: string
  phone?: string
  name: string
  metadata: { empresa_id: string }
}): Promise<Stripe.Customer> {
  return stripe.customers.create({
    email: params.email || undefined,
    phone: params.phone || undefined,
    name: params.name,
    metadata: params.metadata,
  })
}

export async function createTrialSubscription(
  customerId: string,
  priceId: string,
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    trial_period_days: 14,
    payment_settings: {
      save_default_payment_method: 'on_subscription',
    },
    trial_settings: {
      end_behavior: { missing_payment_method: 'cancel' },
    },
  })
}

export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string,
): Promise<Stripe.BillingPortal.Session> {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}

export function requirePlan(requiredPlan: 'basico' | 'pro' | 'equipo') {
  // MVP: solo loguea, en fase 2 bloquea
  return (currentPlan: string) => {
    const planOrder = { trial: 0, basico: 1, pro: 2, equipo: 3 }
    const current = planOrder[currentPlan as keyof typeof planOrder] ?? 0
    const required = planOrder[requiredPlan]
    if (current < required) {
      console.warn(`Plan requerido: ${requiredPlan}, plan actual: ${currentPlan}`)
      return false
    }
    return true
  }
}
