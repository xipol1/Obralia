'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { FileText, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge, type BadgeVariant } from '@/components/ui/badge'

type Estado = 'borrador' | 'enviado' | 'aceptado' | 'rechazado' | 'caducado'

const ESTADO_FILTERS = ['todos', 'borrador', 'enviado', 'aceptado'] as const
type FilterEstado = (typeof ESTADO_FILTERS)[number]

const ESTADO_LABELS: Record<FilterEstado, string> = {
  todos: 'Todos',
  borrador: 'Borrador',
  enviado: 'Enviado',
  aceptado: 'Aceptado',
}

const ESTADO_BADGE: Record<Estado, { variant: BadgeVariant; label: string }> = {
  borrador: { variant: 'muted', label: 'Borrador' },
  enviado: { variant: 'info', label: 'Enviado' },
  aceptado: { variant: 'success', label: 'Aceptado' },
  rechazado: { variant: 'destructive', label: 'Rechazado' },
  caducado: { variant: 'warning', label: 'Caducado' },
}

export default function PresupuestosPage() {
  const supabase = createClient()
  const [filter, setFilter] = useState<FilterEstado>('todos')

  const { data: presupuestos, isLoading } = useQuery({
    queryKey: ['presupuestos'],
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
        .from('presupuestos')
        .select('*, clientes(nombre, apellidos, razon_social)')
        .eq('empresa_id', miembro.empresa_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
  })

  const filtered = useMemo(() => {
    if (!presupuestos) return []
    if (filter === 'todos') return presupuestos
    return presupuestos.filter((p) => p.estado === filter)
  }, [presupuestos, filter])

  const totalSum = useMemo(() => {
    if (!presupuestos) return 0
    return presupuestos.reduce((acc, p) => acc + (p.total ?? 0), 0)
  }, [presupuestos])

  const hasPresupuestos = (presupuestos?.length ?? 0) > 0

  function clienteNombre(cliente: {
    nombre?: string | null
    apellidos?: string | null
    razon_social?: string | null
  } | null) {
    if (!cliente) return 'Sin cliente'
    if (cliente.razon_social) return cliente.razon_social
    return [cliente.nombre, cliente.apellidos].filter(Boolean).join(' ') || 'Sin nombre'
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[--color-foreground]">
            Presupuestos
          </h1>
          {hasPresupuestos && (
            <p className="mt-1 text-sm text-[--color-muted-foreground]">
              {presupuestos!.length} {presupuestos!.length === 1 ? 'presupuesto' : 'presupuestos'} · {formatCurrency(totalSum)} en total
            </p>
          )}
        </div>
        {hasPresupuestos && (
          <Link
            href="/presupuestos/nuevo"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-[--radius] bg-[--color-accent] px-4 text-sm font-semibold text-[--color-accent-foreground] shadow-sm transition-colors hover:bg-[--color-accent]/90"
          >
            <Plus className="h-4 w-4" />
            Nuevo
          </Link>
        )}
      </div>

      {/* Filter pills */}
      {hasPresupuestos && (
        <div className="mt-5 -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ESTADO_FILTERS.map((estado) => {
            const isActive = filter === estado
            return (
              <button
                key={estado}
                type="button"
                onClick={() => setFilter(estado)}
                className={`inline-flex h-9 shrink-0 snap-start items-center rounded-full px-4 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-[--color-primary] text-white'
                    : 'bg-[--color-muted] text-[--color-muted-foreground] hover:bg-[--color-muted]/70'
                }`}
              >
                {ESTADO_LABELS[estado]}
              </button>
            )
          })}
        </div>
      )}

      {/* List */}
      <div className="mt-4 space-y-3">
        {isLoading ? (
          <>
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className="rounded-[--radius] border border-[--color-border]/60 bg-[--color-card] p-4 shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex items-center justify-between pt-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : filtered.length === 0 ? (
          filter !== 'todos' ? (
            <EmptyState
              icon={<FileText />}
              title="Sin resultados"
              description={`No tienes presupuestos en estado "${ESTADO_LABELS[filter]}"`}
            />
          ) : (
            <EmptyState
              icon={<FileText />}
              title="Aún no tienes presupuestos"
              description="Crea tu primer presupuesto en 2 minutos. Tenemos plantillas para empezar rápido."
              action={
                <Link
                  href="/presupuestos/nuevo"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-[--radius] bg-[--color-accent] px-8 text-base font-semibold text-[--color-accent-foreground] shadow-sm transition-colors hover:bg-[--color-accent]/90"
                >
                  <Plus className="h-5 w-5" />
                  Crear presupuesto
                </Link>
              }
            />
          )
        ) : (
          filtered.map((presupuesto) => {
            const estadoInfo = ESTADO_BADGE[presupuesto.estado as Estado] ?? ESTADO_BADGE.borrador
            return (
              <Link
                key={presupuesto.id}
                href={`/presupuestos/${presupuesto.id}`}
                className="group block rounded-[--radius] border border-[--color-border]/60 bg-[--color-card] p-4 shadow-sm transition-all hover:border-[--color-primary]/30 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base font-bold text-[--color-foreground]">
                    {presupuesto.numero}
                  </span>
                  <Badge variant={estadoInfo.variant}>{estadoInfo.label}</Badge>
                </div>
                <p className="mt-1 line-clamp-1 text-base font-semibold text-[--color-foreground]">
                  {presupuesto.titulo || 'Sin título'}
                </p>
                <p className="mt-0.5 line-clamp-1 text-sm text-[--color-muted-foreground]">
                  {clienteNombre(presupuesto.clientes as any)}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-[--color-muted-foreground]">
                    {presupuesto.fecha_emision
                      ? formatDate(presupuesto.fecha_emision)
                      : ''}
                  </span>
                  <span className="tabular text-lg font-bold text-[--color-foreground]">
                    {formatCurrency(presupuesto.total ?? 0)}
                  </span>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
