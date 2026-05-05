'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Plus,
  AlertCircle,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import {
  importarLineaABiblioteca,
  listarLineas,
  obtenerFactura,
} from '@/lib/facturas'
import type { CapituloSistema, FacturaLinea } from '@/types/domain'
import { CAPITULOS_META } from '@/types/domain'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { formatCurrency } from '@/lib/utils'

const CAPITULO_OPTIONS = CAPITULOS_META.map((c) => ({
  value: c.key,
  label: c.label,
}))

export default function FacturaDetallePage() {
  const params = useParams<{ id: string }>()
  const facturaId = params.id
  const supabase = React.useMemo(() => createClient(), [])
  const { toast } = useToast()
  const qc = useQueryClient()

  const facturaQ = useQuery({
    queryKey: ['factura', facturaId],
    queryFn: () => obtenerFactura(supabase, facturaId),
    enabled: !!facturaId,
  })

  const lineasQ = useQuery({
    queryKey: ['factura-lineas', facturaId],
    queryFn: () => listarLineas(supabase, facturaId),
    enabled: !!facturaId,
  })

  const [seleccion, setSeleccion] = React.useState<Set<string>>(new Set())
  const [capituloDefault, setCapituloDefault] =
    React.useState<CapituloSistema>('otros')

  const importarMut = useMutation({
    mutationFn: async (ids: string[]) => {
      let ok = 0
      const errores: string[] = []
      for (const id of ids) {
        try {
          await importarLineaABiblioteca(supabase, id, {
            capitulo: capituloDefault,
          })
          ok++
        } catch (e) {
          errores.push(e instanceof Error ? e.message : 'Error')
        }
      }
      return { ok, errores }
    },
    onSuccess: ({ ok, errores }) => {
      if (ok > 0) {
        toast({
          title: `${ok} ${ok === 1 ? 'partida añadida' : 'partidas añadidas'} a tu biblioteca`,
        })
        setSeleccion(new Set())
        qc.invalidateQueries({ queryKey: ['factura-lineas', facturaId] })
        qc.invalidateQueries({ queryKey: ['biblioteca-pagina'] })
        qc.invalidateQueries({ queryKey: ['biblioteca'] })
      }
      if (errores.length > 0) {
        toast({
          title: `${errores.length} no se pudieron importar`,
          description: errores[0],
          variant: 'destructive',
        })
      }
    },
  })

  if (facturaQ.isLoading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <Skeleton className="h-8 w-48" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (facturaQ.isError || !facturaQ.data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <EmptyState
          icon={<AlertCircle />}
          title="No se pudo cargar la factura"
          description={
            facturaQ.error instanceof Error
              ? facturaQ.error.message
              : 'Vuelve atrás e inténtalo de nuevo'
          }
        />
        <Link href="/ajustes/biblioteca/importar" className="mt-4 inline-block">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </Link>
      </div>
    )
  }

  const factura = facturaQ.data
  const lineas = lineasQ.data ?? []
  const seleccionadas = lineas.filter(
    (l) => seleccion.has(l.id) && l.partida_biblioteca_id == null,
  )

  const toggle = (id: string) => {
    setSeleccion((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const seleccionarTodas = () => {
    const importables = lineas.filter((l) => l.partida_biblioteca_id == null)
    if (seleccion.size === importables.length) {
      setSeleccion(new Set())
    } else {
      setSeleccion(new Set(importables.map((l) => l.id)))
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/ajustes/biblioteca/importar"
          className="flex h-10 w-10 items-center justify-center rounded-[--radius] text-[--color-muted-foreground] transition-colors hover:bg-[--color-muted]"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-[--color-foreground]">
            {factura.proveedor_nombre || factura.original_filename}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[--color-muted-foreground]">
            {factura.numero_factura && <span>{factura.numero_factura}</span>}
            {factura.fecha_factura && <span>· {factura.fecha_factura}</span>}
            {factura.total_con_iva != null && (
              <span>· {formatCurrency(Number(factura.total_con_iva))}</span>
            )}
          </div>
        </div>
      </div>

      {/* Cabecera resumen */}
      {factura.estado === 'procesada' && (
        <div className="rounded-[--radius] border border-[--color-border] bg-[--color-card] p-3 text-sm">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Base" value={fmt(factura.total_sin_iva)} />
            <Stat label="IVA" value={fmt(factura.total_iva)} />
            <Stat label="Total" value={fmt(factura.total_con_iva)} bold />
          </div>
        </div>
      )}

      {factura.estado !== 'procesada' && (
        <div className="rounded-[--radius] border border-[--color-border] bg-[--color-card] p-4 text-sm text-[--color-muted-foreground]">
          {factura.estado === 'procesando' && 'Procesando factura…'}
          {factura.estado === 'pendiente' && 'En cola de procesamiento.'}
          {factura.estado === 'error' && (
            <div className="flex items-start gap-2 text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <span>{factura.error_mensaje ?? 'Error desconocido'}</span>
            </div>
          )}
        </div>
      )}

      {/* Acciones bulk */}
      {lineas.length > 0 && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={seleccionarTodas}
              className="text-sm font-medium text-[--color-primary] hover:underline"
            >
              {seleccion.size > 0 ? 'Quitar selección' : 'Seleccionar todas'}
            </button>
            <span className="text-xs text-[--color-muted-foreground]">
              {seleccion.size} de{' '}
              {lineas.filter((l) => l.partida_biblioteca_id == null).length}{' '}
              importables
            </span>
          </div>

          <div className="grid grid-cols-[1fr_auto] items-end gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[--color-muted-foreground]">
                Capítulo destino
              </label>
              <Select
                value={capituloDefault}
                onChange={(e) =>
                  setCapituloDefault(e.target.value as CapituloSistema)
                }
                options={CAPITULO_OPTIONS}
              />
            </div>
            <Button
              variant="accent"
              disabled={
                seleccionadas.length === 0 || importarMut.isPending
              }
              onClick={() =>
                importarMut.mutate(seleccionadas.map((l) => l.id))
              }
            >
              {importarMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Añadir {seleccionadas.length || ''}
            </Button>
          </div>
        </div>
      )}

      {/* Lista de líneas */}
      <div className="mt-4">
        {lineasQ.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : lineas.length === 0 ? (
          factura.estado === 'procesada' ? (
            <EmptyState
              icon={<AlertCircle />}
              title="No se detectaron líneas"
              description="El sistema no pudo extraer líneas de esta factura. Prueba con otra imagen más nítida."
            />
          ) : null
        ) : (
          <ul className="divide-y divide-[--color-border] overflow-hidden rounded-[--radius] border border-[--color-border] bg-[--color-card]">
            {lineas.map((linea) => (
              <FilaLinea
                key={linea.id}
                linea={linea}
                checked={seleccion.has(linea.id)}
                onToggle={() => toggle(linea.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  bold = false,
}: {
  label: string
  value: string
  bold?: boolean
}) {
  return (
    <div>
      <p className="text-xs text-[--color-muted-foreground]">{label}</p>
      <p
        className={
          bold
            ? 'text-base font-semibold text-[--color-foreground]'
            : 'text-sm text-[--color-foreground]'
        }
      >
        {value}
      </p>
    </div>
  )
}

function FilaLinea({
  linea,
  checked,
  onToggle,
}: {
  linea: FacturaLinea
  checked: boolean
  onToggle: () => void
}) {
  const importada = linea.partida_biblioteca_id != null

  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <input
        type="checkbox"
        checked={importada || checked}
        disabled={importada}
        onChange={onToggle}
        className="mt-1 h-4 w-4 shrink-0 rounded border-[--color-border]"
        aria-label="Seleccionar"
      />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium text-[--color-foreground]">
          {linea.descripcion}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[--color-muted-foreground]">
          {linea.codigo_articulo && <span>#{linea.codigo_articulo}</span>}
          {linea.cantidad != null && (
            <span>
              {linea.cantidad} {linea.unidad ?? 'ud'}
            </span>
          )}
          {linea.precio_unitario != null && (
            <span>· {formatCurrency(Number(linea.precio_unitario))}/ud</span>
          )}
          {linea.tipo_iva != null && <span>· IVA {linea.tipo_iva}%</span>}
          {linea.importe_linea != null && (
            <span className="ml-auto font-semibold text-[--color-foreground]">
              {formatCurrency(Number(linea.importe_linea))}
            </span>
          )}
        </div>
        {importada && (
          <Badge variant="success" className="mt-1">
            <CheckCircle2 className="h-3 w-3" />
            Ya en biblioteca
          </Badge>
        )}
      </div>
    </li>
  )
}

function fmt(n: number | null | undefined): string {
  if (n == null) return '—'
  return formatCurrency(Number(n))
}
