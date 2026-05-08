'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, User, Building2 } from 'lucide-react'
import Link from 'next/link'
import { clienteSchema, type ClienteFormData } from '@/schemas/cliente'
import { createClient } from '@/lib/supabase/client'
import { formatCodigoPostal, formatNif, formatPhoneDisplay } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { clienteAplicaRetencionPorDefecto } from '@/lib/fiscal/retencion-isp'
import type { TipoFiscalCliente } from '@/types/domain'

const TIPO_FISCAL_OPTIONS = [
  { value: 'particular', label: 'Particular (sin retención)' },
  { value: 'autonomo', label: 'Autónomo' },
  { value: 'empresa', label: 'Empresa' },
  { value: 'comunidad', label: 'Comunidad de propietarios' },
  { value: 'administracion', label: 'Administración pública' },
]

export default function NuevoClientePage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ClienteFormData>({
    // biome-ignore lint/suspicious/noExplicitAny: zod resolver typing con defaults
    resolver: zodResolver(clienteSchema) as any,
    defaultValues: {
      tipo: 'particular',
      tipo_fiscal: 'particular',
      aplica_retencion_irpf: false,
      aplica_isp_construccion: false,
      nombre: '',
      apellidos: '',
      razon_social: '',
      nif: '',
      email: '',
      telefono: '',
      direccion: '',
      codigo_postal: '',
      municipio: '',
      provincia: '',
      contacto_nombre: '',
      contacto_telefono: '',
      contacto_email: '',
      administrador_nombre: '',
      administrador_email: '',
      direccion_facturacion: '',
      cp_facturacion: '',
      municipio_facturacion: '',
      provincia_facturacion: '',
      notas: '',
    },
  })

  const tipo = watch('tipo')
  const tipoFiscal = watch('tipo_fiscal')
  const aplicaRetencion = watch('aplica_retencion_irpf')
  const aplicaIsp = watch('aplica_isp_construccion')

  function setTipoFiscal(t: TipoFiscalCliente) {
    setValue('tipo_fiscal', t, { shouldValidate: true })
    // Defaults inteligentes: empresas/autónomos aplican retención por defecto.
    setValue('aplica_retencion_irpf', clienteAplicaRetencionPorDefecto(t))
    // tipo (particular/empresa) lo mantenemos sincronizado para compatibilidad
    setValue('tipo', t === 'particular' ? 'particular' : 'empresa')
  }

  async function onSubmit(data: ClienteFormData) {
    setSaving(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        toast({
          title: 'Sesión expirada',
          description: 'Inicia sesión de nuevo',
          variant: 'destructive',
        })
        return
      }

      const { data: miembro } = await supabase
        .from('miembros')
        .select('empresa_id')
        .eq('user_id', user.id)
        .single()

      if (!miembro) {
        toast({
          title: 'Error',
          description: 'No se encontró tu empresa',
          variant: 'destructive',
        })
        return
      }

      const { error } = await supabase.from('clientes').insert({
        empresa_id: miembro.empresa_id,
        tipo: data.tipo,
        tipo_fiscal: data.tipo_fiscal,
        aplica_retencion_irpf: data.aplica_retencion_irpf,
        aplica_isp_construccion: data.aplica_isp_construccion,
        nombre: data.nombre,
        apellidos: data.apellidos || null,
        razon_social: data.razon_social || null,
        nif: data.nif || null,
        email: data.email || null,
        telefono: data.telefono || null,
        direccion: data.direccion || null,
        codigo_postal: data.codigo_postal || null,
        municipio: data.municipio || null,
        provincia: data.provincia || null,
        contacto_nombre: data.contacto_nombre || null,
        contacto_telefono: data.contacto_telefono || null,
        contacto_email: data.contacto_email || null,
        administrador_nombre: data.administrador_nombre || null,
        administrador_email: data.administrador_email || null,
        direccion_facturacion: data.direccion_facturacion || null,
        cp_facturacion: data.cp_facturacion || null,
        municipio_facturacion: data.municipio_facturacion || null,
        provincia_facturacion: data.provincia_facturacion || null,
        notas: data.notas || null,
      })

      if (error) {
        toast({
          title: 'Error al crear el cliente',
          description: error.message,
          variant: 'destructive',
        })
        return
      }

      toast({ title: 'Cliente creado correctamente' })
      router.push('/clientes')
    } catch {
      toast({
        title: 'Error inesperado',
        description: 'Inténtalo de nuevo',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/clientes"
          className="flex h-10 w-10 items-center justify-center rounded-[--radius] text-[--color-muted-foreground] transition-colors hover:bg-[--color-muted]"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-[--color-foreground]">
          Nuevo cliente
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Tipo toggle */}
        <div className="space-y-2">
          <Label>Tipo de cliente</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTipoFiscal('particular')}
              className={`flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-[--radius] border-2 px-4 py-3 text-sm font-semibold transition-colors ${
                tipo === 'particular'
                  ? 'border-[--color-primary] bg-[--color-primary] text-white'
                  : 'border-[--color-border] bg-[--color-card] text-[--color-foreground] hover:bg-[--color-muted]'
              }`}
            >
              <User className="h-5 w-5" />
              Particular
            </button>
            <button
              type="button"
              onClick={() => setTipoFiscal('empresa')}
              className={`flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-[--radius] border-2 px-4 py-3 text-sm font-semibold transition-colors ${
                tipo === 'empresa'
                  ? 'border-[--color-primary] bg-[--color-primary] text-white'
                  : 'border-[--color-border] bg-[--color-card] text-[--color-foreground] hover:bg-[--color-muted]'
              }`}
            >
              <Building2 className="h-5 w-5" />
              Empresa
            </button>
          </div>
        </div>

        {/* Datos fiscales */}
        <Card className="space-y-4 p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[--color-muted-foreground]">
            Datos fiscales
          </h2>
          <div className="space-y-2">
            <Label htmlFor="tipo_fiscal">Categoría fiscal</Label>
            <Select
              id="tipo_fiscal"
              value={tipoFiscal}
              onChange={(e) =>
                setTipoFiscal(e.target.value as TipoFiscalCliente)
              }
              options={TIPO_FISCAL_OPTIONS}
            />
            <p className="text-xs text-[--color-muted-foreground]">
              Determina si la factura llevará retención IRPF e inversión del
              sujeto pasivo.
            </p>
          </div>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={aplicaRetencion ?? false}
              onChange={(e) =>
                setValue('aplica_retencion_irpf', e.target.checked)
              }
            />
            <span className="text-sm">
              <span className="font-medium">Aplicar retención IRPF</span>
              <span className="block text-xs text-[--color-muted-foreground]">
                15% (7% si llevas &lt; 3 años de alta).
              </span>
            </span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={aplicaIsp ?? false}
              onChange={(e) =>
                setValue('aplica_isp_construccion', e.target.checked)
              }
            />
            <span className="text-sm">
              <span className="font-medium">
                Inversión del sujeto pasivo (construcción)
              </span>
              <span className="block text-xs text-[--color-muted-foreground]">
                La factura se emite sin IVA. Aplica cuando trabajas como
                subcontratista o para promotor empresario.
              </span>
            </span>
          </label>
        </Card>

        {/* Datos principales */}
        <Card className="space-y-4 p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[--color-muted-foreground]">
            Datos principales
          </h2>

          <div className="space-y-2">
            <Label htmlFor="nombre">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nombre"
              placeholder={tipo === 'empresa' ? 'Persona de contacto' : 'Nombre'}
              aria-invalid={!!errors.nombre}
              {...register('nombre')}
            />
            {errors.nombre && (
              <p className="text-sm text-red-600">{errors.nombre.message}</p>
            )}
          </div>

          {tipo === 'particular' && (
            <div className="space-y-2">
              <Label htmlFor="apellidos">
                Apellidos <span className="text-red-500">*</span>
              </Label>
              <Input
                id="apellidos"
                placeholder="Apellidos"
                aria-invalid={!!errors.apellidos}
                {...register('apellidos')}
              />
              {errors.apellidos && (
                <p className="text-sm text-red-600">{errors.apellidos.message}</p>
              )}
            </div>
          )}

          {tipo === 'empresa' && (
            <div className="space-y-2">
              <Label htmlFor="razon_social">
                Razón social <span className="text-red-500">*</span>
              </Label>
              <Input
                id="razon_social"
                placeholder="Reformas López S.L."
                aria-invalid={!!errors.razon_social}
                {...register('razon_social')}
              />
              {errors.razon_social && (
                <p className="text-sm text-red-600">
                  {errors.razon_social.message}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="nif">NIF/CIF</Label>
            <Input
              id="nif"
              placeholder="12345678A"
              autoCapitalize="characters"
              aria-invalid={!!errors.nif}
              {...register('nif', {
                onBlur: (e) => {
                  const formatted = formatNif(e.target.value)
                  if (formatted !== e.target.value) {
                    setValue('nif', formatted, { shouldValidate: true })
                  }
                },
              })}
            />
            {errors.nif && (
              <p className="text-sm text-red-600">{errors.nif.message}</p>
            )}
          </div>
        </Card>

        {/* Contacto */}
        <Card className="space-y-4 p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[--color-muted-foreground]">
            Contacto
          </h2>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="cliente@email.com"
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              placeholder="+34 612 345 678"
              inputMode="tel"
              autoComplete="tel"
              aria-invalid={!!errors.telefono}
              {...register('telefono', {
                onBlur: (e) => {
                  const formatted = formatPhoneDisplay(e.target.value)
                  if (formatted && formatted !== e.target.value) {
                    setValue('telefono', formatted, { shouldValidate: true })
                  }
                },
              })}
            />
            {errors.telefono && (
              <p className="text-sm text-red-600">{errors.telefono.message}</p>
            )}
          </div>
        </Card>

        {/* Dirección */}
        <Card className="space-y-4 p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[--color-muted-foreground]">
            Dirección
          </h2>

          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              placeholder="C/ Mayor 10"
              aria-invalid={!!errors.direccion}
              {...register('direccion')}
            />
            {errors.direccion && (
              <p className="text-sm text-red-600">{errors.direccion.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="codigo_postal">Código postal</Label>
              <Input
                id="codigo_postal"
                placeholder="28001"
                inputMode="numeric"
                maxLength={5}
                aria-invalid={!!errors.codigo_postal}
                {...register('codigo_postal', {
                  onChange: (e) => {
                    const formatted = formatCodigoPostal(e.target.value)
                    if (formatted !== e.target.value) {
                      setValue('codigo_postal', formatted)
                    }
                  },
                })}
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
        </Card>

        {/* Notas */}
        <Card className="space-y-2 p-5">
          <Label htmlFor="notas">Notas internas</Label>
          <Textarea
            id="notas"
            placeholder="Notas internas sobre el cliente..."
            rows={3}
            {...register('notas')}
          />
          {errors.notas && (
            <p className="text-sm text-red-600">{errors.notas.message}</p>
          )}
        </Card>

        <Button type="submit" size="lg" className="w-full" disabled={saving}>
          {saving ? 'Guardando...' : 'Crear cliente'}
        </Button>
      </form>
    </div>
  )
}
