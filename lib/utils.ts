import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

export function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '')
  if (clean.startsWith('34')) return `+${clean}`
  return `+34${clean}`
}

/**
 * Formatea un teléfono español para mostrar al usuario: "+34 612 345 678".
 * Soporta entradas con/sin prefijo, espacios, guiones.
 */
export function formatPhoneDisplay(input: string | null | undefined): string {
  if (!input) return ''
  const clean = input.replace(/\D/g, '')
  // Quitar 34 inicial si existe
  const number = clean.startsWith('34') ? clean.slice(2) : clean
  if (number.length === 0) return ''
  // Agrupar de 3 en 3
  const chunks: string[] = []
  let rest = number
  while (rest.length > 0) {
    chunks.push(rest.slice(0, 3))
    rest = rest.slice(3)
  }
  return `+34 ${chunks.join(' ')}`
}

/**
 * Normaliza un NIF/CIF/NIE: mayúsculas y sin espacios.
 * No valida la letra de control (eso lo hace zod en otro punto).
 */
export function formatNif(input: string | null | undefined): string {
  if (!input) return ''
  return input.replace(/[\s-]/g, '').toUpperCase()
}

/**
 * Normaliza un código postal español a 5 dígitos.
 * Si tiene menos, lo deja como está (no podemos inventar dígitos).
 */
export function formatCodigoPostal(input: string | null | undefined): string {
  if (!input) return ''
  return input.replace(/\D/g, '').slice(0, 5)
}

/**
 * Devuelve el nombre legible de un cliente, según su tipo.
 * Particular: "Nombre Apellidos". Empresa: "Razón social".
 */
export function nombreCliente(cliente: {
  tipo?: string | null
  nombre?: string | null
  apellidos?: string | null
  razon_social?: string | null
} | null | undefined): string {
  if (!cliente) return ''
  if (cliente.tipo === 'empresa' && cliente.razon_social) return cliente.razon_social
  const partes = [cliente.nombre, cliente.apellidos].filter(Boolean).join(' ').trim()
  return partes || cliente.razon_social || ''
}

/**
 * Devuelve las iniciales para un avatar visual (2 letras max).
 */
export function inicialesCliente(cliente: {
  tipo?: string | null
  nombre?: string | null
  apellidos?: string | null
  razon_social?: string | null
} | null | undefined): string {
  if (!cliente) return '?'
  if (cliente.tipo === 'empresa' && cliente.razon_social) {
    return cliente.razon_social.trim().charAt(0).toUpperCase() || '?'
  }
  const a = cliente.nombre?.trim().charAt(0).toUpperCase() ?? ''
  const b = cliente.apellidos?.trim().charAt(0).toUpperCase() ?? ''
  return (a + b) || cliente.razon_social?.charAt(0).toUpperCase() || '?'
}

/**
 * Junta dirección completa en una línea legible.
 */
export function direccionCompleta(parts: {
  direccion?: string | null
  codigo_postal?: string | null
  municipio?: string | null
  provincia?: string | null
}): string {
  const linea1 = parts.direccion ?? ''
  const linea2 = [parts.codigo_postal, parts.municipio, parts.provincia]
    .filter(Boolean)
    .join(' ')
  return [linea1, linea2].filter(Boolean).join(', ')
}
