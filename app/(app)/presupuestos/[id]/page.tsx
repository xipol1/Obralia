'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Pencil,
  FileDown,
  MessageCircle,
  Loader2,
  Droplets,
  Grid3x3,
  Hammer,
  Home,
  MoreHorizontal,
  Paintbrush,
  ShowerHead,
  Square,
  BrickWall,
  Wind,
  Zap,
  PenLine,
  Receipt,
  type LucideIcon,
} from 'lucide-react'
import { FirmaDialog } from '@/components/presupuesto/FirmaDialog'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge, type BadgeVariant } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { getCapituloMeta, type CapituloSistema } from '@/types/domain'

type Estado = 'borrador' | 'enviado' | 'aceptado' | 'rechazado' | 'caducado'

const ESTADO_BADGE: Record<Estado, { variant: BadgeVariant; label: string }> = {
  borrador: { variant: 'muted', label: 'Borrador' },
  enviado: { variant: 'info', label: 'Enviado' },
  aceptado: { variant: 'success', label: 'Aceptado' },
  rechazado: { variant: 'destructive', label: 'Rechazado' },
  caducado: { variant: 'warning', label: 'Caducado' },
}

const UNIDAD_DISPLAY: Record<string, string> = {
  m2: 'm²',
  m3: 'm³',
  ml: 'ml',
  ud: 'ud',
  h: 'h',
  kg: 'kg',
  pa: 'p.a.',
}

const ICON_MAP: Record<string, LucideIcon> = {
  Hammer,
  BrickWall,
  Droplets,
  Zap,
  Paintbrush,
  Grid3x3,
  Square,
  Wind,
  Home,
  ShowerHead,
  MoreHorizontal,
}

function CapituloIcon({
  capituloSistema,
  className,
}: {
  capituloSistema: CapituloSistema | null | undefined
  className?: string
}) {
  const meta = getCapituloMeta(capituloSistema)
  if (!meta) return null
  const Icon = ICON_MAP[meta.icon] ?? MoreHorizontal
  return <Icon className={className ?? `h-4 w-4 ${meta.color}`} aria-hidden />
}

interface PartidaRow {
  id: string
  capitulo_id: string | null
  descripcion: string
  unidad: string
  cantidad: number
  precio_unitario: number
  importe: number
  orden: number
}

interface CapituloRow {
  id: string
  nombre: string
  capitulo_sistema: CapituloSistema | null
  orden: number
}

export default function PresupuestoDetailPage() {
  const params = useParams<{ id: string }>()
  const supabase = useMemo(() => createClient(), [])
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [firmaOpen, setFirmaOpen] = useState(false)
  const [creandoFactura, setCreandoFactura] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['presupuesto', params.id],
    queryFn: async () => {
      const { data: presupuesto, error } = await supabase
        .from('presupuestos')
        .select(
          '*, clientes(nombre, apellidos, razon_social, nif, direccion, telefono), presupuesto_capitulos(*), presupuesto_partidas(*)',
        )
        .eq('id', params.id)
        .single()

      if (error) throw error
      return presupuesto
    },
  })

  function clienteNombre(cliente: {
    nombre?: string | null
    apellidos?: string | null
    razon_social?: string | null
  } | null) {
    if (!cliente) return 'Sin cliente'
    if (cliente.razon_social) return cliente.razon_social
    return [cliente.nombre, cliente.apellidos].filter(Boolean).join(' ') || 'Sin nombre'
  }

  async function handleConvertirAFactura() {
    if (!data) return
    setCreandoFactura(true)
    try {
      // biome-ignore lint/suspicious/noExplicitAny: supabase rels
      const d = data as any
      const { data: existing } = await supabase
        .from('facturas')
        .select('id')
        .eq('presupuesto_id', d.id)
        .maybeSingle()
      if (existing) {
        toast({
          title: 'Ya existe una factura',
          description: 'Te llevamos a la factura existente.',
        })
        window.location.href = `/facturas/${existing.id}`
        return
      }

      const { siguienteNumero } = await import('@/lib/numbering')
      const numero = await siguienteNumero(supabase, d.empresa_id, 'factura')

      const hoy = new Date()
      const dias = 30
      const venc = new Date(hoy.getTime() + dias * 86400000)

      const { data: factura, error } = await supabase
        .from('facturas')
        .insert({
          empresa_id: d.empresa_id,
          presupuesto_id: d.id,
          cliente_id: d.cliente_id,
          numero,
          fecha_emision: hoy.toISOString().slice(0, 10),
          fecha_devengo: hoy.toISOString().slice(0, 10),
          base_imponible: d.base_imponible,
          cuota_iva: d.cuota_iva,
          total: d.total,
          estado: 'emitida',
          tipo_factura: 'normal',
          titulo: d.titulo,
          direccion_obra: d.direccion_obra,
          tipo_iva_default: d.tipo_iva_default,
          motivo_iva_reducido: d.motivo_iva_reducido,
          notas_cliente: d.notas_cliente,
          forma_pago: d.forma_pago,
          // Propagar retención e ISP del presupuesto firmado
          retencion_pct: d.retencion_pct ?? 0,
          retencion_importe: d.retencion_importe ?? 0,
          inversion_sujeto_pasivo: !!d.inversion_sujeto_pasivo,
          motivo_isp: d.motivo_isp ?? null,
          total_a_cobrar: d.total_a_cobrar ?? d.total,
          // Ciclo de cobro: 30 días por defecto
          dias_pago: dias,
          fecha_vencimiento: venc.toISOString().slice(0, 10),
          importe_cobrado: 0,
          // biome-ignore lint/suspicious/noExplicitAny: db insert
        } as any)
        .select('id')
        .single()
      if (error || !factura) throw new Error(error?.message ?? 'Error creando factura')

      // Copia capítulos
      const mapeoCap = new Map<string, string>()
      const caps = (d.presupuesto_capitulos ?? []) as Array<{
        id: string
        nombre: string
        capitulo_sistema: CapituloSistema | null
        orden: number
      }>
      for (const c of caps.slice().sort((a, b) => a.orden - b.orden)) {
        const { data: nuevoCap, error: cErr } = await supabase
          .from('factura_capitulos')
          .insert({
            factura_id: factura.id,
            orden: c.orden,
            nombre: c.nombre,
            capitulo_sistema: c.capitulo_sistema,
            // biome-ignore lint/suspicious/noExplicitAny: db insert
          } as any)
          .select('id')
          .single()
        if (cErr || !nuevoCap) throw new Error(cErr?.message ?? 'Error capítulo factura')
        mapeoCap.set(c.id, nuevoCap.id)
      }

      const parts = (d.presupuesto_partidas ?? []) as Array<{
        id: string
        capitulo_id: string | null
        partida_biblioteca_id?: string | null
        orden: number
        descripcion: string
        unidad: string
        cantidad: number
        precio_unitario: number
        tipo_iva: number
      }>
      const partInsert = parts.map((p) => ({
        factura_id: factura.id,
        capitulo_id: p.capitulo_id ? mapeoCap.get(p.capitulo_id) ?? null : null,
        partida_biblioteca_id: p.partida_biblioteca_id ?? null,
        orden: p.orden,
        descripcion: p.descripcion,
        unidad: p.unidad,
        cantidad: Number(p.cantidad),
        precio_unitario: Number(p.precio_unitario),
        tipo_iva: p.tipo_iva,
      }))
      if (partInsert.length > 0) {
        const { error: pErr } = await supabase
          .from('factura_partidas')
          // biome-ignore lint/suspicious/noExplicitAny: db insert
          .insert(partInsert as any)
        if (pErr) throw new Error(pErr.message)
      }

      toast({ title: 'Factura creada', description: `Nº ${numero}` })
      window.location.href = `/facturas/${factura.id}`
    } catch (err) {
      toast({
        title: 'Error al crear factura',
        description: err instanceof Error ? err.message : 'Inténtalo de nuevo',
        variant: 'destructive',
      })
    } finally {
      setCreandoFactura(false)
    }
  }

  async function handleGenerarPdf() {
    setGeneratingPdf(true)
    try {
      const res = await fetch(`/api/pdf/${params.id}`)
      const body = await res.json().catch(() => ({}))

      if (res.status === 501) {
        toast({
          title: 'Modo demo',
          description: body.error || 'La generación de PDF no está disponible en demo',
        })
        return
      }

      if (!res.ok) {
        throw new Error(body.error || 'Error generando PDF')
      }
      window.open(body.url, '_blank')
      toast({ title: 'PDF generado correctamente' })
    } catch (err) {
      toast({
        title: 'Error al generar PDF',
        description: err instanceof Error ? err.message : 'Inténtalo de nuevo',
        variant: 'destructive',
      })
    } finally {
      setGeneratingPdf(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-[--radius]" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <p className="text-center text-[--color-muted-foreground]">Presupuesto no encontrado</p>
      </div>
    )
  }

  const estado = data.estado as Estado
  const estadoInfo = ESTADO_BADGE[estado] ?? ESTADO_BADGE.borrador

  // biome-ignore lint/suspicious/noExplicitAny: supabase rels
  const partidas = ((data as any).presupuesto_partidas as PartidaRow[]) ?? []
  // biome-ignore lint/suspicious/noExplicitAny: supabase rels
  const capitulos = ((data as any).presupuesto_capitulos as CapituloRow[]) ?? []
  // biome-ignore lint/suspicious/noExplicitAny: supabase rels
  const cliente = (data as any).clientes

  // Agrupar partidas por capítulo
  const partidasPorCap = new Map<string | null, PartidaRow[]>()
  for (const p of partidas) {
    const key = p.capitulo_id ?? null
    const arr = partidasPorCap.get(key) ?? []
    arr.push(p)
    partidasPorCap.set(key, arr)
  }
  for (const [, arr] of partidasPorCap) {
    arr.sort((a, b) => a.orden - b.orden)
  }
  const capitulosOrdenados = [...capitulos].sort((a, b) => a.orden - b.orden)
  const partidasSinCapitulo = partidasPorCap.get(null) ?? []

  return (
    <div className="mx-auto max-w-lg px-4 pb-32 pt-6">
      {/* Header */}
      <div className="mb-2 flex items-center gap-3">
        <Link
          href="/presupuestos"
          className="flex h-10 w-10 items-center justify-center rounded-[--radius] text-[--color-muted-foreground] transition-colors hover:bg-[--color-muted]"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-xl font-bold text-[--color-foreground]">
              Presupuesto {data.numero}
            </h1>
            <Badge variant={estadoInfo.variant}>{estadoInfo.label}</Badge>
          </div>
        </div>
      </div>
      <div className="mb-6 ml-13 pl-[3.25rem] text-xs text-[--color-muted-foreground]">
        {data.fecha_emision && (
          <span>Emitido el {formatDate(data.fecha_emision)}</span>
        )}
        {data.fecha_emision && data.fecha_validez && <span> · </span>}
        {data.fecha_validez && (
          <span>Válido hasta {formatDate(data.fecha_validez)}</span>
        )}
      </div>

      <div className="space-y-4">
        {/* Cliente */}
        <Card className="p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[--color-muted-foreground]">
            Cliente
          </h3>
          <p className="mt-2 text-base font-semibold text-[--color-foreground]">
            {clienteNombre(cliente)}
          </p>
          <dl className="mt-2 space-y-1 text-sm">
            {cliente?.nif && (
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-[--color-muted-foreground]">NIF</dt>
                <dd className="text-[--color-foreground]">{cliente.nif}</dd>
              </div>
            )}
            {cliente?.direccion && (
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-[--color-muted-foreground]">Dirección</dt>
                <dd className="text-[--color-foreground]">{cliente.direccion}</dd>
              </div>
            )}
            {cliente?.telefono && (
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-[--color-muted-foreground]">Teléfono</dt>
                <dd className="text-[--color-foreground]">{cliente.telefono}</dd>
              </div>
            )}
          </dl>
        </Card>

        {/* Obra */}
        <Card className="p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[--color-muted-foreground]">
            Obra
          </h3>
          <p className="mt-2 text-xl font-bold text-[--color-foreground]">
            {data.titulo || 'Sin título'}
          </p>
          {data.direccion_obra && (
            <p className="mt-1 text-sm text-[--color-muted-foreground]">
              {data.direccion_obra}
            </p>
          )}
        </Card>

        {/* Partidas agrupadas por capítulo */}
        <Card className="overflow-hidden">
          <div className="border-b border-[--color-border]/60 px-5 py-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[--color-muted-foreground]">
              Partidas
            </h3>
          </div>

          <div>
            {capitulosOrdenados.map((cap) => {
              const items = partidasPorCap.get(cap.id) ?? []
              const subtotal = items.reduce(
                (acc, p) => acc + Number(p.importe ?? 0),
                0,
              )
              return (
                <section key={cap.id}>
                  <div className="flex items-center justify-between gap-3 border-b border-[--color-border]/40 bg-[--color-muted]/50 px-5 py-2.5">
                    <div className="flex min-w-0 items-center gap-2">
                      {cap.capitulo_sistema && (
                        <CapituloIcon capituloSistema={cap.capitulo_sistema} />
                      )}
                      <p className="truncate text-base font-bold text-[--color-foreground]">
                        {cap.nombre}
                      </p>
                    </div>
                    <span className="tabular shrink-0 text-sm font-bold text-[--color-foreground]">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>

                  {items.length === 0 ? (
                    <p className="px-5 py-3 text-xs text-[--color-muted-foreground]">
                      Sin partidas en este capítulo.
                    </p>
                  ) : (
                    <div className="divide-y divide-[--color-border]/40">
                      {items.map((p) => (
                        <div key={p.id} className="px-5 py-3">
                          <p className="text-sm font-medium text-[--color-foreground]">
                            {p.descripcion}
                          </p>
                          <div className="mt-1 flex items-center justify-between text-xs">
                            <span className="tabular text-[--color-muted-foreground]">
                              {p.cantidad} {UNIDAD_DISPLAY[p.unidad] ?? p.unidad} ×{' '}
                              {formatCurrency(p.precio_unitario)}
                            </span>
                            <span className="tabular text-sm font-semibold text-[--color-foreground]">
                              {formatCurrency(p.importe)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )
            })}

            {/* Partidas legacy sin capítulo */}
            {partidasSinCapitulo.length > 0 && (
              <section>
                <div className="border-b border-[--color-border]/40 bg-[--color-muted]/30 px-5 py-2.5">
                  <p className="text-base font-bold text-[--color-muted-foreground]">
                    Sin agrupar
                  </p>
                </div>
                <div className="divide-y divide-[--color-border]/40">
                  {partidasSinCapitulo.map((p) => (
                    <div key={p.id} className="px-5 py-3">
                      <p className="text-sm font-medium text-[--color-foreground]">
                        {p.descripcion}
                      </p>
                      <div className="mt-1 flex items-center justify-between text-xs">
                        <span className="tabular text-[--color-muted-foreground]">
                          {p.cantidad} {UNIDAD_DISPLAY[p.unidad] ?? p.unidad} ×{' '}
                          {formatCurrency(p.precio_unitario)}
                        </span>
                        <span className="tabular text-sm font-semibold text-[--color-foreground]">
                          {formatCurrency(p.importe)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {capitulosOrdenados.length === 0 && partidasSinCapitulo.length === 0 && (
              <p className="px-5 py-6 text-center text-sm text-[--color-muted-foreground]">
                Aún no hay partidas en este presupuesto.
              </p>
            )}
          </div>
        </Card>

        {/* Totales */}
        <Card className="p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[--color-muted-foreground]">
            Totales
          </h3>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[--color-muted-foreground]">Base imponible</span>
              <span className="tabular font-medium text-[--color-foreground]">
                {formatCurrency(data.base_imponible ?? 0)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[--color-muted-foreground]">
                IVA {data.tipo_iva_default ?? 21}%
                {data.inversion_sujeto_pasivo && (
                  <span className="ml-1 text-amber-600">(no se cobra · ISP)</span>
                )}
              </span>
              <span className="tabular font-medium text-[--color-foreground]">
                {data.inversion_sujeto_pasivo
                  ? '—'
                  : formatCurrency(data.cuota_iva ?? 0)}
              </span>
            </div>
            {Number(data.retencion_pct ?? 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[--color-muted-foreground]">
                  Retención IRPF {data.retencion_pct}%
                </span>
                <span className="tabular font-medium text-red-600">
                  −{formatCurrency(Number(data.retencion_importe ?? 0))}
                </span>
              </div>
            )}
            {data.motivo_iva_reducido && !data.inversion_sujeto_pasivo && (
              <p className="text-xs text-[--color-muted-foreground]">
                {data.motivo_iva_reducido}
              </p>
            )}
            {data.inversion_sujeto_pasivo && (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {data.motivo_isp ||
                  'Operación con inversión del sujeto pasivo (art. 84.Uno.2.f LIVA).'}
              </p>
            )}
            <div className="border-t border-[--color-border] pt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-base font-bold text-[--color-foreground]">
                  {data.inversion_sujeto_pasivo ||
                  Number(data.retencion_pct ?? 0) > 0
                    ? 'Total a cobrar'
                    : 'Total'}
                </span>
                <span className="tabular text-2xl font-bold text-[--color-accent-foreground]">
                  {formatCurrency(
                    Number(data.total_a_cobrar ?? data.total ?? 0),
                  )}
                </span>
              </div>
              {(data.inversion_sujeto_pasivo ||
                Number(data.retencion_pct ?? 0) > 0) && (
                <div className="mt-1 flex justify-between text-xs text-[--color-muted-foreground]">
                  <span>Total con IVA</span>
                  <span>{formatCurrency(data.total ?? 0)}</span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Condiciones */}
        {(data.forma_pago || data.plazo_ejecucion_dias || data.garantia_meses) && (
          <Card className="p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[--color-muted-foreground]">
              Condiciones
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {data.forma_pago && (
                <div>
                  <p className="text-xs text-[--color-muted-foreground]">Forma de pago</p>
                  <p className="mt-0.5 text-sm font-medium text-[--color-foreground]">
                    {data.forma_pago}
                  </p>
                </div>
              )}
              {data.plazo_ejecucion_dias && (
                <div>
                  <p className="text-xs text-[--color-muted-foreground]">Plazo</p>
                  <p className="mt-0.5 text-sm font-medium text-[--color-foreground]">
                    {data.plazo_ejecucion_dias} días
                  </p>
                </div>
              )}
              {data.garantia_meses && (
                <div>
                  <p className="text-xs text-[--color-muted-foreground]">Garantía</p>
                  <p className="mt-0.5 text-sm font-medium text-[--color-foreground]">
                    {data.garantia_meses} meses
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Firma */}
        {(data.firma_url || data.firma_cliente_nombre) && (
          <Card className="p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[--color-muted-foreground]">
              Firma del cliente
            </h3>
            {data.firma_url && (
              // biome-ignore lint/performance/noImgElement: signed URL externa
              <img
                src={data.firma_url}
                alt="Firma del cliente"
                className="mt-3 max-h-32 rounded border border-[--color-border] bg-white p-2"
              />
            )}
            <div className="mt-2 text-sm text-[--color-foreground]">
              {data.firma_cliente_nombre ?? '—'}
            </div>
            {data.firma_cliente_at && (
              <div className="text-xs text-[--color-muted-foreground]">
                Firmado el {formatDate(data.firma_cliente_at)}
              </div>
            )}
          </Card>
        )}

        {/* Notas y exclusiones */}
        {(data.notas_cliente || data.exclusiones) && (
          <Card className="space-y-4 p-5">
            {data.notas_cliente && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[--color-muted-foreground]">
                  Notas
                </h4>
                <p className="mt-1.5 whitespace-pre-wrap text-sm text-[--color-foreground]">
                  {data.notas_cliente}
                </p>
              </div>
            )}
            {data.exclusiones && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[--color-muted-foreground]">
                  Exclusiones
                </h4>
                <p className="mt-1.5 whitespace-pre-wrap text-sm text-[--color-foreground]">
                  {data.exclusiones}
                </p>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Sticky bottom action bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[--color-border]/60 bg-[--color-card]/95 backdrop-blur supports-[backdrop-filter]:bg-[--color-card]/80">
        <div className="mx-auto flex max-w-lg flex-wrap gap-2 px-4 py-3">
          <Link
            href={`/presupuestos/${params.id}/editar`}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-[--radius] border-2 border-[--color-border] bg-[--color-card] text-sm font-semibold text-[--color-foreground] transition-colors hover:bg-[--color-muted]"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Link>
          <Button
            variant="accent"
            className="flex-1"
            onClick={handleGenerarPdf}
            disabled={generatingPdf}
          >
            {generatingPdf ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                PDF...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4" />
                Generar PDF
              </>
            )}
          </Button>
          {data.pdf_url && (
            <Link
              href={`/presupuestos/${params.id}/enviar`}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-[--radius] bg-[#25D366] text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1da851]"
            >
              <MessageCircle className="h-4 w-4" />
              Enviar
            </Link>
          )}
          {!data.firma_url && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setFirmaOpen(true)}
            >
              <PenLine className="h-4 w-4" />
              Firmar
            </Button>
          )}
          {data.firma_url && estado === 'aceptado' && (
            <Button
              variant="accent"
              className="flex-1"
              onClick={handleConvertirAFactura}
              disabled={creandoFactura}
            >
              {creandoFactura ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creando…
                </>
              ) : (
                <>
                  <Receipt className="h-4 w-4" />
                  Crear factura
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <FirmaDialog
        open={firmaOpen}
        onOpenChange={setFirmaOpen}
        presupuestoId={params.id}
        // biome-ignore lint/suspicious/noExplicitAny: supabase row
        empresaId={(data as any).empresa_id}
        defaultNombre={
          cliente
            ? cliente.razon_social ??
              [cliente.nombre, cliente.apellidos].filter(Boolean).join(' ')
            : ''
        }
        onFirmado={() => {
          queryClient.invalidateQueries({ queryKey: ['presupuesto', params.id] })
        }}
      />
    </div>
  )
}
