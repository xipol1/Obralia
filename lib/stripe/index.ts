import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (_stripe) return _stripe
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
  _stripe = new Stripe(key, {
    apiVersion: '2026-04-22.dahlia',
    typescript: true,
  })
  return _stripe
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return Reflect.get(getStripe(), prop, getStripe())
  },
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
