import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  actualizarPartidaPersonal,
  buscarPartidas,
  crearPartidaPersonal,
  duplicarPartidaSistema,
  eliminarPartidaPersonal,
  obtenerPartida,
} from '@/lib/biblioteca'

interface ChainCall {
  table: string
  method: string
  args: unknown[]
}

interface MockState {
  calls: ChainCall[]
  lastPayload: unknown
  lastTable: string | null
}

function createMockSupabase(seedData: Record<string, unknown[]> = {}) {
  const state: MockState = { calls: [], lastPayload: null, lastTable: null }
  const rpc = vi.fn().mockResolvedValue({ data: 'new-uuid-from-rpc', error: null })

  const tableMock = (name: string) => {
    state.lastTable = name
    const data = seedData[name] ?? []
    const builder: Record<string, unknown> = {}
    const record = (method: string, ...args: unknown[]) => {
      state.calls.push({ table: name, method, args })
    }
    builder.select = (...args: unknown[]) => {
      record('select', ...args)
      return builder
    }
    builder.insert = (payload: unknown) => {
      record('insert', payload)
      state.lastPayload = payload
      return builder
    }
    builder.update = (payload: unknown) => {
      record('update', payload)
      state.lastPayload = payload
      return builder
    }
    builder.delete = () => {
      record('delete')
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
    builder.limit = (n: number) => {
      record('limit', n)
      return builder
    }
    builder.order = (col: string, opts?: unknown) => {
      record('order', col, opts)
      return builder
    }
    builder.single = () => {
      record('single')
      return Promise.resolve({ data: data[0] ?? null, error: null })
    }
    builder.maybeSingle = () => {
      record('maybeSingle')
      return Promise.resolve({ data: data[0] ?? null, error: null })
    }
    builder.then = (
      onFulfilled: (val: { data: unknown[]; error: null }) => unknown,
    ) => Promise.resolve({ data, error: null }).then(onFulfilled)
    return builder
  }

  const client = { from: tableMock, rpc } as unknown as Parameters<
    typeof buscarPartidas
  >[0]

  return { client, state, rpc }
}

const EMPRESA_ID = '11111111-1111-1111-1111-111111111111'

function findCall(state: MockState, method: string) {
  return state.calls.find((c) => c.method === method)
}
function findCalls(state: MockState, method: string) {
  return state.calls.filter((c) => c.method === method)
}

describe('buscarPartidas', () => {
  it('aplica filtro activo=true y OR sistema/empresa cuando soloMias=false', async () => {
    const { client, state } = createMockSupabase({ partidas_biblioteca: [] })
    await buscarPartidas(client, { empresaId: EMPRESA_ID, soloMias: false })

    const eqActivo = findCalls(state, 'eq').find(
      (c) => c.args[0] === 'activo' && c.args[1] === true,
    )
    expect(eqActivo).toBeDefined()

    const orCall = findCall(state, 'or')
    expect(orCall).toBeDefined()
    expect(orCall?.args[0]).toBe(
      `empresa_id.is.null,empresa_id.eq.${EMPRESA_ID}`,
    )
  })

  it('cuando soloMias=true filtra por empresa_id sin OR de sistema', async () => {
    const { client, state } = createMockSupabase({ partidas_biblioteca: [] })
    await buscarPartidas(client, { empresaId: EMPRESA_ID, soloMias: true })

    const eqEmpresa = findCalls(state, 'eq').find(
      (c) => c.args[0] === 'empresa_id' && c.args[1] === EMPRESA_ID,
    )
    expect(eqEmpresa).toBeDefined()

    // No debe haber OR de "empresa_id.is.null,..."
    const sistemaOr = findCalls(state, 'or').find((c) =>
      String(c.args[0]).includes('empresa_id.is.null'),
    )
    expect(sistemaOr).toBeUndefined()
  })

  it('aplica filtro de capitulo cuando se pasa', async () => {
    const { client, state } = createMockSupabase({ partidas_biblioteca: [] })
    await buscarPartidas(client, {
      empresaId: EMPRESA_ID,
      capitulo: 'fontaneria',
    })

    const eqCap = findCalls(state, 'eq').find(
      (c) => c.args[0] === 'capitulo' && c.args[1] === 'fontaneria',
    )
    expect(eqCap).toBeDefined()
  })

  it('aplica OR con descripcion/codigo/tags cuando hay query', async () => {
    const { client, state } = createMockSupabase({ partidas_biblioteca: [] })
    await buscarPartidas(client, {
      empresaId: EMPRESA_ID,
      query: 'alicatado',
    })

    const orQuery = findCalls(state, 'or').find((c) =>
      String(c.args[0]).includes('descripcion.ilike'),
    )
    expect(orQuery).toBeDefined()
    const expr = String(orQuery?.args[0])
    expect(expr).toContain('descripcion.ilike.%alicatado%')
    expect(expr).toContain('codigo.ilike.%alicatado%')
    expect(expr).toContain('tags.cs.{alicatado}')
  })

  it('ordena partidas de empresa antes que las de sistema', async () => {
    const seed = [
      {
        id: 'p1',
        empresa_id: null,
        origen: 'sistema',
        capitulo: 'fontaneria',
        descripcion: 'A Tubería sistema',
        unidad: 'ml',
        precio_unitario_orientativo: 5,
        tipo_iva_sugerido: 21,
        tags: [],
        activo: true,
      },
      {
        id: 'p2',
        empresa_id: EMPRESA_ID,
        origen: 'empresa',
        capitulo: 'fontaneria',
        descripcion: 'Z Tubería empresa',
        unidad: 'ml',
        precio_unitario_orientativo: 6,
        tipo_iva_sugerido: 21,
        tags: [],
        activo: true,
      },
    ]
    const { client } = createMockSupabase({ partidas_biblioteca: seed })
    const result = await buscarPartidas(client, { empresaId: EMPRESA_ID })

    expect(result[0].origen).toBe('empresa')
    expect(result[1].origen).toBe('sistema')
  })

  it('ordena alfabéticamente dentro del mismo origen', async () => {
    const seed = [
      {
        id: 'p1',
        empresa_id: null,
        origen: 'sistema',
        capitulo: 'pintura',
        descripcion: 'B Brocha plana',
        unidad: 'ud',
        precio_unitario_orientativo: 3,
        tipo_iva_sugerido: 21,
        tags: [],
        activo: true,
      },
      {
        id: 'p2',
        empresa_id: null,
        origen: 'sistema',
        capitulo: 'pintura',
        descripcion: 'A Acrílica blanca',
        unidad: 'kg',
        precio_unitario_orientativo: 7,
        tipo_iva_sugerido: 21,
        tags: [],
        activo: true,
      },
    ]
    const { client } = createMockSupabase({ partidas_biblioteca: seed })
    const result = await buscarPartidas(client, { empresaId: EMPRESA_ID })

    expect(result[0].descripcion.startsWith('A')).toBe(true)
    expect(result[1].descripcion.startsWith('B')).toBe(true)
  })

  it('respeta el limit (slice tras ordenar)', async () => {
    const seed = Array.from({ length: 10 }).map((_, i) => ({
      id: `p${i}`,
      empresa_id: null,
      origen: 'sistema' as const,
      capitulo: 'pintura' as const,
      descripcion: `Item ${String.fromCharCode(65 + i)}`,
      unidad: 'ud' as const,
      precio_unitario_orientativo: 1,
      tipo_iva_sugerido: 21 as const,
      tags: [],
      activo: true,
    }))
    const { client } = createMockSupabase({ partidas_biblioteca: seed })
    const result = await buscarPartidas(client, {
      empresaId: EMPRESA_ID,
      limit: 3,
    })
    expect(result).toHaveLength(3)
  })
})

describe('crearPartidaPersonal', () => {
  it('rechaza descripcion vacía con error de Zod', async () => {
    const { client } = createMockSupabase({ partidas_biblioteca: [] })
    await expect(
      crearPartidaPersonal(client, EMPRESA_ID, {
        capitulo: 'fontaneria',
        descripcion: '',
        unidad: 'ml',
        precio_unitario_orientativo: 5,
        tipo_iva_sugerido: 21,
        tags: [],
      } as never),
    ).rejects.toThrow()
  })

  it('inserta payload con empresa_id, origen=empresa y activo=true', async () => {
    const seedRow = {
      id: 'new-id',
      empresa_id: EMPRESA_ID,
      origen: 'empresa',
      capitulo: 'fontaneria',
      descripcion: 'Tubería PEX 16mm',
      unidad: 'ml',
      precio_unitario_orientativo: 5,
      tipo_iva_sugerido: 21,
      tags: [],
      activo: true,
    }
    const { client, state } = createMockSupabase({
      partidas_biblioteca: [seedRow],
    })
    const result = await crearPartidaPersonal(client, EMPRESA_ID, {
      capitulo: 'fontaneria',
      descripcion: 'Tubería PEX 16mm',
      unidad: 'ml',
      precio_unitario_orientativo: 5,
      tipo_iva_sugerido: 21,
      tags: [],
    } as never)

    expect(result.id).toBe('new-id')
    const insertCall = findCall(state, 'insert')
    expect(insertCall).toBeDefined()
    const payload = insertCall?.args[0] as Record<string, unknown>
    expect(payload.empresa_id).toBe(EMPRESA_ID)
    expect(payload.origen).toBe('empresa')
    expect(payload.activo).toBe(true)
  })
})

describe('actualizarPartidaPersonal', () => {
  it('actualiza solo campos definidos y filtra por id', async () => {
    const seedRow = {
      id: 'pid-1',
      empresa_id: EMPRESA_ID,
      origen: 'empresa',
      capitulo: 'pintura',
      descripcion: 'Nueva',
      unidad: 'ud',
      precio_unitario_orientativo: 9,
      tipo_iva_sugerido: 21,
      tags: [],
      activo: true,
    }
    const { client, state } = createMockSupabase({
      partidas_biblioteca: [seedRow],
    })
    await actualizarPartidaPersonal(client, 'pid-1', {
      descripcion: 'Nueva',
    } as never)

    const updateCall = findCall(state, 'update')
    expect(updateCall).toBeDefined()
    const payload = updateCall?.args[0] as Record<string, unknown>
    expect(payload).toMatchObject({ descripcion: 'Nueva' })
    // Las claves no provistas (codigo, capitulo, etc.) no aparecen en el patch.
    expect(Object.keys(payload)).not.toContain('codigo')
    expect(Object.keys(payload)).not.toContain('capitulo')

    const eqId = findCalls(state, 'eq').find(
      (c) => c.args[0] === 'id' && c.args[1] === 'pid-1',
    )
    expect(eqId).toBeDefined()
  })
})

describe('eliminarPartidaPersonal', () => {
  it('hace soft-delete poniendo activo=false', async () => {
    const { client, state } = createMockSupabase({ partidas_biblioteca: [] })
    await eliminarPartidaPersonal(client, 'pid-9')

    const updateCall = findCall(state, 'update')
    expect(updateCall).toBeDefined()
    expect(updateCall?.args[0]).toEqual({ activo: false })
    const eqId = findCalls(state, 'eq').find(
      (c) => c.args[0] === 'id' && c.args[1] === 'pid-9',
    )
    expect(eqId).toBeDefined()
  })
})

describe('duplicarPartidaSistema', () => {
  it('invoca rpc duplicar_partida_a_empresa con args correctos y devuelve el ID', async () => {
    const { client, rpc } = createMockSupabase()
    const result = await duplicarPartidaSistema(client, 'src-id', EMPRESA_ID)

    expect(rpc).toHaveBeenCalledWith('duplicar_partida_a_empresa', {
      p_partida_id: 'src-id',
      p_empresa_id: EMPRESA_ID,
    })
    expect(result).toBe('new-uuid-from-rpc')
  })
})

describe('obtenerPartida', () => {
  it('devuelve null cuando maybeSingle no encuentra fila', async () => {
    const { client } = createMockSupabase({ partidas_biblioteca: [] })
    const result = await obtenerPartida(client, 'no-existe')
    expect(result).toBeNull()
  })

  it('devuelve la fila cuando existe', async () => {
    const seedRow = {
      id: 'pid-7',
      empresa_id: null,
      origen: 'sistema',
      capitulo: 'demolicion',
      descripcion: 'Demolición tabique',
      unidad: 'm2',
      precio_unitario_orientativo: 12,
      tipo_iva_sugerido: 21,
      tags: [],
      activo: true,
    }
    const { client } = createMockSupabase({ partidas_biblioteca: [seedRow] })
    const result = await obtenerPartida(client, 'pid-7')
    expect(result?.id).toBe('pid-7')
  })
})
