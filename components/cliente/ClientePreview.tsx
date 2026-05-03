'use client'

/**
 * ClientePreview — tarjeta visual de confirmación tras seleccionar cliente.
 *
 * Aparece después del ClientePicker. Muestra al constructor TODA la info
 * del cliente para que confirme visualmente que acertó (en lugar de
 * solo ver un cliente_id en el form).
 *
 * Acciones:
 *  - "Cambiar" → reabre el picker
 *  - Click en teléfono → abre marcador del móvil (tel:)
 */

import { Building2, MapPin, Phone, User, UserCircle, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { direccionCompleta, formatPhoneDisplay, inicialesCliente, nombreCliente } from '@/lib/utils'
import type { Cliente } from '@/types/domain'

interface ClientePreviewProps {
  cliente: Cliente
  onChange: () => void
}

export function ClientePreview({ cliente, onChange }: ClientePreviewProps) {
  const Icon = cliente.tipo === 'empresa' ? Building2 : User
  const direccion = direccionCompleta(cliente)

  return (
    <div className="rounded-[--radius] border-2 border-[--color-primary]/20 bg-[--color-primary]/5 p-4">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-[--color-card] text-lg font-bold text-[--color-primary] shadow-sm">
          {inicialesCliente(cliente) || <UserCircle className="h-7 w-7" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 flex-shrink-0 text-[--color-primary]" />
            <span className="truncate text-lg font-bold text-[--color-foreground]">
              {nombreCliente(cliente) || 'Sin nombre'}
            </span>
          </div>

          {cliente.nif && (
            <p className="mt-0.5 text-sm text-[--color-muted-foreground]">
              NIF: {cliente.nif}
            </p>
          )}

          {cliente.telefono && (
            <a
              href={`tel:${cliente.telefono}`}
              className="mt-2 flex items-center gap-1.5 text-sm font-medium text-[--color-primary] hover:underline"
            >
              <Phone className="h-3.5 w-3.5" />
              {formatPhoneDisplay(cliente.telefono)}
            </a>
          )}

          {direccion && (
            <div className="mt-1 flex items-start gap-1.5 text-sm text-[--color-muted-foreground]">
              <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              <span>{direccion}</span>
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onChange}
          className="flex-shrink-0"
        >
          <Pencil className="h-4 w-4" />
          Cambiar
        </Button>
      </div>
    </div>
  )
}
