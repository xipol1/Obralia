import { describe, expect, it, vi } from 'vitest'
import {
  cargarPlantillaEnPresupuesto,
  listarPlantillas,
  obtenerPlantilla,
} from '@/lib/plantillas'

interface ChainCall {
  table: string
  method: string
  args: unknown[]
}

interface MockOptions {
  /** Por tabla, fila única para `.single()` / `.maybeSingle()` */
  singleData?: Record<string, unknown | null>
  /** Por tabla, lista para terminadores thenable (`.then`) */
  listData?: Record<string, unknown[]>
  /** Cola de filas que devolverá `.single()` por tabla (para inserts en loop) */
  singleQueue?: Record<string, unknown[]>
}

function createMockSupabase(opts: MockOptions = {}) {
  const calls: ChainCall[] = []
  const singleQueue: Record<string, unknown[]> = {}
  for (const [k, v] of Object.entries(opts.singleQueue ?? {})) {
    singleQueue[k] = [...v]
  }

  const tableMock = (name: string) => {
    const builder: Record<string, unknown> = {}
    const record = (method: string, ...args: unknown[]) => {
      calls.push({ table: name, method, args })
    }
    builder.select = (...args: unknown[]) => {
      record('select', ...args)
      return builder
    }
    builder.insert = (payload: unknown) => {
      record('insert', payload)
      return builder
    }
    builder.update = (payload: unknown) => {
      record('update', payload)
      return builder
    }
    builder.eq = (col: string, val: unknown) => {
      record('eq', col, val)
      return builder
    }
    builder.in = (col: string, val: unknown) => {
      record('in', col, val)
      return builder
    }
    builder.or = (expr: string) => {
      record('or', expr)
      return builder
    }
    builder.order = (col: string, o?: unknown) => {
      record('order', col, o)
      return builder
    }
    builder.limit = (n: number) => {
      record('limit', n)
      return builder
    }
    builder.single = () => {
      record('single')
      const queue = singleQueue[name]
      if (queue && queue.length > 0) {
        return Promise.resolve({ data: queue.shift(), error: null })
      }
      const data = opts.singleData?.[name] ?? null
      return Promise.resolve({ data, error: null })
    }
    builder.maybeSingle = () => {
      record('maybeSingle')
      const data = opts.singleData?.[name] ?? null
      return Promise.resolve({ data, error: null })
    }
    builder.then = (
      onFulfilled: (val: { data: unknown[]; error: null }) => unknown,
    ) => {
      const data = opts.listData?.[name] ?? []
      return Promise.resolve({ data, error: null }).then(onFulfilled)
    }
    return builder
  }

  const client = {
    from: tableMock,
    rpc: vi.fn(),
  } as unknown as Parameters<typeof listarPlantillas>[0]

  return { client, calls }
}

const EMPRESA_ID = '22222222-2222-2222-2222-222222222222'

describe('listarPlantillas', () => {
  it('agrupa partidas por plantilla y calcula counts y total_estimado', async () => {
    const plantillas = [
      {
        id: 'plA',
        empresa_id: null,
        nombre: 'Reforma Baño',
        slug: 'reforma-bano',
        descripcion: '',
        icono: null,
        orden: 1,
        activa: true,
        created_at: '',
      },
      {
        id: 'plB',
        empresa_id: null,
        nombre: 'Reforma Cocina',
        slug: 'reforma-cocina',
        descripcion: '',
        icono: null,
        orden: 2,
        activa: true,
        created_at: '',
      },
    ]
    const partidas = [
      // Plantilla A: 3 partidas en 2 capítulos -> 3*10*2 = 60
      {
        plantilla_id: 'plA',
        plantilla_capitulo_id: 'capA1',
        cantidad_sugerida: 10,
        precio_unitario_orientativo: 2,
      },
      {
        plantilla_id: 'plA',
        plantilla_capitulo_id: 'capA1',
        cantidad_sugerida: 5,
        precio_unitario_orientativo: 4,
      },
      {
        plantilla_id: 'plA',
        plantilla_capitulo_id: 'capA2',
        cantidad_sugerida: 1,
        precio_unitario_orientativo: 100,
      },
      // Plantilla B: 5 partidas, 1 capítulo
      ...Array.from({ length: 5 }).map((_, i) => ({
        plantilla_id: 'plB',
        plantilla_capitulo_id: 'capB1',
        cantidad_sugerida: 1,
        precio_unitario_orientativo: 10,
      })),
    ]
    const { client } = createMockSupabase({
      listData: { plantillas_obra: plantillas, plantilla_partidas: partidas },
    })
    const result = await listarPlantillas(client, EMPRESA_ID)

    expect(result).toHaveLength(2)
    const a = result.find((r) => r.id === 'plA')!
    const b = result.find((r) => r.id === 'plB')!
    expect(a.num_partidas).toBe(3)
    expect(a.num_capitulos).toBe(2)
    // 10*2 + 5*4 + 1*100 = 20 + 20 + 100 = 140
    expect(a.total_estimado).toBe(140)
    expect(b.num_partidas).toBe(5)
    expect(b.num_capitulos).toBe(1)
    expect(b.total_estimado).toBe(50)
  })

  it('devuelve array vacío sin más queries cuando no hay plantillas', async () => {
    const { client, calls } = createMockSupabase({
      listData: { plantillas_obra: [] },
    })
    const result = await listarPlantillas(client, EMPRESA_ID)
    expect(result).toEqual([])
    // No debe haber consultado plantilla_partidas
    expect(calls.find((c) => c.table === 'plantilla_partidas')).toBeUndefined()
  })
})

describe('obtenerPlantilla', () => {
  it('devuelve null cuando la plantilla no existe', async () => {
    const { client } = createMockSupabase({
      singleData: { plantillas_obra: null },
    })
    const result = await obtenerPlantilla(client, 'no-existe')
    expect(result).toBeNull()
  })

  it('ordena capítulos y partidas por orden ascendente', async () => {
    const plantilla = {
      id: 'plX',
      empresa_id: null,
      nombre: 'Test',
      slug: 'test',
      descripcion: '',
      icono: null,
      orden: 1,
      activa: true,
      created_at: '',
      plantilla_capitulos: [
        { id: 'c2', orden: 2, nombre: 'Segundo', plantilla_id: 'plX' },
        { id: 'c1', orden: 1, nombre: 'Primero', plantilla_id: 'plX' },
        { id: 'c3', orden: 3, nombre: 'Tercero', plantilla_id: 'plX' },
      ],
      plantilla_partidas: [
        {
          id: 'p2',
          orden: 2,
          plantilla_id: 'plX',
          descripcion: 'B',
          unidad: 'ud',
          cantidad_sugerida: 1,
          precio_unitario_orientativo: 1,
          tipo_iva_sugerido: 21,
          plantilla_capitulo_id: 'c1',
        },
        {
          id: 'p1',
          orden: 1,
          plantilla_id: 'plX',
          descripcion: 'A',
          unidad: 'ud',
          cantidad_sugerida: 1,
          precio_unitario_orientativo: 1,
          tipo_iva_sugerido: 21,
          plantilla_capitulo_id: 'c1',
        },
      ],
    }
    const { client } = createMockSupabase({
      singleData: { plantillas_obra: plantilla },
    })
    const result = await obtenerPlantilla(client, 'plX')
    expect(result).not.toBeNull()
    expect(result!.capitulos.map((c) => c.id)).toEqual(['c1', 'c2', 'c3'])
    expect(result!.partidas.map((p) => p.id)).toEqual(['p1', 'p2'])
  })
})

describe('cargarPlantillaEnPresupuesto', () => {
  it('crea capítulos y partidas correctamente y devuelve los counts', async () => {
    const plantilla = {
      id: 'plY',
      empresa_id: null,
      nombre: 'T',
      slug: 't',
      descripcion: '',
      icono: null,
      orden: 1,
      activa: true,
      created_at: '',
      plantilla_capitulos: [
        { id: 'pc1', orden: 1, nombre: 'Cap1', plantilla_id: 'plY' },
        { id: 'pc2', orden: 2, nombre: 'Cap2', plantilla_id: 'plY' },
      ],
      plantilla_partidas: [
        {
          id: 'pp1',
          orden: 1,
          plantilla_id: 'plY',
          plantilla_capitulo_id: 'pc1',
          descripcion: 'A',
          unidad: 'ud',
          cantidad_sugerida: 2,
          precio_unitario_orientativo: 10,
          tipo_iva_sugerido: 21,
        },
        {
          id: 'pp2',
          orden: 2,
          plantilla_id: 'plY',
          plantilla_capitulo_id: 'pc1',
          descripcion: 'B',
          unidad: 'ud',
          cantidad_sugerida: 1,
          precio_unitario_orientativo: 5,
          tipo_iva_sugerido: 21,
        },
        {
          id: 'pp3',
          orden: 3,
          plantilla_id: 'plY',
          plantilla_capitulo_id: 'pc2',
          descripcion: 'C',
          unidad: 'm2',
          cantidad_sugerida: 4,
          precio_unitario_orientativo: 25,
          tipo_iva_sugerido: 10,
        },
        {
          id: 'pp4',
          orden: 4,
          plantilla_id: 'plY',
          plantilla_capitulo_id: 'pc2',
          descripcion: 'D',
          unidad: 'm2',
          cantidad_sugerida: 1,
          precio_unitario_orientativo: 8,
          tipo_iva_sugerido: 10,
        },
      ],
    }
    const { client } = createMockSupabase({
      singleData: { plantillas_obra: plantilla },
      singleQueue: {
        presupuesto_capitulos: [{ id: 'newcap1' }, { id: 'newcap2' }],
      },
    })

    const result = await cargarPlantillaEnPresupuesto(client, 'plY', 'pres-1')
    expect(result.capitulosCreados).toBe(2)
    expect(result.partidasCreadas).toBe(4)
  })

  it('calcula totalEstimado sumando cantidad × precio de cada partida', async () => {
    const plantilla = {
      id: 'plZ',
      empresa_id: null,
      nombre: 'T',
      slug: 't',
      descripcion: '',
      icono: null,
      orden: 1,
      activa: true,
      created_at: '',
      plantilla_capitulos: [
        { id: 'pcZ1', orden: 1, nombre: 'Único', plantilla_id: 'plZ' },
      ],
      plantilla_partidas: [
        {
          id: 'pp1',
          orden: 1,
          plantilla_id: 'plZ',
          plantilla_capitulo_id: 'pcZ1',
          descripcion: 'A',
          unidad: 'ud',
          cantidad_sugerida: 3,
          precio_unitario_orientativo: 10,
          tipo_iva_sugerido: 21,
        },
        {
          id: 'pp2',
          orden: 2,
          plantilla_id: 'plZ',
          plantilla_capitulo_id: 'pcZ1',
          descripcion: 'B',
          unidad: 'm2',
          cantidad_sugerida: 5.5,
          precio_unitario_orientativo: 4,
          tipo_iva_sugerido: 21,
        },
      ],
    }
    const { client } = createMockSupabase({
      singleData: { plantillas_obra: plantilla },
      singleQueue: { presupuesto_capitulos: [{ id: 'nc1' }] },
    })
    const result = await cargarPlantillaEnPresupuesto(client, 'plZ', 'pres-2')
    // 3*10 + 5.5*4 = 30 + 22 = 52
    expect(result.totalEstimado).toBe(52)
  })

  it('lanza error si la plantilla no existe', async () => {
    const { client } = createMockSupabase({
      singleData: { plantillas_obra: null },
    })
    await expect(
      cargarPlantillaEnPresupuesto(client, 'no-existe', 'pres'),
    ).rejects.toThrow('Plantilla no encontrada')
  })
})
