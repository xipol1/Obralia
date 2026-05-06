'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { empresaSchema, type EmpresaFormData } from '@/schemas/empresa'
import { useToast } from '@/components/ui/toast'
import { crearEmpresaConMembresia } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function OnboardingEmpresaPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmpresaFormData>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      razon_social: '',
      nif: '',
      direccion: '',
      codigo_postal: '',
      municipio: '',
      provincia: '',
      email: '',
      telefono: '',
    },
  })

  async function onSubmit(data: EmpresaFormData) {
    setSaving(true)
    try {
      const result = await crearEmpresaConMembresia(data)
      if (!result.ok) {
        toast({
          title: 'No pudimos crear la empresa',
          description: result.error,
          variant: 'destructive',
        })
        return
      }
      router.push('/onboarding/logo')
    } catch (e) {
      toast({
        title: 'Error inesperado',
        description: e instanceof Error ? e.message : 'Inténtalo de nuevo',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[--color-foreground]">
          Datos de tu empresa
        </h1>
        <p className="mt-1 text-sm text-[--color-muted-foreground]">
          Estos datos aparecerán en tus presupuestos
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="razon_social">
            Razon social <span className="text-red-500">*</span>
          </Label>
          <Input
            id="razon_social"
            placeholder="Construcciones Garcia S.L."
            aria-invalid={!!errors.razon_social}
            {...register('razon_social')}
          />
          {errors.razon_social && (
            <p className="text-sm text-red-600">{errors.razon_social.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nif">
            NIF/CIF <span className="text-red-500">*</span>
          </Label>
          <Input
            id="nif"
            placeholder="B12345678"
            aria-invalid={!!errors.nif}
            {...register('nif')}
          />
          {errors.nif && (
            <p className="text-sm text-red-600">{errors.nif.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="direccion">Direccion</Label>
          <Input
            id="direccion"
            placeholder="C/ Mayor 10, 2o A"
            aria-invalid={!!errors.direccion}
            {...register('direccion')}
          />
          {errors.direccion && (
            <p className="text-sm text-red-600">{errors.direccion.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="codigo_postal">Codigo postal</Label>
            <Input
              id="codigo_postal"
              placeholder="28001"
              inputMode="numeric"
              aria-invalid={!!errors.codigo_postal}
              {...register('codigo_postal')}
            />
            {errors.codigo_postal && (
              <p className="text-sm text-red-600">
                {errors.codigo_postal.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="municipio">Municipio</Label>
            <Input
              id="municipio"
              placeholder="Madrid"
              aria-invalid={!!errors.municipio}
              {...register('municipio')}
            />
            {errors.municipio && (
              <p className="text-sm text-red-600">{errors.municipio.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="provincia">Provincia</Label>
          <Input
            id="provincia"
            placeholder="Madrid"
            aria-invalid={!!errors.provincia}
            {...register('provincia')}
          />
          {errors.provincia && (
            <p className="text-sm text-red-600">{errors.provincia.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="info@tuempresa.es"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefono">Telefono</Label>
          <Input
            id="telefono"
            placeholder="612 345 678"
            inputMode="tel"
            aria-invalid={!!errors.telefono}
            {...register('telefono')}
          />
          {errors.telefono && (
            <p className="text-sm text-red-600">{errors.telefono.message}</p>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={saving}>
          {saving ? 'Guardando...' : 'Siguiente'}
        </Button>
      </form>
    </div>
  )
}
