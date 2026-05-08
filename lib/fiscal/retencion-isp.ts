/**
 * Obralia - Cálculo de retención IRPF e Inversión del Sujeto Pasivo (ISP)
 *
 * Reglas resumidas:
 * - Retención IRPF: sólo cuando el cliente actúa como empresario o profesional.
 *   Tipo general 15%; los autónomos pueden aplicar 7% durante los 3 primeros
 *   años de actividad (art. 95.1 RIRPF).
 * - Inversión Sujeto Pasivo (ISP) en construcción: art. 84.Uno.2.f LIVA.
 *   La factura se emite SIN IVA, el destinatario lo autorrepercute.
 *   Aplica a ejecuciones de obra inmobiliaria entre empresario contratista y
 *   empresario promotor (o entre subcontratistas).
 *
 * Estos helpers no toman decisiones automáticas: dan defaults sensatos a la UI
 * y la lógica de cálculo de totales.
 */

import type { TipoFiscalCliente } from '@/types/domain'

/** Cliente que tributa como empresa/autónomo y por tanto puede recibir retención */
export function clienteAplicaRetencionPorDefecto(
  tipoFiscal: TipoFiscalCliente,
): boolean {
  return (
    tipoFiscal === 'autonomo' ||
    tipoFiscal === 'empresa' ||
    tipoFiscal === 'administracion'
  )
}

/**
 * Porcentaje de retención sugerido según fecha de alta del emisor.
 * - Si lleva menos de 3 años de alta: 7%
 * - Si lleva 3 años o más, o no hay fecha: 15%
 *
 * Nota: el reformista puede preferir aplicar siempre 15% para evitar
 * regularizaciones — la UI debe permitir override.
 */
export function porcentajeRetencionSugerido(
  fechaAltaActividad: string | null | undefined,
  hoy: Date = new Date(),
): 7 | 15 {
  if (!fechaAltaActividad) return 15
  const alta = new Date(fechaAltaActividad)
  if (Number.isNaN(alta.getTime())) return 15
  const tresAnyosDespues = new Date(alta)
  tresAnyosDespues.setFullYear(alta.getFullYear() + 3)
  return hoy < tresAnyosDespues ? 7 : 15
}

/**
 * Cálculo de totales de un documento (presupuesto / factura) con todos los
 * ajustes fiscales españoles aplicables a reformas.
 *
 * - Si ISP, la cuota de IVA NO se cobra al cliente (la autorrepercute él).
 *   La factura conserva el valor de cuota_iva para reporting interno, pero
 *   total_a_cobrar la excluye.
 * - La retención se calcula sobre la base imponible (no sobre el total con IVA).
 */
export interface TotalesInput {
  baseImponible: number
  tipoIva: number
  retencionPct: number
  inversionSujetoPasivo: boolean
}

export interface TotalesOutput {
  baseImponible: number
  cuotaIva: number
  retencionImporte: number
  /** total = base + IVA. Es el "total" tradicional de la factura. */
  total: number
  /** lo que efectivamente cobra el reformista (excluye IVA si ISP, descuenta retención) */
  totalACobrar: number
}

export function calcularTotales(input: TotalesInput): TotalesOutput {
  const baseImponible = round2(input.baseImponible)
  const cuotaIva = round2((baseImponible * input.tipoIva) / 100)
  const retencionImporte = round2((baseImponible * input.retencionPct) / 100)
  const total = round2(baseImponible + cuotaIva)
  const totalACobrar = round2(
    baseImponible +
      (input.inversionSujetoPasivo ? 0 : cuotaIva) -
      retencionImporte,
  )
  return { baseImponible, cuotaIva, retencionImporte, total, totalACobrar }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Etiqueta legal estándar para incluir en facturas con ISP.
 */
export const LEYENDA_ISP =
  'Operación con inversión del sujeto pasivo conforme al artículo 84.Uno.2º.f) de la Ley 37/1992 del IVA. El destinatario es el sujeto pasivo del impuesto.'

/**
 * Estado real de cobro de una factura combinando importe cobrado y vencimiento.
 */
export interface EstadoCobroInput {
  total: number
  importeCobrado: number
  fechaVencimiento: string | null | undefined
  hoy?: Date
}

export type EstadoCobro = 'pendiente' | 'parcial' | 'cobrada' | 'vencida'

export function estadoCobro(input: EstadoCobroInput): EstadoCobro {
  const hoy = input.hoy ?? new Date()
  const cobrado = input.importeCobrado ?? 0
  const total = input.total ?? 0
  if (cobrado >= total - 0.01) return 'cobrada'
  if (cobrado > 0) return 'parcial'
  if (input.fechaVencimiento) {
    const venc = new Date(input.fechaVencimiento)
    if (!Number.isNaN(venc.getTime()) && venc < hoy) return 'vencida'
  }
  return 'pendiente'
}
