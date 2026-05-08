'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Receipt, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge, type BadgeVariant } from '@/components/ui/badge'
import { estadoCobro, type EstadoCobro } from '@/lib/fiscal/retencion-isp'

const FILTROS = ['todas', 'pendientes', 'vencidas', 'cobradas'] as const
type Filtro = (typeof FILTROS)[number]

const ESTADO_BADGE: Record<
  EstadoCobro,
  { variant: BadgeVariant; label: string }
> = {
  pendiente: { variant: 'info', label: 'Pendiente' },
  parcial: { variant: 'warning', label: 'Parcial' },
  vencida: { variant: 'destructive', label: 'Vencida' },
  cobrada: { variant: 'success', label: 'Cobrada' },
}

interface FacturaRow {
  id: string
  numero: string
  titulo: string | null
  fecha_emision: string | null
  fecha_vencimiento: string | null
  total: number | null
  total_a_cobrar: number | null
  importe_cobrado: number | null
  estado: string
  clientes: {
    nombre: string | null
    apellidos: string | null
    razon_social: string | null
  } | null
}

export default function FacturasPage() {
  const supabase = createClient()
  const [filtro, setFiltro] = useState<Filtro>('todas')

  const { data: facturas, isLoading } = useQuery({
    queryKey: ['facturas-emitidas'],
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

      const { data, error } = await supabase
        .from('facturas')
        .select('*, clientes(nombre, apellidos, razon_social)')
        .eq('empresa_id', miembro.empresa_id)
        .order('fecha_emision', { ascending: false })
      if (error) throw error
      return data as unknown as FacturaRow[]
    },
  })

  /** Resumen agregado de cobros para el dashboard superior */
  const aging = useMemo(() => {
    const acc = {
      pendienteTotal: 0,
      vencidoTotal: 0,
      cobradoMes: 0,
      numVencidas: 0,
    }
    if (!facturas) return acc
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)
    for (const f of facturas) {
      const total = Number(f.total_a_cobrar ?? f.total ?? 0)
      const cobrado = Number(f.importe_cobrado ?? 0)
      const pendiente = Math.max(0, total - cobrado)
      const e = estadoCobro({
        total,
        importeCobrado: cobrado,
        fechaVencimiento: f.fecha_vencimiento,
      })
      if (e === 'cobrada') {
        // Acumular cobros del mes en curso si tenemos fecha de cobro reciente
        // Aproximación: si cobrada y fecha_emision en el mes
        if (f.fecha_emision && new Date(f.fecha_emision) >= inicioMes) {
          acc.cobradoMes += total
        }
      } else {
        acc.pendienteTotal += pendiente
        if (e === 'vencida') {
          acc.vencidoTotal += pendiente
          acc.numVencidas += 1
        }
      }
    }
    return acc
  }, [facturas])

  const filtered = useMemo(() => {
    if (!facturas) return []
    return facturas.filter((f) => {
      const e = estadoCobro({
        total: Number(f.total_a_cobrar ?? f.total ?? 0),
        importeCobrado: Number(f.importe_cobrado ?? 0),
        fechaVencimiento: f.fecha_vencimiento,
      })
      switch (filtro) {
        case 'todas':
          return true
        case 'pendientes':
          return e === 'pendiente' || e === 'parcial' || e === 'vencida'
        case 'vencidas':
          return e === 'vencida'
        case 'cobradas':
          return e === 'cobrada'
      }
    })
  }, [facturas, filtro])

  function clienteNombre(c: FacturaRow['clientes']) {
    if (!c) return 'Sin cliente'
    if (c.razon_social) return c.razon_social
    return [c.nombre, c.apellidos].filter(Boolean).join(' ') || 'Sin nombre'
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="text-2xl font-bold text-[--color-foreground]">Facturas</h1>
      <p className="mt-1 text-sm text-[--color-muted-foreground]">
        Las facturas se generan al firmar un presupuesto.
      </p>

      {/* Aging widget */}
      {(facturas?.length ?? 0) > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-[--radius] border border-[--color-border] bg-[--color-card] p-3">
            <p className="text-xs text-[--color-muted-foreground]">
              Te deben
            </p>
            <p className="mt-0.5 text-lg font-bold text-[--color-foreground]">
              {formatCurrency(aging.pendienteTotal)}
            </p>
          </div>
          <div
            className={`rounded-[--radius] border p-3 ${
              aging.vencidoTotal > 0
                ? 'border-red-300 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30'
                : 'border-[--color-border] bg-[--color-card]'
            }`}
          >
            <p className="text-xs text-[--color-muted-foreground]">
              Vencido
              {aging.numVencidas > 0 && ` (${aging.numVencidas})`}
            </p>
            <p
              className={`mt-0.5 text-lg font-bold ${
                aging.vencidoTotal > 0
                  ? 'text-red-700 dark:text-red-400'
                  : 'text-[--color-foreground]'
              }`}
            >
              {formatCurrency(aging.vencidoTotal)}
            </p>
          </div>
        </div>
      )}

      {/* Filtros */}
      {(facturas?.length ?? 0) > 0 && (
        <div className="mt-4 -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTROS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFiltro(f)}
              className={`inline-flex h-9 shrink-0 snap-start items-center rounded-full px-4 text-sm font-semibold capitalize transition-colors ${
                filtro === f
                  ? 'bg-[--color-primary] text-white'
                  : 'bg-[--color-muted] text-[--color-muted-foreground] hover:bg-[--color-muted]/70'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))
        ) : (filtered.length === 0 && (facturas?.length ?? 0) === 0) ? (
          <EmptyState
            icon={<Receipt />}
            title="Aún no hay facturas"
            description="Cuando un cliente firme un presupuesto, podrás convertirlo en factura desde la pantalla de detalle."
          />
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-[--color-muted-foreground]">
            Sin facturas en este filtro.
          </p>
        ) : (
          filtered.map((f) => {
            const total = Number(f.total_a_cobrar ?? f.total ?? 0)
            const cobrado = Number(f.importe_cobrado ?? 0)
            const e = estadoCobro({
              total,
              importeCobrado: cobrado,
              fechaVencimiento: f.fecha_vencimiento,
            })
            const info = ESTADO_BADGE[e]
            return (
              <Link
                key={f.id}
                href={`/facturas/${f.id}`}
                className="group block rounded-[--radius] border border-[--color-border]/60 bg-[--color-card] p-4 shadow-sm transition-all hover:border-[--color-primary]/30 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base font-bold text-[--color-foreground]">
                    {f.numero}
                  </span>
                  <Badge variant={info.variant}>
                    {e === 'vencida' && (
                      <AlertTriangle className="mr-1 h-3 w-3" />
                    )}
                    {info.label}
                  </Badge>
                </div>
                <p className="mt-1 line-clamp-1 text-base font-semibold text-[--color-foreground]">
                  {f.titulo || 'Sin título'}
                </p>
                <p className="mt-0.5 line-clamp-1 text-sm text-[--color-muted-foreground]">
                  {clienteNombre(f.clientes)}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-[--color-muted-foreground]">
                    {f.fecha_vencimiento
                      ? `Vence ${formatDate(f.fecha_vencimiento)}`
                      : f.fecha_emision
                        ? formatDate(f.fecha_emision)
                        : ''}
                  </span>
                  <span className="tabular text-lg font-bold text-[--color-foreground]">
                    {formatCurrency(total)}
                  </span>
                </div>
                {e === 'parcial' && (
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-[--color-muted-foreground]">
                      Cobrado {formatCurrency(cobrado)}
                    </span>
                    <span className="font-semibold text-[--color-primary]">
                      Pendiente {formatCurrency(total - cobrado)}
                    </span>
                  </div>
                )}
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
