'use client'

import * as React from 'react'
import {
  type Control,
  type UseFormRegister,
  useFieldArray,
  useWatch,
} from 'react-hook-form'
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  MoreVertical,
  Plus,
  Trash2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

import { cn, formatCurrency } from '@/lib/utils'
import {
  CAPITULOS_META,
  type CapituloSistema,
} from '@/types/domain'

import { SelectorPartidas } from '@/components/biblioteca/SelectorPartidas'

// ---------------------------------------------------------------------------
// Tipos del formulario
// ---------------------------------------------------------------------------
export interface PartidaFormItem {
  id?: string
  partida_biblioteca_id: string | null
  descripcion: string
  unidad: string
  cantidad: number
  precio_unitario: number
  tipo_iva: 0 | 4 | 10 | 21
}

export interface CapituloFormItem {
  id?: string
  nombre: string
  capitulo_sistema?: CapituloSistema | null
  partidas: PartidaFormItem[]
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

const CAPITULO_SISTEMA_OPTIONS = [
  { value: '', label: '— Sin asignar —' },
  ...CAPITULOS_META.map((c) => ({ value: c.key, label: c.label })),
]

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface CapitulosEditorProps {
  // biome-ignore lint/suspicious/noExplicitAny: form genérico, cada parent define su shape
  control: Control<any>
  // biome-ignore lint/suspicious/noExplicitAny: form genérico
  register: UseFormRegister<any>
  empresaId: string
  capituloIvaDefault: 0 | 4 | 10 | 21
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export function CapitulosEditor({
  control,
  register,
  empresaId,
  capituloIvaDefault,
}: CapitulosEditorProps) {
  const { fields, append, remove, move, update } = useFieldArray({
    control,
    name: 'capitulos',
  })

  // Cuál está abierto. El primero por defecto.
  const [abierto, setAbierto] = React.useState<Record<number, boolean>>({
    0: true,
  })

  React.useEffect(() => {
    // Asegura que el primero quede abierto al montar si hay capítulos
    if (fields.length > 0 && abierto[0] === undefined) {
      setAbierto((s) => ({ ...s, 0: true }))
    }
  }, [fields.length, abierto])

  const [dialogNuevo, setDialogNuevo] = React.useState(false)
  const [dialogConfirmBorrar, setDialogConfirmBorrar] = React.useState<
    number | null
  >(null)
  const [dialogMenu, setDialogMenu] = React.useState<number | null>(null)

  // Drag & drop nativo (sólo desktop). En móvil seguimos usando ↑/↓ del menú.
  const [dragFromIdx, setDragFromIdx] = React.useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = React.useState<number | null>(null)

  const handleNuevoCapitulo = (
    nombre: string,
    capituloSistema: CapituloSistema | null,
  ) => {
    append({
      id: crypto.randomUUID(),
      nombre,
      capitulo_sistema: capituloSistema,
      partidas: [],
    } satisfies CapituloFormItem)
    setDialogNuevo(false)
    setAbierto((s) => ({ ...s, [fields.length]: true }))
  }

  const handleBorrar = (idx: number) => {
    const cap = fields[idx] as unknown as CapituloFormItem
    if (cap?.partidas?.length > 0) {
      setDialogConfirmBorrar(idx)
    } else {
      remove(idx)
    }
  }

  return (
    <div className="space-y-3">
      {fields.map((field, idx) => (
        <div
          key={field.id}
          onDragOver={(e) => {
            if (dragFromIdx === null) return
            e.preventDefault()
            if (dragOverIdx !== idx) setDragOverIdx(idx)
          }}
          onDrop={(e) => {
            e.preventDefault()
            if (dragFromIdx !== null && dragFromIdx !== idx) {
              move(dragFromIdx, idx)
            }
            setDragFromIdx(null)
            setDragOverIdx(null)
          }}
          className={
            dragOverIdx === idx && dragFromIdx !== null && dragFromIdx !== idx
              ? 'rounded-[--radius] outline outline-2 outline-[--color-primary]'
              : undefined
          }
        >
          <CapituloItem
            idx={idx}
            control={control}
            register={register}
            empresaId={empresaId}
            capituloIvaDefault={capituloIvaDefault}
            abierto={!!abierto[idx]}
            onToggle={() =>
              setAbierto((s) => ({ ...s, [idx]: !s[idx] }))
            }
            onMenu={() => setDialogMenu(idx)}
            onMoveUp={() => idx > 0 && move(idx, idx - 1)}
            onMoveDown={() =>
              idx < fields.length - 1 && move(idx, idx + 1)
            }
            onBorrar={() => handleBorrar(idx)}
            // biome-ignore lint/suspicious/noExplicitAny: campo genérico
            fieldData={field as any}
            // biome-ignore lint/suspicious/noExplicitAny: callback genérico de update
            updateField={(patch) => update(idx, patch as any)}
            onDragStart={() => setDragFromIdx(idx)}
            onDragEnd={() => {
              setDragFromIdx(null)
              setDragOverIdx(null)
            }}
            isDragging={dragFromIdx === idx}
          />
        </div>
      ))}

      {/* CTA añadir capítulo */}
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        onClick={() => setDialogNuevo(true)}
      >
        <Plus className="h-4 w-4" />
        Añadir capítulo
      </Button>

      {/* Dialog: Nuevo capítulo */}
      <NuevoCapituloDialog
        open={dialogNuevo}
        onOpenChange={setDialogNuevo}
        onCreate={handleNuevoCapitulo}
      />

      {/* Dialog: confirmación de borrado */}
      <Dialog
        open={dialogConfirmBorrar !== null}
        onOpenChange={(o) => !o && setDialogConfirmBorrar(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Borrar capítulo?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[--color-muted-foreground]">
            Este capítulo contiene partidas. Si lo borras, también se eliminarán
            todas sus partidas.
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogConfirmBorrar(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (dialogConfirmBorrar !== null) remove(dialogConfirmBorrar)
                setDialogConfirmBorrar(null)
              }}
            >
              Borrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: menú contextual capítulo */}
      <Dialog
        open={dialogMenu !== null}
        onOpenChange={(o) => !o && setDialogMenu(null)}
      >
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Acciones del capítulo</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => {
                if (dialogMenu !== null) {
                  setAbierto((s) => ({ ...s, [dialogMenu]: true }))
                }
                setDialogMenu(null)
              }}
            >
              Renombrar
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              disabled={dialogMenu === 0}
              onClick={() => {
                if (dialogMenu !== null && dialogMenu > 0) {
                  move(dialogMenu, dialogMenu - 1)
                }
                setDialogMenu(null)
              }}
            >
              Mover arriba
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              disabled={
                dialogMenu === null || dialogMenu >= fields.length - 1
              }
              onClick={() => {
                if (
                  dialogMenu !== null &&
                  dialogMenu < fields.length - 1
                ) {
                  move(dialogMenu, dialogMenu + 1)
                }
                setDialogMenu(null)
              }}
            >
              Mover abajo
            </Button>
            <Button
              variant="destructive"
              className="justify-start"
              onClick={() => {
                if (dialogMenu !== null) handleBorrar(dialogMenu)
                setDialogMenu(null)
              }}
            >
              Borrar capítulo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ===========================================================================
// CapituloItem (sub-componente con su propio useFieldArray)
// ===========================================================================
interface CapituloItemProps {
  idx: number
  // biome-ignore lint/suspicious/noExplicitAny: form genérico
  control: Control<any>
  // biome-ignore lint/suspicious/noExplicitAny: form genérico
  register: UseFormRegister<any>
  empresaId: string
  capituloIvaDefault: 0 | 4 | 10 | 21
  abierto: boolean
  onToggle: () => void
  onMenu: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onBorrar: () => void
  fieldData: CapituloFormItem
  updateField: (patch: CapituloFormItem) => void
  onDragStart?: () => void
  onDragEnd?: () => void
  isDragging?: boolean
}

function CapituloItem({
  idx,
  control,
  register,
  empresaId,
  capituloIvaDefault,
  abierto,
  onToggle,
  onMenu,
  fieldData,
  onDragStart,
  onDragEnd,
  isDragging,
}: CapituloItemProps) {
  const partidasArray = useFieldArray({
    control,
    name: `capitulos.${idx}.partidas`,
  })

  const partidasWatch = useWatch({
    control,
    name: `capitulos.${idx}.partidas`,
  }) as PartidaFormItem[] | undefined

  const subtotal = React.useMemo(() => {
    if (!partidasWatch) return 0
    return partidasWatch.reduce((acc, p) => {
      const c = Number(p?.cantidad ?? 0)
      const pu = Number(p?.precio_unitario ?? 0)
      return acc + c * pu
    }, 0)
  }, [partidasWatch])

  const [selectorOpen, setSelectorOpen] = React.useState(false)

  return (
    <section
      className={cn(
        'overflow-hidden rounded-[--radius] border border-[--color-border] bg-[--color-card] transition-opacity',
        isDragging && 'opacity-50',
      )}
    >
      {/* Cabecera */}
      <header className="flex items-center gap-2 border-b border-[--color-border] bg-[--color-muted]/40 p-3">
        {/* Handle drag (sólo desktop) */}
        <button
          type="button"
          aria-label="Arrastra para reordenar"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = 'move'
            onDragStart?.()
          }}
          onDragEnd={() => onDragEnd?.()}
          className="hidden cursor-grab touch-none rounded-md p-1 text-[--color-muted-foreground] hover:bg-[--color-muted] active:cursor-grabbing sm:inline-flex"
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onToggle}
          aria-label={abierto ? 'Colapsar' : 'Expandir'}
          className="rounded-md p-1 hover:bg-[--color-muted]"
        >
          {abierto ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </button>
        <Input
          {...register(`capitulos.${idx}.nombre`)}
          placeholder="Nombre del capítulo"
          className="border-transparent bg-transparent px-2 text-base font-semibold shadow-none focus-visible:bg-[--color-card]"
        />
        <span className="hidden shrink-0 text-sm font-bold text-[--color-foreground] sm:block">
          {formatCurrency(subtotal)}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onMenu}
          aria-label="Acciones del capítulo"
        >
          <MoreVertical className="h-5 w-5" />
        </Button>
      </header>

      {/* Subtotal en móvil */}
      <div className="flex items-center justify-between border-b border-[--color-border] px-3 py-2 sm:hidden">
        <span className="text-xs text-[--color-muted-foreground]">
          Subtotal capítulo
        </span>
        <span className="text-sm font-bold">{formatCurrency(subtotal)}</span>
      </div>

      {abierto && (
        <div className="space-y-3 p-3">
          {partidasArray.fields.length === 0 && (
            <p className="py-4 text-center text-sm text-[--color-muted-foreground]">
              Aún no hay partidas en este capítulo.
            </p>
          )}

          {partidasArray.fields.map((pf, pIdx) => (
            <PartidaCard
              key={pf.id}
              capIdx={idx}
              pIdx={pIdx}
              control={control}
              register={register}
              onRemove={() => partidasArray.remove(pIdx)}
            />
          ))}

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => setSelectorOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Añadir partida
          </Button>

          <SelectorPartidas
            open={selectorOpen}
            onOpenChange={setSelectorOpen}
            empresaId={empresaId}
            capituloPrefiltrado={fieldData?.capitulo_sistema ?? undefined}
            onAdd={(partida) => {
              partidasArray.append({
                partida_biblioteca_id: partida.partida_biblioteca_id,
                descripcion: partida.descripcion,
                unidad: partida.unidad,
                cantidad: partida.cantidad,
                precio_unitario: partida.precio_unitario,
                tipo_iva: partida.tipo_iva ?? capituloIvaDefault,
              } satisfies PartidaFormItem)
            }}
          />
        </div>
      )}
    </section>
  )
}

// ===========================================================================
// PartidaCard
// ===========================================================================
interface PartidaCardProps {
  capIdx: number
  pIdx: number
  // biome-ignore lint/suspicious/noExplicitAny: form genérico
  control: Control<any>
  // biome-ignore lint/suspicious/noExplicitAny: form genérico
  register: UseFormRegister<any>
  onRemove: () => void
}

function PartidaCard({
  capIdx,
  pIdx,
  control,
  register,
  onRemove,
}: PartidaCardProps) {
  const watched = useWatch({
    control,
    name: `capitulos.${capIdx}.partidas.${pIdx}`,
  }) as PartidaFormItem | undefined

  const cantidad = Number(watched?.cantidad ?? 0)
  const precio = Number(watched?.precio_unitario ?? 0)
  const importe = cantidad * precio
  const esBiblioteca = !!watched?.partida_biblioteca_id

  const selectAll = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if ('select' in e.currentTarget) e.currentTarget.select()
  }

  const baseName = `capitulos.${capIdx}.partidas.${pIdx}` as const

  return (
    <div className="space-y-2 rounded-lg border border-[--color-border] bg-[--color-card] p-3">
      {/* Línea 1: descripción */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Label
            htmlFor={`${baseName}.descripcion`}
            className="text-xs uppercase tracking-wide text-[--color-muted-foreground]"
          >
            Descripción
          </Label>
          {esBiblioteca && (
            <Badge variant="muted" className="text-[10px]">
              Biblioteca
            </Badge>
          )}
        </div>
        <Input
          id={`${baseName}.descripcion`}
          {...register(`${baseName}.descripcion`)}
          placeholder="Descripción de la partida"
        />
      </div>

      {/* Línea 2: unidad / cantidad / precio */}
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-[--color-muted-foreground]">
            Unidad
          </Label>
          <Select
            {...register(`${baseName}.unidad`)}
            options={UNIDAD_OPTIONS}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-[--color-muted-foreground]">
            Cantidad
          </Label>
          <Input
            type="number"
            step="0.01"
            inputMode="decimal"
            onFocus={selectAll}
            {...register(`${baseName}.cantidad`, { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-[--color-muted-foreground]">
            Precio
          </Label>
          <Input
            type="number"
            step="0.01"
            inputMode="decimal"
            onFocus={selectAll}
            {...register(`${baseName}.precio_unitario`, {
              valueAsNumber: true,
            })}
          />
        </div>
      </div>

      {/* Línea 3: importe + papelera */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-sm text-[--color-muted-foreground]">Importe</span>
        <div className="flex items-center gap-3">
          <span className="font-bold text-[--color-foreground]">
            {formatCurrency(importe)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            aria-label="Eliminar partida"
            className="text-[--color-destructive] hover:bg-[--color-destructive]/10"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* IVA escondido para mantener el valor en el form */}
      <input
        type="hidden"
        {...register(`${baseName}.tipo_iva`, { valueAsNumber: true })}
      />
      <input type="hidden" {...register(`${baseName}.partida_biblioteca_id`)} />
    </div>
  )
}

// ===========================================================================
// Dialog: nuevo capítulo
// ===========================================================================
interface NuevoCapituloDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (nombre: string, capituloSistema: CapituloSistema | null) => void
}

function NuevoCapituloDialog({
  open,
  onOpenChange,
  onCreate,
}: NuevoCapituloDialogProps) {
  const [nombre, setNombre] = React.useState('')
  const [capSistema, setCapSistema] = React.useState<string>('')

  React.useEffect(() => {
    if (open) {
      setNombre('')
      setCapSistema('')
    }
  }, [open])

  // Autocompletar capítulo sistema desde el nombre
  React.useEffect(() => {
    if (capSistema) return
    const match = CAPITULOS_META.find(
      (m) =>
        m.label.toLowerCase() === nombre.trim().toLowerCase() ||
        m.key === nombre.trim().toLowerCase(),
    )
    if (match) setCapSistema(match.key)
  }, [nombre, capSistema])

  const submit = () => {
    const n = nombre.trim()
    if (!n) return
    onCreate(n, (capSistema || null) as CapituloSistema | null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo capítulo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nuevo-cap-nombre">Nombre</Label>
            <Input
              id="nuevo-cap-nombre"
              autoFocus
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Albañilería"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-[--color-muted-foreground]">
              Sugerencias
            </Label>
            <div className="flex flex-wrap gap-2">
              {CAPITULOS_META.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => {
                    setNombre(m.label)
                    setCapSistema(m.key)
                  }}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    capSistema === m.key
                      ? 'border-[--color-primary] bg-[--color-primary]/10 text-[--color-primary]'
                      : 'border-[--color-border] bg-[--color-card] hover:bg-[--color-muted]',
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nuevo-cap-sistema">Capítulo del sistema</Label>
            <Select
              id="nuevo-cap-sistema"
              value={capSistema}
              onChange={(e) => setCapSistema(e.target.value)}
              options={CAPITULO_SISTEMA_OPTIONS}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="accent"
            onClick={submit}
            disabled={!nombre.trim()}
          >
            Crear capítulo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
