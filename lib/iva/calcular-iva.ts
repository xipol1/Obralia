import type { TipoIVA } from '@/types/domain'

export interface IvaInput {
  esViviendaParticular: boolean
  esResidenciaHabitual: boolean
  materialSuperaCuarenta: boolean | null
}

export interface IvaResult {
  tipoIva: TipoIVA
  porcentaje: number
  motivo: string
}

export function calcularIvaAplicable(input: IvaInput): IvaResult {
  if (!input.esViviendaParticular) {
    return {
      tipoIva: 21,
      porcentaje: 21,
      motivo:
        'IVA general del 21%. La obra no es en vivienda particular del destinatario final.',
    }
  }

  if (!input.esResidenciaHabitual) {
    return {
      tipoIva: 21,
      porcentaje: 21,
      motivo:
        'IVA general del 21%. La vivienda no es residencia habitual del destinatario.',
    }
  }

  if (input.materialSuperaCuarenta === true) {
    return {
      tipoIva: 21,
      porcentaje: 21,
      motivo:
        'IVA general del 21%. El coste de los materiales aportados por el contratista supera el 40% de la base imponible (Art. 91.Uno.2.10º LIVA).',
    }
  }

  if (input.materialSuperaCuarenta === false) {
    return {
      tipoIva: 10,
      porcentaje: 10,
      motivo:
        'IVA reducido del 10% aplicable a obras de renovación y reparación en vivienda particular que constituye residencia habitual del destinatario, donde el coste de los materiales aportados por el contratista no supera el 40% de la base imponible (Art. 91.Uno.2.10º LIVA).',
    }
  }

  // materialSuperaCuarenta === null ("no lo sé")
  return {
    tipoIva: 10,
    porcentaje: 10,
    motivo:
      'IVA reducido del 10% aplicable a obras de renovación y reparación en vivienda particular que constituye residencia habitual del destinatario. IMPORTANTE: El coste de los materiales aportados no debe superar el 40% de la base imponible para que aplique este tipo (Art. 91.Uno.2.10º LIVA). Verifique este requisito.',
  }
}

// VPO régimen especial — preparado pero no expuesto en MVP
export function calcularIvaVpo(_esVpoRegimenEspecial: boolean): IvaResult {
  return {
    tipoIva: 4,
    porcentaje: 4,
    motivo:
      'IVA superreducido del 4% aplicable a entregas de viviendas de protección oficial de régimen especial o de promoción pública (Art. 91.Uno.1.7º LIVA).',
  }
}
