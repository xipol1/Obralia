'use client'

/**
 * ClientePicker — bottom-sheet visual para elegir un cliente.
 *
 * Diseñado para que un constructor con manos sucias y prisa pueda:
 *   1. Ver los clientes como tarjetas grandes con avatar y datos completos.
 *   2. Buscar por nombre o teléfono.
 *   3. Crear un cliente nuevo sin perder el contexto del presupuesto.
 *
 * Reemplaza al desplegable HTML <select>, que en móvil oculta el resto
 * y obliga a leer texto pequeño.
 */

import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, X, UserPlus, Building2, User, Phone, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn, direccionCompleta, formatPhoneDisplay, inicialesCliente, nombreCliente } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import type { Cliente } from '@/types/domain'
import { ClienteQuickCreate } from './ClienteQuickCreate'

interface ClientePickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  empresaId: string
  selectedId?: string | null
  onSelect: (cliente: Cliente) => void
}

export function ClientePicker({
  open,
  onOpenChange,
  empresaId,
  selectedId,
  onSelect,
}: ClientePickerProps) {
  const supabase = createClient()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), 200)
    return () => clearTimeout(t)
  }, [query])

  // Body scroll lock + ESC close
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onOpenChange])

  const { data: clientes, isLoading } = useQuery({
    queryKey: ['clientes-picker', empresaId],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Cliente[]
    },
  })

  const filtered = useMemo(() => {
    if (!clientes) return []
    if (!debouncedQuery) return clientes
    return clientes.filter((c) => {
      const haystack = [
        nombreCliente(c),
        c.nif,
        c.telefono,
        c.email,
        c.municipio,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(debouncedQuery)
    })
  }, [clientes, debouncedQuery])

  function handleClienteCreated(nuevo: Cliente) {
    setCreateOpen(false)
    onSelect(nuevo)
    onOpenChange(false)
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar"
        onClick={() => onOpenChange(false)}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
      />

      {/* Sheet — mobile: bottom 90% / desktop: right 480px */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex h-[90dvh] flex-col overflow-hidden rounded-t-2xl bg-[--color-card] shadow-2xl md:bottom-0 md:left-auto md:right-0 md:top-0 md:h-dvh md:w-[480px] md:rounded-none md:border-l md:border-[--color-border]">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-[--color-border] bg-[--color-card] px-4 pb-3 pt-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[--color-foreground]">Elegir cliente</h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[--color-muted-foreground]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, teléfono..."
              className="pl-10"
              inputMode="search"
              autoFocus
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3">
          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[--color-muted] text-[--color-muted-foreground]">
                <User className="h-8 w-8" />
              </div>
              {debouncedQuery ? (
                <>
                  <p className="text-base font-semibold text-[--color-foreground]">
                    No encontramos a nadie
                  </p>
                  <p className="text-sm text-[--color-muted-foreground]">
                    ¿Quieres crear un cliente con esos datos?
                  </p>
                </>
              ) : (
                <>
                  <p className="text-base font-semibold text-[--color-foreground]">
                    Aún no tienes clientes
                  </p>
                  <p className="text-sm text-[--color-muted-foreground]">
                    Crea el primero para hacer tu presupuesto
                  </p>
                </>
              )}
              <Button
                type="button"
                variant="accent"
                size="lg"
                onClick={() => setCreateOpen(true)}
                className="mt-2"
              >
                <UserPlus className="h-5 w-5" />
                Nuevo cliente
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((c) => {
                const isSelected = c.id === selectedId
                const Icon = c.tipo === 'empresa' ? Building2 : User
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onSelect(c)
                      onOpenChange(false)
                    }}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-[--radius] border-2 p-4 text-left transition-all active:scale-[0.99]',
                      isSelected
                        ? 'border-[--color-primary] bg-[--color-primary]/5'
                        : 'border-[--color-border] bg-[--color-card] hover:border-[--color-primary]/50',
                    )}
                  >
                    {/* Avatar */}
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[--color-muted] text-base font-bold text-[--color-foreground]">
                      {inicialesCliente(c) || <Icon className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 text-[--color-muted-foreground]" />
                        <span className="truncate text-base font-bold text-[--color-foreground]">
                          {nombreCliente(c) || 'Sin nombre'}
                        </span>
                      </div>
                      {c.telefono && (
                        <div className="mt-1 flex items-center gap-1.5 text-sm text-[--color-muted-foreground]">
                          <Phone className="h-3.5 w-3.5" />
                          {formatPhoneDisplay(c.telefono)}
                        </div>
                      )}
                      {(c.direccion || c.municipio) && (
                        <div className="mt-0.5 flex items-start gap-1.5 text-sm text-[--color-muted-foreground]">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                          <span className="line-clamp-1">
                            {direccionCompleta(c)}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="sticky bottom-0 border-t border-[--color-border] bg-[--color-card] p-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => setCreateOpen(true)}
            className="w-full"
          >
            <UserPlus className="h-5 w-5" />
            Crear cliente nuevo
          </Button>
        </div>
      </div>

      <ClienteQuickCreate
        open={createOpen}
        onOpenChange={setCreateOpen}
        empresaId={empresaId}
        prefilledNombre={query}
        onCreated={handleClienteCreated}
      />
    </>
  )
}
