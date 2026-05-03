/**
 * @deprecated Sesión 2 (ADR-002): las plantillas viven ahora en BD
 * (tablas plantillas_obra + plantilla_capitulos + plantilla_partidas).
 *
 * Este archivo se conserva 1 sesión más como red de seguridad y referencia
 * de los precios orientativos del seed. Eliminar en sesión 3.
 *
 * Para cargar plantillas en producción, usa lib/plantillas/index.ts:
 *   - listarPlantillas(supabase, empresaId)
 *   - cargarPlantillaEnPresupuesto(supabase, plantillaId, presupuestoId)
 */

import type { TipoIVA, UnidadMedida } from '@/types/domain'

export interface PartidaPlantilla {
  descripcion: string
  unidad: UnidadMedida
  cantidad: number
  precio_unitario: number
  tipo_iva: TipoIVA
}

export interface Plantilla {
  id: string
  nombre: string
  descripcion: string
  emoji: string
  tipo_iva_default: TipoIVA
  partidas: PartidaPlantilla[]
}

// -----------------------------------------------------------------------------
// Plantillas
// -----------------------------------------------------------------------------

export const PLANTILLAS: Plantilla[] = [
  {
    id: 'reforma-bano-completo',
    nombre: 'Reforma baño completo',
    descripcion: 'Demolición, fontanería, alicatado, sanitarios, pintura',
    emoji: '🚿',
    tipo_iva_default: 10,
    partidas: [
      {
        descripcion: 'Demolición de alicatado, solado y sanitarios existentes',
        unidad: 'pa',
        cantidad: 1,
        precio_unitario: 650,
        tipo_iva: 10,
      },
      {
        descripcion: 'Retirada de escombros y transporte a vertedero',
        unidad: 'pa',
        cantidad: 1,
        precio_unitario: 280,
        tipo_iva: 10,
      },
      {
        descripcion: 'Fontanería: distribución agua fría/caliente y desagües',
        unidad: 'pa',
        cantidad: 1,
        precio_unitario: 850,
        tipo_iva: 10,
      },
      {
        descripcion: 'Electricidad: punto luz, espejo y enchufes',
        unidad: 'pa',
        cantidad: 1,
        precio_unitario: 320,
        tipo_iva: 10,
      },
      {
        descripcion: 'Impermeabilización plato de ducha con lámina asfáltica',
        unidad: 'm2',
        cantidad: 4,
        precio_unitario: 45,
        tipo_iva: 10,
      },
      {
        descripcion: 'Alicatado de paredes con porcelánico 30x60',
        unidad: 'm2',
        cantidad: 28,
        precio_unitario: 42,
        tipo_iva: 10,
      },
      {
        descripcion: 'Solado de gres antideslizante',
        unidad: 'm2',
        cantidad: 6,
        precio_unitario: 38,
        tipo_iva: 10,
      },
      {
        descripcion: 'Suministro e instalación de plato de ducha y mampara',
        unidad: 'ud',
        cantidad: 1,
        precio_unitario: 850,
        tipo_iva: 10,
      },
      {
        descripcion: 'Suministro e instalación de inodoro suspendido con cisterna empotrada',
        unidad: 'ud',
        cantidad: 1,
        precio_unitario: 520,
        tipo_iva: 10,
      },
      {
        descripcion: 'Suministro e instalación de mueble de baño con lavabo y grifería',
        unidad: 'ud',
        cantidad: 1,
        precio_unitario: 680,
        tipo_iva: 10,
      },
      {
        descripcion: 'Pintura de techo plástica antihumedad',
        unidad: 'm2',
        cantidad: 6,
        precio_unitario: 15,
        tipo_iva: 10,
      },
    ],
  },

  {
    id: 'reforma-cocina-basica',
    nombre: 'Reforma cocina básica',
    descripcion: 'Demolición, instalaciones, alicatado, mobiliario, pintura',
    emoji: '🍳',
    tipo_iva_default: 10,
    partidas: [
      {
        descripcion: 'Desmontaje de mobiliario, electrodomésticos y alicatado',
        unidad: 'pa',
        cantidad: 1,
        precio_unitario: 750,
        tipo_iva: 10,
      },
      {
        descripcion: 'Retirada de escombros y transporte a vertedero',
        unidad: 'pa',
        cantidad: 1,
        precio_unitario: 320,
        tipo_iva: 10,
      },
      {
        descripcion: 'Fontanería: tomas agua y desagüe fregadero/lavavajillas',
        unidad: 'pa',
        cantidad: 1,
        precio_unitario: 480,
        tipo_iva: 10,
      },
      {
        descripcion: 'Electricidad: circuito independiente para horno y vitro, puntos de luz',
        unidad: 'pa',
        cantidad: 1,
        precio_unitario: 620,
        tipo_iva: 10,
      },
      {
        descripcion: 'Alicatado de frente de encimera con porcelánico',
        unidad: 'm2',
        cantidad: 8,
        precio_unitario: 42,
        tipo_iva: 10,
      },
      {
        descripcion: 'Solado vinílico de alta resistencia',
        unidad: 'm2',
        cantidad: 12,
        precio_unitario: 35,
        tipo_iva: 10,
      },
      {
        descripcion: 'Suministro e instalación de muebles de cocina (alto y bajo)',
        unidad: 'ml',
        cantidad: 4,
        precio_unitario: 480,
        tipo_iva: 10,
      },
      {
        descripcion: 'Encimera de cuarzo compacto, espesor 20mm',
        unidad: 'ml',
        cantidad: 4,
        precio_unitario: 280,
        tipo_iva: 10,
      },
      {
        descripcion: 'Suministro e instalación de fregadero y grifería monomando',
        unidad: 'ud',
        cantidad: 1,
        precio_unitario: 420,
        tipo_iva: 10,
      },
      {
        descripcion: 'Pintura plástica lavable de techo y paredes',
        unidad: 'm2',
        cantidad: 35,
        precio_unitario: 12,
        tipo_iva: 10,
      },
    ],
  },

  {
    id: 'pintura-piso-completo',
    nombre: 'Pintura piso completo',
    descripcion: 'Preparación de paredes y pintura plástica de un piso',
    emoji: '🎨',
    tipo_iva_default: 10,
    partidas: [
      {
        descripcion: 'Protección de suelos, mobiliario y carpinterías',
        unidad: 'pa',
        cantidad: 1,
        precio_unitario: 180,
        tipo_iva: 10,
      },
      {
        descripcion: 'Lijado, masillado y reparación de imperfecciones en paredes',
        unidad: 'm2',
        cantidad: 220,
        precio_unitario: 4.5,
        tipo_iva: 10,
      },
      {
        descripcion: 'Imprimación selladora en paredes y techos',
        unidad: 'm2',
        cantidad: 220,
        precio_unitario: 3,
        tipo_iva: 10,
      },
      {
        descripcion: 'Aplicación de dos manos de pintura plástica mate lavable en paredes',
        unidad: 'm2',
        cantidad: 180,
        precio_unitario: 8.5,
        tipo_iva: 10,
      },
      {
        descripcion: 'Aplicación de dos manos de pintura plástica blanca en techos',
        unidad: 'm2',
        cantidad: 65,
        precio_unitario: 9,
        tipo_iva: 10,
      },
      {
        descripcion: 'Limpieza final y retirada de protecciones',
        unidad: 'pa',
        cantidad: 1,
        precio_unitario: 220,
        tipo_iva: 10,
      },
    ],
  },

  {
    id: 'solado-alicatado',
    nombre: 'Solado y alicatado',
    descripcion: 'Cambio de suelo y revestimiento de paredes',
    emoji: '🧱',
    tipo_iva_default: 10,
    partidas: [
      {
        descripcion: 'Demolición de solado existente',
        unidad: 'm2',
        cantidad: 50,
        precio_unitario: 12,
        tipo_iva: 10,
      },
      {
        descripcion: 'Retirada de escombros y transporte',
        unidad: 'pa',
        cantidad: 1,
        precio_unitario: 280,
        tipo_iva: 10,
      },
      {
        descripcion: 'Nivelación con mortero autonivelante',
        unidad: 'm2',
        cantidad: 50,
        precio_unitario: 18,
        tipo_iva: 10,
      },
      {
        descripcion: 'Suministro e instalación de gres porcelánico 60x60 rectificado',
        unidad: 'm2',
        cantidad: 50,
        precio_unitario: 45,
        tipo_iva: 10,
      },
      {
        descripcion: 'Rodapié de gres a juego, altura 8 cm',
        unidad: 'ml',
        cantidad: 28,
        precio_unitario: 12,
        tipo_iva: 10,
      },
      {
        descripcion: 'Sellado de juntas con material epoxi',
        unidad: 'm2',
        cantidad: 50,
        precio_unitario: 6,
        tipo_iva: 10,
      },
    ],
  },

  {
    id: 'instalacion-electrica-basica',
    nombre: 'Instalación eléctrica básica',
    descripcion: 'Renovación cuadro, cableado y mecanismos',
    emoji: '⚡',
    tipo_iva_default: 10,
    partidas: [
      {
        descripcion: 'Sustitución de cuadro eléctrico con magnetotérmicos y diferencial',
        unidad: 'ud',
        cantidad: 1,
        precio_unitario: 480,
        tipo_iva: 10,
      },
      {
        descripcion: 'Sustitución de cableado en circuitos principales',
        unidad: 'ml',
        cantidad: 80,
        precio_unitario: 6.5,
        tipo_iva: 10,
      },
      {
        descripcion: 'Instalación de tomas de corriente schuko',
        unidad: 'ud',
        cantidad: 18,
        precio_unitario: 28,
        tipo_iva: 10,
      },
      {
        descripcion: 'Instalación de puntos de luz con interruptor',
        unidad: 'ud',
        cantidad: 12,
        precio_unitario: 35,
        tipo_iva: 10,
      },
      {
        descripcion: 'Instalación de toma TV y datos',
        unidad: 'ud',
        cantidad: 4,
        precio_unitario: 42,
        tipo_iva: 10,
      },
      {
        descripcion: 'Boletín eléctrico (CIE) y tramitación',
        unidad: 'pa',
        cantidad: 1,
        precio_unitario: 180,
        tipo_iva: 21,
      },
    ],
  },
]

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

export function getPlantilla(id: string): Plantilla | undefined {
  return PLANTILLAS.find((p) => p.id === id)
}

export function calcularTotalPlantilla(plantilla: Plantilla): {
  base: number
  iva: number
  total: number
} {
  const base = plantilla.partidas.reduce(
    (sum, p) => sum + p.cantidad * p.precio_unitario,
    0,
  )
  const iva = base * (plantilla.tipo_iva_default / 100)
  return { base, iva: Math.round(iva * 100) / 100, total: Math.round((base + iva) * 100) / 100 }
}
