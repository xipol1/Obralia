/**
 * Cliente Supabase falso para modo demo.
 *
 * Activado cuando NEXT_PUBLIC_SUPABASE_URL contiene "placeholder".
 * Persiste datos en localStorage. Mimics la API que usan las páginas:
 * .from(table).select().eq().order().single() / .insert().select().single() / etc.
 *
 * Soporta joins simples del estilo `select('*, clientes(...)')` rellenando el objeto embebido.
 */

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000099'
const DEMO_PHONE = '+34674709388'
export const DEMO_EMPRESA_ID = '00000000-0000-0000-0000-000000000001'

// v2: schema extendido con biblioteca, plantillas y capítulos (Sesión 2)
const DB_KEY = 'obralia-demo-db-v2'
const SESSION_KEY = 'obralia-demo-session'

type Row = Record<string, unknown>

interface DemoDb {
  empresas: Row[]
  miembros: Row[]
  clientes: Row[]
  presupuestos: Row[]
  presupuesto_capitulos: Row[]
  presupuesto_partidas: Row[]
  contadores: Row[]
  partidas_biblioteca: Row[]
  plantillas_obra: Row[]
  plantilla_capitulos: Row[]
  plantilla_partidas: Row[]
}

import { buildBibliotecaSeed, buildPlantillasSeed } from './demo-seed-biblioteca'

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function nowIso() {
  return new Date().toISOString()
}

function seed(): DemoDb {
  const empresaId = DEMO_EMPRESA_ID
  const trialEndsAt = new Date(Date.now() + 14 * 86400 * 1000).toISOString()
  return {
    empresas: [
      {
        id: empresaId,
        created_at: nowIso(),
        updated_at: nowIso(),
        nombre_comercial: 'Reformas López',
        razon_social: 'Reformas López García S.L.',
        nif: 'B12345678',
        direccion: 'Calle Mayor 15, Bajo',
        codigo_postal: '28001',
        municipio: 'Madrid',
        provincia: 'Madrid',
        email: 'info@reformaslopez.es',
        telefono: '+34612345678',
        web: null,
        logo_url: null,
        iban: null,
        regimen_fiscal: 'estimacion_directa',
        stripe_customer_id: null,
        stripe_subscription_id: null,
        plan: 'trial',
        trial_ends_at: trialEndsAt,
      },
    ],
    miembros: [
      {
        id: uuid(),
        created_at: nowIso(),
        updated_at: nowIso(),
        empresa_id: empresaId,
        user_id: DEMO_USER_ID,
        rol: 'owner',
      },
    ],
    clientes: [
      {
        id: '00000000-0000-0000-0000-000000000010',
        created_at: nowIso(),
        updated_at: nowIso(),
        empresa_id: empresaId,
        tipo: 'particular',
        nombre: 'María',
        apellidos: 'García Fernández',
        razon_social: null,
        nif: '12345678Z',
        email: null,
        telefono: '+34611111111',
        direccion: 'Calle Gran Vía 42, 3ºB',
        codigo_postal: '28013',
        municipio: 'Madrid',
        provincia: 'Madrid',
        notas: null,
      },
      {
        id: '00000000-0000-0000-0000-000000000011',
        created_at: nowIso(),
        updated_at: nowIso(),
        empresa_id: empresaId,
        tipo: 'particular',
        nombre: 'Carlos',
        apellidos: 'Martínez Ruiz',
        razon_social: null,
        nif: '87654321X',
        email: null,
        telefono: '+34622222222',
        direccion: 'Avda. de la Constitución 8',
        codigo_postal: '41001',
        municipio: 'Sevilla',
        provincia: 'Sevilla',
        notas: null,
      },
    ],
    presupuestos: [
      {
        id: '00000000-0000-0000-0000-000000000100',
        created_at: nowIso(),
        updated_at: nowIso(),
        empresa_id: empresaId,
        cliente_id: '00000000-0000-0000-0000-000000000010',
        numero: '2026-0001',
        fecha_emision: '2026-05-01',
        fecha_validez: '2026-06-01',
        estado: 'borrador',
        titulo: 'Reforma integral baño C/ Gran Vía 42',
        direccion_obra: 'Calle Gran Vía 42, 3ºB, Madrid',
        tipo_iva_default: 10,
        motivo_iva_reducido:
          'IVA reducido del 10% aplicable a obras de renovación y reparación en vivienda particular que constituye residencia habitual del destinatario, donde el coste de los materiales aportados por el contratista no supera el 40% de la base imponible (Art. 91.Uno.2.10º LIVA).',
        base_imponible: 4850,
        cuota_iva: 485,
        total: 5335,
        notas_cliente: 'Incluye retirada de escombros y limpieza final.',
        notas_internas: null,
        exclusiones: 'No incluye permisos municipales ni tasas.',
        forma_pago: '50% al inicio, 50% a la finalización',
        plazo_ejecucion_dias: 15,
        garantia_meses: 12,
        pdf_url: null,
        enviado_at: null,
        aceptado_at: null,
        firma_url: null,
      },
    ],
    presupuesto_capitulos: [
      {
        id: 'd0000000-0000-0000-0000-000000000001',
        created_at: nowIso(),
        updated_at: nowIso(),
        presupuesto_id: '00000000-0000-0000-0000-000000000100',
        orden: 1,
        nombre: 'General',
        subtotal: 0,
        capitulo_sistema: null,
      },
    ],
    presupuesto_partidas: [
      partida('100', 1, 'Demolición de alicatado y solado existente', 'm2', 12, 18.5),
      partida('100', 2, 'Impermeabilización con lámina asfáltica', 'm2', 3.5, 45),
      partida('100', 3, 'Alicatado de paredes con porcelánico 30x60', 'm2', 28, 42),
      partida('100', 4, 'Solado de gres antideslizante', 'm2', 6.5, 38),
      partida('100', 5, 'Plato de ducha y mampara', 'ud', 1, 850),
      partida('100', 6, 'Fontanería: grifería y conexiones', 'pa', 1, 420),
      partida('100', 7, 'Electricidad: punto de luz y extractor', 'pa', 1, 280),
      partida('100', 8, 'Pintura antihumedad de techo', 'm2', 6.5, 15),
    ],
    contadores: [
      { empresa_id: empresaId, tipo: 'presupuesto', ejercicio: 2026, ultimo_numero: 1 },
    ],
    partidas_biblioteca: buildBibliotecaSeed(),
    ...buildPlantillasSeed(),
  }
}

function partida(
  presIdSuffix: string,
  orden: number,
  descripcion: string,
  unidad: string,
  cantidad: number,
  precio_unitario: number,
): Row {
  return {
    id: uuid(),
    created_at: nowIso(),
    updated_at: nowIso(),
    presupuesto_id: `00000000-0000-0000-0000-000000000${presIdSuffix}`,
    capitulo_id: 'd0000000-0000-0000-0000-000000000001',
    capitulo_sistema: null,
    partida_biblioteca_id: null,
    orden,
    descripcion,
    unidad,
    cantidad,
    precio_unitario,
    importe: cantidad * precio_unitario,
    tipo_iva: 10,
    coste_unitario_interno: null,
    notas: null,
  }
}

function loadDb(): DemoDb {
  if (typeof window === 'undefined') return seed()
  try {
    const raw = window.localStorage.getItem(DB_KEY)
    if (!raw) {
      const fresh = seed()
      window.localStorage.setItem(DB_KEY, JSON.stringify(fresh))
      return fresh
    }
    return JSON.parse(raw) as DemoDb
  } catch {
    return seed()
  }
}

function saveDb(db: DemoDb) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(DB_KEY, JSON.stringify(db))
}

function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(SESSION_KEY) === '1'
}

function setLoggedIn(value: boolean) {
  if (typeof window === 'undefined') return
  if (value) {
    window.localStorage.setItem(SESSION_KEY, '1')
    document.cookie = 'obralia-demo=1; Path=/; Max-Age=2592000; SameSite=Lax'
  } else {
    window.localStorage.removeItem(SESSION_KEY)
    document.cookie = 'obralia-demo=; Path=/; Max-Age=0; SameSite=Lax'
  }
}

// -----------------------------------------------------------------------------
// Query builder
// -----------------------------------------------------------------------------

type FilterOp =
  | { kind: 'eq'; col: string; val: unknown }
  | { kind: 'neq'; col: string; val: unknown }
  | { kind: 'in'; col: string; vals: unknown[] }
  | { kind: 'is_null'; col: string }
  | { kind: 'ilike'; col: string; pattern: string }
  | { kind: 'contains_array'; col: string; values: string[] }
  | { kind: 'or'; clauses: FilterOp[] }

interface QueryState {
  table: keyof DemoDb
  mode: 'select' | 'insert' | 'update' | 'delete'
  selectClause: string
  filters: FilterOp[]
  orderBy: { column: string; ascending: boolean } | null
  limit: number | null
  payload: Row | Row[] | null
  single: boolean
  maybeSingle: boolean
}

function evalFilter(row: Row, f: FilterOp): boolean {
  switch (f.kind) {
    case 'eq':
      return row[f.col] === f.val
    case 'neq':
      return row[f.col] !== f.val
    case 'in':
      return f.vals.includes(row[f.col] as never)
    case 'is_null':
      return row[f.col] === null || row[f.col] === undefined
    case 'ilike': {
      const v = row[f.col]
      if (typeof v !== 'string') return false
      // Convertir pattern de Postgres ILIKE a regex case-insensitive
      // % → .*, _ → .
      const re = new RegExp(
        '^' +
          f.pattern
            .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
            .replace(/%/g, '.*')
            .replace(/_/g, '.') +
          '$',
        'i',
      )
      return re.test(v)
    }
    case 'contains_array': {
      const arr = row[f.col]
      if (!Array.isArray(arr)) return false
      return f.values.every((v) => (arr as unknown[]).includes(v))
    }
    case 'or':
      return f.clauses.some((c) => evalFilter(row, c))
  }
}

function applyFilters(rows: Row[], filters: FilterOp[]): Row[] {
  return rows.filter((r) => filters.every((f) => evalFilter(r, f)))
}

/**
 * Parsea una sub-cláusula de Supabase .or() del estilo "col.op.value".
 * Soporta: eq, neq, is, ilike, cs.{x,y}, in.(a,b)
 */
function parseOrClause(s: string): FilterOp | null {
  const trimmed = s.trim()
  // tags.cs.{abc}
  const cs = trimmed.match(/^([\w.]+)\.cs\.\{(.*)\}$/)
  if (cs) {
    const [, col, list] = cs
    return {
      kind: 'contains_array',
      col,
      values: list.split(',').map((v) => v.trim()).filter(Boolean),
    }
  }
  // col.is.null
  const isNull = trimmed.match(/^([\w.]+)\.is\.null$/i)
  if (isNull) return { kind: 'is_null', col: isNull[1] }
  // col.ilike.pattern
  const ilike = trimmed.match(/^([\w.]+)\.ilike\.(.+)$/)
  if (ilike) return { kind: 'ilike', col: ilike[1], pattern: ilike[2] }
  // col.eq.value
  const eq = trimmed.match(/^([\w.]+)\.eq\.(.+)$/)
  if (eq) return { kind: 'eq', col: eq[1], val: coerceValue(eq[2]) }
  // col.neq.value
  const neq = trimmed.match(/^([\w.]+)\.neq\.(.+)$/)
  if (neq) return { kind: 'neq', col: neq[1], val: coerceValue(neq[2]) }
  return null
}

function coerceValue(s: string): unknown {
  if (s === 'null') return null
  if (s === 'true') return true
  if (s === 'false') return false
  if (/^-?\d+$/.test(s)) return Number(s)
  return s
}

function parseOrExpression(expr: string): FilterOp {
  // Split top-level commas (sin paréntesis ni llaves)
  const clauses: FilterOp[] = []
  let depth = 0
  let current = ''
  for (const ch of expr) {
    if (ch === '(' || ch === '{') depth++
    else if (ch === ')' || ch === '}') depth--
    if (ch === ',' && depth === 0) {
      const parsed = parseOrClause(current)
      if (parsed) clauses.push(parsed)
      current = ''
    } else {
      current += ch
    }
  }
  if (current.trim()) {
    const parsed = parseOrClause(current)
    if (parsed) clauses.push(parsed)
  }
  return { kind: 'or', clauses }
}

function parseEmbeds(selectClause: string): string[] {
  // Detecta nombres de tabla embebidos: 'clientes(...)'
  const matches = selectClause.match(/(\w+)\(/g)
  if (!matches) return []
  return matches.map((m) => m.slice(0, -1)).filter((n) => n !== 'select')
}

function attachEmbeds(db: DemoDb, table: keyof DemoDb, rows: Row[], embeds: string[]): Row[] {
  if (embeds.length === 0) return rows
  return rows.map((row) => {
    const enriched = { ...row }
    for (const embed of embeds) {
      // Ej: presupuestos.cliente_id → clientes.id (singular embed)
      if (embed === 'clientes' && 'cliente_id' in row) {
        const found = db.clientes.find((c) => c.id === row.cliente_id)
        enriched.clientes = found ?? null
      } else if (embed === 'empresas' && 'empresa_id' in row) {
        const found = db.empresas.find((e) => e.id === row.empresa_id)
        enriched.empresas = found ?? null
      } else if (embed === 'presupuesto_partidas' && table === 'presupuestos') {
        enriched.presupuesto_partidas = db.presupuesto_partidas
          .filter((p) => p.presupuesto_id === row.id)
          .sort((a, b) => Number(a.orden) - Number(b.orden))
      } else if (embed === 'presupuesto_capitulos' && table === 'presupuestos') {
        enriched.presupuesto_capitulos = db.presupuesto_capitulos
          .filter((c) => c.presupuesto_id === row.id)
          .sort((a, b) => Number(a.orden) - Number(b.orden))
      } else if (embed === 'plantilla_capitulos' && table === 'plantillas_obra') {
        enriched.plantilla_capitulos = db.plantilla_capitulos
          .filter((c) => c.plantilla_id === row.id)
          .sort((a, b) => Number(a.orden) - Number(b.orden))
      } else if (embed === 'plantilla_partidas' && table === 'plantillas_obra') {
        enriched.plantilla_partidas = db.plantilla_partidas
          .filter((p) => p.plantilla_id === row.id)
          .sort((a, b) => Number(a.orden) - Number(b.orden))
      } else if (embed === 'miembros') {
        enriched.miembros = db.miembros.filter((m) => m.empresa_id === row.id)
      }
    }
    return enriched
  })
}

function execute(state: QueryState): { data: unknown; error: null | { message: string } } {
  const db = loadDb()
  const tableData = db[state.table]
  const embeds = parseEmbeds(state.selectClause)

  if (state.mode === 'insert') {
    const payloads = Array.isArray(state.payload) ? state.payload : [state.payload]
    const inserted: Row[] = []
    for (const p of payloads) {
      const row: Row = {
        id: uuid(),
        created_at: nowIso(),
        updated_at: nowIso(),
        ...(p as Row),
      }
      // Generated columns
      if (state.table === 'presupuesto_partidas') {
        row.importe = Number(row.cantidad ?? 0) * Number(row.precio_unitario ?? 0)
      }
      tableData.push(row)
      inserted.push(row)
    }
    saveDb(db)
    const data = state.single ? inserted[0] : inserted
    return { data, error: null }
  }

  if (state.mode === 'update') {
    const filtered = applyFilters(tableData, state.filters)
    for (const row of filtered) {
      Object.assign(row, state.payload, { updated_at: nowIso() })
      if (state.table === 'presupuesto_partidas') {
        row.importe = Number(row.cantidad ?? 0) * Number(row.precio_unitario ?? 0)
      }
    }
    saveDb(db)
    const data = state.single ? (filtered[0] ?? null) : filtered
    return { data, error: null }
  }

  if (state.mode === 'delete') {
    const filtered = applyFilters(tableData, state.filters)
    const ids = new Set(filtered.map((r) => r.id))
    db[state.table] = (tableData as Row[]).filter((r) => !ids.has(r.id)) as never
    saveDb(db)
    return { data: filtered, error: null }
  }

  // select
  let rows = applyFilters(tableData, state.filters)
  rows = attachEmbeds(db, state.table, rows, embeds)
  if (state.orderBy) {
    const { column, ascending } = state.orderBy
    rows = [...rows].sort((a, b) => {
      const av = a[column]
      const bv = b[column]
      if (av === bv) return 0
      const r = (av as never) < (bv as never) ? -1 : 1
      return ascending ? r : -r
    })
  }
  if (state.limit !== null) rows = rows.slice(0, state.limit)
  if (state.single) {
    return rows.length === 0
      ? { data: null, error: { message: 'No rows' } }
      : { data: rows[0], error: null }
  }
  if (state.maybeSingle) {
    return { data: rows[0] ?? null, error: null }
  }
  return { data: rows, error: null }
}

function makeQueryBuilder(table: keyof DemoDb): unknown {
  const state: QueryState = {
    table,
    mode: 'select',
    selectClause: '*',
    filters: [],
    orderBy: null,
    limit: null,
    payload: null,
    single: false,
    maybeSingle: false,
  }

  const builder: Record<string, unknown> = {
    select(cols?: string) {
      state.selectClause = cols ?? '*'
      return builder
    },
    insert(payload: Row | Row[]) {
      state.mode = 'insert'
      state.payload = payload
      return builder
    },
    update(payload: Row) {
      state.mode = 'update'
      state.payload = payload
      return builder
    },
    delete() {
      state.mode = 'delete'
      return builder
    },
    upsert(payload: Row | Row[]) {
      state.mode = 'insert'
      state.payload = payload
      return builder
    },
    eq(col: string, val: unknown) {
      state.filters.push({ kind: 'eq', col, val })
      return builder
    },
    neq(col: string, val: unknown) {
      state.filters.push({ kind: 'neq', col, val })
      return builder
    },
    in(col: string, vals: unknown[]) {
      state.filters.push({ kind: 'in', col, vals })
      return builder
    },
    is(col: string, val: unknown) {
      if (val === null) state.filters.push({ kind: 'is_null', col })
      else state.filters.push({ kind: 'eq', col, val })
      return builder
    },
    or(expr: string) {
      state.filters.push(parseOrExpression(expr))
      return builder
    },
    ilike(col: string, pattern: string) {
      state.filters.push({ kind: 'ilike', col, pattern })
      return builder
    },
    order(column: string, opts?: { ascending?: boolean }) {
      state.orderBy = { column, ascending: opts?.ascending ?? true }
      return builder
    },
    limit(n: number) {
      state.limit = n
      return builder
    },
    single() {
      state.single = true
      return new Promise((resolve) => resolve(execute(state)))
    },
    maybeSingle() {
      state.maybeSingle = true
      return new Promise((resolve) => resolve(execute(state)))
    },
    then(onFulfilled: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) {
      return Promise.resolve(execute(state)).then(onFulfilled, onRejected)
    },
  }

  return builder
}

// -----------------------------------------------------------------------------
// Demo client public API
// -----------------------------------------------------------------------------

function createDemoAuth() {
  return {
    async getUser() {
      if (!isLoggedIn()) return { data: { user: null }, error: null }
      return {
        data: {
          user: {
            id: DEMO_USER_ID,
            phone: DEMO_PHONE,
            email: null,
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: nowIso(),
          },
        },
        error: null,
      }
    },
    async getSession() {
      if (!isLoggedIn()) return { data: { session: null }, error: null }
      return {
        data: {
          session: {
            access_token: 'demo',
            refresh_token: 'demo',
            user: { id: DEMO_USER_ID, phone: DEMO_PHONE },
          },
        },
        error: null,
      }
    },
    async signInWithOtp(_args: { phone: string }) {
      return { data: {}, error: null }
    },
    async verifyOtp(_args: { phone: string; token: string; type: string }) {
      setLoggedIn(true)
      return {
        data: {
          user: { id: DEMO_USER_ID, phone: DEMO_PHONE },
          session: { access_token: 'demo' },
        },
        error: null,
      }
    },
    async signOut() {
      setLoggedIn(false)
      // Reset DB para que el siguiente login arranque limpio
      if (typeof window !== 'undefined') window.localStorage.removeItem(DB_KEY)
      return { error: null }
    },
    onAuthStateChange(_cb: unknown) {
      return { data: { subscription: { unsubscribe() {} } }, error: null }
    },
  }
}

function createDemoStorage() {
  return {
    from(_bucket: string) {
      return {
        async upload(path: string, _file: File | Blob, _opts?: unknown) {
          return { data: { path }, error: null }
        },
        getPublicUrl(path: string) {
          return { data: { publicUrl: `/demo-storage/${path}` } }
        },
        async createSignedUrl(path: string, _expiresIn: number) {
          return { data: { signedUrl: `/demo-storage/${path}` }, error: null }
        },
        async remove(_paths: string[]) {
          return { data: [], error: null }
        },
        async list(_prefix?: string) {
          return { data: [], error: null }
        },
      }
    },
  }
}

async function demoRpc(fn: string, args: Record<string, unknown>) {
  if (fn === 'siguiente_numero') {
    const db = loadDb()
    const ejercicio = Number(args.p_ejercicio)
    const tipo = String(args.p_tipo)
    const empresaId = String(args.p_empresa_id)
    let counter = db.contadores.find(
      (c) =>
        c.empresa_id === empresaId &&
        c.tipo === tipo &&
        c.ejercicio === ejercicio,
    )
    if (!counter) {
      counter = { empresa_id: empresaId, tipo, ejercicio, ultimo_numero: 0 }
      db.contadores.push(counter)
    }
    counter.ultimo_numero = Number(counter.ultimo_numero) + 1
    saveDb(db)
    return {
      data: `${ejercicio}-${String(counter.ultimo_numero).padStart(4, '0')}`,
      error: null,
    }
  }
  if (fn === 'duplicar_partida_a_empresa') {
    const db = loadDb()
    const partidaId = String(args.p_partida_id)
    const empresaId = String(args.p_empresa_id)
    const original = db.partidas_biblioteca.find((p) => p.id === partidaId)
    if (!original) {
      return { data: null, error: { message: 'Partida no encontrada' } }
    }
    const nueva: Row = {
      id: uuid(),
      created_at: nowIso(),
      updated_at: nowIso(),
      empresa_id: empresaId,
      origen: 'empresa',
      capitulo: original.capitulo,
      codigo: original.codigo,
      descripcion: original.descripcion,
      unidad: original.unidad,
      precio_unitario_orientativo: original.precio_unitario_orientativo,
      tipo_iva_sugerido: original.tipo_iva_sugerido,
      tags: original.tags,
      notas: original.notas,
      activo: true,
      origen_biblioteca_id: original.id,
    }
    db.partidas_biblioteca.push(nueva)
    saveDb(db)
    return { data: nueva.id, error: null }
  }
  return { data: null, error: { message: `RPC ${fn} not implemented in demo` } }
}

export function createDemoClient() {
  return {
    auth: createDemoAuth(),
    storage: createDemoStorage(),
    from(table: string) {
      return makeQueryBuilder(table as keyof DemoDb)
    },
    rpc(fn: string, args: Record<string, unknown>) {
      return demoRpc(fn, args)
    },
  }
}

export function isDemoMode(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  return !url || url.includes('placeholder')
}

export function resetDemoDb() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(DB_KEY)
  }
}
