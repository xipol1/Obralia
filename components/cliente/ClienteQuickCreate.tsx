'use client'

/**
 * ClienteQuickCreate — modal mínimo para crear cliente sin abandonar
 * el presupuesto que se está editando.
 *
 * Solo pide los 4 campos imprescindibles:
 *   - Tipo (toggle visual particular/empresa)
 *   - Nombre / Razón social
 *   - Teléfono (con auto-formato)
 *   - Dirección (opcional)
 *
 * Resto de datos se completan luego desde /clientes/[id] si hace falta.
 */

import { useEffect, useState } from 'react'
import { Building2, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatPhoneDisplay, formatNif } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Cliente } from '@/types/domain'

interface ClienteQuickCreateProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  empresaId: string
  prefilledNombre?: string
  onCreated: (cliente: Cliente) => void
}

export function ClienteQuickCreate({
  open,
  onOpenChange,
  empresaId,
  prefilledNombre,
  onCreated,
}: ClienteQuickCreateProps) {
  const supabase = createClient()
  const { toast } = useToast()

  const [tipo, setTipo] = useState<'particular' | 'empresa'>('particular')
  const [nombre, setNombre] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [razonSocial, setRazonSocial] = useState('')
  const [nif, setNif] = useState('')
  const [telefono, setTelefono] = useState('')
  const [direccion, setDireccion] = useState('')
  const [saving, setSaving] = useState(false)

  // Reset cuando se abre con prefill
  useEffect(() => {
    if (open) {
      if (prefilledNombre) {
        setNombre(prefilledNombre)
        setRazonSocial(prefilledNombre)
      } else {
        setNombre('')
        setRazonSocial('')
      }
      setApellidos('')
      setNif('')
      setTelefono('')
      setDireccion('')
      setTipo('particular')
    }
  }, [open, prefilledNombre])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return

    if (tipo === 'particular' && !nombre.trim()) {
      toast({ title: 'Falta el nombre', variant: 'destructive' })
      return
    }
    if (tipo === 'empresa' && !razonSocial.trim()) {
      toast({ title: 'Falta la razón social', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const payload = {
        empresa_id: empresaId,
        tipo,
        nombre: tipo === 'particular' ? nombre.trim() : null,
        apellidos: tipo === 'particular' ? apellidos.trim() || null : null,
        razon_social: tipo === 'empresa' ? razonSocial.trim() : null,
        nif: nif ? formatNif(nif) : null,
        telefono: telefono.trim() || null,
        direccion: direccion.trim() || null,
      }
      const { data, error } = await supabase
        .from('clientes')
        .insert(payload)
        .select('*')
        .single()

      if (error || !data) {
        toast({
          title: 'No se pudo crear el cliente',
          description: error?.message,
          variant: 'destructive',
        })
        return
      }

      toast({ title: '✓ Cliente creado' })
      onCreated(data as Cliente)
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Inténtalo de nuevo',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo cliente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo: dos botones grandes */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTipo('particular')}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-[--radius] border-2 p-3 transition-all ${
                tipo === 'particular'
                  ? 'border-[--color-primary] bg-[--color-primary]/5 text-[--color-primary]'
                  : 'border-[--color-border] text-[--color-muted-foreground]'
              }`}
            >
              <User className="h-6 w-6" />
              <span className="text-sm font-semibold">Particular</span>
            </button>
            <button
              type="button"
              onClick={() => setTipo('empresa')}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-[--radius] border-2 p-3 transition-all ${
                tipo === 'empresa'
                  ? 'border-[--color-primary] bg-[--color-primary]/5 text-[--color-primary]'
                  : 'border-[--color-border] text-[--color-muted-foreground]'
              }`}
            >
              <Building2 className="h-6 w-6" />
              <span className="text-sm font-semibold">Empresa</span>
            </button>
          </div>

          {tipo === 'particular' ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="qc-nombre">Nombre *</Label>
                <Input
                  id="qc-nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="María"
                  autoFocus
                  autoComplete="given-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qc-apellidos">Apellidos</Label>
                <Input
                  id="qc-apellidos"
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  placeholder="García"
                  autoComplete="family-name"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="qc-rs">Razón social *</Label>
              <Input
                id="qc-rs"
                value={razonSocial}
                onChange={(e) => setRazonSocial(e.target.value)}
                placeholder="Reformas García SL"
                autoFocus
                autoComplete="organization"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="qc-tel">Teléfono</Label>
            <Input
              id="qc-tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              onBlur={() => setTelefono((v) => formatPhoneDisplay(v))}
              placeholder="+34 612 345 678"
              inputMode="tel"
              autoComplete="tel"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="qc-dir">Dirección</Label>
            <Input
              id="qc-dir"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="C/ Mayor 12, 3ºB"
              autoComplete="street-address"
            />
            <p className="text-xs text-[--color-muted-foreground]">
              Se usará como dirección de obra por defecto. Podrás cambiarla.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="qc-nif">NIF / CIF (opcional)</Label>
            <Input
              id="qc-nif"
              value={nif}
              onChange={(e) => setNif(e.target.value)}
              onBlur={() => setNif((v) => formatNif(v))}
              placeholder="12345678Z"
              autoCapitalize="characters"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="accent" size="lg" disabled={saving}>
              {saving ? 'Guardando...' : 'Crear y usar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
