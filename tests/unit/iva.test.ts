import { describe, expect, it } from 'vitest'
import { calcularIvaAplicable, calcularIvaVpo } from '@/lib/iva/calcular-iva'
import type { IvaInput } from '@/lib/iva/calcular-iva'

describe('calcularIvaAplicable', () => {
  it('devuelve 21% cuando NO es vivienda particular', () => {
    const result = calcularIvaAplicable({
      esViviendaParticular: false,
      esResidenciaHabitual: false,
      materialSuperaCuarenta: false,
    })
    expect(result.tipoIva).toBe(21)
    expect(result.porcentaje).toBe(21)
  })

  it('devuelve 21% cuando es vivienda particular pero NO residencia habitual', () => {
    const result = calcularIvaAplicable({
      esViviendaParticular: true,
      esResidenciaHabitual: false,
      materialSuperaCuarenta: false,
    })
    expect(result.tipoIva).toBe(21)
  })

  it('devuelve 21% cuando material supera el 40%', () => {
    const result = calcularIvaAplicable({
      esViviendaParticular: true,
      esResidenciaHabitual: true,
      materialSuperaCuarenta: true,
    })
    expect(result.tipoIva).toBe(21)
    expect(result.motivo).toContain('40%')
  })

  it('devuelve 10% cuando vivienda particular + residencia habitual + material < 40%', () => {
    const result = calcularIvaAplicable({
      esViviendaParticular: true,
      esResidenciaHabitual: true,
      materialSuperaCuarenta: false,
    })
    expect(result.tipoIva).toBe(10)
    expect(result.porcentaje).toBe(10)
    expect(result.motivo).toContain('Art. 91')
  })

  it('devuelve 10% con advertencia cuando material es "no lo sé" (null)', () => {
    const result = calcularIvaAplicable({
      esViviendaParticular: true,
      esResidenciaHabitual: true,
      materialSuperaCuarenta: null,
    })
    expect(result.tipoIva).toBe(10)
    expect(result.motivo).toContain('IMPORTANTE')
    expect(result.motivo).toContain('40%')
  })

  it('obra nueva en local comercial → 21%', () => {
    const result = calcularIvaAplicable({
      esViviendaParticular: false,
      esResidenciaHabitual: false,
      materialSuperaCuarenta: false,
    })
    expect(result.tipoIva).toBe(21)
  })

  it('reforma en oficina (no vivienda) → 21%', () => {
    const result = calcularIvaAplicable({
      esViviendaParticular: false,
      esResidenciaHabitual: true,
      materialSuperaCuarenta: false,
    })
    expect(result.tipoIva).toBe(21)
  })

  it('vivienda de segunda residencia (vacacional) → 21%', () => {
    const result = calcularIvaAplicable({
      esViviendaParticular: true,
      esResidenciaHabitual: false,
      materialSuperaCuarenta: null,
    })
    expect(result.tipoIva).toBe(21)
  })

  it('reforma vivienda habitual con material exacto al 40% → depende de la declaración', () => {
    // Si el constructor dice que SÍ supera → 21%
    const result = calcularIvaAplicable({
      esViviendaParticular: true,
      esResidenciaHabitual: true,
      materialSuperaCuarenta: true,
    })
    expect(result.tipoIva).toBe(21)
  })

  it('garaje NO vinculado a vivienda → 21%', () => {
    const result = calcularIvaAplicable({
      esViviendaParticular: false,
      esResidenciaHabitual: false,
      materialSuperaCuarenta: false,
    })
    expect(result.tipoIva).toBe(21)
  })

  it('todos los campos en false → 21% (no es vivienda particular)', () => {
    const result = calcularIvaAplicable({
      esViviendaParticular: false,
      esResidenciaHabitual: false,
      materialSuperaCuarenta: false,
    })
    expect(result.tipoIva).toBe(21)
  })

  it('motivo siempre incluye referencia legal cuando aplica reducido', () => {
    const result = calcularIvaAplicable({
      esViviendaParticular: true,
      esResidenciaHabitual: true,
      materialSuperaCuarenta: false,
    })
    expect(result.motivo).toContain('LIVA')
  })

  it('el resultado siempre tiene tipoIva, porcentaje y motivo definidos', () => {
    const cases: IvaInput[] = [
      { esViviendaParticular: true, esResidenciaHabitual: true, materialSuperaCuarenta: true },
      { esViviendaParticular: true, esResidenciaHabitual: true, materialSuperaCuarenta: false },
      { esViviendaParticular: true, esResidenciaHabitual: true, materialSuperaCuarenta: null },
      { esViviendaParticular: true, esResidenciaHabitual: false, materialSuperaCuarenta: false },
      { esViviendaParticular: false, esResidenciaHabitual: true, materialSuperaCuarenta: false },
      { esViviendaParticular: false, esResidenciaHabitual: false, materialSuperaCuarenta: null },
    ]
    for (const input of cases) {
      const result = calcularIvaAplicable(input)
      expect(result.tipoIva).toBeDefined()
      expect(result.porcentaje).toBeDefined()
      expect(result.motivo).toBeTruthy()
      expect(result.motivo.length).toBeGreaterThan(10)
    }
  })
})

describe('calcularIvaVpo', () => {
  it('devuelve 4% para VPO régimen especial', () => {
    const result = calcularIvaVpo(true)
    expect(result.tipoIva).toBe(4)
    expect(result.porcentaje).toBe(4)
    expect(result.motivo).toContain('protección oficial')
  })
})
