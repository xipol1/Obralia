'use client'

import { Suspense, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Receipt,
  AlertTriangle,
  Upload,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Trash2,
  ArrowDownToLine,
  ArrowUpToLine,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge, type BadgeVariant } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { estadoCobro, type EstadoCobro } from '@/lib/fiscal/retencion-isp'
import {
  buildFacturaPath,
  crearFacturaSubida,
  eliminarFactura,
  listarFacturas,
  uploadFacturaArchivo,
} from '@/lib/facturas'
import {
  ALLOWED_MIME_TYPES,
  MAX_FACTURA_BYTES,
  subirFacturaSchema,
} from '@/schemas/factura'
import type { FacturaSubida } from '@/types/domain'
import * as React from 'react'

type Tab = 'emitidas' | 'recibidas'

export default function FacturasPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-4 py-6">
          <Skeleton className="h-8 w-48" />
        </div>
      }
    >
      <FacturasInner />
    </Suspense>
  )
}

function FacturasInner() {
  const params = useSearchParams()
  const router = useRouter()
  const tabParam = (params.get('tab') as Tab | null) ?? 'emitidas'
  const tab: Tab = tabParam === 'recibidas' ? 'recibidas' : 'emitidas'

  const setTab = (t: Tab) => {
    router.replace(t === 'emitidas' ? '/facturas' : `/facturas?tab=${t}`)
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="text-2xl font-bold text-[--color-foreground]">Facturas</h1>

      {/* Tabs */}
      <div className="mt-4 inline-flex rounded-full border border-[--color-border] bg-[--color-card] p-1">
        <button
          type="button"
          onClick={() => setTab('emitidas')}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
            tab === 'emitidas'
              ? 'bg-[--color-primary] text-white'
              : 'text-[--color-muted-foreground] hover:text-[--color-foreground]',
          )}
        >
          <ArrowUpToLine className="h-3.5 w-3.5" />
          Emitidas
        </button>
        <button
          type="button"
          onClick={() => setTab('recibidas')}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
            tab === 'recibidas'
              ? 'bg-[--color-primary] text-white'
              : 'text-[--color-muted-foreground] hover:text-[--color-foreground]',
          )}
        >
          <ArrowDownToLine className="h-3.5 w-3.5" />
          Recibidas
        </button>
      </div>

      <div className="mt-5">
        {tab === 'emitidas' ? <EmitidasView /> : <RecibidasView />}
      </div>
    </div>
  )
}

// =============================================================================
// EMITIDAS — facturas a cliente generadas desde presupuesto
// =============================================================================

const FILTROS = ['todas', 'pendientes', 'vencidas', 'cobradas'] as const
type Filtro = (typeof FILTROS)[number]

const ESTADO_BADGE: Record<EstadoCobro, { variant: BadgeVariant; label: string }> = {
  pendiente: { variant: 'info', label: 'Pendiente' },
  parcial: { variant: 'warning', label: 'Parcial' },
  vencida: { variant: 'destructive', label: 'Vencida' },
  cobrada: { variant: 'success', label: 'Cobrada' },
}

interface FacturaEmitidaRow {
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

function EmitidasView() {
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
      return data as unknown as FacturaEmitidaRow[]
    },
  })

  const aging = useMemo(() => {
    const acc = { pendienteTotal: 0, vencidoTotal: 0, numVencidas: 0 }
    if (!facturas) return acc
    for (const f of facturas) {
      const total = Number(f.total_a_cobrar ?? f.total ?? 0)
      const cobrado = Number(f.importe_cobrado ?? 0)
      const e = estadoCobro({
        total,
        importeCobrado: cobrado,
        fechaVencimiento: f.fecha_vencimiento,
      })
      if (e !== 'cobrada') {
        acc.pendienteTotal += Math.max(0, total - cobrado)
        if (e === 'vencida') {
          acc.vencidoTotal += Math.max(0, total - cobrado)
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

  const hasFacturas = (facturas?.length ?? 0) > 0

  function clienteNombre(c: FacturaEmitidaRow['clientes']) {
    if (!c) return 'Sin cliente'
    if (c.razon_social) return c.razon_social
    return [c.nombre, c.apellidos].filter(Boolean).join(' ') || 'Sin nombre'
  }

  return (
    <>
      <p className="text-sm text-[--color-muted-foreground]">
        Facturas a tus clientes. Se generan al firmar un presupuesto.
      </p>

      {hasFacturas && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-[--radius] border border-[--color-border] bg-[--color-card] p-3">
            <p className="text-xs text-[--color-muted-foreground]">Te deben</p>
            <p className="mt-0.5 text-lg font-bold text-[--color-foreground]">
              {formatCurrency(aging.pendienteTotal)}
            </p>
          </div>
          <div
            className={cn(
              'rounded-[--radius] border p-3',
              aging.vencidoTotal > 0
                ? 'border-red-300 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30'
                : 'border-[--color-border] bg-[--color-card]',
            )}
          >
            <p className="text-xs text-[--color-muted-foreground]">
              Vencido{aging.numVencidas > 0 && ` (${aging.numVencidas})`}
            </p>
            <p
              className={cn(
                'mt-0.5 text-lg font-bold',
                aging.vencidoTotal > 0
                  ? 'text-red-700 dark:text-red-400'
                  : 'text-[--color-foreground]',
              )}
            >
              {formatCurrency(aging.vencidoTotal)}
            </p>
          </div>
        </div>
      )}

      {hasFacturas && (
        <div className="mt-4 -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTROS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFiltro(f)}
              className={cn(
                'inline-flex h-9 shrink-0 snap-start items-center rounded-full px-4 text-sm font-semibold capitalize transition-colors',
                filtro === f
                  ? 'bg-[--color-primary] text-white'
                  : 'bg-[--color-muted] text-[--color-muted-foreground] hover:bg-[--color-muted]/70',
              )}
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
        ) : !hasFacturas ? (
          <EmptyState
            icon={<Receipt />}
            title="Aún no hay facturas emitidas"
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
                    {e === 'vencida' && <AlertTriangle className="mr-1 h-3 w-3" />}
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
    </>
  )
}

// =============================================================================
// RECIBIDAS — OCR de facturas de proveedor → biblioteca
// =============================================================================

const RECIBIDA_LABEL: Record<
  FacturaSubida['estado'],
  { label: string; variant: BadgeVariant }
> = {
  pendiente: { label: 'Pendiente', variant: 'muted' },
  procesando: { label: 'Procesando…', variant: 'info' },
  procesada: { label: 'Procesada', variant: 'success' },
  error: { label: 'Error', variant: 'destructive' },
}

function RecibidasView() {
  const supabase = React.useMemo(() => createClient(), [])
  const { toast } = useToast()
  const qc = useQueryClient()
  const router = useRouter()
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const empresaQ = useQuery({
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

  const empresaId = empresaQ.data?.empresaId
  const userId = empresaQ.data?.userId

  const facturasQ = useQuery({
    queryKey: ['facturas-recibidas', empresaId],
    queryFn: async () => {
      if (!empresaId) return []
      return listarFacturas(supabase, empresaId)
    },
    enabled: !!empresaId,
    refetchInterval: (q) => {
      const data = q.state.data as FacturaSubida[] | undefined
      const hasInflight = data?.some(
        (f) => f.estado === 'pendiente' || f.estado === 'procesando',
      )
      return hasInflight ? 2000 : false
    },
  })

  const subirMut = useMutation({
    mutationFn: async (file: File) => {
      if (!empresaId || !userId) throw new Error('Sin empresa asociada al usuario')
      const parsed = subirFacturaSchema.safeParse({
        filename: file.name,
        mime_type: file.type || 'application/octet-stream',
        size_bytes: file.size,
      })
      if (!parsed.success) {
        const first = parsed.error.issues?.[0]
        throw new Error(first?.message ?? 'Archivo no válido')
      }
      const facturaId =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const path = buildFacturaPath(empresaId, facturaId, file.name)
      try {
        await uploadFacturaArchivo(supabase, path, file)
      } catch (e) {
        throw new Error(
          `Subida a Storage falló: ${e instanceof Error ? e.message : String(e)}`,
        )
      }
      let factura
      try {
        factura = await crearFacturaSubida(supabase, empresaId, {
          storage_path: path,
          original_filename: file.name,
          mime_type: file.type || 'application/octet-stream',
          size_bytes: file.size,
          subida_por: userId,
        })
      } catch (e) {
        throw new Error(
          `Crear registro falló: ${e instanceof Error ? e.message : String(e)}`,
        )
      }
      fetch(`/api/facturas/${factura.id}/procesar`, { method: 'POST' }).catch(
        () => {},
      )
      return factura
    },
    onSuccess: () => {
      toast({ title: 'Factura subida, procesando…' })
      qc.invalidateQueries({ queryKey: ['facturas-recibidas'] })
    },
    onError: (e) => {
      toast({
        title: 'Error al subir',
        description: e instanceof Error ? e.message : 'Inténtalo de nuevo',
        variant: 'destructive',
      })
    },
  })

  const eliminarMut = useMutation({
    mutationFn: async (facturaId: string) => {
      await eliminarFactura(supabase, facturaId)
    },
    onSuccess: () => {
      toast({ title: 'Factura eliminada' })
      qc.invalidateQueries({ queryKey: ['facturas-recibidas'] })
    },
    onError: (e) => {
      toast({
        title: 'Error al eliminar',
        description: e instanceof Error ? e.message : 'Inténtalo de nuevo',
        variant: 'destructive',
      })
    },
  })

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    subirMut.mutate(file)
    e.target.value = ''
  }

  const facturas = facturasQ.data ?? []

  return (
    <>
      <p className="text-sm text-[--color-muted-foreground]">
        Sube facturas de proveedor (PDF o foto). Las analizamos con OCR y
        añadimos los materiales a tu biblioteca con sus precios reales.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_MIME_TYPES.join(',')}
        className="hidden"
        onChange={onFileChange}
      />
      <Button
        variant="accent"
        size="lg"
        className="mt-4 w-full"
        onClick={() => fileInputRef.current?.click()}
        disabled={subirMut.isPending || !empresaId}
      >
        {subirMut.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        Subir factura (PDF o foto)
      </Button>
      <p className="mt-2 text-xs text-[--color-muted-foreground]">
        Máx. {Math.round(MAX_FACTURA_BYTES / 1024 / 1024)} MB · PDF, JPG, PNG, WEBP
      </p>

      <div className="mt-6">
        {facturasQ.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : facturasQ.isError ? (
          <EmptyState
            icon={<AlertCircle />}
            title="Error al cargar"
            description={
              facturasQ.error instanceof Error
                ? facturasQ.error.message
                : 'Inténtalo de nuevo'
            }
          />
        ) : facturas.length === 0 ? (
          <EmptyState
            icon={<FileText />}
            title="Aún no hay facturas recibidas"
            description="Sube una factura de proveedor para empezar a construir tu biblioteca con precios reales."
          />
        ) : (
          <ul className="divide-y divide-[--color-border] overflow-hidden rounded-[--radius] border border-[--color-border] bg-[--color-card]">
            {facturas.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[--color-muted]"
              >
                <button
                  type="button"
                  className="flex flex-1 items-start gap-3 text-left"
                  onClick={() => {
                    if (f.estado === 'procesada') {
                      router.push(`/ajustes/biblioteca/importar/${f.id}`)
                    }
                  }}
                  disabled={f.estado !== 'procesada'}
                >
                  <RecibidaIcon estado={f.estado} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[--color-foreground]">
                      {f.proveedor_nombre || f.original_filename}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[--color-muted-foreground]">
                      {f.numero_factura && <span>{f.numero_factura}</span>}
                      <span>·</span>
                      <span>
                        {formatDate(f.fecha_factura ?? f.created_at) ?? '—'}
                      </span>
                      {f.total_con_iva != null && (
                        <>
                          <span>·</span>
                          <span className="font-medium text-[--color-foreground]">
                            {formatCurrency(Number(f.total_con_iva))}
                          </span>
                        </>
                      )}
                    </div>
                    <Badge
                      variant={RECIBIDA_LABEL[f.estado].variant}
                      className="mt-1"
                    >
                      {RECIBIDA_LABEL[f.estado].label}
                    </Badge>
                    {f.estado === 'error' && f.error_mensaje && (
                      <p className="mt-1 line-clamp-2 text-xs text-[--color-destructive]">
                        {f.error_mensaje}
                      </p>
                    )}
                  </div>
                </button>
                <button
                  type="button"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[--color-muted-foreground] transition-colors hover:bg-[--color-muted] hover:text-red-600"
                  onClick={() => {
                    if (confirm('¿Eliminar esta factura y sus líneas?')) {
                      eliminarMut.mutate(f.id)
                    }
                  }}
                  aria-label="Eliminar"
                  disabled={eliminarMut.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

function RecibidaIcon({ estado }: { estado: FacturaSubida['estado'] }) {
  const cls = 'h-5 w-5 shrink-0 mt-0.5'
  if (estado === 'pendiente')
    return <Clock className={cn(cls, 'text-[--color-muted-foreground]')} />
  if (estado === 'procesando')
    return <Loader2 className={cn(cls, 'animate-spin text-blue-600')} />
  if (estado === 'procesada')
    return <CheckCircle2 className={cn(cls, 'text-green-600')} />
  return <AlertCircle className={cn(cls, 'text-red-600')} />
}
