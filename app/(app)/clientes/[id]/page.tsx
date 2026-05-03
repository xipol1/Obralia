'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Trash2, User, Building2 } from 'lucide-react'
import Link from 'next/link'
import { clienteSchema, type ClienteFormData } from '@/schemas/cliente'
import { createClient } from '@/lib/supabase/client'
import { formatCodigoPostal, formatNif, formatPhoneDisplay } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

export default function EditClientePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { toast } = useToast()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      tipo: 'particular',
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
      notas: '',
    },
  })

  const tipo = watch('tipo')

  useEffect(() => {
    async function fetchCliente() {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error || !data) {
        toast({
          title: 'Cliente no encontrado',
          variant: 'destructive',
        })
        router.push('/clientes')
        return
      }

      reset({
        tipo: data.tipo as 'particular' | 'empresa',
        nombre: data.nombre || '',
        apellidos: data.apellidos || '',
        razon_social: data.razon_social || '',
        nif: data.nif || '',
        email: data.email || '',
        telefono: data.telefono || '',
        direccion: data.direccion || '',
        codigo_postal: data.codigo_postal || '',
        municipio: data.municipio || '',
        provincia: data.provincia || '',
        notas: data.notas || '',
      })
      setLoading(false)
    }
    fetchCliente()
  }, [params.id, supabase, reset, router, toast])

  async function onSubmit(data: ClienteFormData) {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('clientes')
        .update({
          tipo: data.tipo,
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
          notas: data.notas || null,
        })
        .eq('id', params.id)

      if (error) {
        toast({
          title: 'Error al guardar',
          description: error.message,
          variant: 'destructive',
        })
        return
      }

      toast({ title: 'Cliente actualizado correctamente' })
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

  async function handleDelete() {
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', params.id)

      if (error) {
        toast({
          title: 'Error al eliminar',
          description: error.message,
          variant: 'destructive',
        })
        return
      }

      toast({ title: 'Cliente eliminado' })
      router.push('/clientes')
    } catch {
      toast({
        title: 'Error inesperado',
        description: 'Inténtalo de nuevo',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
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
          Editar cliente
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Tipo toggle */}
        <div className="space-y-2">
          <Label>Tipo de cliente</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setValue('tipo', 'particular', { shouldValidate: true })}
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
              onClick={() => setValue('tipo', 'empresa', { shouldValidate: true })}
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
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </form>

      {/* Delete section */}
      <div className="mt-10 border-t border-[--color-border] pt-6">
        <Button
          type="button"
          variant="destructive"
          size="lg"
          className="w-full"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="h-4 w-4" />
          Eliminar cliente
        </Button>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar cliente</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará el cliente y todos
              sus datos asociados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
