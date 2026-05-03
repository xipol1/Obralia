'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { presupuestoEnvioSchema, type PresupuestoEnvioFormData } from '@/schemas/presupuesto'
import { createClient } from '@/lib/supabase/client'
import { generarMensajeWhatsApp, generarLinkWhatsApp } from '@/lib/whatsapp'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'

export default function EnviarPresupuestoPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const [sending, setSending] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['presupuesto-enviar', params.id],
    queryFn: async () => {
      const { data: presupuesto, error } = await supabase
        .from('presupuestos')
        .select('*, clientes(nombre, apellidos, razon_social, telefono), empresas!presupuestos_empresa_id_fkey(razon_social)')
        .eq('id', params.id)
        .single()

      if (error) throw error
      return presupuesto
    },
  })

  const clienteData = data?.clientes as any
  const clienteNombre = clienteData
    ? clienteData.razon_social ||
      [clienteData.nombre, clienteData.apellidos].filter(Boolean).join(' ') ||
      'Cliente'
    : 'Cliente'

  const defaultMessage = data
    ? generarMensajeWhatsApp({
        nombreCliente: clienteNombre,
        tituloObra: data.titulo || 'la obra',
        total: data.total ?? 0,
        fechaValidez: data.fecha_validez || new Date().toISOString(),
        urlPdf: data.pdf_url || '',
        nombreEmpresa: (data.empresas as unknown as { razon_social: string } | null)?.razon_social || '',
        telefonoCliente: clienteData?.telefono || '',
      })
    : ''

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PresupuestoEnvioFormData>({
    resolver: zodResolver(presupuestoEnvioSchema),
    values: {
      mensaje: defaultMessage,
    },
  })

  async function onSubmit(formData: PresupuestoEnvioFormData) {
    if (!data) return
    if (!clienteData?.telefono) {
      toast({
        title: 'Sin telefono',
        description: 'El cliente no tiene numero de telefono registrado',
        variant: 'destructive',
      })
      return
    }

    setSending(true)
    try {
      // Build the WhatsApp link with the edited message
      const link = generarLinkWhatsApp({
        nombreCliente: clienteNombre,
        tituloObra: data.titulo || 'la obra',
        total: data.total ?? 0,
        fechaValidez: data.fecha_validez || new Date().toISOString(),
        urlPdf: data.pdf_url || '',
        nombreEmpresa: (data.empresas as unknown as { razon_social: string } | null)?.razon_social || '',
        telefonoCliente: clienteData.telefono,
      })

      // Open WhatsApp
      window.open(link, '_blank')

      // Mark as sent
      await supabase
        .from('presupuestos')
        .update({
          estado: 'enviado',
          enviado_at: new Date().toISOString(),
        })
        .eq('id', params.id)

      toast({ title: 'Presupuesto marcado como enviado' })
      router.push(`/presupuestos/${params.id}`)
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Intentalo de nuevo',
        variant: 'destructive',
      })
    } finally {
      setSending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-[--radius]" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <p className="text-center text-[--color-muted-foreground]">
          Presupuesto no encontrado
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={`/presupuestos/${params.id}`}
          className="flex h-10 w-10 items-center justify-center rounded-[--radius] text-[--color-muted-foreground] transition-colors hover:bg-[--color-muted]"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-[--color-foreground]">
          Enviar por WhatsApp
        </h1>
      </div>

      {/* Summary */}
      <Card className="mb-6 p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-[--color-muted-foreground]">
          {data.numero}
        </p>
        <p className="mt-1.5 text-base font-semibold text-[--color-foreground]">
          {data.titulo || 'Sin título'}
        </p>
        <p className="mt-2 tabular text-2xl font-bold text-[--color-foreground]">
          {formatCurrency(data.total ?? 0)}
        </p>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="mensaje">Mensaje de WhatsApp</Label>
          <Textarea
            id="mensaje"
            rows={9}
            aria-invalid={!!errors.mensaje}
            {...register('mensaje')}
          />
          {errors.mensaje && (
            <p className="text-sm text-red-600">{errors.mensaje.message}</p>
          )}
          <p className="text-xs text-[--color-muted-foreground]">
            Puedes editar el mensaje antes de enviarlo
          </p>
        </div>

        {!clienteData?.telefono && (
          <div className="rounded-[--radius] border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            El cliente no tiene número de teléfono registrado. Añádelo primero
            en la ficha del cliente.
          </div>
        )}

        <Button
          type="submit"
          disabled={sending || !clienteData?.telefono}
          size="lg"
          className="w-full text-white"
          style={{ backgroundColor: '#25D366' }}
        >
          <MessageCircle className="h-5 w-5" />
          {sending ? 'Enviando...' : 'Enviar por WhatsApp'}
        </Button>

        <p className="text-center text-xs text-[--color-muted-foreground]">
          Se actualizará el estado a &ldquo;Enviado&rdquo;
        </p>
      </form>
    </div>
  )
}
