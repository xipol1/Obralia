'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  emailPasswordSchema,
  type EmailPasswordFormData,
} from '@/schemas/auth'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { asegurarUsuario } from './actions'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailPasswordFormData>({
    resolver: zodResolver(emailPasswordSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(data: EmailPasswordFormData) {
    // 1. Asegura que el usuario existe en Supabase (lo crea si no, sin verificación)
    const ensure = await asegurarUsuario(data)
    if (!ensure.ok) {
      toast({
        title: 'No pudimos entrar',
        description: ensure.error,
        variant: 'destructive',
      })
      return
    }

    // 2. Login real con la sesión del navegador
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      toast({
        title: 'Error al iniciar sesión',
        description: error.message,
        variant: 'destructive',
      })
      return
    }

    // 3. Decide destino según si el usuario ya tiene empresa
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/onboarding')
      return
    }
    const { data: miembro } = await supabase
      .from('miembros')
      .select('empresa_id')
      .eq('user_id', user.id)
      .maybeSingle()

    router.push(miembro ? '/presupuestos' : '/onboarding')
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Entra en Obralia</CardTitle>
        <CardDescription className="pt-1 text-base">
          Crea tu cuenta o entra con tu email y contraseña
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tucorreo@empresa.com"
              inputMode="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-[--color-destructive]">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-[--color-destructive]">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Entrando…' : 'Entrar'}
          </Button>

          <p className="text-center text-xs text-[--color-muted-foreground]">
            Si es la primera vez que entras con este email, creamos la cuenta
            automáticamente. No mandamos emails de verificación.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
