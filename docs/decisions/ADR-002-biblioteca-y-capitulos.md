# ADR-002: Biblioteca de partidas y capítulos en presupuestos

## Estado
Aceptado — 2026-05-03

## Contexto
Sesión 2 introduce dos cambios estructurales en el modelo de presupuestos:

1. **Capítulos**: agrupar partidas por bloques de obra (Demolición, Albañilería, Fontanería…) con subtotales propios.
2. **Biblioteca de partidas**: catálogo en BD que el constructor puede consultar al crear presupuesto, con partidas de sistema (comunes, inmutables) y partidas propias (creadas o duplicadas por la empresa).

Adicionalmente: las plantillas hardcodeadas en `lib/plantillas/index.ts` (5 plantillas, ~40 partidas) deben migrar a tablas de BD para poder editarse desde la app y eventualmente que cada empresa cree sus propias plantillas.

## Decisión

### Modelo "sistema + personal" (Opción B)
Tanto **partidas** como **plantillas** tienen dos orígenes:
- `origen = 'sistema'` con `empresa_id IS NULL`: comunes a todos, inmutables desde cliente.
- `origen = 'empresa'` con `empresa_id NOT NULL`: propias de cada empresa.

La empresa puede:
- Crear partidas/plantillas propias.
- "Hacer mía" una de sistema (RPC `duplicar_partida_a_empresa`): crea una copia editable con `origen_biblioteca_id` apuntando al original.
- Editar el precio al usar una de sistema en un presupuesto y opcionalmente guardar la copia en su biblioteca.

`origen_biblioteca_id` queda preparado para futura **Opción C** (precios comunitarios / promedios entre empresas) sin migración rompedora.

### Sin FK fuerte presupuesto_partidas → partidas_biblioteca
- `partida_biblioteca_id` es `references partidas_biblioteca(id) on delete set null`: si se borra una partida del catálogo, los presupuestos antiguos siguen teniendo el snapshot copiado (descripción, precio, IVA, unidad).
- Esto preserva la naturaleza de **documento histórico congelado** del presupuesto: aunque mañana suba un material un 20%, el presupuesto que mandé al cliente ayer no cambia.
- Mismo principio para `plantilla_partidas`: snapshot de descripción/precio en la fila.

### Capítulos del sistema = enum cerrado
12 capítulos fijos cubren la mayoría de obras de reforma residencial:

`demolicion, albanileria, fontaneria, electricidad, pintura, solado_alicatado, carpinteria, pladur_falsos_techos, climatizacion, cubiertas_fachadas, sanitarios_griferia, otros`

Las **partidas de la biblioteca** se etiquetan obligatoriamente con uno de estos 12 → permite filtrado limpio en el selector.

Las **secciones de un presupuesto concreto** (`presupuesto_capitulos.nombre`) son texto libre: el constructor puede llamarlo "Demolición y desescombro" o "Fase 1" si quiere. Una columna nueva `capitulo_sistema` opcional vincula al enum cuando aplica (para filtrado y agrupación coherente).

### Búsqueda MVP: ILIKE + tags array
- `WHERE descripcion ILIKE '%query%' OR query = ANY(tags) OR codigo ILIKE '%query%'`
- Índice GIN sobre `tags` y `to_tsvector('simple', descripcion)` (español/acentos los pulimos en sesión 4 si hace falta; con `unaccent` extension).
- Sin `pgvector` ni búsqueda semántica todavía — overkill para MVP.

### Migración del presupuesto demo: capítulo "General" auto
El seed actual crea un presupuesto con 8 partidas planas (`capitulo_id = NULL`). En la migración del schema:

```sql
-- Crear capítulo "General" para presupuestos legacy con partidas sin capítulo
INSERT INTO presupuesto_capitulos (presupuesto_id, orden, nombre)
SELECT DISTINCT p.id, 1, 'General'
FROM presupuestos p
WHERE EXISTS (
  SELECT 1 FROM presupuesto_partidas pp
  WHERE pp.presupuesto_id = p.id AND pp.capitulo_id IS NULL
);

UPDATE presupuesto_partidas pp
SET capitulo_id = c.id
FROM presupuesto_capitulos c
WHERE pp.capitulo_id IS NULL
  AND c.presupuesto_id = pp.presupuesto_id
  AND c.nombre = 'General';
```

Beneficio: el editor y el PDF manejan **un único caso** (siempre hay capítulos). Sin ramas legacy.

### Plantillas hardcodeadas → DB
`lib/plantillas/index.ts` queda **deprecado pero conservado**:
- Se marca con `@deprecated` y comentario explicativo.
- Se conserva una sesión más como red de seguridad (por si la migración del seed falla en algún entorno).
- Se elimina en sesión 3.

El nuevo `lib/plantillas/index.ts` reexporta funciones DB-backed: `listarPlantillas(empresaId)`, `cargarPlantillaEnPresupuesto(plantillaId, presupuestoId)`.

## Alternativas descartadas

- **Opción A (todo personal por empresa, sin sistema)**: la fricción de empezar con biblioteca vacía mata la propuesta de valor "presupuesta en 5 minutos". Descartado.
- **Opción C (precios comunitarios desde día 1)**: requiere agregaciones, anti-cheating, UX extra. Posponemos a 2027.
- **FK fuerte presupuesto_partidas → partidas_biblioteca**: rompería presupuestos históricos al borrar/editar el catálogo. Descartado.
- **Capítulos texto libre sin enum**: imposible filtrar la biblioteca por capítulo de forma consistente. Descartado.
- **Drag-and-drop para reordenar**: poco fiable en móvil con manos sucias. Usamos flechas ↑↓ en el menú "⋮".

## Consecuencias

### Positivas
- Presupuesto sigue siendo **documento histórico congelado**.
- Schema preparado para Opción C sin migración rompedora.
- Cada empresa parte con catálogo de ~200 partidas listas (sistema), va construyendo el suyo encima.
- PDF y editor manejan capítulos de forma uniforme (incluyendo presupuestos antiguos migrados a "General").

### Negativas
- Duplicación física de datos (cada presupuesto copia descripción/precio de cada partida). Aceptable: presupuestos son inmutables tras envío.
- Inconsistencia posible: si la empresa edita una partida de su biblioteca, los presupuestos pasados no cambian. Es **el comportamiento deseado**, pero hay que comunicarlo en la UI ("Esta partida ya está en tu biblioteca, los cambios no afectan a presupuestos anteriores").
- Demo client necesita extenderse para soportar las nuevas tablas + RPC. Sin esto, el modo demo (que es lo que ve el usuario sin Supabase real) no funciona.

## Divergencias del prompt

1. **Prompt dice "lista cerrada de 12 capítulos del enum"**. Schema final también permite añadir capítulos custom dentro de un presupuesto vía `presupuesto_capitulos` (texto libre + `capitulo_sistema` opcional). Coincide con el prompt pero merece resaltarse: el enum es para la biblioteca, no para los capítulos del presupuesto.

2. **Prompt sugiere `tsvector('simple', descripcion)` para FTS español**. En sesión 2 lo creamos pero no lo usamos: la búsqueda real usa solo `ILIKE` + `tags`. El índice queda preparado para sesión 3 cuando activemos FTS con `unaccent` para acentos.

3. **Prompt dice "borra o marca @deprecated lib/plantillas/index.ts"**. Elegimos **marcar @deprecated** para conservar el array como referencia 1 sesión más. Borrado total en ADR-003 (sesión 3).
