'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { createClient } from '@/lib/supabase/client'

interface CobroDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  facturaId: string
  totalACobrar: number
  importeCobradoActual: number
  onCobroRegistrado?: () => void
}

export function CobroDialog({
  open,
  onOpenChange,
  facturaId,
  totalACobrar,
  importeCobradoActual,
  onCobroRegistrado,
}: CobroDialogProps) {
  const supabase = React.useMemo(() => createClient(), [])
  const { toast } = useToast()

  const restante = Math.max(0, totalACobrar - importeCobradoActual)
  const [importe, setImporte] = React.useState<string>(restante.toFixed(2))
  const [fecha, setFecha] = React.useState<string>(
    new Date().toISOString().slice(0, 10),
  )
  const [notas, setNotas] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setImporte(restante.toFixed(2))
      setFecha(new Date().toISOString().slice(0, 10))
      setNotas('')
    }
  }, [open, restante])

  async function guardar() {
    const monto = Number(importe)
    if (!Number.isFinite(monto) || monto <= 0) {
      toast({ title: 'Importe inválido', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const nuevoCobrado = importeCobradoActual + monto
      const cobradaEntera = nuevoCobrado >= totalACobrar - 0.01
      const { error } = await supabase
        .from('facturas')
        .update({
          importe_cobrado: nuevoCobrado,
          fecha_cobro: cobradaEntera ? fecha : null,
          estado: cobradaEntera ? 'pagada' : 'parcial',
          notas_cobro: notas || null,
          // biome-ignore lint/suspicious/noExplicitAny: db update
        } as any)
        .eq('id', facturaId)
      if (error) throw new Error(error.message)
      toast({
        title: cobradaEntera ? 'Factura cobrada' : 'Cobro parcial registrado',
      })
      onCobroRegistrado?.()
      onOpenChange(false)
    } catch (err) {
      toast({
        title: 'Error al registrar cobro',
        description: err instanceof Error ? err.message : 'Inténtalo de nuevo',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar cobro</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-[--color-muted]/50 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[--color-muted-foreground]">
                Total a cobrar
              </span>
              <span className="font-semibold">
                {totalACobrar.toFixed(2)} €
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[--color-muted-foreground]">Ya cobrado</span>
              <span>{importeCobradoActual.toFixed(2)} €</span>
            </div>
            <div className="mt-1 flex justify-between border-t pt-1">
              <span className="text-[--color-muted-foreground]">Restante</span>
              <span className="font-semibold text-[--color-primary]">
                {restante.toFixed(2)} €
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cobro-importe">Importe cobrado (€)</Label>
            <Input
              id="cobro-importe"
              type="number"
              step="0.01"
              inputMode="decimal"
              value={importe}
              onChange={(e) => setImporte(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cobro-fecha">Fecha de cobro</Label>
            <Input
              id="cobro-fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cobro-notas">Notas (opcional)</Label>
            <Textarea
              id="cobro-notas"
              rows={2}
              placeholder="Transferencia, nº operación, etc."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
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
              'Registrar cobro'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
