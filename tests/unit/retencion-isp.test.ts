import { describe, expect, it } from 'vitest'
import {
  calcularTotales,
  clienteAplicaRetencionPorDefecto,
  estadoCobro,
  porcentajeRetencionSugerido,
} from '@/lib/fiscal/retencion-isp'

describe('clienteAplicaRetencionPorDefecto', () => {
  it('particular y comunidad NO aplican retención', () => {
    expect(clienteAplicaRetencionPorDefecto('particular')).toBe(false)
    expect(clienteAplicaRetencionPorDefecto('comunidad')).toBe(false)
  })

  it('autonomo / empresa / administracion SÍ aplican retención', () => {
    expect(clienteAplicaRetencionPorDefecto('autonomo')).toBe(true)
    expect(clienteAplicaRetencionPorDefecto('empresa')).toBe(true)
    expect(clienteAplicaRetencionPorDefecto('administracion')).toBe(true)
  })
})

describe('porcentajeRetencionSugerido', () => {
  it('autónomo en sus 3 primeros años → 7%', () => {
    const hoy = new Date('2026-05-08')
    expect(porcentajeRetencionSugerido('2025-01-01', hoy)).toBe(7)
    expect(porcentajeRetencionSugerido('2024-06-01', hoy)).toBe(7)
  })

  it('autónomo con más de 3 años → 15%', () => {
    const hoy = new Date('2026-05-08')
    expect(porcentajeRetencionSugerido('2020-01-01', hoy)).toBe(15)
  })

  it('sin fecha de alta → 15% por defecto', () => {
    expect(porcentajeRetencionSugerido(null)).toBe(15)
    expect(porcentajeRetencionSugerido(undefined)).toBe(15)
  })

  it('exactamente 3 años desde alta → 15% (límite superior)', () => {
    const hoy = new Date('2027-01-01')
    expect(porcentajeRetencionSugerido('2024-01-01', hoy)).toBe(15)
  })
})

describe('calcularTotales', () => {
  it('caso simple sin retención ni ISP', () => {
    const t = calcularTotales({
      baseImponible: 1000,
      tipoIva: 21,
      retencionPct: 0,
      inversionSujetoPasivo: false,
    })
    expect(t.cuotaIva).toBe(210)
    expect(t.retencionImporte).toBe(0)
    expect(t.total).toBe(1210)
    expect(t.totalACobrar).toBe(1210)
  })

  it('reforma vivienda con IVA reducido 10% y retención 15%', () => {
    const t = calcularTotales({
      baseImponible: 5000,
      tipoIva: 10,
      retencionPct: 15,
      inversionSujetoPasivo: false,
    })
    expect(t.cuotaIva).toBe(500)
    expect(t.retencionImporte).toBe(750)
    expect(t.total).toBe(5500) // base + IVA, sin retención
    expect(t.totalACobrar).toBe(4750) // 5000 + 500 - 750
  })

  it('subcontrata a constructora con ISP: factura SIN IVA, sin retención', () => {
    const t = calcularTotales({
      baseImponible: 2000,
      tipoIva: 21,
      retencionPct: 0,
      inversionSujetoPasivo: true,
    })
    // La cuota se calcula igual para reporting interno...
    expect(t.cuotaIva).toBe(420)
    // ...pero NO se cobra
    expect(t.totalACobrar).toBe(2000)
  })

  it('factura B2B con ISP + retención (caso poco común pero válido)', () => {
    const t = calcularTotales({
      baseImponible: 1000,
      tipoIva: 21,
      retencionPct: 15,
      inversionSujetoPasivo: true,
    })
    // base sin IVA, menos retención sobre la base
    expect(t.totalACobrar).toBe(850)
  })

  it('redondea correctamente con decimales', () => {
    const t = calcularTotales({
      baseImponible: 333.33,
      tipoIva: 21,
      retencionPct: 7,
      inversionSujetoPasivo: false,
    })
    expect(t.cuotaIva).toBe(70)
    expect(t.retencionImporte).toBe(23.33)
    expect(t.totalACobrar).toBeCloseTo(380, 2)
  })
})

describe('estadoCobro', () => {
  const hoy = new Date('2026-05-08')

  it('cobrada cuando importe_cobrado >= total', () => {
    expect(
      estadoCobro({
        total: 1000,
        importeCobrado: 1000,
        fechaVencimiento: '2026-04-01',
        hoy,
      }),
    ).toBe('cobrada')
  })

  it('cobrada también con tolerancia de céntimo', () => {
    expect(
      estadoCobro({
        total: 1000,
        importeCobrado: 999.995,
        fechaVencimiento: null,
        hoy,
      }),
    ).toBe('cobrada')
  })

  it('parcial cuando hay cobro pero no completo, aunque vencida', () => {
    // Cobro parcial gana sobre vencida (UX: el usuario ya tocó la factura)
    expect(
      estadoCobro({
        total: 1000,
        importeCobrado: 400,
        fechaVencimiento: '2026-04-01',
        hoy,
      }),
    ).toBe('parcial')
  })

  it('vencida si fecha pasada y nada cobrado', () => {
    expect(
      estadoCobro({
        total: 1000,
        importeCobrado: 0,
        fechaVencimiento: '2026-04-01',
        hoy,
      }),
    ).toBe('vencida')
  })

  it('pendiente si no hay vencimiento o futuro', () => {
    expect(
      estadoCobro({
        total: 1000,
        importeCobrado: 0,
        fechaVencimiento: '2026-12-01',
        hoy,
      }),
    ).toBe('pendiente')
    expect(
      estadoCobro({
        total: 1000,
        importeCobrado: 0,
        fechaVencimiento: null,
        hoy,
      }),
    ).toBe('pendiente')
  })
})
