# Estado del proyecto — Sesión 2

**Fecha**: 2026-05-03

## Qué se ha entregado en esta sesión

### Modelo de datos (ADR-002)
- [x] **Migración 00002** `supabase/migrations/00002_biblioteca_y_capitulos.sql`:
  - Enum `capitulo_sistema` con 12 valores (demolición, albañilería, fontanería, electricidad, pintura, solado/alicatado, carpintería, pladur, climatización, cubiertas/fachadas, sanitarios/grifería, otros).
  - Tabla `partidas_biblioteca` (sistema + propias por empresa, con `origen`, `tags[]`, `origen_biblioteca_id` preparado para Opción C).
  - Tabla `plantillas_obra` + `plantilla_capitulos` + `plantilla_partidas` (snapshot, sin FK fuerte a biblioteca).
  - Columnas nuevas en `presupuesto_capitulos.capitulo_sistema` y `presupuesto_partidas.partida_biblioteca_id` + `capitulo_sistema`.
  - Migración legacy: presupuestos con partidas planas reciben capítulo "General" automáticamente.
  - RPC `duplicar_partida_a_empresa(p_partida_id, p_empresa_id)` con SECURITY DEFINER.
  - RLS completas: SELECT sistema-OR-mías, INSERT/UPDATE/DELETE solo sobre las propias.

### Seed
- [x] **`supabase/seeds/biblioteca_sistema.sql`** — 186 partidas curadas (precios PVP 2026 España residencial), distribuidas en los 12 capítulos.
- [x] **5 plantillas de sistema** migradas desde el array hardcodeado: reforma_bano_completo, reforma_cocina_basica, pintura_piso_completo, solado_alicatado, instalacion_electrica_basica.
- [x] **22 capítulos de plantilla** + **35 partidas de plantilla** referenciando partidas reales de biblioteca vía `partida_biblioteca_id`.

### Backend
- [x] `lib/biblioteca/index.ts`: `buscarPartidas`, `crearPartidaPersonal`, `actualizarPartidaPersonal`, `eliminarPartidaPersonal` (soft-delete), `duplicarPartidaSistema` (RPC), `obtenerPartida`.
- [x] `lib/plantillas/index.ts`: refactor a DB-backed con `listarPlantillas`, `obtenerPlantilla`, `cargarPlantillaEnPresupuesto`. El array hardcodeado se conserva en `lib/plantillas/legacy.ts` marcado `@deprecated`.
- [x] `schemas/biblioteca.ts`: zod schemas compartidos (`partidaBibliotecaSchema`, `crearPartidaSchema`, `actualizarPartidaSchema`, `buscarPartidasSchema`).
- [x] `schemas/presupuesto.ts`: refactor para usar `capitulos[].partidas[]` en lugar de `partidas[]` plano.
- [x] `types/database.ts` y `types/domain.ts`: tipos para todas las tablas nuevas + enum + RPC + helpers `CAPITULOS_META` y `getCapituloMeta`.

### Demo client
- [x] `lib/supabase/demo-client.ts` extendido con: tablas `partidas_biblioteca`, `plantillas_obra`, `plantilla_capitulos`, `plantilla_partidas`, `presupuesto_capitulos`. Soporte de `.or()`, `.in()`, `.is()`, `.ilike()`, embeds para plantillas. RPC `duplicar_partida_a_empresa` implementada.
- [x] `lib/supabase/demo-seed-biblioteca.ts`: subset representativo (60 partidas + 5 plantillas + 19 capítulos) para que la demo sin Supabase muestre la biblioteca llena. Versión de localStorage bumped a `obralia-demo-db-v2`.

### UI
- [x] **`components/biblioteca/SelectorPartidas.tsx`** — bottom-sheet móvil / dialog lateral desktop. Search debounced 250ms. Tabs Todas/Mías/Sistema. Chips horizontales con los 12 capítulos. Lista virtualizada simple. Paso "ajustar" con inputs grandes y opción "guardar como mía". Paso "crear partida personalizada".
- [x] **`components/presupuesto/CapitulosEditor.tsx`** — secciones colapsables con subtotal, menú "⋮" (renombrar/mover/borrar), "+ Añadir partida" abre SelectorPartidas pre-filtrado, "+ Añadir capítulo" con sugerencias del enum.
- [x] **`/presupuestos/nuevo`** refactor: selector de plantillas DB-backed, IVA wizard, CapitulosEditor integrado, persistencia en transacción cliente (presupuesto + capítulos + partidas).
- [x] **`/presupuestos/[id]`** refactor: muestra partidas agrupadas por capítulo con subtotales y bloque "Sin agrupar" para legacy.
- [x] **`/ajustes/biblioteca`** nueva: gestión completa de partidas propias + vista "Sistema" con botón "Hacer mía", crear/editar/eliminar (soft).
- [x] **`/ajustes`**: nuevo card linking a biblioteca.

### PDF
- [x] **`lib/pdf/PresupuestoPDF.tsx`** refactor: agrupa por capítulo con cabecera, subtotal por capítulo y bloque "Sin agrupar" para legacy. Si no hay capítulos, mantiene render plano (compat).
- [x] **`/api/pdf/[id]` route**: incluye `presupuesto_capitulos` en el SELECT y los pasa a la plantilla.

### Calidad
- [x] **0 errores TypeScript**.
- [x] **38 tests pasando** (objetivo 25+):
  - 14 tests IVA (Sesión 1, sin cambios).
  - 14 tests `lib/biblioteca` (búsqueda, ordenación, validación, RPC, soft-delete).
  - 7 tests `lib/plantillas` (listado con counts, obtener, cargar plantilla en presupuesto).
  - 3 tests snapshot PDF (con capítulos, modo legacy, agrupación).
- [x] **ADR-002** documenta divergencias del prompt y decisiones (capítulo "General" auto, FK soft, plantillas hardcodeadas conservadas como legacy 1 sesión más).
- [x] **Todas las rutas responden 200** verificadas con curl: `/`, `/login`, `/presupuestos`, `/presupuestos/nuevo`, `/presupuestos/[id]`, `/clientes`, `/ajustes`, `/ajustes/biblioteca`, `/ajustes/empresa`, `/ajustes/facturacion`.

## Qué falta (siguiente sesión)

### Sesión 3 (sugerido)
- [ ] Editar presupuesto existente (pantalla de edición completa con CapitulosEditor cargado desde BD).
- [ ] Drag-and-drop alternativo en desktop para reordenar capítulos/partidas (móvil mantiene flechas ↑↓).
- [ ] Eliminar `lib/plantillas/legacy.ts` si la migración del seed ha funcionado en todos los entornos.
- [ ] Activar FTS español con `unaccent` extension para que la búsqueda en biblioteca encuentre "demolicion" y "demolición" igual.
- [ ] Test e2e Playwright extendido: login → nueva plantilla → añadir partida buscándola → guardar → ver PDF.

### Más adelante
- [ ] Firma del cliente (canvas + almacenamiento) — Sesión 4 según plan.
- [ ] Conversión presupuesto → factura — Sesión 5.
- [ ] Voz, fotos, márgenes ocultos, multi-usuario.

## Cómo arrancar local

```bash
npm install
cp .env.example .env.local   # opcional — sin claves reales arranca en modo demo
npm run dev                  # puerto 3000 por defecto, o el que pase con -p
```

Para ver la sesión en demo: http://localhost:3000/login → cualquier teléfono → cualquier OTP de 6 dígitos → entras como Reformas López con biblioteca + plantillas precargadas.

## Cómo desplegar a Supabase real

1. Crear proyecto Supabase, copiar URL + anon + service-role a `.env.local`.
2. Aplicar migraciones en orden: `00001_initial_schema.sql`, `00002_biblioteca_y_capitulos.sql`.
3. Aplicar seed: `seed.sql` (datos demo) + `seeds/biblioteca_sistema.sql` (catálogo sistema).
4. Configurar Twilio en Auth → Phone provider para SMS reales.

## Qué necesito del fundador para Sesión 3

1. **Decisión de prioridad**: ¿edición de presupuestos existentes o flujo factura?
2. **Revisión rápida de los 186 precios del seed** — un autónomo experimentado en 30 min puede validar 10-15 partidas críticas (sanitarios, alicatado, mano de obra horaria) y marcar las que no defendería en su zona.
3. **Decisión sobre tags**: ¿añadimos un editor de tags visible en `/ajustes/biblioteca` para que la empresa enriquezca su búsqueda?
