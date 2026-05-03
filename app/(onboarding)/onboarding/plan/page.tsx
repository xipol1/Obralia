'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'

const FEATURES = [
  'Presupuestos ilimitados',
  'Envio por WhatsApp y email',
  'Gestion de clientes',
  'Calculo automatico de IVA',
  'Logo en tus documentos',
  'Soporte prioritario',
]

export default function OnboardingPlanPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [empresaName, setEmpresaName] = useState('')
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    async function fetchEmpresa() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: miembro } = await supabase
        .from('miembros')
        .select('empresa_id')
        .eq('user_id', user.id)
        .single()

      if (miembro) {
        setEmpresaId(miembro.empresa_id)

        const { data: empresa } = await supabase
          .from('empresas')
          .select('razon_social, email, telefono')
          .eq('id', miembro.empresa_id)
          .single()

        if (empresa) {
          setEmpresaName(empresa.razon_social)
        }
      }
    }
    fetchEmpresa()
  }, [supabase])

  async function handleStartTrial() {
    if (!empresaId) return

    setStarting(true)
    try {
      // Call API route that handles Stripe customer creation + empresa update
      const res = await fetch('/api/onboarding/start-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresa_id: empresaId }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Error al iniciar la prueba')
      }

      router.push('/presupuestos')
    } catch (err) {
      toast({
        title: 'Error al iniciar la prueba',
        description:
          err instanceof Error ? err.message : 'Intentalo de nuevo',
        variant: 'destructive',
      })
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[--color-accent]/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[--color-accent]">
          14 días gratis
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[--color-foreground]">
          Empieza tu prueba
        </h1>
        <p className="mt-2 text-base text-[--color-muted-foreground]">
          Sin tarjeta. Sin compromiso.
        </p>
      </div>

      {/* Features list */}
      <div className="rounded-[--radius] border border-[--color-border]/60 bg-[--color-card] p-6 shadow-sm">
        {empresaName && (
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-[--color-muted-foreground]">
            Plan para {empresaName}
          </p>
        )}
        <ul className="space-y-3">
          {FEATURES.map((feature) => (
            <li key={feature} className="flex items-center gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[--color-accent]/15">
                <Check className="h-4 w-4 text-[--color-accent]" />
              </div>
              <span className="text-sm font-medium text-[--color-foreground]">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Button
        onClick={handleStartTrial}
        disabled={starting || !empresaId}
        variant="accent"
        size="xl"
        className="w-full"
      >
        {starting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Activando...
          </>
        ) : (
          'Empezar mi prueba'
        )}
      </Button>

      <p className="text-center text-xs text-[--color-muted-foreground]">
        No se te cobrará nada. Podrás elegir un plan cuando termine tu prueba.
      </p>
    </div>
  )
}
