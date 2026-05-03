'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, CreditCard, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'

const PLAN_LABELS: Record<string, string> = {
  trial: 'TRIAL',
  basico: 'BÁSICO',
  pro: 'PRO',
  equipo: 'EQUIPO',
}

export default function FacturacionPage() {
  const { toast } = useToast()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [redirecting, setRedirecting] = useState(false)
  const [plan, setPlan] = useState<string | null>(null)
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null)
  const [hasStripeCustomer, setHasStripeCustomer] = useState(false)

  useEffect(() => {
    async function fetchBillingInfo() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: miembro } = await supabase
        .from('miembros')
        .select('empresa_id')
        .eq('user_id', user.id)
        .single()

      if (!miembro) return

      const { data: empresa } = await supabase
        .from('empresas')
        .select('plan, trial_ends_at, stripe_customer_id')
        .eq('id', miembro.empresa_id)
        .single()

      if (empresa) {
        setPlan(empresa.plan)
        setTrialEndsAt(empresa.trial_ends_at)
        setHasStripeCustomer(!!empresa.stripe_customer_id)
      }

      setLoading(false)
    }
    fetchBillingInfo()
  }, [supabase])

  async function handleManageSubscription() {
    setRedirecting(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        toast({
          title: 'Error',
          description: data.error || 'No se pudo abrir el portal de facturación',
          variant: 'destructive',
        })
        setRedirecting(false)
        return
      }

      window.location.href = data.url
    } catch {
      toast({
        title: 'Error inesperado',
        description: 'Inténtalo de nuevo',
        variant: 'destructive',
      })
      setRedirecting(false)
    }
  }

  function formatTrialDate(dateStr: string) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <Skeleton className="h-8 w-48" />
        <div className="mt-6 space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </div>
    )
  }

  const planLabel = PLAN_LABELS[plan || 'trial'] || (plan || '').toUpperCase()
  const isTrial = plan === 'trial'

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/ajustes"
          className="flex h-10 w-10 items-center justify-center rounded-[--radius] text-[--color-muted-foreground] transition-colors hover:bg-[--color-muted]"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-[--color-foreground]">
          Facturación y plan
        </h1>
      </div>

      {/* Big plan badge */}
      <Card className="overflow-hidden p-6">
        <p className="text-xs font-bold uppercase tracking-wider text-[--color-muted-foreground]">
          Tu plan actual
        </p>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-sm font-bold uppercase tracking-wider text-[--color-muted-foreground]">
            Plan
          </span>
          <span className="text-4xl font-extrabold tracking-tight text-[--color-accent]">
            {planLabel}
          </span>
        </div>

        {isTrial && trialEndsAt && (
          <div className="mt-4 rounded-[--radius] bg-[--color-accent]/10 px-4 py-3">
            <p className="text-sm font-semibold text-[--color-foreground]">
              Tu prueba acaba el {formatTrialDate(trialEndsAt)}
            </p>
            <p className="mt-0.5 text-xs text-[--color-muted-foreground]">
              Activa tu plan antes para no perder acceso
            </p>
          </div>
        )}
      </Card>

      {/* Actions */}
      <div className="mt-6">
        {hasStripeCustomer ? (
          <Button
            onClick={handleManageSubscription}
            disabled={redirecting}
            size="lg"
            className="w-full"
          >
            <ExternalLink className="h-4 w-4" />
            {redirecting ? 'Redirigiendo...' : 'Gestionar suscripción'}
          </Button>
        ) : (
          <EmptyState
            icon={<CreditCard />}
            title="Sin suscripción activa"
            description="Activa tu plan para gestionar la facturación y los métodos de pago."
          />
        )}
      </div>
    </div>
  )
}
