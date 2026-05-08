'use client'

import * as React from 'react'
import { Loader2, Eraser, Pen } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import { createClient } from '@/lib/supabase/client'

interface FirmaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  presupuestoId: string
  empresaId: string
  defaultNombre?: string
  onFirmado?: (firmaUrl: string) => void
}

const CANVAS_W = 600
const CANVAS_H = 220

export function FirmaDialog({
  open,
  onOpenChange,
  presupuestoId,
  empresaId,
  defaultNombre,
  onFirmado,
}: FirmaDialogProps) {
  const supabase = React.useMemo(() => createClient(), [])
  const { toast } = useToast()
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const drawingRef = React.useRef(false)
  const lastRef = React.useRef<{ x: number; y: number } | null>(null)
  const dirtyRef = React.useRef(false)

  const [nombre, setNombre] = React.useState(defaultNombre ?? '')
  const [saving, setSaving] = React.useState(false)
  const [tieneTrazo, setTieneTrazo] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    setNombre(defaultNombre ?? '')
    setTieneTrazo(false)
    dirtyRef.current = false
    requestAnimationFrame(() => {
      const c = canvasRef.current
      if (!c) return
      const ctx = c.getContext('2d')
      if (!ctx) return
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, c.width, c.height)
      ctx.strokeStyle = '#111'
      ctx.lineWidth = 2.2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    })
  }, [open, defaultNombre])

  function getPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const c = canvasRef.current
    if (!c) return null
    const rect = c.getBoundingClientRect()
    const scaleX = c.width / rect.width
    const scaleY = c.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault()
    canvasRef.current?.setPointerCapture(e.pointerId)
    drawingRef.current = true
    lastRef.current = getPos(e)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return
    const ctx = canvasRef.current?.getContext('2d')
    const pos = getPos(e)
    if (!ctx || !pos || !lastRef.current) return
    ctx.beginPath()
    ctx.moveTo(lastRef.current.x, lastRef.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastRef.current = pos
    if (!dirtyRef.current) {
      dirtyRef.current = true
      setTieneTrazo(true)
    }
  }

  function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    drawingRef.current = false
    lastRef.current = null
    canvasRef.current?.releasePointerCapture(e.pointerId)
  }

  function limpiar() {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, c.width, c.height)
    setTieneTrazo(false)
    dirtyRef.current = false
  }

  async function guardar() {
    if (!tieneTrazo) {
      toast({ title: 'Falta la firma', description: 'Dibuja la firma antes de guardar.' })
      return
    }
    if (!nombre.trim()) {
      toast({ title: 'Falta el nombre', description: 'Escribe el nombre de quien firma.' })
      return
    }
    setSaving(true)
    try {
      const c = canvasRef.current
      if (!c) throw new Error('Canvas no disponible')
      const blob: Blob = await new Promise((resolve, reject) =>
        c.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('No se pudo generar el PNG'))),
          'image/png',
        ),
      )

      const path = `${empresaId}/${presupuestoId}.png`
      const { error: upErr } = await supabase.storage
        .from('firmas')
        .upload(path, blob, {
          contentType: 'image/png',
          upsert: true,
          cacheControl: '0',
        })
      if (upErr) throw new Error(upErr.message)

      const { data: signed, error: sErr } = await supabase.storage
        .from('firmas')
        .createSignedUrl(path, 60 * 60 * 24 * 365)
      if (sErr || !signed?.signedUrl) {
        throw new Error(sErr?.message ?? 'No se pudo firmar la URL')
      }

      const { error: updErr } = await supabase
        .from('presupuestos')
        .update({
          firma_url: signed.signedUrl,
          firma_cliente_nombre: nombre.trim(),
          firma_cliente_at: new Date().toISOString(),
          estado: 'aceptado',
          aceptado_at: new Date().toISOString(),
          // biome-ignore lint/suspicious/noExplicitAny: db update
        } as any)
        .eq('id', presupuestoId)
      if (updErr) throw new Error(updErr.message)

      toast({ title: 'Presupuesto firmado' })
      onFirmado?.(signed.signedUrl)
      onOpenChange(false)
    } catch (err) {
      toast({
        title: 'Error al firmar',
        description: err instanceof Error ? err.message : 'Inténtalo de nuevo',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Firma del cliente</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firma-nombre">Nombre y apellidos</Label>
            <Input
              id="firma-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="María García Fernández"
            />
          </div>

          <div className="space-y-2">
            <Label>Firma</Label>
            <div className="overflow-hidden rounded-[--radius] border-2 border-dashed border-[--color-border] bg-white">
              <canvas
                ref={canvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onPointerLeave={handlePointerUp}
                className="block h-44 w-full touch-none cursor-crosshair"
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-[--color-muted-foreground]">
                <Pen className="mr-1 inline h-3 w-3" />
                Firma con el dedo o el ratón.
              </p>
              <Button type="button" variant="ghost" size="sm" onClick={limpiar}>
                <Eraser className="h-3.5 w-3.5" />
                Borrar
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" variant="accent" onClick={guardar} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando…
              </>
            ) : (
              'Guardar firma'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
