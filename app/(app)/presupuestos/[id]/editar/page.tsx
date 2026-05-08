'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Info, Loader2, UserPlus } from 'lucide-react'
import { presupuestoSchema, type PresupuestoFormData } from '@/schemas/presupuesto'
import { createClient } from '@/lib/supabase/client'
import { calcularIvaAplicable, type IvaInput } from '@/lib/iva/calcular-iva'
import { calcularTotales, LEYENDA_ISP } from '@/lib/fiscal/retencion-isp'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { CapitulosEditor } from '@/components/presupuesto/CapitulosEditor'
import { ClientePicker } from '@/components/cliente/ClientePicker'
import { ClientePreview } from '@/components/cliente/ClientePreview'
import type { Cliente, CapituloSistema } from '@/types/domain'

export default function EditarPresupuestoPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = useMemo(() => createClient(), [])
  const [saving, setSaving] = useState(false)

  const [ivaQ1, setIvaQ1] = useState<boolean | null>(null)
  const [ivaQ2, setIvaQ2] = useState<boolean | null>(null)
  const [ivaQ3, setIvaQ3] = useState<boolean | null>(null)

  const ivaResult = useMemo(() => {
    if (ivaQ1 === null) return null
    const input: IvaInput = {
      esViviendaParticular: ivaQ1,
      esResidenciaHabitual: ivaQ2 ?? false,
      materialSuperaCuarenta: ivaQ1 && ivaQ2 ? ivaQ3 : false,
    }
    return calcularIvaAplicable(input)
  }, [ivaQ1, ivaQ2, ivaQ3])

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PresupuestoFormData>({
    // biome-ignore lint/suspicious/noExplicitAny: zod resolver typing
    resolver: zodResolver(presupuestoSchema) as any,
    defaultValues: {
      cliente_id: '',
      titulo: '',
      direccion_obra: '',
      tipo_iva_default: 21,
      motivo_iva_reducido: '',
      notas_cliente: '',
      notas_internas: '',
      exclusiones: '',
      forma_pago: '',
      // biome-ignore lint/suspicious/noExplicitAny: schema permite vacío
      plazo_ejecucion_dias: '' as any,
      // biome-ignore lint/suspicious/noExplicitAny: schema permite vacío
      garantia_meses: '' as any,
      retencion_pct: 0,
      inversion_sujeto_pasivo: false,
      motivo_isp: '',
      capitulos: [],
    },
  })

  const capitulos = watch('capitulos')
  const direccionObraActual = watch('direccion_obra')

  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  const { data: empresaInfo } = useQuery({
    queryKey: ['empresa-actual'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')
      const { data: miembro } = await supabase
        .from('miembros')
        .select('empresa_id')
        .eq('user_id', user.id)
        .single()
      if (!miembro) throw new Error('Sin empresa asociada')
      return { empresaId: miembro.empresa_id, userId: user.id }
    },
  })
  const empresaId = empresaInfo?.empresaId

  // Cargar presupuesto + capítulos + partidas + cliente
  const { data: presupuesto, isLoading } = useQuery({
    queryKey: ['presupuesto-edit', params.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('presupuestos')
        .select(
          '*, clientes(*), presupuesto_capitulos(*), presupuesto_partidas(*)',
        )
        .eq('id', params.id)
        .single()
      if (error) throw error
      return data
    },
  })

  // Hidratar el formulario al cargar
  useEffect(() => {
    if (!presupuesto) return
    // biome-ignore lint/suspicious/noExplicitAny: shape supabase
    const data = presupuesto as any
    const caps: Array<{
      id: string
      nombre: string
      capitulo_sistema: CapituloSistema | null
      orden: number
    }> = (data.presupuesto_capitulos ?? []).slice().sort(
      // biome-ignore lint/suspicious/noExplicitAny: orden
      (a: any, b: any) => a.orden - b.orden,
    )
    const parts: Array<{
      id: string
      capitulo_id: string | null
      descripcion: string
      unidad: string
      cantidad: number
      precio_unitario: number
      tipo_iva: number
      partida_biblioteca_id: string | null
      orden: number
    }> = (data.presupuesto_partidas ?? []).slice().sort(
      // biome-ignore lint/suspicious/noExplicitAny: orden
      (a: any, b: any) => a.orden - b.orden,
    )

    const capitulosForm: PresupuestoFormData['capitulos'] = caps.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      capitulo_sistema: c.capitulo_sistema,
      partidas: parts
        .filter((p) => p.capitulo_id === c.id)
        .map((p) => ({
          descripcion: p.descripcion,
          unidad: p.unidad as PresupuestoFormData['capitulos'][number]['partidas'][number]['unidad'],
          cantidad: Number(p.cantidad),
          precio_unitario: Number(p.precio_unitario),
          tipo_iva: p.tipo_iva as 0 | 4 | 10 | 21,
          partida_biblioteca_id: p.partida_biblioteca_id ?? null,
        })),
    }))

    // Si quedan partidas sin capítulo (legacy), las metemos en un capítulo "Sin agrupar"
    const huerfanas = parts.filter((p) => !p.capitulo_id)
    if (huerfanas.length > 0) {
      capitulosForm.push({
        id: crypto.randomUUID(),
        nombre: 'Sin agrupar',
        capitulo_sistema: null,
        partidas: huerfanas.map((p) => ({
          descripcion: p.descripcion,
          unidad: p.unidad as PresupuestoFormData['capitulos'][number]['partidas'][number]['unidad'],
          cantidad: Number(p.cantidad),
          precio_unitario: Number(p.precio_unitario),
          tipo_iva: p.tipo_iva as 0 | 4 | 10 | 21,
          partida_biblioteca_id: p.partida_biblioteca_id ?? null,
        })),
      })
    }

    if (capitulosForm.length === 0) {
      capitulosForm.push({
        id: crypto.randomUUID(),
        nombre: 'General',
        capitulo_sistema: null,
        partidas: [],
      })
    }

    reset({
      cliente_id: data.cliente_id ?? '',
      titulo: data.titulo ?? '',
      direccion_obra: data.direccion_obra ?? '',
      tipo_iva_default: (data.tipo_iva_default ?? 21) as 0 | 4 | 10 | 21,
      motivo_iva_reducido: data.motivo_iva_reducido ?? '',
      notas_cliente: data.notas_cliente ?? '',
      notas_internas: data.notas_internas ?? '',
      exclusiones: data.exclusiones ?? '',
      forma_pago: data.forma_pago ?? '',
      // biome-ignore lint/suspicious/noExplicitAny: schema acepta vacío
      plazo_ejecucion_dias: (data.plazo_ejecucion_dias ?? '') as any,
      // biome-ignore lint/suspicious/noExplicitAny: schema acepta vacío
      garantia_meses: (data.garantia_meses ?? '') as any,
      retencion_pct: Number(data.retencion_pct ?? 0),
      inversion_sujeto_pasivo: !!data.inversion_sujeto_pasivo,
      motivo_isp: data.motivo_isp ?? '',
      capitulos: capitulosForm,
    })

    if (data.clientes) {
      setClienteSeleccionado(data.clientes as Cliente)
    }
  }, [presupuesto, reset])

  // IVA wizard sólo aplica si el usuario lo toca: no sobreescribir lo cargado.
  useEffect(() => {
    if (!ivaResult) return
    setValue('tipo_iva_default', ivaResult.porcentaje as 0 | 4 | 10 | 21)
    setValue(
      'motivo_iva_reducido',
      ivaResult.porcentaje < 21 ? ivaResult.motivo : '',
    )
    capitulos?.forEach((cap, ci) => {
      cap.partidas?.forEach((_, pi) => {
        setValue(
          `capitulos.${ci}.partidas.${pi}.tipo_iva`,
          ivaResult.porcentaje as 0 | 4 | 10 | 21,
        )
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ivaResult])

  function selectCliente(cliente: Cliente) {
    setClienteSeleccionado(cliente)
    setValue('cliente_id', cliente.id, { shouldDirty: true })
    if (!direccionObraActual && cliente.direccion) {
      const partes = [cliente.direccion, cliente.codigo_postal, cliente.municipio]
        .filter(Boolean)
        .join(', ')
      setValue('direccion_obra', partes, { shouldDirty: true })
    }
  }

  const retencionPctW = watch('retencion_pct')
  const ispW = watch('inversion_sujeto_pasivo')

  const totals = useMemo(() => {
    const tipoIva = ivaResult?.porcentaje ?? watch('tipo_iva_default') ?? 21
    let baseImponible = 0
    for (const c of capitulos ?? []) {
      for (const p of c.partidas ?? []) {
        baseImponible += (Number(p.cantidad) || 0) * (Number(p.precio_unitario) || 0)
      }
    }
    const t = calcularTotales({
      baseImponible,
      tipoIva,
      retencionPct: Number(retencionPctW) || 0,
      inversionSujetoPasivo: !!ispW,
    })
    return { ...t, tipoIva }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capitulos, ivaResult, retencionPctW, ispW])

  async function onSubmit(data: PresupuestoFormData) {
    if (!empresaId) {
      toast({ title: 'Error', description: 'No se encontró tu empresa', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      // 1) Update cabecera
      const { error: updErr } = await supabase
        .from('presupuestos')
        .update({
          cliente_id: data.cliente_id || null,
          titulo: data.titulo,
          direccion_obra: data.direccion_obra || null,
          tipo_iva_default: data.tipo_iva_default,
          motivo_iva_reducido: data.motivo_iva_reducido || null,
          base_imponible: totals.baseImponible,
          cuota_iva: totals.cuotaIva,
          total: totals.total,
          retencion_pct: data.retencion_pct ?? 0,
          retencion_importe: totals.retencionImporte,
          inversion_sujeto_pasivo: data.inversion_sujeto_pasivo ?? false,
          motivo_isp: data.inversion_sujeto_pasivo
            ? data.motivo_isp || LEYENDA_ISP
            : null,
          total_a_cobrar: totals.totalACobrar,
          notas_cliente: data.notas_cliente || null,
          notas_internas: data.notas_internas || null,
          exclusiones: data.exclusiones || null,
          forma_pago: data.forma_pago || null,
          plazo_ejecucion_dias: data.plazo_ejecucion_dias
            ? Number(data.plazo_ejecucion_dias)
            : null,
          garantia_meses: data.garantia_meses ? Number(data.garantia_meses) : null,
          // biome-ignore lint/suspicious/noExplicitAny: db update
        } as any)
        .eq('id', params.id)

      if (updErr) throw new Error(updErr.message)

      // 2) Borrar capítulos y partidas previas (cascade desde capítulos no aplica
      //    a partidas que tienen capitulo_id ON DELETE SET NULL; las borramos a mano)
      const { error: delPartErr } = await supabase
        .from('presupuesto_partidas')
        .delete()
        .eq('presupuesto_id', params.id)
      if (delPartErr) throw new Error(delPartErr.message)

      const { error: delCapErr } = await supabase
        .from('presupuesto_capitulos')
        .delete()
        .eq('presupuesto_id', params.id)
      if (delCapErr) throw new Error(delCapErr.message)

      // 3) Reinsertar capítulos y partidas
      let ordenPart = 0
      for (let ci = 0; ci < data.capitulos.length; ci++) {
        const cap = data.capitulos[ci]
        const { data: capRow, error: capErr } = await supabase
          .from('presupuesto_capitulos')
          .insert({
            presupuesto_id: params.id,
            orden: ci + 1,
            nombre: cap.nombre,
            capitulo_sistema: cap.capitulo_sistema ?? null,
            // biome-ignore lint/suspicious/noExplicitAny: db insert
          } as any)
          .select('id')
          .single()
        if (capErr || !capRow) throw new Error(capErr?.message ?? 'Error capítulo')

        if (cap.partidas.length > 0) {
          const partidasInsert = cap.partidas.map((p) => ({
            presupuesto_id: params.id,
            capitulo_id: capRow.id,
            partida_biblioteca_id: p.partida_biblioteca_id ?? null,
            orden: ++ordenPart,
            descripcion: p.descripcion,
            unidad: p.unidad,
            cantidad: Number(p.cantidad),
            precio_unitario: Number(p.precio_unitario),
            tipo_iva: p.tipo_iva,
          }))
          const { error: partErr } = await supabase
            .from('presupuesto_partidas')
            // biome-ignore lint/suspicious/noExplicitAny: db insert
            .insert(partidasInsert as any)
          if (partErr) throw new Error(partErr.message)
        }
      }

      toast({ title: 'Presupuesto actualizado' })
      router.push(`/presupuestos/${params.id}`)
    } catch (err) {
      toast({
        title: 'Error al guardar',
        description: err instanceof Error ? err.message : 'Inténtalo de nuevo',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (isLoading || !presupuesto) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // biome-ignore lint/suspicious/noExplicitAny: db data
  const numero = (presupuesto as any).numero

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={`/presupuestos/${params.id}`}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Editar {numero}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Cliente
          </h2>
          {clienteSeleccionado ? (
            <ClientePreview
              cliente={clienteSeleccionado}
              onChange={() => setPickerOpen(true)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="flex w-full items-center gap-3 rounded-[--radius] border-2 border-dashed border-[--color-border] bg-[--color-card] p-5 text-left transition-colors hover:border-[--color-primary]/50 hover:bg-[--color-primary]/5"
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[--color-muted]">
                <UserPlus className="h-6 w-6 text-[--color-muted-foreground]" />
              </div>
              <div className="flex-1">
                <p className="text-base font-semibold text-[--color-foreground]">
                  Elegir cliente
                </p>
              </div>
            </button>
          )}
          <input type="hidden" {...register('cliente_id')} />
          {errors.cliente_id && (
            <p className="text-sm text-red-600">{errors.cliente_id.message}</p>
          )}
          {empresaId && (
            <ClientePicker
              open={pickerOpen}
              onOpenChange={setPickerOpen}
              empresaId={empresaId}
              selectedId={clienteSeleccionado?.id ?? null}
              onSelect={selectCliente}
            />
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Datos del presupuesto
          </h2>
          <div className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input id="titulo" {...register('titulo')} aria-invalid={!!errors.titulo} />
            {errors.titulo && <p className="text-sm text-red-600">{errors.titulo.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="direccion_obra">Dirección de la obra</Label>
            <Input id="direccion_obra" {...register('direccion_obra')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="forma_pago">Forma de pago</Label>
            <Input id="forma_pago" {...register('forma_pago')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="plazo_ejecucion_dias">Plazo (días)</Label>
              <Input
                id="plazo_ejecucion_dias"
                type="number"
                inputMode="numeric"
                {...register('plazo_ejecucion_dias')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="garantia_meses">Garantía (meses)</Label>
              <Input
                id="garantia_meses"
                type="number"
                inputMode="numeric"
                {...register('garantia_meses')}
              />
            </div>
          </div>
        </section>

        {/* IVA wizard (opcional, sólo si quiere recalcular) */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Tipo de IVA
          </h2>
          <p className="text-xs text-[--color-muted-foreground]">
            Actualmente: {watch('tipo_iva_default')}%. Usa el asistente sólo si quieres cambiarlo.
          </p>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              1. ¿La obra es en vivienda particular del cliente final?
            </p>
            <div className="flex gap-3">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => {
                    setIvaQ1(v)
                    if (!v) {
                      setIvaQ2(null)
                      setIvaQ3(null)
                    } else if (ivaQ1 !== true) {
                      setIvaQ2(null)
                      setIvaQ3(null)
                    }
                  }}
                  className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                    ivaQ1 === v
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400'
                  }`}
                >
                  {v ? 'Sí' : 'No'}
                </button>
              ))}
            </div>
          </div>

          {ivaQ1 === true && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                2. ¿El cliente vive habitualmente o va a vivir en esa vivienda?
              </p>
              <div className="flex gap-3">
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => {
                      setIvaQ2(v)
                      if (!v) setIvaQ3(null)
                    }}
                    className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                      ivaQ2 === v
                        ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {v ? 'Sí' : 'No'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {ivaQ1 === true && ivaQ2 === true && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                3. ¿El coste de los materiales que pones tú supera el 40% del presupuesto?
              </p>
              <div className="flex gap-3">
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => setIvaQ3(v)}
                    className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                      ivaQ3 === v
                        ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {v ? 'Sí' : 'No'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {ivaResult && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                    IVA aplicable: {ivaResult.porcentaje}%
                  </p>
                  <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                    {ivaResult.motivo}
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Capítulos y partidas
          </h2>
          {errors.capitulos && 'message' in errors.capitulos && errors.capitulos.message && (
            <p className="text-sm text-red-600">{errors.capitulos.message as string}</p>
          )}

          {empresaId ? (
            <CapitulosEditor
              control={control as never}
              register={register as never}
              empresaId={empresaId}
              capituloIvaDefault={
                (ivaResult?.porcentaje ?? watch('tipo_iva_default') ?? 21) as 0 | 4 | 10 | 21
              }
            />
          ) : (
            <p className="text-sm text-[--color-muted-foreground]">Cargando empresa…</p>
          )}
        </section>

        <section className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Base imponible</span>
              <span className="font-medium">{formatCurrency(totals.baseImponible)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">IVA {totals.tipoIva}%</span>
              <span className="font-medium">{formatCurrency(totals.cuotaIva)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 dark:border-gray-700">
              <div className="flex justify-between">
                <span className="text-base font-bold">Total</span>
                <span className="text-xl font-bold">{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notas</h2>
          <div className="space-y-2">
            <Label htmlFor="notas_cliente">Notas para el cliente</Label>
            <Textarea id="notas_cliente" rows={3} {...register('notas_cliente')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="exclusiones">Exclusiones</Label>
            <Textarea id="exclusiones" rows={3} {...register('exclusiones')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notas_internas">Notas internas</Label>
            <Textarea id="notas_internas" rows={3} {...register('notas_internas')} />
          </div>
        </section>

        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando…
            </>
          ) : (
            'Guardar cambios'
          )}
        </Button>
      </form>
    </div>
  )
}
