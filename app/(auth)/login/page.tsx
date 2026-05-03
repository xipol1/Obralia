'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { telefonoSchema, type TelefonoFormData } from '@/schemas/auth'
import { createClient } from '@/lib/supabase/client'
import { isDemoMode } from '@/lib/supabase/demo-client'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const demo = isDemoMode()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TelefonoFormData>({
    resolver: zodResolver(telefonoSchema),
    defaultValues: { telefono: '' },
  })

  async function onSubmit(data: TelefonoFormData) {
    const phone = data.telefono.startsWith('+34')
      ? data.telefono
      : `+34${data.telefono}`

    const { error } = await supabase.auth.signInWithOtp({ phone })

    if (error) {
      toast({
        title: 'Error al enviar el código',
        description: error.message,
        variant: 'destructive',
      })
      return
    }

    router.push(`/verificar?telefono=${encodeURIComponent(phone)}`)
  }

  return (
    <Card>
      <CardHeader className="text-center">
        {demo && (
          <div className="mb-3 flex justify-center">
            <Badge variant="warning">MODO DEMO</Badge>
          </div>
        )}
        <CardTitle className="text-2xl">
          {demo ? 'Modo demo activo' : 'Tu móvil es tu cuenta'}
        </CardTitle>
        <CardDescription className="pt-1 text-base">
          {demo
            ? 'Pulsa entrar y prueba la app con datos de ejemplo'
            : 'Te mandamos un código por SMS para entrar'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="telefono">Tu número de móvil</Label>
            <div className="flex h-12 items-center gap-2 rounded-[--radius] border border-[--color-border] bg-[--color-card] px-3 focus-within:ring-2 focus-within:ring-[--color-ring]">
              <span className="text-base font-medium text-[--color-muted-foreground]">
                +34
              </span>
              <input
                id="telefono"
                placeholder="612 345 678"
                inputMode="tel"
                autoComplete="tel"
                aria-invalid={!!errors.telefono}
                className="flex-1 border-0 bg-transparent text-base focus:outline-none focus:ring-0"
                {...register('telefono')}
              />
            </div>
            {errors.telefono && (
              <p className="text-sm text-[--color-destructive]">
                {errors.telefono.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? demo
                ? 'Entrando...'
                : 'Mandando...'
              : demo
                ? 'Entrar al demo'
                : 'Mandarme el código'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
