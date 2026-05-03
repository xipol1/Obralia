import { formatCurrency, formatDate, formatPhone } from './utils'

interface WhatsAppInput {
  nombreCliente: string
  tituloObra: string
  total: number
  fechaValidez: string | Date
  urlPdf: string
  nombreEmpresa: string
  telefonoCliente: string
}

export function generarMensajeWhatsApp(input: WhatsAppInput): string {
  return `Hola ${input.nombreCliente}, te envío el presupuesto solicitado para ${input.tituloObra}.

Total: ${formatCurrency(input.total)} (IVA incluido).
Validez: hasta el ${formatDate(input.fechaValidez)}.

Aquí tienes el PDF: ${input.urlPdf}

Cualquier duda me dices.
${input.nombreEmpresa}`
}

export function generarLinkWhatsApp(input: WhatsAppInput): string {
  const phone = formatPhone(input.telefonoCliente).replace('+', '')
  const text = encodeURIComponent(generarMensajeWhatsApp(input))
  return `https://wa.me/${phone}?text=${text}`
}
