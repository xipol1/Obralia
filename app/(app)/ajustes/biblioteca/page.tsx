'use client'

import * as React from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  BookOpen,
  Copy,
  ScanText,
  Droplets,
  Grid3x3,
  Hammer,
  Home,
  MoreHorizontal,
  Paintbrush,
  Plus,
  Search,
  ShowerHead,
  Square,
  Trash2,
  BrickWall,
  Wind,
  Zap,
  type LucideIcon,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import {
  buscarPartidas,
  crearPartidaPersonal,
  actualizarPartidaPersonal,
  eliminarPartidaPersonal,
  duplicarPartidaSistema,
} from '@/lib/biblioteca'
import {
  CAPITULOS_META,
  type CapituloSistema,
  type PartidaBiblioteca,
} from '@/types/domain'
import {
  crearPartidaSchema,
  actualizarPartidaSchema,
  type CrearPartidaFormData,
  type ActualizarPartidaFormData,
} from '@/schemas/biblioteca'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { cn, formatCurrency } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------
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

const UNIDAD_OPTIONS = [
  { value: 'm2', label: 'm²' },
  { value: 'm3', label: 'm³' },
  { value: 'ml', label: 'ml' },
  { value: 'ud', label: 'ud' },
  { value: 'h', label: 'h' },
  { value: 'kg', label: 'kg' },
  { value: 'pa', label: 'pa' },
]

const IVA_OPTIONS = [
  { value: '0', label: '0% (exento)' },
  { value: '4', label: '4% (superreducido)' },
  { value: '10', label: '10% (reducido)' },
  { value: '21', label: '21% (general)' },
]

const CAPITULO_OPTIONS = CAPITULOS_META.map((c) => ({
  value: c.key,
  label: c.label,
}))

// ---------------------------------------------------------------------------
// Hook debounce
// ---------------------------------------------------------------------------
function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

function CapituloChipIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? MoreHorizontal
  return <Icon className={className} aria-hidden />
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------
type Tab = 'mias' | 'sistema'

export default function BibliotecaPage() {
  const supabase = React.useMemo(() => createClient(), [])
  const { toast } = useToast()
  const qc = useQueryClient()

  const [tab, setTab] = React.useState<Tab>('mias')
  const [query, setQuery] = React.useState('')
  const queryDebounced = useDebounced(query, 250)
  const [capitulo, setCapitulo] = React.useState<CapituloSistema | undefined>(
    undefined,
  )

  const [editando, setEditando] = React.useState<PartidaBiblioteca | null>(null)
  const [crearOpen, setCrearOpen] = React.useState(false)

  // Empresa
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
      return { empresaId: miembro.empresa_id }
    },
  })
  const empresaId = empresaInfo?.empresaId

  // Lista de partidas según tab
  const partidasQuery = useQuery({
    queryKey: [
      'biblioteca-pagina',
      empresaId,
      tab,
      queryDebounced,
      capitulo ?? null,
    ] as const,
    queryFn: async () => {
      if (!empresaId) return []
      const rows = await buscarPartidas(supabase, {
        empresaId,
        query: queryDebounced || undefined,
        capitulo,
        soloMias: tab === 'mias',
        limit: 100,
      })
      if (tab === 'sistema') return rows.filter((r) => r.origen === 'sistema')
      return rows
    },
    enabled: !!empresaId,
  })

  // Duplicar (Hacer mía)
  const duplicarMut = useMutation({
    mutationFn: async (partidaId: string) => {
      if (!empresaId) throw new Error('Sin empresa')
      return duplicarPartidaSistema(supabase, partidaId, empresaId)
    },
    onSuccess: () => {
      toast({ title: 'Guardada en tu biblioteca' })
      qc.invalidateQueries({ queryKey: ['biblioteca-pagina'] })
      qc.invalidateQueries({ queryKey: ['biblioteca'] })
    },
    onError: (e) => {
      toast({
        title: 'Error al duplicar',
        description: e instanceof Error ? e.message : 'Inténtalo de nuevo',
        variant: 'destructive',
      })
    },
  })

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/ajustes"
          className="flex h-10 w-10 items-center justify-center rounded-[--radius] text-[--color-muted-foreground] transition-colors hover:bg-[--color-muted]"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-[--color-foreground]">
          Mi biblioteca de partidas
        </h1>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[--color-muted-foreground]"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar partida (ej: alicatado, enchufe...)"
          className="pl-10"
          inputMode="search"
        />
      </div>

      {/* Chips capítulos */}
      <div className="-mx-4 mt-3 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex snap-x gap-2">
          {CAPITULOS_META.map((meta) => {
            const active = capitulo === meta.key
            return (
              <button
                key={meta.key}
                type="button"
                onClick={() => setCapitulo(active ? undefined : meta.key)}
                className={cn(
                  'flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  active
                    ? 'border-[--color-primary] bg-[--color-primary]/10 text-[--color-primary]'
                    : 'border-[--color-border] bg-[--color-card] text-[--color-foreground] hover:bg-[--color-muted]',
                )}
              >
                <CapituloChipIcon
                  name={meta.icon}
                  className={cn('h-4 w-4', meta.color)}
                />
                <span>{meta.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-4 flex items-center gap-2">
        {(
          [
            { v: 'mias', l: 'Mías' },
            { v: 'sistema', l: 'Sistema' },
          ] as const
        ).map((t) => (
          <button
            key={t.v}
            type="button"
            onClick={() => setTab(t.v)}
            className={cn(
              'flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
              tab === t.v
                ? 'bg-[--color-primary] text-[--color-primary-foreground]'
                : 'bg-[--color-muted] text-[--color-muted-foreground] hover:bg-[--color-muted]/80',
            )}
          >
            {t.l}
          </button>
        ))}
      </div>

      {/* CTA Nueva partida + Importar */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button
          variant="accent"
          size="lg"
          onClick={() => setCrearOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Nueva partida
        </Button>
        <Link href="/facturas?tab=recibidas" className="contents">
          <Button variant="outline" size="lg" className="w-full">
            <ScanText className="h-4 w-4" />
            Importar facturas
          </Button>
        </Link>
      </div>

      {/* Lista */}
      <div className="mt-4">
        {partidasQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : partidasQuery.isError ? (
          <EmptyState
            icon={<BookOpen />}
            title="Error al cargar"
            description={
              partidasQuery.error instanceof Error
                ? partidasQuery.error.message
                : 'Inténtalo de nuevo'
            }
          />
        ) : !partidasQuery.data || partidasQuery.data.length === 0 ? (
          tab === 'mias' ? (
            <EmptyState
              icon={<BookOpen />}
              title="Aún no tienes partidas propias"
              description="Cuando edites el precio de una partida del sistema desde un presupuesto, se guardará aquí. O créala nueva."
              action={
                <Button variant="accent" onClick={() => setCrearOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Nueva partida
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<Search />}
              title="No hay partidas"
              description="Prueba con otra búsqueda o capítulo."
            />
          )
        ) : (
          <ul className="divide-y divide-[--color-border] overflow-hidden rounded-[--radius] border border-[--color-border] bg-[--color-card]">
            {partidasQuery.data.map((p) => (
              <li key={p.id}>
                {tab === 'mias' ? (
                  <button
                    type="button"
                    onClick={() => setEditando(p)}
                    className="w-full px-4 py-3 text-left transition-colors hover:bg-[--color-muted] focus-visible:bg-[--color-muted] focus-visible:outline-none"
                  >
                    <FilaPartida partida={p} />
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <FilaPartida partida={p} />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => duplicarMut.mutate(p.id)}
                      disabled={duplicarMut.isPending}
                    >
                      <Copy className="h-4 w-4" />
                      Hacer mía
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Dialog: crear partida */}
      <CrearPartidaDialog
        open={crearOpen}
        onOpenChange={setCrearOpen}
        empresaId={empresaId}
        onCreated={() => {
          qc.invalidateQueries({ queryKey: ['biblioteca-pagina'] })
          qc.invalidateQueries({ queryKey: ['biblioteca'] })
        }}
      />

      {/* Dialog: editar partida */}
      <EditarPartidaDialog
        partida={editando}
        onClose={() => setEditando(null)}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ['biblioteca-pagina'] })
          qc.invalidateQueries({ queryKey: ['biblioteca'] })
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Fila de partida
// ---------------------------------------------------------------------------
function FilaPartida({ partida }: { partida: PartidaBiblioteca }) {
  return (
    <>
      <p className="line-clamp-2 font-medium text-[--color-foreground]">
        {partida.descripcion}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[--color-muted-foreground]">
        <span className="font-medium">{partida.unidad}</span>
        <span>·</span>
        <span>{formatCurrency(Number(partida.precio_unitario_orientativo))}</span>
        <span>·</span>
        <span>IVA {partida.tipo_iva_sugerido}%</span>
        <Badge
          variant={partida.origen === 'sistema' ? 'info' : 'default'}
          className="ml-auto"
        >
          {partida.origen === 'sistema' ? 'Sistema' : 'Mía'}
        </Badge>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Dialog: crear partida
// ---------------------------------------------------------------------------
function CrearPartidaDialog({
  open,
  onOpenChange,
  empresaId,
  onCreated,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  empresaId: string | undefined
  onCreated: () => void
}) {
  const supabase = React.useMemo(() => createClient(), [])
  const { toast } = useToast()
  const [tagsRaw, setTagsRaw] = React.useState('')

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CrearPartidaFormData>({
    resolver: zodResolver(crearPartidaSchema) as never,
    defaultValues: {
      capitulo: 'otros',
      codigo: '',
      descripcion: '',
      unidad: 'ud',
      precio_unitario_orientativo: 0,
      tipo_iva_sugerido: 21,
      tags: [],
      notas: '',
    },
  })

  React.useEffect(() => {
    if (open) {
      reset()
      setTagsRaw('')
    }
  }, [open, reset])

  const onTagsBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const arr = e.target.value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 20)
    setValue('tags', arr, { shouldValidate: true })
  }

  const onSubmit = async (values: CrearPartidaFormData) => {
    if (!empresaId) {
      toast({
        title: 'Error',
        description: 'No se encontró tu empresa',
        variant: 'destructive',
      })
      return
    }
    try {
      await crearPartidaPersonal(supabase, empresaId, values)
      toast({ title: 'Partida creada' })
      onCreated()
      onOpenChange(false)
    } catch (e) {
      toast({
        title: 'Error al crear',
        description: e instanceof Error ? e.message : 'Inténtalo de nuevo',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva partida</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="np-capitulo">Capítulo</Label>
            <Select
              id="np-capitulo"
              {...register('capitulo')}
              options={CAPITULO_OPTIONS}
              aria-invalid={!!errors.capitulo}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="np-codigo">Código (opcional)</Label>
            <Input id="np-codigo" placeholder="Ej: ALB-001" {...register('codigo')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="np-descripcion">Descripción</Label>
            <Textarea
              id="np-descripcion"
              rows={3}
              placeholder="Describe la partida"
              {...register('descripcion')}
              aria-invalid={!!errors.descripcion}
            />
            {errors.descripcion && (
              <p className="text-xs text-[--color-destructive]">
                {errors.descripcion.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="np-unidad">Unidad</Label>
              <Select id="np-unidad" {...register('unidad')} options={UNIDAD_OPTIONS} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="np-iva">IVA</Label>
              <Select
                id="np-iva"
                {...register('tipo_iva_sugerido')}
                options={IVA_OPTIONS}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="np-precio">Precio orientativo €/ud</Label>
            <Input
              id="np-precio"
              type="number"
              step="0.01"
              inputMode="decimal"
              {...register('precio_unitario_orientativo')}
              aria-invalid={!!errors.precio_unitario_orientativo}
            />
            {errors.precio_unitario_orientativo && (
              <p className="text-xs text-[--color-destructive]">
                {errors.precio_unitario_orientativo.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="np-tags">Etiquetas (separadas por coma)</Label>
            <Input
              id="np-tags"
              placeholder="baño, reforma"
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              onBlur={onTagsBlur}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="np-notas">Notas (opcional)</Label>
            <Textarea id="np-notas" rows={2} {...register('notas')} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="accent" disabled={isSubmitting}>
              {isSubmitting ? 'Creando…' : 'Crear partida'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Dialog: editar partida personal
// ---------------------------------------------------------------------------
function EditarPartidaDialog({
  partida,
  onClose,
  onSaved,
}: {
  partida: PartidaBiblioteca | null
  onClose: () => void
  onSaved: () => void
}) {
  const supabase = React.useMemo(() => createClient(), [])
  const { toast } = useToast()
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const [tagsRaw, setTagsRaw] = React.useState('')

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ActualizarPartidaFormData>({
    resolver: zodResolver(actualizarPartidaSchema) as never,
    defaultValues: {
      capitulo: 'otros',
      codigo: '',
      descripcion: '',
      unidad: 'ud',
      precio_unitario_orientativo: 0,
      tipo_iva_sugerido: 21,
      tags: [],
      notas: '',
    },
  })

  React.useEffect(() => {
    if (partida) {
      reset({
        capitulo: partida.capitulo as CapituloSistema,
        codigo: partida.codigo ?? '',
        descripcion: partida.descripcion,
        unidad: partida.unidad as ActualizarPartidaFormData['unidad'],
        precio_unitario_orientativo: Number(partida.precio_unitario_orientativo),
        tipo_iva_sugerido: partida.tipo_iva_sugerido as 0 | 4 | 10 | 21,
        tags: partida.tags ?? [],
        notas: partida.notas ?? '',
      })
      setTagsRaw((partida.tags ?? []).join(', '))
      setConfirmDelete(false)
    }
  }, [partida, reset])

  const onTagsBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const arr = e.target.value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 20)
    setValue('tags', arr, { shouldValidate: true })
  }

  const onSubmit = async (values: ActualizarPartidaFormData) => {
    if (!partida) return
    try {
      await actualizarPartidaPersonal(supabase, partida.id, values)
      toast({ title: 'Partida actualizada' })
      onSaved()
      onClose()
    } catch (e) {
      toast({
        title: 'Error al actualizar',
        description: e instanceof Error ? e.message : 'Inténtalo de nuevo',
        variant: 'destructive',
      })
    }
  }

  const onDelete = async () => {
    if (!partida) return
    try {
      await eliminarPartidaPersonal(supabase, partida.id)
      toast({ title: 'Partida eliminada' })
      onSaved()
      onClose()
    } catch (e) {
      toast({
        title: 'Error al eliminar',
        description: e instanceof Error ? e.message : 'Inténtalo de nuevo',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={partida !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar partida</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ep-capitulo">Capítulo</Label>
            <Select
              id="ep-capitulo"
              {...register('capitulo')}
              options={CAPITULO_OPTIONS}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ep-codigo">Código (opcional)</Label>
            <Input id="ep-codigo" {...register('codigo')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ep-descripcion">Descripción</Label>
            <Textarea
              id="ep-descripcion"
              rows={3}
              {...register('descripcion')}
              aria-invalid={!!errors.descripcion}
            />
            {errors.descripcion && (
              <p className="text-xs text-[--color-destructive]">
                {errors.descripcion.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ep-unidad">Unidad</Label>
              <Select id="ep-unidad" {...register('unidad')} options={UNIDAD_OPTIONS} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ep-iva">IVA</Label>
              <Select
                id="ep-iva"
                {...register('tipo_iva_sugerido')}
                options={IVA_OPTIONS}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ep-precio">Precio orientativo €/ud</Label>
            <Input
              id="ep-precio"
              type="number"
              step="0.01"
              inputMode="decimal"
              {...register('precio_unitario_orientativo')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ep-tags">Etiquetas</Label>
            <Input
              id="ep-tags"
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              onBlur={onTagsBlur}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ep-notas">Notas</Label>
            <Textarea id="ep-notas" rows={2} {...register('notas')} />
          </div>

          {confirmDelete ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
              <p className="text-sm font-medium text-red-900 dark:text-red-200">
                ¿Seguro que quieres eliminar esta partida?
              </p>
              <p className="mt-1 text-xs text-red-700 dark:text-red-300">
                Se ocultará de tu biblioteca. Los presupuestos existentes no se verán afectados.
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={onDelete}
                >
                  Sí, eliminar
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-4 w-4" />
              Eliminar partida
            </Button>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="accent" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
