'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { otpSchema, type OtpFormData } from '@/schemas/auth'
import { createClient } from '@/lib/supabase/client'
import { isDemoMode } from '@/lib/supabase/demo-client'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'

function formatPhone(phone: string): string {
  // Strip +34 prefix and any spaces
  const digits = phone.replace(/^\+34/, '').replace(/\s/g, '')
  if (digits.length !== 9) return phone || 'tu teléfono'
  return `+34 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`
}

export default function VerificarPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardHeader className="items-center text-center">
            <CardTitle>Cargando...</CardTitle>
          </CardHeader>
        </Card>
      }
    >
      <VerificarPageInner />
    </Suspense>
  )
}

function VerificarPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const phone = searchParams.get('telefono') ?? ''
  const { toast } = useToast()
  const supabase = createClient()
  const demo = isDemoMode()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { telefono: phone, token: '' },
  })

  async function onSubmit(data: OtpFormData) {
    const { error } = await supabase.auth.verifyOtp({
      phone: data.telefono,
      token: data.token,
      type: 'sms',
    })

    if (error) {
      toast({
        title: 'Código incorrecto',
        description: error.message,
        variant: 'destructive',
      })
      return
    }

    // Check if user has an empresa (company) via miembros table
    const { data: miembros } = await supabase
      .from('miembros')
      .select('empresa_id')
      .limit(1)

    if (!miembros || miembros.length === 0) {
      router.push('/onboarding')
    } else {
      router.push('/presupuestos')
    }
  }

  async function handleResend() {
    if (!phone) return

    const { error } = await supabase.auth.signInWithOtp({ phone })

    if (error) {
      toast({
        title: 'Error al reenviar',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Código reenviado',
        description: 'Mira tu teléfono',
      })
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Mete el código que te ha llegado</CardTitle>
        <CardDescription className="pt-1 text-base">
          SMS enviado a{' '}
          <span className="font-medium text-[--color-foreground]">
            {formatPhone(phone)}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Hidden phone field */}
          <input type="hidden" {...register('telefono')} />

          <div className="space-y-2">
            <Label htmlFor="token">Código de verificación</Label>
            <Input
              id="token"
              placeholder="000000"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              className="text-center font-mono text-3xl font-bold tracking-[0.5em]"
              aria-invalid={!!errors.token}
              {...register('token')}
            />
            {errors.token && (
              <p className="text-sm text-[--color-destructive]">
                {errors.token.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Verificando...' : 'Verificar →'}
          </Button>
          <p className="text-center text-sm text-[--color-muted-foreground]">
            {demo
              ? 'Mete cualquier código de 6 dígitos'
              : 'Si no recibes el SMS en 1 minuto, revisa que el número es correcto'}
          </p>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <button
          type="button"
          onClick={handleResend}
          className="text-sm font-semibold text-[--color-primary] hover:underline"
        >
          ¿No te ha llegado? Mandar otra vez
        </button>
      </CardFooter>
    </Card>
  )
}
