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
