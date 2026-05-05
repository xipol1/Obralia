/**
 * Obralia - Domain Types
 *
 * Simplified types for UI consumption, built on top of database types.
 */

import type { CapituloSistema, Database, Tables } from "./database";

export type { CapituloSistema };

// ---------------------------------------------------------------------------
// Scalar enums / union types
// ---------------------------------------------------------------------------

export type TipoIVA = 0 | 4 | 10 | 21;

export type UnidadMedida = "m2" | "m3" | "ml" | "ud" | "h" | "kg" | "pa";

export type EstadoPresupuesto =
  | "borrador"
  | "enviado"
  | "aceptado"
  | "rechazado"
  | "caducado";

export type EstadoFactura = "emitida" | "pagada" | "rectificada";

export type Plan = "trial" | "basico" | "pro" | "equipo";

export type RegimenFiscal = "estimacion_directa" | "estimacion_objetiva";

export type RolMiembro = "owner" | "admin" | "usuario";

export type TipoCliente = "particular" | "empresa";

export type AccionAudit = "create" | "update" | "send" | "delete";

// ---------------------------------------------------------------------------
// Row aliases
// ---------------------------------------------------------------------------

export type Empresa = Tables<"empresas">;

export type Cliente = Tables<"clientes">;

export type Partida = Tables<"presupuesto_partidas">;

export type Capitulo = Tables<"presupuesto_capitulos">;

export type Factura = Tables<"facturas">;

export type EventoAudit = Tables<"eventos_audit">;

// ---------------------------------------------------------------------------
// Composite / enriched types for UI
// ---------------------------------------------------------------------------

/** Miembro with empresa info joined */
export type Miembro = Tables<"miembros"> & {
  empresa: Empresa;
};

/** Presupuesto with partidas and optional cliente info */
export type Presupuesto = Tables<"presupuestos"> & {
  partidas: Partida[];
  capitulos?: Capitulo[];
  cliente?: Cliente | null;
};

/** Lightweight presupuesto row for list views (no partidas) */
export type PresupuestoListItem = Tables<"presupuestos"> & {
  cliente?: Pick<Cliente, "nombre" | "apellidos" | "razon_social"> | null;
};

// ---------------------------------------------------------------------------
// Sesión 2: Biblioteca y plantillas
// ---------------------------------------------------------------------------

export type OrigenItem = "sistema" | "empresa";

export type PartidaBiblioteca = Tables<"partidas_biblioteca">;

export type PlantillaObra = Tables<"plantillas_obra">;

export type PlantillaCapitulo = Tables<"plantilla_capitulos">;

export type PlantillaPartida = Tables<"plantilla_partidas">;

/** Plantilla con sus capítulos y partidas (para listar y aplicar) */
export type PlantillaCompleta = PlantillaObra & {
  capitulos: PlantillaCapitulo[];
  partidas: PlantillaPartida[];
};

/** Metadata visible para el usuario sobre un capítulo del sistema */
export interface CapituloMeta {
  key: CapituloSistema;
  label: string;
  /** Nombre lucide-react del icono */
  icon: string;
  /** Color de acento (clase Tailwind) */
  color: string;
}

/** Lista ordenada de los 12 capítulos del sistema */
export const CAPITULOS_META: CapituloMeta[] = [
  { key: "demolicion", label: "Demolición", icon: "Hammer", color: "text-red-600" },
  { key: "albanileria", label: "Albañilería", icon: "BrickWall", color: "text-amber-700" },
  { key: "fontaneria", label: "Fontanería", icon: "Droplets", color: "text-blue-600" },
  { key: "electricidad", label: "Electricidad", icon: "Zap", color: "text-yellow-600" },
  { key: "pintura", label: "Pintura", icon: "Paintbrush", color: "text-purple-600" },
  { key: "solado_alicatado", label: "Solado y alicatado", icon: "Grid3x3", color: "text-stone-600" },
  { key: "carpinteria", label: "Carpintería", icon: "Hammer", color: "text-orange-700" },
  { key: "pladur_falsos_techos", label: "Pladur y techos", icon: "Square", color: "text-slate-500" },
  { key: "climatizacion", label: "Climatización", icon: "Wind", color: "text-cyan-600" },
  { key: "cubiertas_fachadas", label: "Cubiertas y fachadas", icon: "Home", color: "text-emerald-700" },
  { key: "sanitarios_griferia", label: "Sanitarios y grifería", icon: "ShowerHead", color: "text-sky-600" },
  { key: "otros", label: "Otros", icon: "MoreHorizontal", color: "text-gray-500" },
];

export function getCapituloMeta(key: CapituloSistema | null | undefined): CapituloMeta | null {
  if (!key) return null;
  return CAPITULOS_META.find((c) => c.key === key) ?? null;
}

// ---------------------------------------------------------------------------
// Sesión 4: Facturas OCR (tablas no presentes aún en types/database.ts)
// ---------------------------------------------------------------------------

export type EstadoFacturaSubida =
  | "pendiente"
  | "procesando"
  | "procesada"
  | "error";

/** Cabecera de una factura subida (tabla facturas_subidas) */
export interface FacturaSubida {
  id: string;
  created_at: string;
  updated_at: string;
  empresa_id: string;
  subida_por: string | null;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  estado: EstadoFacturaSubida;
  error_mensaje: string | null;
  procesada_at: string | null;
  proveedor_nombre: string | null;
  proveedor_nif: string | null;
  numero_factura: string | null;
  fecha_factura: string | null;
  total_sin_iva: number | null;
  total_iva: number | null;
  total_con_iva: number | null;
  moneda: string | null;
}

/** Línea extraída de una factura (tabla factura_lineas) */
export interface FacturaLinea {
  id: string;
  created_at: string;
  factura_id: string;
  empresa_id: string;
  orden: number;
  codigo_articulo: string | null;
  descripcion: string;
  cantidad: number | null;
  unidad: string | null;
  precio_unitario: number | null;
  importe_linea: number | null;
  tipo_iva: number | null;
  partida_biblioteca_id: string | null;
  importada_at: string | null;
}
