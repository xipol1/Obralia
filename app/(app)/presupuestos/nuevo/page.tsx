'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Info, BookTemplate, UserPlus } from 'lucide-react'
import { presupuestoSchema, type PresupuestoFormData } from '@/schemas/presupuesto'
import {
  listarPlantillas,
  obtenerPlantilla,
  type PlantillaResumen,
} from '@/lib/plantillas'
import { createClient } from '@/lib/supabase/client'
import { siguienteNumero } from '@/lib/numbering'
import { calcularIvaAplicable, type IvaInput } from '@/lib/iva/calcular-iva'
import {
  calcularTotales,
  porcentajeRetencionSugerido,
  LEYENDA_ISP,
} from '@/lib/fiscal/retencion-isp'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CapitulosEditor } from '@/components/presupuesto/CapitulosEditor'
import { ClientePicker } from '@/components/cliente/ClientePicker'
import { ClientePreview } from '@/components/cliente/ClientePreview'
import type { Cliente } from '@/types/domain'

const LAST_CLIENTE_KEY = 'obralia-last-cliente-id'

function defaultFechaValidez(): string {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().slice(0, 10)
}

export default function NuevoPresupuestoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = useMemo(() => createClient(), [])
  const [saving, setSaving] = useState(false)
  const [showTemplates, setShowTemplates] = useState(true)

  // IVA wizard state
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
    formState: { errors },
  } = useForm<PresupuestoFormData>({
    // biome-ignore lint/suspicious/noExplicitAny: zod resolver typing
    resolver: zodResolver(presupuestoSchema) as any,
    defaultValues: {
      cliente_id: '',
      titulo: '',
      direccion_obra: '',
      // Por defecto IVA 10% (caso mayoritario: reforma vivienda residencial).
      // El asistente lo ajusta si el constructor lo cambia.
      tipo_iva_default: 10,
      motivo_iva_reducido: '',
      notas_cliente: '',
      notas_internas: '',
      exclusiones: '',
      // Defaults sensatos del sector para que el constructor no tenga que pensar.
      forma_pago: '50% al inicio, 50% a la finalización',
      // biome-ignore lint/suspicious/noExplicitAny: schema permite string vacío en estos campos
      plazo_ejecucion_dias: 30 as any,
      // biome-ignore lint/suspicious/noExplicitAny: schema permite string vacío en estos campos
      garantia_meses: 12 as any,
      retencion_pct: 0,
      inversion_sujeto_pasivo: false,
      motivo_isp: '',
      capitulos: [
        {
          id: typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : 'cap-0',
          nombre: 'General',
          capitulo_sistema: null,
          partidas: [],
        },
      ],
    },
  })

  const capitulos = watch('capitulos')
  const tituloActual = watch('titulo')
  const direccionObraActual = watch('direccion_obra')

  // Cliente seleccionado (objeto completo) + control del picker visual
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  // Empresa actual (con fecha de alta para sugerir 7% vs 15% de retención)
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
      const { data: empresa } = await supabase
        .from('empresas')
        .select('fecha_alta_actividad')
        .eq('id', miembro.empresa_id)
        .maybeSingle()
      return {
        empresaId: miembro.empresa_id,
        userId: user.id,
        fechaAltaActividad:
          // biome-ignore lint/suspicious/noExplicitAny: column nueva
          (empresa as any)?.fecha_alta_actividad ?? null,
      }
    },
  })
  const empresaId = empresaInfo?.empresaId

  // Plantillas (DB)
  const { data: plantillas } = useQuery({
    queryKey: ['plantillas-listado', empresaId],
    queryFn: () => listarPlantillas(supabase, empresaId!),
    enabled: !!empresaId,
  })

  // Estado: ¿el form está "vacío" (capítulo único sin partidas)?
  const isInitialState = useMemo(() => {
    return (
      capitulos.length === 1 &&
      (!capitulos[0]?.partidas || capitulos[0].partidas.length === 0)
    )
  }, [capitulos])

  const canShowTemplates = showTemplates && isInitialState

  async function handleSelectPlantilla(p: PlantillaResumen) {
    try {
      const completa = await obtenerPlantilla(supabase, p.id)
      if (!completa) {
        toast({ title: 'Plantilla no encontrada', variant: 'destructive' })
        return
      }

      // Mapear a estructura de capitulos del formulario
      const mapeoCaps = new Map<string, number>()
      const capitulosForm: PresupuestoFormData['capitulos'] =
        completa.capitulos.length > 0
          ? completa.capitulos.map((c, i) => {
              mapeoCaps.set(c.id, i)
              return {
                id:
                  typeof crypto !== 'undefined' && crypto.randomUUID
                    ? crypto.randomUUID()
                    : `cap-${i}`,
                nombre: c.nombre,
                capitulo_sistema: c.capitulo_sistema ?? null,
                partidas: [],
              }
            })
          : [
              {
                id:
                  typeof crypto !== 'undefined' && crypto.randomUUID
                    ? crypto.randomUUID()
                    : 'cap-0',
                nombre: 'General',
                capitulo_sistema: null,
                partidas: [],
              },
            ]

      // Distribuir partidas a sus capítulos
      for (const part of completa.partidas) {
        const idx = part.plantilla_capitulo_id
          ? mapeoCaps.get(part.plantilla_capitulo_id) ?? 0
          : 0
        capitulosForm[idx]?.partidas.push({
          descripcion: part.descripcion,
          unidad: part.unidad as PresupuestoFormData['capitulos'][number]['partidas'][number]['unidad'],
          cantidad: Number(part.cantidad_sugerida),
          precio_unitario: Number(part.precio_unitario_orientativo),
          tipo_iva: part.tipo_iva_sugerido as 0 | 4 | 10 | 21,
          partida_biblioteca_id: part.partida_biblioteca_id ?? null,
        })
      }

      setValue('capitulos', capitulosForm, { shouldValidate: false })
      if (!tituloActual || tituloActual.trim() === '') {
        setValue('titulo', completa.titulo_sugerido ?? completa.nombre)
      }

      toast({
        title: 'Plantilla cargada',
        description: 'Ajusta cantidades y precios a esta obra',
      })
      setShowTemplates(false)
    } catch (err) {
      toast({
        title: 'Error al cargar plantilla',
        description: err instanceof Error ? err.message : 'Inténtalo de nuevo',
        variant: 'destructive',
      })
    }
  }

  // Sincronizar IVA del wizard con form y partidas
  useEffect(() => {
    if (!ivaResult) return
    setValue('tipo_iva_default', ivaResult.porcentaje as 0 | 4 | 10 | 21)
    setValue(
      'motivo_iva_reducido',
      ivaResult.porcentaje < 21 ? ivaResult.motivo : '',
    )
    capitulos.forEach((cap, ci) => {
      cap.partidas?.forEach((_, pi) => {
        setValue(
          `capitulos.${ci}.partidas.${pi}.tipo_iva`,
          ivaResult.porcentaje as 0 | 4 | 10 | 21,
        )
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ivaResult])

  /**
   * Selecciona un cliente.
   * - Sincroniza cliente_id en el form.
   * - Auto-rellena direccion_obra con la del cliente si está vacía
   *   (la mayoría de reformas residenciales son en casa del cliente).
   * - Guarda como "último cliente usado" en localStorage para
   *   pre-seleccionarlo al crear el siguiente presupuesto.
   */
  function selectCliente(cliente: Cliente) {
    setClienteSeleccionado(cliente)
    setValue('cliente_id', cliente.id, { shouldDirty: true })

    // Autofill dirección de obra si el constructor no escribió una propia
    if (!direccionObraActual && cliente.direccion) {
      const partes = [
        cliente.direccion,
        cliente.codigo_postal,
        cliente.municipio,
      ]
        .filter(Boolean)
        .join(', ')
      setValue('direccion_obra', partes, { shouldDirty: true })
    }

    // Autoaplicar retención IRPF e ISP según perfil fiscal del cliente.
    // El usuario puede sobreescribir desde la sección "IVA y retenciones".
    if (cliente.aplica_retencion_irpf) {
      const pct = porcentajeRetencionSugerido(
        empresaInfo?.fechaAltaActividad ?? null,
      )
      setValue('retencion_pct', pct, { shouldDirty: true })
    } else {
      setValue('retencion_pct', 0, { shouldDirty: true })
    }
    setValue(
      'inversion_sujeto_pasivo',
      !!cliente.aplica_isp_construccion,
      { shouldDirty: true },
    )

    // Recordar para próximos presupuestos
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(LAST_CLIENTE_KEY, cliente.id)
      } catch {
        // ignorar quotas exceeded
      }
    }
  }

  // Pre-seleccionar el último cliente usado al cargar la página
  useEffect(() => {
    if (!empresaId || clienteSeleccionado) return
    if (typeof window === 'undefined') return
    let cancelled = false

    const lastId = window.localStorage.getItem(LAST_CLIENTE_KEY)
    if (!lastId) return

    ;(async () => {
      const { data } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', lastId)
        .eq('empresa_id', empresaId)
        .maybeSingle()
      if (cancelled || !data) return
      // No usamos selectCliente() para no marcar el form como dirty;
      // si el usuario quiere otro, basta con tocar "Cambiar".
      setClienteSeleccionado(data as Cliente)
      setValue('cliente_id', (data as Cliente).id)
    })()

    return () => {
      cancelled = true
    }
  }, [empresaId, clienteSeleccionado, supabase, setValue])

  const retencionPctW = watch('retencion_pct')
  const ispW = watch('inversion_sujeto_pasivo')

  // Totales (con retención IRPF e ISP)
  const totals = useMemo(() => {
    const tipoIva = ivaResult?.porcentaje ?? 21
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
  }, [capitulos, ivaResult, retencionPctW, ispW])

  async function onSubmit(data: PresupuestoFormData) {
    if (!empresaId) {
      toast({
        title: 'Error',
        description: 'No se encontró tu empresa',
        variant: 'destructive',
      })
      return
    }
    setSaving(true)
    try {
      const numero = await siguienteNumero(supabase, empresaId, 'presupuesto')

      // Insert presupuesto
      const { data: presupuesto, error: presError } = await supabase
        .from('presupuestos')
        .insert({
          empresa_id: empresaId,
          cliente_id: data.cliente_id || null,
          numero,
          titulo: data.titulo,
          direccion_obra: data.direccion_obra || null,
          estado: 'borrador',
          fecha_emision: new Date().toISOString().slice(0, 10),
          fecha_validez: defaultFechaValidez(),
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
          // biome-ignore lint/suspicious/noExplicitAny: db insert
        } as any)
        .select('id')
        .single()

      if (presError || !presupuesto) {
        toast({
          title: 'Error al crear presupuesto',
          description: presError?.message,
          variant: 'destructive',
        })
        return
      }

      // Insert capítulos y partidas
      let ordenPartidaGlobal = 0
      for (let ci = 0; ci < data.capitulos.length; ci++) {
        const cap = data.capitulos[ci]
        const { data: capRow, error: capErr } = await supabase
          .from('presupuesto_capitulos')
          .insert({
            presupuesto_id: presupuesto.id,
            orden: ci + 1,
            nombre: cap.nombre,
            capitulo_sistema: cap.capitulo_sistema ?? null,
            // biome-ignore lint/suspicious/noExplicitAny: db insert
          } as any)
          .select('id')
          .single()

        if (capErr || !capRow) {
          toast({
            title: 'Error al crear capítulo',
            description: capErr?.message,
            variant: 'destructive',
          })
          return
        }

        if (cap.partidas.length > 0) {
          const partidasInsert = cap.partidas.map((p) => ({
            presupuesto_id: presupuesto.id,
            capitulo_id: capRow.id,
            partida_biblioteca_id: p.partida_biblioteca_id ?? null,
            orden: ++ordenPartidaGlobal,
            descripcion: p.descripcion,
            unidad: p.unidad,
            cantidad: Number(p.cantidad),
            precio_unitario: Number(p.precio_unitario),
            importe: Number(p.cantidad) * Number(p.precio_unitario),
            tipo_iva: p.tipo_iva,
          }))

          const { error: partErr } = await supabase
            .from('presupuesto_partidas')
            // biome-ignore lint/suspicious/noExplicitAny: db insert
            .insert(partidasInsert as any)

          if (partErr) {
            toast({
              title: 'Error al crear partidas',
              description: partErr.message,
              variant: 'destructive',
            })
            return
          }
        }
      }

      toast({ title: 'Presupuesto creado correctamente' })
      router.push(`/presupuestos/${presupuesto.id}`)
    } catch (err) {
      toast({
        title: 'Error inesperado',
        description: err instanceof Error ? err.message : 'Inténtalo de nuevo',
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
          href="/presupuestos"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Nuevo presupuesto
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Plantillas */}
        {canShowTemplates ? (
          <section className="rounded-[--radius] border border-[--color-border] bg-[--color-card] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[--color-primary]">
                  ¿Empezar desde una plantilla?
                </h2>
                <p className="mt-1 text-sm text-[--color-muted-foreground]">
                  Carga capítulos y partidas típicas y ajústalos a esta obra
                </p>
              </div>
            </div>

            <div className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
              {(plantillas ?? []).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPlantilla(p)}
                  className="min-w-[220px] flex-shrink-0 cursor-pointer snap-start rounded-[--radius] border-2 border-[--color-border] bg-[--color-card] p-4 text-left transition-all hover:border-[--color-primary] active:scale-[0.98]"
                >
                  <div className="flex h-8 w-8 items-center justify-center text-2xl">
                    {p.icono ?? '📋'}
                  </div>
                  <p className="mt-2 font-bold text-[--color-primary]">
                    {p.nombre}
                  </p>
                  {p.descripcion && (
                    <p className="mt-1 line-clamp-2 text-sm text-[--color-muted-foreground]">
                      {p.descripcion}
                    </p>
                  )}
                  <p className="mt-3 text-xs text-[--color-muted-foreground]">
                    {p.num_partidas} partidas · ~
                    {Math.round(p.total_estimado).toLocaleString('es-ES')} €
                  </p>
                </button>
              ))}
              {(!plantillas || plantillas.length === 0) && (
                <p className="text-sm text-[--color-muted-foreground]">
                  No hay plantillas disponibles aún.
                </p>
              )}
            </div>

            <div className="mt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowTemplates(false)}
              >
                Empezar desde cero →
              </Button>
            </div>
          </section>
        ) : (
          isInitialState && (
            <div className="-mb-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowTemplates(true)}
              >
                <BookTemplate className="h-4 w-4" />
                Cargar plantilla
              </Button>
            </div>
          )
        )}

        {/* Cliente */}
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
                <p className="text-sm text-[--color-muted-foreground]">
                  Toca para buscar o crear uno nuevo
                </p>
              </div>
            </button>
          )}

          {/* Hidden input para que react-hook-form siga registrando cliente_id */}
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

        {/* Datos del presupuesto */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Datos del presupuesto
          </h2>

          <div className="space-y-2">
            <Label htmlFor="titulo">
              Título <span className="text-red-500">*</span>
            </Label>
            <Input
              id="titulo"
              placeholder="Reforma baño C/ Mayor 12"
              aria-invalid={!!errors.titulo}
              {...register('titulo')}
            />
            {errors.titulo && (
              <p className="text-sm text-red-600">{errors.titulo.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion_obra">Dirección de la obra</Label>
            <Input
              id="direccion_obra"
              placeholder="C/ Mayor 12, 2ºB, Madrid"
              {...register('direccion_obra')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="forma_pago">Forma de pago</Label>
            <Input
              id="forma_pago"
              placeholder="50% inicio, 50% fin de obra"
              {...register('forma_pago')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="plazo_ejecucion_dias">Plazo (días)</Label>
              <Input
                id="plazo_ejecucion_dias"
                type="number"
                inputMode="numeric"
                placeholder="30"
                {...register('plazo_ejecucion_dias')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="garantia_meses">Garantía (meses)</Label>
              <Input
                id="garantia_meses"
                type="number"
                inputMode="numeric"
                placeholder="12"
                {...register('garantia_meses')}
              />
            </div>
          </div>
        </section>

        {/* IVA Wizard */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Tipo de IVA
          </h2>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              1. ¿La obra es en vivienda particular del cliente final?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIvaQ1(true)
                  if (ivaQ1 !== true) {
                    setIvaQ2(null)
                    setIvaQ3(null)
                  }
                }}
                className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                  ivaQ1 === true
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400'
                }`}
              >
                Sí
              </button>
              <button
                type="button"
                onClick={() => {
                  setIvaQ1(false)
                  setIvaQ2(null)
                  setIvaQ3(null)
                }}
                className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                  ivaQ1 === false
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400'
                }`}
              >
                No
              </button>
            </div>
          </div>

          {ivaQ1 === true && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                2. ¿El cliente vive habitualmente en esa vivienda o va a vivir?
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIvaQ2(true)
                    if (ivaQ2 !== true) setIvaQ3(null)
                  }}
                  className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                    ivaQ2 === true
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400'
                  }`}
                >
                  Sí
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIvaQ2(false)
                    setIvaQ3(null)
                  }}
                  className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                    ivaQ2 === false
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400'
                  }`}
                >
                  No
                </button>
              </div>
            </div>
          )}

          {ivaQ1 === true && ivaQ2 === true && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                3. ¿El coste de los materiales que pones tú supera el 40% del presupuesto?
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIvaQ3(true)}
                  className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                    ivaQ3 === true
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400'
                  }`}
                >
                  Sí
                </button>
                <button
                  type="button"
                  onClick={() => setIvaQ3(false)}
                  className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                    ivaQ3 === false
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400'
                  }`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => setIvaQ3(null)}
                  className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                    ivaQ3 === null && ivaQ1 === true && ivaQ2 === true
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400'
                  }`}
                >
                  No lo sé
                </button>
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

          {/* Retención IRPF */}
          <div className="space-y-2">
            <Label htmlFor="retencion_pct">Retención IRPF (%)</Label>
            <div className="flex items-center gap-2">
              {[0, 7, 15].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() =>
                    setValue('retencion_pct', v, { shouldDirty: true })
                  }
                  className={`rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition-colors ${
                    Number(retencionPctW) === v
                      ? 'border-[--color-primary] bg-[--color-primary]/10 text-[--color-primary]'
                      : 'border-[--color-border] text-[--color-muted-foreground]'
                  }`}
                >
                  {v}%
                </button>
              ))}
              <Input
                id="retencion_pct"
                type="number"
                step="0.01"
                inputMode="decimal"
                className="w-24"
                {...register('retencion_pct', { valueAsNumber: true })}
              />
            </div>
            <p className="text-xs text-[--color-muted-foreground]">
              0% para particular. 7% si llevas &lt; 3 años de alta. 15% para
              empresas/autónomos en general.
            </p>
          </div>

          {/* Inversión sujeto pasivo */}
          <label className="flex items-start gap-3 rounded-lg border border-[--color-border] bg-[--color-card] p-3">
            <input
              type="checkbox"
              className="mt-0.5 h-5 w-5"
              checked={!!ispW}
              onChange={(e) =>
                setValue('inversion_sujeto_pasivo', e.target.checked, {
                  shouldDirty: true,
                })
              }
            />
            <span className="text-sm">
              <span className="font-medium">
                Inversión del sujeto pasivo (ISP)
              </span>
              <span className="block text-xs text-[--color-muted-foreground]">
                La factura se emitirá <strong>sin IVA</strong>. Aplica en
                ejecuciones de obra a empresario/promotor (art. 84.Uno.2.f LIVA).
              </span>
            </span>
          </label>
        </section>

        {/* Capítulos y partidas */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Capítulos y partidas
          </h2>
          {errors.capitulos && 'message' in errors.capitulos && errors.capitulos.message && (
            <p className="text-sm text-red-600">
              {errors.capitulos.message as string}
            </p>
          )}

          {empresaId ? (
            <CapitulosEditor
              control={control as never}
              register={register as never}
              empresaId={empresaId}
              capituloIvaDefault={(ivaResult?.porcentaje ?? 21) as 0 | 4 | 10 | 21}
            />
          ) : (
            <p className="text-sm text-[--color-muted-foreground]">
              Cargando empresa…
            </p>
          )}
        </section>

        {/* Totales */}
        <section className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Base imponible</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formatCurrency(totals.baseImponible)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                IVA {totals.tipoIva}%{' '}
                {ispW && <span className="text-amber-600">(no se cobra · ISP)</span>}
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {ispW ? '—' : formatCurrency(totals.cuotaIva)}
              </span>
            </div>
            {Number(retencionPctW) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Retención IRPF {retencionPctW}%
                </span>
                <span className="font-medium text-red-600">
                  −{formatCurrency(totals.retencionImporte)}
                </span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-2 dark:border-gray-700">
              <div className="flex justify-between">
                <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                  Total a cobrar
                </span>
                <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(totals.totalACobrar)}
                </span>
              </div>
              {(ispW || Number(retencionPctW) > 0) && (
                <div className="mt-1 flex justify-between text-xs text-[--color-muted-foreground]">
                  <span>Total con IVA</span>
                  <span>{formatCurrency(totals.total)}</span>
                </div>
              )}
            </div>
            {ivaResult && ivaResult.porcentaje < 21 && !ispW && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {ivaResult.motivo}
              </p>
            )}
            {ispW && (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {LEYENDA_ISP}
              </p>
            )}
          </div>
        </section>

        {/* Notas */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Notas
          </h2>

          <div className="space-y-2">
            <Label htmlFor="notas_cliente">Notas para el cliente</Label>
            <Textarea
              id="notas_cliente"
              placeholder="Notas visibles en el presupuesto"
              rows={3}
              {...register('notas_cliente')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exclusiones">Exclusiones</Label>
            <Textarea
              id="exclusiones"
              placeholder="No incluye permisos, tasas..."
              rows={3}
              {...register('exclusiones')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas_internas">Notas internas</Label>
            <Textarea
              id="notas_internas"
              placeholder="Solo visible para ti"
              rows={3}
              {...register('notas_internas')}
            />
          </div>
        </section>

        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar borrador'}
        </Button>
      </form>
    </div>
  )
}
