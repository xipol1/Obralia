'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, Users, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'

export default function ClientesPage() {
  const supabase = createClient()
  const [search, setSearch] = useState('')

  const { data: clientes, isLoading } = useQuery({
    queryKey: ['clientes'],
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
        .from('clientes')
        .select('*')
        .eq('empresa_id', miembro.empresa_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
  })

  const filtered = useMemo(() => {
    if (!clientes) return []
    if (!search.trim()) return clientes

    const q = search.toLowerCase()
    return clientes.filter(
      (c) =>
        c.nombre?.toLowerCase().includes(q) ||
        c.razon_social?.toLowerCase().includes(q) ||
        c.nif?.toLowerCase().includes(q) ||
        c.telefono?.includes(q)
    )
  }, [clientes, search])

  const hasClientes = (clientes?.length ?? 0) > 0

  function getDisplayName(cliente: {
    tipo: string | null
    nombre: string | null
    apellidos: string | null
    razon_social: string | null
  }) {
    if (cliente.tipo === 'empresa') {
      return cliente.razon_social || 'Sin nombre'
    }
    return [cliente.nombre, cliente.apellidos].filter(Boolean).join(' ') || 'Sin nombre'
  }

  function getInitial(name: string) {
    const trimmed = name.trim()
    return trimmed.charAt(0).toUpperCase() || '?'
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[--color-foreground]">
            Clientes
          </h1>
          {hasClientes && (
            <p className="mt-1 text-sm text-[--color-muted-foreground]">
              {clientes!.length} {clientes!.length === 1 ? 'cliente' : 'clientes'}
            </p>
          )}
        </div>
        {hasClientes && (
          <Link
            href="/clientes/nuevo"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-[--radius] bg-[--color-accent] px-4 text-sm font-semibold text-[--color-accent-foreground] shadow-sm transition-colors hover:bg-[--color-accent]/90"
          >
            <Plus className="h-4 w-4" />
            Nuevo
          </Link>
        )}
      </div>

      {/* Search */}
      {hasClientes && (
        <div className="relative mt-5">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[--color-muted-foreground]" />
          <input
            type="text"
            placeholder="Buscar por nombre, NIF o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 w-full rounded-full border border-[--color-border] bg-[--color-card] pl-11 pr-4 text-base text-[--color-foreground] placeholder:text-[--color-muted-foreground] focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/20"
          />
        </div>
      )}

      {/* List */}
      <div className="mt-4 space-y-3">
        {isLoading ? (
          <>
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-[--radius] border border-[--color-border]/60 bg-[--color-card] p-4 shadow-sm"
              >
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </>
        ) : filtered.length === 0 ? (
          search.trim() ? (
            <EmptyState
              icon={<Search />}
              title="Sin resultados"
              description={`No se encontraron clientes para "${search}"`}
            />
          ) : (
            <EmptyState
              icon={<Users />}
              title="Sin clientes todavía"
              description="Añade tu primer cliente para empezar a hacer presupuestos"
              action={
                <Link
                  href="/clientes/nuevo"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-[--radius] bg-[--color-accent] px-8 text-base font-semibold text-[--color-accent-foreground] shadow-sm transition-colors hover:bg-[--color-accent]/90"
                >
                  <Plus className="h-5 w-5" />
                  Nuevo cliente
                </Link>
              }
            />
          )
        ) : (
          filtered.map((cliente) => {
            const name = getDisplayName(cliente)
            const subtitle = cliente.telefono || cliente.email || ''
            return (
              <Link
                key={cliente.id}
                href={`/clientes/${cliente.id}`}
                className="group flex items-center gap-3 rounded-[--radius] border border-[--color-border]/60 bg-[--color-card] p-4 shadow-sm transition-all hover:border-[--color-primary]/30 hover:shadow-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[--color-muted] text-base font-bold text-[--color-foreground]">
                  {getInitial(name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-[--color-foreground]">
                    {name}
                    {cliente.nif && (
                      <span className="ml-2 text-sm font-normal text-[--color-muted-foreground]">
                        · {cliente.nif}
                      </span>
                    )}
                  </p>
                  {subtitle && (
                    <p className="truncate text-sm text-[--color-muted-foreground]">
                      {subtitle}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-[--color-muted-foreground] transition-transform group-hover:translate-x-0.5" />
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
