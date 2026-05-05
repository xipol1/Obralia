'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  FileText,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Trash2,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
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

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { cn, formatCurrency } from '@/lib/utils'

const ESTADO_LABEL: Record<
  FacturaSubida['estado'],
  { label: string; variant: 'default' | 'info' | 'success' | 'destructive' }
> = {
  pendiente: { label: 'Pendiente', variant: 'default' },
  procesando: { label: 'Procesando…', variant: 'info' },
  procesada: { label: 'Procesada', variant: 'success' },
  error: { label: 'Error', variant: 'destructive' },
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export default function ImportarFacturasPage() {
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
    queryKey: ['facturas', empresaId],
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
      if (!empresaId || !userId) throw new Error('Sin empresa')

      // Validación cliente
      const parsed = subirFacturaSchema.safeParse({
        filename: file.name,
        mime_type: file.type,
        size_bytes: file.size,
      })
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? 'Archivo no válido')
      }

      // Genera path con un UUID temporal del lado cliente
      const facturaId = crypto.randomUUID()
      const path = buildFacturaPath(empresaId, facturaId, file.name)

      await uploadFacturaArchivo(supabase, path, file)

      const factura = await crearFacturaSubida(supabase, empresaId, {
        storage_path: path,
        original_filename: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        subida_por: userId,
      })

      // Lanza el OCR async (no bloquea)
      fetch(`/api/facturas/${factura.id}/procesar`, { method: 'POST' }).catch(
        () => {},
      )

      return factura
    },
    onSuccess: () => {
      toast({ title: 'Factura subida, procesando…' })
      qc.invalidateQueries({ queryKey: ['facturas'] })
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
      qc.invalidateQueries({ queryKey: ['facturas'] })
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

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/ajustes/biblioteca"
          className="flex h-10 w-10 items-center justify-center rounded-[--radius] text-[--color-muted-foreground] transition-colors hover:bg-[--color-muted]"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[--color-foreground]">
            Importar de facturas
          </h1>
          <p className="text-sm text-[--color-muted-foreground]">
            Sube tus facturas, las analizamos y añadimos los materiales a tu
            biblioteca con sus precios reales.
          </p>
        </div>
      </div>

      {/* Upload */}
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
        className="w-full"
        onClick={() => fileInputRef.current?.click()}
        disabled={subirMut.isPending}
      >
        {subirMut.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        Subir factura (PDF o foto)
      </Button>
      <p className="mt-2 text-xs text-[--color-muted-foreground]">
        Máx. {Math.round(MAX_FACTURA_BYTES / 1024 / 1024)} MB · PDF, JPG, PNG, WEBP, HEIC
      </p>

      {/* Lista */}
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
        ) : !facturasQ.data || facturasQ.data.length === 0 ? (
          <EmptyState
            icon={<FileText />}
            title="Aún no has subido ninguna factura"
            description="Sube una factura para empezar a construir tu biblioteca."
          />
        ) : (
          <ul className="divide-y divide-[--color-border] overflow-hidden rounded-[--radius] border border-[--color-border] bg-[--color-card]">
            {facturasQ.data.map((f) => (
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
                  <EstadoIcon estado={f.estado} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[--color-foreground]">
                      {f.proveedor_nombre || f.original_filename}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[--color-muted-foreground]">
                      {f.numero_factura && <span>{f.numero_factura}</span>}
                      <span>·</span>
                      <span>{formatDate(f.fecha_factura ?? f.created_at)}</span>
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
                      variant={ESTADO_LABEL[f.estado].variant}
                      className="mt-1"
                    >
                      {ESTADO_LABEL[f.estado].label}
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
    </div>
  )
}

function EstadoIcon({ estado }: { estado: FacturaSubida['estado'] }) {
  const cls = 'h-5 w-5 shrink-0 mt-0.5'
  if (estado === 'pendiente')
    return <Clock className={cn(cls, 'text-[--color-muted-foreground]')} />
  if (estado === 'procesando')
    return <Loader2 className={cn(cls, 'animate-spin text-blue-600')} />
  if (estado === 'procesada')
    return <CheckCircle2 className={cn(cls, 'text-green-600')} />
  return <AlertCircle className={cn(cls, 'text-red-600')} />
}
