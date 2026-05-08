'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, BadgeEuro, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge, type BadgeVariant } from '@/components/ui/badge'
import { CobroDialog } from '@/components/factura/CobroDialog'
import { estadoCobro, LEYENDA_ISP } from '@/lib/fiscal/retencion-isp'

type Estado = 'emitida' | 'pagada' | 'rectificada' | 'parcial' | 'vencida' | 'anulada'

const ESTADO_BADGE: Record<Estado, { variant: BadgeVariant; label: string }> = {
  emitida: { variant: 'info', label: 'Emitida' },
  pagada: { variant: 'success', label: 'Pagada' },
  rectificada: { variant: 'warning', label: 'Rectificada' },
  parcial: { variant: 'warning', label: 'Cobro parcial' },
  vencida: { variant: 'destructive', label: 'Vencida' },
  anulada: { variant: 'muted', label: 'Anulada' },
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

export default function FacturaDetailPage() {
  const params = useParams<{ id: string }>()
  const supabase = useMemo(() => createClient(), [])
  const queryClient = useQueryClient()
  const [cobroOpen, setCobroOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['factura', params.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facturas')
        .select(
          '*, clientes(*), factura_capitulos(*), factura_partidas(*)',
        )
        .eq('id', params.id)
        .single()
      if (error) throw error
      return data
    },
  })

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <p className="text-center text-[--color-muted-foreground]">
          Factura no encontrada
        </p>
      </div>
    )
  }

  // Estado real combinando importe cobrado + vencimiento.
  const totalACobrar = Number(data.total_a_cobrar ?? data.total ?? 0)
  const importeCobrado = Number(data.importe_cobrado ?? 0)
  const cobroEstado = estadoCobro({
    total: totalACobrar,
    importeCobrado,
    fechaVencimiento: data.fecha_vencimiento,
  })
  const estadoEfectivo: Estado =
    data.estado === 'pagada' || cobroEstado === 'cobrada'
      ? 'pagada'
      : cobroEstado === 'parcial'
        ? 'parcial'
        : cobroEstado === 'vencida'
          ? 'vencida'
          : (data.estado as Estado)
  const estadoInfo = ESTADO_BADGE[estadoEfectivo] ?? ESTADO_BADGE.emitida
  // biome-ignore lint/suspicious/noExplicitAny: supabase rels
  const cliente = (data as any).clientes
  // biome-ignore lint/suspicious/noExplicitAny: supabase rels
  const capitulos = (((data as any).factura_capitulos ?? []) as Array<{
    id: string
    nombre: string
    orden: number
  }>)
    .slice()
    .sort((a, b) => a.orden - b.orden)
  // biome-ignore lint/suspicious/noExplicitAny: supabase rels
  const partidas = (((data as any).factura_partidas ?? []) as Array<{
    id: string
    capitulo_id: string | null
    descripcion: string
    unidad: string
    cantidad: number
    precio_unitario: number
    importe: number
    orden: number
  }>)
    .slice()
    .sort((a, b) => a.orden - b.orden)

  const partidasPorCap = new Map<string | null, typeof partidas>()
  for (const p of partidas) {
    const k = p.capitulo_id
    const arr = partidasPorCap.get(k) ?? []
    arr.push(p)
    partidasPorCap.set(k, arr)
  }

  function clienteNombre() {
    if (!cliente) return 'Sin cliente'
    if (cliente.razon_social) return cliente.razon_social
    return (
      [cliente.nombre, cliente.apellidos].filter(Boolean).join(' ') ||
      'Sin nombre'
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-12 pt-6">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/facturas"
          className="flex h-10 w-10 items-center justify-center rounded-[--radius] text-[--color-muted-foreground] hover:bg-[--color-muted]"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-xl font-bold text-[--color-foreground]">
              Factura {data.numero}
            </h1>
            <Badge variant={estadoInfo.variant}>{estadoInfo.label}</Badge>
          </div>
          <p className="mt-0.5 text-xs text-[--color-muted-foreground]">
            {data.fecha_emision && (
              <>Emitida el {formatDate(data.fecha_emision)}</>
            )}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <Card className="p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[--color-muted-foreground]">
            Cliente
          </h3>
          <p className="mt-2 text-base font-semibold text-[--color-foreground]">
            {clienteNombre()}
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
          </dl>
        </Card>

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

        <Card className="overflow-hidden">
          <div className="border-b border-[--color-border]/60 px-5 py-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[--color-muted-foreground]">
              Partidas
            </h3>
          </div>
          {capitulos.map((cap) => {
            const items = partidasPorCap.get(cap.id) ?? []
            const subtotal = items.reduce((s, p) => s + Number(p.importe ?? 0), 0)
            return (
              <section key={cap.id}>
                <div className="flex items-center justify-between border-b border-[--color-border]/40 bg-[--color-muted]/50 px-5 py-2.5">
                  <p className="truncate text-base font-bold text-[--color-foreground]">
                    {cap.nombre}
                  </p>
                  <span className="tabular shrink-0 text-sm font-bold text-[--color-foreground]">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="divide-y divide-[--color-border]/40">
                  {items.map((p) => (
                    <div key={p.id} className="px-5 py-3">
                      <p className="text-sm font-medium text-[--color-foreground]">
                        {p.descripcion}
                      </p>
                      <div className="mt-1 flex items-center justify-between text-xs">
                        <span className="tabular text-[--color-muted-foreground]">
                          {p.cantidad} {UNIDAD_DISPLAY[p.unidad] ?? p.unidad} ×{' '}
                          {formatCurrency(Number(p.precio_unitario))}
                        </span>
                        <span className="tabular text-sm font-semibold text-[--color-foreground]">
                          {formatCurrency(Number(p.importe))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )
          })}
          {capitulos.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-[--color-muted-foreground]">
              <FileText className="mx-auto mb-2 h-6 w-6" />
              Sin partidas
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[--color-muted-foreground]">
            Totales
          </h3>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[--color-muted-foreground]">Base imponible</span>
              <span className="tabular font-medium text-[--color-foreground]">
                {formatCurrency(Number(data.base_imponible ?? 0))}
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
                  : formatCurrency(Number(data.cuota_iva ?? 0))}
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
            <div className="border-t border-[--color-border] pt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-base font-bold text-[--color-foreground]">
                  Total a cobrar
                </span>
                <span className="tabular text-2xl font-bold text-[--color-accent-foreground]">
                  {formatCurrency(totalACobrar)}
                </span>
              </div>
              {(data.inversion_sujeto_pasivo ||
                Number(data.retencion_pct ?? 0) > 0) && (
                <div className="mt-1 flex justify-between text-xs text-[--color-muted-foreground]">
                  <span>Total con IVA</span>
                  <span>{formatCurrency(Number(data.total ?? 0))}</span>
                </div>
              )}
            </div>
            {data.inversion_sujeto_pasivo && (
              <p className="pt-2 text-xs text-amber-700 dark:text-amber-400">
                {data.motivo_isp || LEYENDA_ISP}
              </p>
            )}
          </div>
        </Card>

        {/* Estado de cobro */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[--color-muted-foreground]">
              Cobro
            </h3>
            <Badge variant={estadoInfo.variant}>{estadoInfo.label}</Badge>
          </div>
          <div className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-[--color-muted-foreground]">Cobrado</span>
              <span className="tabular font-medium">
                {formatCurrency(importeCobrado)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[--color-muted-foreground]">Pendiente</span>
              <span className="tabular font-semibold text-[--color-primary]">
                {formatCurrency(Math.max(0, totalACobrar - importeCobrado))}
              </span>
            </div>
            {data.fecha_vencimiento && (
              <div className="flex justify-between">
                <span className="text-[--color-muted-foreground]">
                  Vencimiento
                </span>
                <span
                  className={
                    cobroEstado === 'vencida'
                      ? 'font-semibold text-red-600'
                      : 'text-[--color-foreground]'
                  }
                >
                  {formatDate(data.fecha_vencimiento)}
                </span>
              </div>
            )}
            {data.fecha_cobro && (
              <div className="flex justify-between">
                <span className="text-[--color-muted-foreground]">Cobrada</span>
                <span className="text-[--color-foreground]">
                  {formatDate(data.fecha_cobro)}
                </span>
              </div>
            )}
          </div>
          {cobroEstado !== 'cobrada' && (
            <Button
              variant="accent"
              className="mt-4 w-full"
              onClick={() => setCobroOpen(true)}
            >
              <BadgeEuro className="h-4 w-4" />
              Registrar cobro
            </Button>
          )}
        </Card>

        {data.presupuesto_id && (
          <p className="text-center text-xs text-[--color-muted-foreground]">
            Generada desde{' '}
            <Link
              href={`/presupuestos/${data.presupuesto_id}`}
              className="font-semibold text-[--color-primary]"
            >
              presupuesto
            </Link>
          </p>
        )}
      </div>

      <CobroDialog
        open={cobroOpen}
        onOpenChange={setCobroOpen}
        facturaId={params.id}
        totalACobrar={totalACobrar}
        importeCobradoActual={importeCobrado}
        onCobroRegistrado={() => {
          queryClient.invalidateQueries({ queryKey: ['factura', params.id] })
        }}
      />
    </div>
  )
}
