/**
 * Seed de la biblioteca y plantillas para el modo demo.
 *
 * Subset representativo de las ~186 partidas del seed real, manteniendo:
 * - cobertura de los 12 capítulos del enum
 * - todas las partidas que aparecen en las 5 plantillas
 *
 * Este archivo es solo para el cliente demo (localStorage). El seed real para
 * producción vive en supabase/seeds/biblioteca_sistema.sql.
 */

type Row = Record<string, unknown>

// Helper: stable IDs siguiendo el patrón aXXX/bXXX/cXXX para seguimiento
const partidaId = (n: number) => `a0000000-0000-0000-0000-${String(n).padStart(12, '0')}`
const plantillaId = (n: number) => `b0000000-0000-0000-0000-${String(n).padStart(12, '0')}`
const capId = (n: number) => `c0000000-0000-0000-0000-${String(n).padStart(12, '0')}`

interface BasePartida {
  n: number
  capitulo: string
  codigo: string
  descripcion: string
  unidad: string
  precio: number
  iva: 10 | 21
  tags: string[]
}

const PARTIDAS_DATA: BasePartida[] = [
  // ── DEMOLICIÓN ────────────────────────────────────────────────
  { n: 1, capitulo: 'demolicion', codigo: 'DEM-001', descripcion: 'Demolición de alicatado y solado en baño', unidad: 'pa', precio: 650, iva: 10, tags: ['demoler', 'tirar', 'quitar', 'azulejo'] },
  { n: 2, capitulo: 'demolicion', codigo: 'DEM-002', descripcion: 'Desmontaje de mobiliario, electrodomésticos y alicatado en cocina', unidad: 'pa', precio: 750, iva: 10, tags: ['desmontar', 'cocina', 'tirar'] },
  { n: 3, capitulo: 'demolicion', codigo: 'DEM-003', descripcion: 'Demolición de solado existente', unidad: 'm2', precio: 12, iva: 10, tags: ['levantar', 'suelo', 'baldosa'] },
  { n: 4, capitulo: 'demolicion', codigo: 'DEM-004', descripcion: 'Demolición de tabique de ladrillo cerámico hueco', unidad: 'm2', precio: 22, iva: 10, tags: ['tirar', 'pared', 'tabique', 'derribar'] },
  { n: 5, capitulo: 'demolicion', codigo: 'DEM-005', descripcion: 'Retirada de escombros y transporte a vertedero autorizado', unidad: 'pa', precio: 280, iva: 10, tags: ['escombros', 'vertedero', 'limpiar', 'sacos'] },
  { n: 6, capitulo: 'demolicion', codigo: 'DEM-006', descripcion: 'Apertura de hueco en muro de carga', unidad: 'ud', precio: 980, iva: 10, tags: ['hueco', 'muro', 'puerta', 'paso'] },
  { n: 7, capitulo: 'demolicion', codigo: 'DEM-007', descripcion: 'Picado y retirada de gotelé en paredes', unidad: 'm2', precio: 8.5, iva: 10, tags: ['gotele', 'picar', 'pared'] },
  { n: 8, capitulo: 'demolicion', codigo: 'DEM-008', descripcion: 'Demolición de bañera o plato de ducha existente', unidad: 'ud', precio: 120, iva: 10, tags: ['bañera', 'ducha', 'sacar'] },

  // ── ALBAÑILERÍA ───────────────────────────────────────────────
  { n: 20, capitulo: 'albanileria', codigo: 'ALB-001', descripcion: 'Tabique de ladrillo hueco doble con guarnecido', unidad: 'm2', precio: 58, iva: 10, tags: ['tabique', 'levantar', 'pared'] },
  { n: 21, capitulo: 'albanileria', codigo: 'ALB-002', descripcion: 'Recibido de cercos en obra', unidad: 'ud', precio: 45, iva: 10, tags: ['cerco', 'puerta', 'marco'] },
  { n: 22, capitulo: 'albanileria', codigo: 'ALB-003', descripcion: 'Mortero autonivelante para regularizar suelo', unidad: 'm2', precio: 18, iva: 10, tags: ['nivelar', 'mortero', 'autonivelante', 'suelo'] },
  { n: 23, capitulo: 'albanileria', codigo: 'ALB-004', descripcion: 'Enfoscado maestreado de mortero de cemento', unidad: 'm2', precio: 22, iva: 10, tags: ['enfoscar', 'mortero', 'pared'] },
  { n: 24, capitulo: 'albanileria', codigo: 'ALB-005', descripcion: 'Sellado de juntas con material epoxi', unidad: 'm2', precio: 6, iva: 10, tags: ['junta', 'sellar', 'epoxi'] },
  { n: 25, capitulo: 'albanileria', codigo: 'ALB-006', descripcion: 'Recrecido de mortero para nivelación de suelo', unidad: 'm2', precio: 14, iva: 10, tags: ['recrecido', 'nivelar', 'mortero'] },

  // ── FONTANERÍA ────────────────────────────────────────────────
  { n: 40, capitulo: 'fontaneria', codigo: 'FON-001', descripcion: 'Distribución agua fría/caliente y desagües en baño', unidad: 'pa', precio: 850, iva: 10, tags: ['fontaneria', 'agua', 'desague', 'tubería'] },
  { n: 41, capitulo: 'fontaneria', codigo: 'FON-002', descripcion: 'Tomas agua y desagüe fregadero/lavavajillas', unidad: 'pa', precio: 480, iva: 10, tags: ['fontaneria', 'cocina', 'fregadero'] },
  { n: 42, capitulo: 'fontaneria', codigo: 'FON-003', descripcion: 'Sustitución de bajante de PVC', unidad: 'ml', precio: 38, iva: 10, tags: ['bajante', 'pvc', 'tubería'] },
  { n: 43, capitulo: 'fontaneria', codigo: 'FON-004', descripcion: 'Suministro e instalación de termo eléctrico 80L', unidad: 'ud', precio: 380, iva: 10, tags: ['termo', 'agua caliente'] },
  { n: 44, capitulo: 'fontaneria', codigo: 'FON-005', descripcion: 'Boletín de gas y tramitación', unidad: 'pa', precio: 220, iva: 21, tags: ['boletín', 'gas', 'oca'] },
  { n: 45, capitulo: 'fontaneria', codigo: 'FON-006', descripcion: 'Llaves de paso individuales por estancia', unidad: 'ud', precio: 65, iva: 10, tags: ['llave', 'corte'] },

  // ── ELECTRICIDAD ──────────────────────────────────────────────
  { n: 60, capitulo: 'electricidad', codigo: 'ELE-001', descripcion: 'Punto de luz, espejo y enchufes en baño', unidad: 'pa', precio: 320, iva: 10, tags: ['enchufe', 'luz', 'baño'] },
  { n: 61, capitulo: 'electricidad', codigo: 'ELE-002', descripcion: 'Circuito independiente para horno y vitro, puntos de luz', unidad: 'pa', precio: 620, iva: 10, tags: ['horno', 'vitro', 'circuito', 'cocina'] },
  { n: 62, capitulo: 'electricidad', codigo: 'ELE-003', descripcion: 'Sustitución de cuadro eléctrico con magnetotérmicos y diferencial', unidad: 'ud', precio: 480, iva: 10, tags: ['cuadro', 'magnetotermico', 'diferencial'] },
  { n: 63, capitulo: 'electricidad', codigo: 'ELE-004', descripcion: 'Sustitución de cableado en circuitos principales', unidad: 'ml', precio: 6.5, iva: 10, tags: ['cable', 'cableado', 'circuito'] },
  { n: 64, capitulo: 'electricidad', codigo: 'ELE-005', descripcion: 'Toma de corriente schuko 16A', unidad: 'ud', precio: 28, iva: 10, tags: ['enchufe', 'schuko', 'toma'] },
  { n: 65, capitulo: 'electricidad', codigo: 'ELE-006', descripcion: 'Punto de luz con interruptor', unidad: 'ud', precio: 35, iva: 10, tags: ['punto luz', 'interruptor'] },
  { n: 66, capitulo: 'electricidad', codigo: 'ELE-007', descripcion: 'Toma TV y datos RJ45', unidad: 'ud', precio: 42, iva: 10, tags: ['tv', 'datos', 'rj45', 'antena'] },
  { n: 67, capitulo: 'electricidad', codigo: 'ELE-008', descripcion: 'Boletín eléctrico (CIE) y tramitación', unidad: 'pa', precio: 180, iva: 21, tags: ['boletín', 'cie'] },

  // ── PINTURA ───────────────────────────────────────────────────
  { n: 80, capitulo: 'pintura', codigo: 'PIN-001', descripcion: 'Protección de suelos, mobiliario y carpinterías', unidad: 'pa', precio: 180, iva: 10, tags: ['proteger', 'cubrir'] },
  { n: 81, capitulo: 'pintura', codigo: 'PIN-002', descripcion: 'Lijado, masillado y reparación de imperfecciones en paredes', unidad: 'm2', precio: 4.5, iva: 10, tags: ['lijar', 'masilla', 'reparar'] },
  { n: 82, capitulo: 'pintura', codigo: 'PIN-003', descripcion: 'Imprimación selladora en paredes y techos', unidad: 'm2', precio: 3, iva: 10, tags: ['imprimar', 'sellar'] },
  { n: 83, capitulo: 'pintura', codigo: 'PIN-004', descripcion: 'Dos manos de pintura plástica mate lavable en paredes', unidad: 'm2', precio: 8.5, iva: 10, tags: ['pintar', 'plastica', 'mate'] },
  { n: 84, capitulo: 'pintura', codigo: 'PIN-005', descripcion: 'Dos manos de pintura plástica blanca en techos', unidad: 'm2', precio: 9, iva: 10, tags: ['pintar', 'techo', 'blanco'] },
  { n: 85, capitulo: 'pintura', codigo: 'PIN-006', descripcion: 'Limpieza final y retirada de protecciones', unidad: 'pa', precio: 220, iva: 10, tags: ['limpiar', 'final'] },
  { n: 86, capitulo: 'pintura', codigo: 'PIN-007', descripcion: 'Pintura plástica antihumedad en techo', unidad: 'm2', precio: 15, iva: 10, tags: ['antihumedad', 'baño', 'techo'] },
  { n: 87, capitulo: 'pintura', codigo: 'PIN-008', descripcion: 'Pintura plástica lavable de techo y paredes (cocina)', unidad: 'm2', precio: 12, iva: 10, tags: ['lavable', 'cocina'] },

  // ── SOLADO Y ALICATADO ────────────────────────────────────────
  { n: 100, capitulo: 'solado_alicatado', codigo: 'SOL-001', descripcion: 'Impermeabilización plato de ducha con lámina asfáltica', unidad: 'm2', precio: 45, iva: 10, tags: ['impermeabilizar', 'ducha', 'lámina'] },
  { n: 101, capitulo: 'solado_alicatado', codigo: 'SOL-002', descripcion: 'Alicatado de paredes con porcelánico 30x60', unidad: 'm2', precio: 42, iva: 10, tags: ['alicatar', 'azulejo', 'baldosa', 'porcelanico'] },
  { n: 102, capitulo: 'solado_alicatado', codigo: 'SOL-003', descripcion: 'Solado de gres antideslizante', unidad: 'm2', precio: 38, iva: 10, tags: ['suelo', 'gres', 'baño', 'antideslizante'] },
  { n: 103, capitulo: 'solado_alicatado', codigo: 'SOL-004', descripcion: 'Alicatado de frente de encimera con porcelánico', unidad: 'm2', precio: 42, iva: 10, tags: ['frente', 'cocina', 'encimera'] },
  { n: 104, capitulo: 'solado_alicatado', codigo: 'SOL-005', descripcion: 'Solado vinílico de alta resistencia', unidad: 'm2', precio: 35, iva: 10, tags: ['vinilico', 'cocina'] },
  { n: 105, capitulo: 'solado_alicatado', codigo: 'SOL-006', descripcion: 'Gres porcelánico 60x60 rectificado', unidad: 'm2', precio: 45, iva: 10, tags: ['gres', 'rectificado', 'suelo'] },
  { n: 106, capitulo: 'solado_alicatado', codigo: 'SOL-007', descripcion: 'Rodapié de gres a juego, altura 8 cm', unidad: 'ml', precio: 12, iva: 10, tags: ['rodapie', 'rodapié'] },
  { n: 107, capitulo: 'solado_alicatado', codigo: 'SOL-008', descripcion: 'Tarima laminada AC4 con aislamiento acústico', unidad: 'm2', precio: 28, iva: 10, tags: ['tarima', 'laminada', 'parquet'] },

  // ── CARPINTERÍA ───────────────────────────────────────────────
  { n: 120, capitulo: 'carpinteria', codigo: 'CAR-001', descripcion: 'Puerta de paso block lacada blanca con manilla', unidad: 'ud', precio: 320, iva: 10, tags: ['puerta', 'paso', 'block'] },
  { n: 121, capitulo: 'carpinteria', codigo: 'CAR-002', descripcion: 'Frente de armario empotrado con puertas correderas', unidad: 'm2', precio: 280, iva: 10, tags: ['armario', 'empotrado'] },
  { n: 122, capitulo: 'carpinteria', codigo: 'CAR-003', descripcion: 'Acuchillado, lijado y barnizado de tarima', unidad: 'm2', precio: 22, iva: 10, tags: ['acuchillar', 'barnizar', 'tarima'] },
  { n: 123, capitulo: 'carpinteria', codigo: 'CAR-004', descripcion: 'Ventana PVC oscilobatiente con vidrio bajo emisivo', unidad: 'ud', precio: 480, iva: 10, tags: ['ventana', 'pvc', 'climalit'] },
  { n: 124, capitulo: 'carpinteria', codigo: 'CAR-005', descripcion: 'Mosquitera enrollable para ventana', unidad: 'ud', precio: 95, iva: 10, tags: ['mosquitera'] },

  // ── PLADUR Y TECHOS ───────────────────────────────────────────
  { n: 140, capitulo: 'pladur_falsos_techos', codigo: 'PLA-001', descripcion: 'Falso techo continuo de placa de yeso laminado 13mm', unidad: 'm2', precio: 32, iva: 10, tags: ['pladur', 'falso techo', 'yeso'] },
  { n: 141, capitulo: 'pladur_falsos_techos', codigo: 'PLA-002', descripcion: 'Tabique de pladur con doble placa y aislamiento', unidad: 'm2', precio: 48, iva: 10, tags: ['pladur', 'tabique', 'aislamiento'] },
  { n: 142, capitulo: 'pladur_falsos_techos', codigo: 'PLA-003', descripcion: 'Foseado de luz indirecta perimetral', unidad: 'ml', precio: 38, iva: 10, tags: ['foseado', 'led', 'cornisa'] },

  // ── CLIMATIZACIÓN ─────────────────────────────────────────────
  { n: 160, capitulo: 'climatizacion', codigo: 'CLI-001', descripcion: 'Aire acondicionado split 1x1 inverter 3000 frigorías', unidad: 'ud', precio: 980, iva: 10, tags: ['aire', 'split', 'inverter'] },
  { n: 161, capitulo: 'climatizacion', codigo: 'CLI-002', descripcion: 'Radiador toallero eléctrico para baño', unidad: 'ud', precio: 220, iva: 10, tags: ['toallero', 'radiador'] },
  { n: 162, capitulo: 'climatizacion', codigo: 'CLI-003', descripcion: 'Suelo radiante eléctrico bajo cerámica', unidad: 'm2', precio: 65, iva: 10, tags: ['suelo radiante', 'calefaccion'] },

  // ── CUBIERTAS Y FACHADAS ──────────────────────────────────────
  { n: 180, capitulo: 'cubiertas_fachadas', codigo: 'CUB-001', descripcion: 'Sistema SATE de aislamiento térmico exterior', unidad: 'm2', precio: 78, iva: 10, tags: ['sate', 'aislamiento', 'fachada'] },
  { n: 181, capitulo: 'cubiertas_fachadas', codigo: 'CUB-002', descripcion: 'Impermeabilización de terraza con lámina líquida', unidad: 'm2', precio: 32, iva: 10, tags: ['impermeabilizar', 'terraza'] },

  // ── SANITARIOS Y GRIFERÍA ─────────────────────────────────────
  { n: 200, capitulo: 'sanitarios_griferia', codigo: 'SAN-001', descripcion: 'Suministro e instalación de plato de ducha y mampara', unidad: 'ud', precio: 850, iva: 10, tags: ['plato', 'ducha', 'mampara'] },
  { n: 201, capitulo: 'sanitarios_griferia', codigo: 'SAN-002', descripcion: 'Inodoro suspendido con cisterna empotrada', unidad: 'ud', precio: 520, iva: 10, tags: ['inodoro', 'suspendido', 'cisterna', 'wc'] },
  { n: 202, capitulo: 'sanitarios_griferia', codigo: 'SAN-003', descripcion: 'Mueble de baño con lavabo y grifería', unidad: 'ud', precio: 680, iva: 10, tags: ['mueble', 'lavabo', 'grifo'] },
  { n: 203, capitulo: 'sanitarios_griferia', codigo: 'SAN-004', descripcion: 'Grifería termostática de ducha', unidad: 'ud', precio: 280, iva: 10, tags: ['grifo', 'termostatica'] },
  { n: 204, capitulo: 'sanitarios_griferia', codigo: 'SAN-005', descripcion: 'Fregadero acero inoxidable doble seno y grifería', unidad: 'ud', precio: 420, iva: 10, tags: ['fregadero', 'grifo', 'cocina'] },

  // ── COCINA EXTRA ──────────────────────────────────────────────
  { n: 220, capitulo: 'carpinteria', codigo: 'CAR-006', descripcion: 'Muebles de cocina (alto y bajo)', unidad: 'ml', precio: 480, iva: 10, tags: ['muebles', 'cocina'] },
  { n: 221, capitulo: 'carpinteria', codigo: 'CAR-007', descripcion: 'Encimera de cuarzo compacto, espesor 20mm', unidad: 'ml', precio: 280, iva: 10, tags: ['encimera', 'cuarzo'] },

  // ── ESCOMBROS COCINA ──────────────────────────────────────────
  { n: 230, capitulo: 'demolicion', codigo: 'DEM-009', descripcion: 'Retirada de escombros cocina', unidad: 'pa', precio: 320, iva: 10, tags: ['escombros', 'cocina'] },

  // ── OTROS ─────────────────────────────────────────────────────
  { n: 240, capitulo: 'otros', codigo: 'OTR-001', descripcion: 'Proyecto técnico y dirección de obra', unidad: 'pa', precio: 1200, iva: 21, tags: ['proyecto', 'arquitecto', 'tecnico'] },
  { n: 241, capitulo: 'otros', codigo: 'OTR-002', descripcion: 'Tasas y licencia de obra menor', unidad: 'pa', precio: 380, iva: 21, tags: ['licencia', 'tasa'] },
  { n: 242, capitulo: 'otros', codigo: 'OTR-003', descripcion: 'Limpieza fin de obra', unidad: 'pa', precio: 280, iva: 10, tags: ['limpieza', 'final'] },
]

const ahora = '2026-05-03T00:00:00.000Z'

export function buildBibliotecaSeed(): Row[] {
  return PARTIDAS_DATA.map((p) => ({
    id: partidaId(p.n),
    created_at: ahora,
    updated_at: ahora,
    empresa_id: null,
    origen: 'sistema',
    capitulo: p.capitulo,
    codigo: p.codigo,
    descripcion: p.descripcion,
    unidad: p.unidad,
    precio_unitario_orientativo: p.precio,
    tipo_iva_sugerido: p.iva,
    tags: p.tags,
    notas: null,
    activo: true,
    origen_biblioteca_id: null,
  }))
}

// ──────────────────────────────────────────────────────────────────
// Plantillas: 5 plantillas con sus capítulos y partidas
// ──────────────────────────────────────────────────────────────────

export function buildPlantillasSeed(): {
  plantillas_obra: Row[]
  plantilla_capitulos: Row[]
  plantilla_partidas: Row[]
} {
  const plantillas: Row[] = [
    { id: plantillaId(1), created_at: ahora, updated_at: ahora, empresa_id: null, origen: 'sistema', slug: 'reforma_bano_completo', nombre: 'Reforma baño completo', descripcion: 'Demolición, fontanería, alicatado, sanitarios, pintura', icono: '🚿', tipo_iva_default: 10, titulo_sugerido: 'Reforma baño', orden: 10, activa: true },
    { id: plantillaId(2), created_at: ahora, updated_at: ahora, empresa_id: null, origen: 'sistema', slug: 'reforma_cocina_basica', nombre: 'Reforma cocina básica', descripcion: 'Demolición, instalaciones, alicatado, mobiliario, pintura', icono: '🍳', tipo_iva_default: 10, titulo_sugerido: 'Reforma cocina', orden: 20, activa: true },
    { id: plantillaId(3), created_at: ahora, updated_at: ahora, empresa_id: null, origen: 'sistema', slug: 'pintura_piso_completo', nombre: 'Pintura piso completo', descripcion: 'Preparación de paredes y pintura plástica de un piso', icono: '🎨', tipo_iva_default: 10, titulo_sugerido: 'Pintura piso', orden: 30, activa: true },
    { id: plantillaId(4), created_at: ahora, updated_at: ahora, empresa_id: null, origen: 'sistema', slug: 'solado_alicatado', nombre: 'Solado y alicatado', descripcion: 'Cambio de suelo y revestimiento de paredes', icono: '🧱', tipo_iva_default: 10, titulo_sugerido: 'Solado y alicatado', orden: 40, activa: true },
    { id: plantillaId(5), created_at: ahora, updated_at: ahora, empresa_id: null, origen: 'sistema', slug: 'instalacion_electrica_basica', nombre: 'Instalación eléctrica básica', descripcion: 'Renovación cuadro, cableado y mecanismos', icono: '⚡', tipo_iva_default: 10, titulo_sugerido: 'Renovación instalación eléctrica', orden: 50, activa: true },
  ]

  // Capítulos por plantilla
  const capitulos: Row[] = [
    // 1. Reforma baño
    { id: capId(1), created_at: ahora, plantilla_id: plantillaId(1), orden: 1, nombre: 'Demolición y desescombro', capitulo_sistema: 'demolicion' },
    { id: capId(2), created_at: ahora, plantilla_id: plantillaId(1), orden: 2, nombre: 'Fontanería', capitulo_sistema: 'fontaneria' },
    { id: capId(3), created_at: ahora, plantilla_id: plantillaId(1), orden: 3, nombre: 'Electricidad', capitulo_sistema: 'electricidad' },
    { id: capId(4), created_at: ahora, plantilla_id: plantillaId(1), orden: 4, nombre: 'Albañilería y revestimientos', capitulo_sistema: 'solado_alicatado' },
    { id: capId(5), created_at: ahora, plantilla_id: plantillaId(1), orden: 5, nombre: 'Sanitarios', capitulo_sistema: 'sanitarios_griferia' },
    { id: capId(6), created_at: ahora, plantilla_id: plantillaId(1), orden: 6, nombre: 'Pintura', capitulo_sistema: 'pintura' },
    // 2. Reforma cocina
    { id: capId(10), created_at: ahora, plantilla_id: plantillaId(2), orden: 1, nombre: 'Demolición', capitulo_sistema: 'demolicion' },
    { id: capId(11), created_at: ahora, plantilla_id: plantillaId(2), orden: 2, nombre: 'Instalaciones', capitulo_sistema: 'fontaneria' },
    { id: capId(12), created_at: ahora, plantilla_id: plantillaId(2), orden: 3, nombre: 'Revestimientos y solado', capitulo_sistema: 'solado_alicatado' },
    { id: capId(13), created_at: ahora, plantilla_id: plantillaId(2), orden: 4, nombre: 'Mobiliario', capitulo_sistema: 'carpinteria' },
    { id: capId(14), created_at: ahora, plantilla_id: plantillaId(2), orden: 5, nombre: 'Pintura', capitulo_sistema: 'pintura' },
    // 3. Pintura piso
    { id: capId(20), created_at: ahora, plantilla_id: plantillaId(3), orden: 1, nombre: 'Preparación', capitulo_sistema: 'pintura' },
    { id: capId(21), created_at: ahora, plantilla_id: plantillaId(3), orden: 2, nombre: 'Pintado', capitulo_sistema: 'pintura' },
    // 4. Solado y alicatado
    { id: capId(30), created_at: ahora, plantilla_id: plantillaId(4), orden: 1, nombre: 'Demolición', capitulo_sistema: 'demolicion' },
    { id: capId(31), created_at: ahora, plantilla_id: plantillaId(4), orden: 2, nombre: 'Solado y alicatado', capitulo_sistema: 'solado_alicatado' },
    // 5. Eléctrica
    { id: capId(40), created_at: ahora, plantilla_id: plantillaId(5), orden: 1, nombre: 'Cuadro y cableado', capitulo_sistema: 'electricidad' },
    { id: capId(41), created_at: ahora, plantilla_id: plantillaId(5), orden: 2, nombre: 'Mecanismos', capitulo_sistema: 'electricidad' },
    { id: capId(42), created_at: ahora, plantilla_id: plantillaId(5), orden: 3, nombre: 'Tramitación', capitulo_sistema: 'otros' },
  ]

  type Pp = { plantilla: number; cap: number; n: number; cantidad: number; orden: number }
  const partidasMap: Pp[] = [
    // Reforma baño
    { plantilla: 1, cap: 1, n: 1, cantidad: 1, orden: 1 },
    { plantilla: 1, cap: 1, n: 5, cantidad: 1, orden: 2 },
    { plantilla: 1, cap: 2, n: 40, cantidad: 1, orden: 1 },
    { plantilla: 1, cap: 3, n: 60, cantidad: 1, orden: 1 },
    { plantilla: 1, cap: 4, n: 100, cantidad: 4, orden: 1 },
    { plantilla: 1, cap: 4, n: 101, cantidad: 28, orden: 2 },
    { plantilla: 1, cap: 4, n: 102, cantidad: 6, orden: 3 },
    { plantilla: 1, cap: 5, n: 200, cantidad: 1, orden: 1 },
    { plantilla: 1, cap: 5, n: 201, cantidad: 1, orden: 2 },
    { plantilla: 1, cap: 5, n: 202, cantidad: 1, orden: 3 },
    { plantilla: 1, cap: 6, n: 86, cantidad: 6, orden: 1 },
    // Reforma cocina
    { plantilla: 2, cap: 10, n: 2, cantidad: 1, orden: 1 },
    { plantilla: 2, cap: 10, n: 230, cantidad: 1, orden: 2 },
    { plantilla: 2, cap: 11, n: 41, cantidad: 1, orden: 1 },
    { plantilla: 2, cap: 11, n: 61, cantidad: 1, orden: 2 },
    { plantilla: 2, cap: 12, n: 103, cantidad: 8, orden: 1 },
    { plantilla: 2, cap: 12, n: 104, cantidad: 12, orden: 2 },
    { plantilla: 2, cap: 13, n: 220, cantidad: 4, orden: 1 },
    { plantilla: 2, cap: 13, n: 221, cantidad: 4, orden: 2 },
    { plantilla: 2, cap: 13, n: 204, cantidad: 1, orden: 3 },
    { plantilla: 2, cap: 14, n: 87, cantidad: 35, orden: 1 },
    // Pintura
    { plantilla: 3, cap: 20, n: 80, cantidad: 1, orden: 1 },
    { plantilla: 3, cap: 20, n: 81, cantidad: 220, orden: 2 },
    { plantilla: 3, cap: 20, n: 82, cantidad: 220, orden: 3 },
    { plantilla: 3, cap: 21, n: 83, cantidad: 180, orden: 1 },
    { plantilla: 3, cap: 21, n: 84, cantidad: 65, orden: 2 },
    { plantilla: 3, cap: 21, n: 85, cantidad: 1, orden: 3 },
    // Solado/alicatado
    { plantilla: 4, cap: 30, n: 3, cantidad: 50, orden: 1 },
    { plantilla: 4, cap: 30, n: 5, cantidad: 1, orden: 2 },
    { plantilla: 4, cap: 31, n: 22, cantidad: 50, orden: 1 },
    { plantilla: 4, cap: 31, n: 105, cantidad: 50, orden: 2 },
    { plantilla: 4, cap: 31, n: 106, cantidad: 28, orden: 3 },
    { plantilla: 4, cap: 31, n: 24, cantidad: 50, orden: 4 },
    // Eléctrica
    { plantilla: 5, cap: 40, n: 62, cantidad: 1, orden: 1 },
    { plantilla: 5, cap: 40, n: 63, cantidad: 80, orden: 2 },
    { plantilla: 5, cap: 41, n: 64, cantidad: 18, orden: 1 },
    { plantilla: 5, cap: 41, n: 65, cantidad: 12, orden: 2 },
    { plantilla: 5, cap: 41, n: 66, cantidad: 4, orden: 3 },
    { plantilla: 5, cap: 42, n: 67, cantidad: 1, orden: 1 },
  ]

  const partidasIndex = new Map(PARTIDAS_DATA.map((p) => [p.n, p]))

  const partidas: Row[] = partidasMap.map((m, i) => {
    const base = partidasIndex.get(m.n)
    if (!base) throw new Error(`Demo seed: partida ${m.n} no encontrada`)
    return {
      id: `e0000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`,
      created_at: ahora,
      plantilla_id: plantillaId(m.plantilla),
      plantilla_capitulo_id: capId(m.cap),
      partida_biblioteca_id: partidaId(m.n),
      orden: m.orden,
      descripcion: base.descripcion,
      unidad: base.unidad,
      precio_unitario_orientativo: base.precio,
      cantidad_sugerida: m.cantidad,
      tipo_iva_sugerido: base.iva,
    }
  })

  return { plantillas_obra: plantillas, plantilla_capitulos: capitulos, plantilla_partidas: partidas }
}
