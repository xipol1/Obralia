'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
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
  BrickWall,
  Wind,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/components/ui/toast'

import { cn, formatCurrency } from '@/lib/utils'
import {
  buscarPartidas,
  crearPartidaPersonal,
  duplicarPartidaSistema,
  actualizarPartidaPersonal,
  obtenerPartida,
} from '@/lib/biblioteca'
import { createClient } from '@/lib/supabase/client'
import {
  CAPITULOS_META,
  type CapituloSistema,
  type PartidaBiblioteca,
} from '@/types/domain'
import {
  crearPartidaSchema,
  type CrearPartidaFormData,
} from '@/schemas/biblioteca'

// ---------------------------------------------------------------------------
// Mapeo estático de iconos para evitar dynamic imports
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

function CapituloIcon({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const Icon = ICON_MAP[name] ?? MoreHorizontal
  return <Icon className={className} aria-hidden />
}

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------
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
// Props
// ---------------------------------------------------------------------------
interface SelectorPartidasProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  empresaId: string
  /** Si se pasa, prefiltra por este capítulo */
  capituloPrefiltrado?: CapituloSistema
  /** Callback cuando el usuario añade una partida ajustada */
  onAdd: (partida: {
    descripcion: string
    unidad: string
    cantidad: number
    precio_unitario: number
    tipo_iva: 0 | 4 | 10 | 21
    partida_biblioteca_id: string | null
  }) => void
}

type Vista = 'lista' | 'ajustar' | 'crear'
type TabFiltro = 'todas' | 'mias' | 'sistema'

// ---------------------------------------------------------------------------
// Hook debounce sencillo
// ---------------------------------------------------------------------------
function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export function SelectorPartidas({
  open,
  onOpenChange,
  empresaId,
  capituloPrefiltrado,
  onAdd,
}: SelectorPartidasProps) {
  const { toast } = useToast()
  const supabase = React.useMemo(() => createClient(), [])

  const [vista, setVista] = React.useState<Vista>('lista')
  const [seleccionada, setSeleccionada] =
    React.useState<PartidaBiblioteca | null>(null)

  // Filtros
  const [query, setQuery] = React.useState('')
  const queryDebounced = useDebounced(query, 250)
  const [tab, setTab] = React.useState<TabFiltro>('todas')
  const [capitulo, setCapitulo] = React.useState<CapituloSistema | undefined>(
    capituloPrefiltrado,
  )

  // Reset interno al abrir
  React.useEffect(() => {
    if (open) {
      setVista('lista')
      setSeleccionada(null)
      setQuery('')
      setTab('todas')
      setCapitulo(capituloPrefiltrado)
    }
  }, [open, capituloPrefiltrado])

  // Bloquear scroll body cuando el sheet está abierto
  React.useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // Cerrar con ESC
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onOpenChange])

  // ---- Query ---------------------------------------------------------------
  const soloMias = tab === 'mias'
  const soloSistema = tab === 'sistema'

  const partidasQuery = useQuery({
    queryKey: [
      'biblioteca',
      empresaId,
      queryDebounced,
      capitulo ?? null,
      tab,
    ] as const,
    queryFn: async () => {
      const rows = await buscarPartidas(supabase, {
        empresaId,
        query: queryDebounced || undefined,
        capitulo,
        soloMias,
      })
      // Filtrado adicional para "sistema" en cliente (la API no lo soporta nativamente)
      if (soloSistema) return rows.filter((r) => r.origen === 'sistema')
      return rows
    },
    enabled: open && vista === 'lista',
  })

  // ---- Handlers ------------------------------------------------------------
  const handleSeleccionar = (p: PartidaBiblioteca) => {
    setSeleccionada(p)
    setVista('ajustar')
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-stretch md:justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Selector de partidas"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar"
        onClick={() => onOpenChange(false)}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      {/* Panel */}
      <div
        className={cn(
          'relative flex w-full flex-col bg-[--color-card] text-[--color-foreground] shadow-2xl',
          'h-[90vh] rounded-t-2xl',
          'md:h-full md:max-h-screen md:w-[480px] md:rounded-none md:rounded-l-2xl',
          'animate-in slide-in-from-bottom-8 md:slide-in-from-right-8 md:slide-in-from-bottom-0',
        )}
      >
        {vista === 'lista' && (
          <ListaVista
            query={query}
            setQuery={setQuery}
            tab={tab}
            setTab={setTab}
            capitulo={capitulo}
            setCapitulo={setCapitulo}
            onClose={() => onOpenChange(false)}
            partidasQuery={partidasQuery}
            onSeleccionar={handleSeleccionar}
            onIrCrear={() => setVista('crear')}
          />
        )}

        {vista === 'ajustar' && seleccionada && (
          <AjustarVista
            partida={seleccionada}
            empresaId={empresaId}
            onBack={() => setVista('lista')}
            onAddFinal={(payload, newId) => {
              onAdd({
                ...payload,
                partida_biblioteca_id: newId ?? seleccionada.id,
              })
              onOpenChange(false)
            }}
            supabase={supabase}
            toast={toast}
          />
        )}

        {vista === 'crear' && (
          <CrearVista
            empresaId={empresaId}
            capituloPrefiltrado={capitulo ?? capituloPrefiltrado}
            onBack={() => setVista('lista')}
            onCreated={(nueva) => {
              onAdd({
                descripcion: nueva.descripcion,
                unidad: nueva.unidad,
                cantidad: 1,
                precio_unitario: Number(nueva.precio_unitario_orientativo),
                tipo_iva: nueva.tipo_iva_sugerido as 0 | 4 | 10 | 21,
                partida_biblioteca_id: nueva.id,
              })
              onOpenChange(false)
            }}
            supabase={supabase}
            toast={toast}
          />
        )}
      </div>
    </div>
  )
}

// ===========================================================================
// VISTA: Lista de búsqueda
// ===========================================================================
interface ListaVistaProps {
  query: string
  setQuery: (q: string) => void
  tab: TabFiltro
  setTab: (t: TabFiltro) => void
  capitulo: CapituloSistema | undefined
  setCapitulo: (c: CapituloSistema | undefined) => void
  onClose: () => void
  onSeleccionar: (p: PartidaBiblioteca) => void
  onIrCrear: () => void
  partidasQuery: ReturnType<typeof useQuery<PartidaBiblioteca[], Error>>
}

function ListaVista({
  query,
  setQuery,
  tab,
  setTab,
  capitulo,
  setCapitulo,
  onClose,
  onSeleccionar,
  onIrCrear,
  partidasQuery,
}: ListaVistaProps) {
  const { data, isLoading, isError, error } = partidasQuery

  return (
    <>
      {/* Header sticky */}
      <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-[--color-border] bg-[--color-card] p-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[--color-muted-foreground]"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar partida (ej: alicatado, enchufe, ducha...)"
              className="pl-10"
              autoFocus
              inputMode="search"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2">
          {(
            [
              { v: 'todas', l: 'Todas' },
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

        {/* Chips capítulos */}
        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                  <CapituloIcon
                    name={meta.icon}
                    className={cn('h-4 w-4', meta.color)}
                  />
                  <span>{meta.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Lista resultados */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            icon={<X />}
            title="Error al cargar"
            description={error?.message ?? 'Inténtalo de nuevo'}
          />
        ) : !data || data.length === 0 ? (
          <EmptyState
            icon={<Search />}
            title="No encontramos partidas"
            description="Prueba con otra búsqueda o crea una partida personalizada"
            action={
              <Button variant="accent" onClick={onIrCrear}>
                <Plus className="h-4 w-4" />
                Crear partida personalizada
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-[--color-border]">
            {data.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onSeleccionar(p)}
                  className="w-full px-4 py-3 text-left transition-colors hover:bg-[--color-muted] focus-visible:bg-[--color-muted] focus-visible:outline-none"
                >
                  <p className="line-clamp-2 font-medium text-[--color-foreground]">
                    {p.descripcion}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[--color-muted-foreground]">
                    <span className="font-medium">{p.unidad}</span>
                    <span>·</span>
                    <span>
                      {formatCurrency(Number(p.precio_unitario_orientativo))}
                    </span>
                    <Badge
                      variant={p.origen === 'sistema' ? 'info' : 'default'}
                      className="ml-auto"
                    >
                      {p.origen === 'sistema' ? 'Sistema' : 'Mía'}
                    </Badge>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* CTA crear */}
      <div className="sticky bottom-0 border-t border-[--color-border] bg-[--color-card] p-4">
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={onIrCrear}
        >
          <Plus className="h-4 w-4" />
          Crear partida personalizada
        </Button>
      </div>
    </>
  )
}

// ===========================================================================
// VISTA: Ajustar partida seleccionada
// ===========================================================================
interface AjustarVistaProps {
  partida: PartidaBiblioteca
  empresaId: string
  onBack: () => void
  onAddFinal: (
    payload: {
      descripcion: string
      unidad: string
      cantidad: number
      precio_unitario: number
      tipo_iva: 0 | 4 | 10 | 21
    },
    nuevoBibliotecaId?: string | null,
  ) => void
  supabase: ReturnType<typeof createClient>
  toast: ReturnType<typeof useToast>['toast']
}

function AjustarVista({
  partida,
  empresaId,
  onBack,
  onAddFinal,
  supabase,
  toast,
}: AjustarVistaProps) {
  const [descripcion, setDescripcion] = React.useState(partida.descripcion)
  const [cantidad, setCantidad] = React.useState<string>('1')
  const [precio, setPrecio] = React.useState<string>(
    String(partida.precio_unitario_orientativo ?? 0),
  )
  const [unidad, setUnidad] = React.useState<string>(partida.unidad)
  const [tipoIva, setTipoIva] = React.useState<string>(
    String(partida.tipo_iva_sugerido),
  )
  const [guardarEnMia, setGuardarEnMia] = React.useState(false)
  const [enviando, setEnviando] = React.useState(false)

  const precioOrient = Number(partida.precio_unitario_orientativo ?? 0)
  const precioActual = Number(precio || 0)
  const precioCambiado = Math.abs(precioActual - precioOrient) > 0.0001
  const esSistema = partida.origen === 'sistema'
  const ofrecerGuardar = esSistema && precioCambiado

  const submit = async () => {
    setEnviando(true)
    try {
      let nuevoBibliotecaId: string | null = null

      if (ofrecerGuardar && guardarEnMia) {
        const newId = await duplicarPartidaSistema(
          supabase,
          partida.id,
          empresaId,
        )
        await actualizarPartidaPersonal(supabase, newId, {
          precio_unitario_orientativo: precioActual,
          descripcion,
          unidad: unidad as CrearPartidaFormData['unidad'],
          tipo_iva_sugerido: Number(tipoIva) as 0 | 4 | 10 | 21,
        })
        nuevoBibliotecaId = newId
        toast({ title: 'Guardada en tu biblioteca' })
      }

      onAddFinal(
        {
          descripcion,
          unidad,
          cantidad: Number(cantidad || 0),
          precio_unitario: precioActual,
          tipo_iva: Number(tipoIva) as 0 | 4 | 10 | 21,
        },
        nuevoBibliotecaId,
      )
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'No se pudo añadir',
        variant: 'destructive',
      })
    } finally {
      setEnviando(false)
    }
  }

  const importe = (Number(cantidad || 0) * precioActual) || 0

  const selectAll = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.select()
  }

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-[--color-border] bg-[--color-card] p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-medium">
            {partida.descripcion}
          </p>
        </div>
        <Badge variant={esSistema ? 'info' : 'default'}>
          {esSistema ? 'Sistema' : 'Mía'}
        </Badge>
      </div>

      {/* Form */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div className="space-y-2">
          <Label htmlFor="adj-descripcion">Descripción</Label>
          <Textarea
            id="adj-descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="adj-cantidad">Cantidad</Label>
            <Input
              id="adj-cantidad"
              inputMode="decimal"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              onFocus={selectAll}
              className="text-2xl font-semibold"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="adj-precio">Precio €/ud</Label>
            <Input
              id="adj-precio"
              inputMode="decimal"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              onFocus={selectAll}
              className="text-2xl font-semibold"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="adj-unidad">Unidad</Label>
            <Select
              id="adj-unidad"
              value={unidad}
              onChange={(e) => setUnidad(e.target.value)}
              options={UNIDAD_OPTIONS}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="adj-iva">IVA</Label>
            <Select
              id="adj-iva"
              value={tipoIva}
              onChange={(e) => setTipoIva(e.target.value)}
              options={IVA_OPTIONS}
            />
          </div>
        </div>

        {ofrecerGuardar && (
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[--color-border] bg-[--color-muted]/50 p-3 text-sm">
            <input
              type="checkbox"
              checked={guardarEnMia}
              onChange={(e) => setGuardarEnMia(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[--color-primary]"
            />
            <span className="text-[--color-foreground]">
              Guardar también en mi biblioteca como mía
              <span className="mt-0.5 block text-xs text-[--color-muted-foreground]">
                Has cambiado el precio. Podrás reutilizarla en futuros
                presupuestos con tu precio.
              </span>
            </span>
          </label>
        )}

        <div className="flex items-center justify-between rounded-lg bg-[--color-muted] px-4 py-3">
          <span className="text-sm font-medium text-[--color-muted-foreground]">
            Importe
          </span>
          <span className="text-xl font-bold text-[--color-foreground]">
            {formatCurrency(importe)}
          </span>
        </div>
      </div>

      {/* CTA */}
      <div className="sticky bottom-0 border-t border-[--color-border] bg-[--color-card] p-4">
        <Button
          variant="accent"
          size="xl"
          className="w-full"
          onClick={submit}
          disabled={enviando || !descripcion || precioActual < 0}
        >
          {enviando ? 'Añadiendo…' : 'Añadir al presupuesto'}
        </Button>
      </div>
    </>
  )
}

// ===========================================================================
// VISTA: Crear partida personalizada
// ===========================================================================
interface CrearVistaProps {
  empresaId: string
  capituloPrefiltrado?: CapituloSistema
  onBack: () => void
  onCreated: (nueva: PartidaBiblioteca) => void
  supabase: ReturnType<typeof createClient>
  toast: ReturnType<typeof useToast>['toast']
}

function CrearVista({
  empresaId,
  capituloPrefiltrado,
  onBack,
  onCreated,
  supabase,
  toast,
}: CrearVistaProps) {
  const [tagsRaw, setTagsRaw] = React.useState('')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CrearPartidaFormData>({
    resolver: zodResolver(crearPartidaSchema) as never,
    defaultValues: {
      capitulo: capituloPrefiltrado ?? 'otros',
      codigo: '',
      descripcion: '',
      unidad: 'ud',
      precio_unitario_orientativo: 0,
      tipo_iva_sugerido: 21,
      tags: [],
      notas: '',
    },
  })

  const onTagsBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const arr = e.target.value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 20)
    setValue('tags', arr, { shouldValidate: true })
  }

  const onSubmit = async (values: CrearPartidaFormData) => {
    try {
      const nueva = await crearPartidaPersonal(supabase, empresaId, values)
      toast({ title: 'Partida creada' })
      onCreated(nueva)
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'No se pudo crear',
        variant: 'destructive',
      })
    }
  }

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-[--color-border] bg-[--color-card] p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-base font-semibold">Crear partida personalizada</h2>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit as never)}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div className="space-y-2">
            <Label htmlFor="cr-capitulo">Capítulo</Label>
            <Select
              id="cr-capitulo"
              {...register('capitulo')}
              options={CAPITULO_OPTIONS}
              aria-invalid={!!errors.capitulo}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cr-codigo">Código (opcional)</Label>
            <Input
              id="cr-codigo"
              placeholder="Ej: ALB-001"
              {...register('codigo')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cr-descripcion">Descripción</Label>
            <Textarea
              id="cr-descripcion"
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
              <Label htmlFor="cr-unidad">Unidad</Label>
              <Select
                id="cr-unidad"
                {...register('unidad')}
                options={UNIDAD_OPTIONS}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cr-iva">IVA</Label>
              <Select
                id="cr-iva"
                {...register('tipo_iva_sugerido')}
                options={IVA_OPTIONS}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cr-precio">Precio orientativo €/ud</Label>
            <Input
              id="cr-precio"
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
            <Label htmlFor="cr-tags">Etiquetas (separadas por coma)</Label>
            <Input
              id="cr-tags"
              placeholder="baño, reforma, alicatado"
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              onBlur={onTagsBlur}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cr-notas">Notas (opcional)</Label>
            <Textarea
              id="cr-notas"
              rows={2}
              {...register('notas')}
            />
          </div>
        </div>

        <div className="sticky bottom-0 flex gap-2 border-t border-[--color-border] bg-[--color-card] p-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="accent"
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creando…' : 'Crear y añadir'}
          </Button>
        </div>
      </form>
    </>
  )
}

// Re-export por conveniencia (silencia el linter de helper sin uso si se diera)
void obtenerPartida
