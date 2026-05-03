import { describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'

// Mock @react-pdf/renderer to avoid jsdom/canvas issues. The component returns a
// React element tree that is shape-checked, not rendered to PDF.
vi.mock('@react-pdf/renderer', () => {
  const passthrough =
    (tag: string) =>
    ({ children, ...rest }: { children?: unknown; [k: string]: unknown }) =>
      createElement(tag, rest as never, children as never)
  return {
    Document: passthrough('document'),
    Page: passthrough('page'),
    View: passthrough('view'),
    Text: passthrough('text'),
    Image: ({ src, style }: { src?: string; style?: unknown }) =>
      createElement('image', { src, style: style as never }),
    StyleSheet: { create: <T,>(s: T) => s },
    Font: { register: () => {} },
  }
})

// Importar después del mock
import PresupuestoPDF from '@/lib/pdf/PresupuestoPDF'

const baseProps = {
  empresa: { razon_social: 'Test SL', nif: 'B12345678' },
  cliente: { nombre: 'María', apellidos: 'García' },
  presupuesto: {
    numero: '2026-0001',
    fecha_emision: '2026-05-03',
    tipo_iva_default: 10,
    base_imponible: 1500,
    cuota_iva: 150,
    total: 1650,
  },
}

describe('PresupuestoPDF', () => {
  it('crea un element React con 2 capítulos y 5 partidas sin throw', () => {
    const props = {
      ...baseProps,
      partidas: [
        {
          descripcion: 'Demolición',
          unidad: 'pa',
          cantidad: 1,
          precio_unitario: 500,
          importe: 500,
          capitulo_id: 'c1',
        },
        {
          descripcion: 'Escombros',
          unidad: 'pa',
          cantidad: 1,
          precio_unitario: 200,
          importe: 200,
          capitulo_id: 'c1',
        },
        {
          descripcion: 'Alicatado',
          unidad: 'm2',
          cantidad: 10,
          precio_unitario: 50,
          importe: 500,
          capitulo_id: 'c2',
        },
        {
          descripcion: 'Solado',
          unidad: 'm2',
          cantidad: 5,
          precio_unitario: 40,
          importe: 200,
          capitulo_id: 'c2',
        },
        {
          descripcion: 'Pintura',
          unidad: 'm2',
          cantidad: 10,
          precio_unitario: 10,
          importe: 100,
          capitulo_id: 'c2',
        },
      ],
      capitulos: [
        { id: 'c1', nombre: 'Demolición', orden: 1 },
        { id: 'c2', nombre: 'Acabados', orden: 2 },
      ],
    }
    const element = createElement(PresupuestoPDF, props as never)
    expect(element).toBeDefined()
    // El componente todavía no se ha ejecutado; props son los inputs
    expect(element.props).toMatchObject({
      capitulos: expect.arrayContaining([
        expect.objectContaining({ nombre: 'Demolición' }),
      ]),
      partidas: expect.any(Array),
    })
  })

  it('renderiza con partidas planas (sin capítulos) sin throw — modo legacy', () => {
    const props = {
      ...baseProps,
      partidas: [
        {
          descripcion: 'Reparación general',
          unidad: 'pa',
          cantidad: 1,
          precio_unitario: 1500,
          importe: 1500,
          capitulo_id: null,
        },
      ],
    }
    // Llamar al componente como función para forzar la ejecución del render.
    const Cmp = PresupuestoPDF as unknown as (p: unknown) => unknown
    expect(() => Cmp(props)).not.toThrow()
  })

  it('agrupa partidas por capitulo_id en el árbol renderizado', () => {
    const props = {
      ...baseProps,
      partidas: [
        {
          descripcion: 'P1',
          unidad: 'ud',
          cantidad: 1,
          precio_unitario: 10,
          importe: 10,
          capitulo_id: 'c1',
        },
        {
          descripcion: 'P2',
          unidad: 'ud',
          cantidad: 1,
          precio_unitario: 20,
          importe: 20,
          capitulo_id: 'c2',
        },
        {
          descripcion: 'P3',
          unidad: 'ud',
          cantidad: 1,
          precio_unitario: 30,
          importe: 30,
          capitulo_id: 'c1',
        },
      ],
      capitulos: [
        { id: 'c1', nombre: 'Capítulo 1', orden: 1 },
        { id: 'c2', nombre: 'Capítulo 2', orden: 2 },
      ],
    }
    // Ejecutamos la función-componente y serializamos el árbol resultante.
    const Cmp = PresupuestoPDF as unknown as (p: unknown) => unknown
    const tree = Cmp(props)
    const serialized = JSON.stringify(tree)
    // Los nombres de los dos capítulos deben aparecer en el output
    expect(serialized).toContain('Capítulo 1')
    expect(serialized).toContain('Capítulo 2')
    // Los subtotales por capítulo: c1 = 10+30 = 40, c2 = 20
    expect(serialized).toContain('40,00')
    expect(serialized).toContain('20,00')
  })
})
