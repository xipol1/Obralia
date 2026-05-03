# ADR-003: Rediseño UX/UI del flujo del constructor

## Estado
Propuesta — 2026-05-03 (pendiente de aprobación del fundador)

## Contexto

Tras Sesión 2 tenemos un MVP funcional con presupuestos, biblioteca, capítulos y plantillas. Una auditoría real del flujo (no del prompt aspiracional) revela:

- **20-25 toques** para crear y enviar el primer presupuesto desde plantilla.
- **Pérdida silenciosa de datos** si cae la red (cosa que pasa en obra constantemente).
- **Wizard IVA blocker** con 3 preguntas legales a un autónomo de 50 años con manos sucias.
- **Cliente opcional** que rompe el envío al final, no al principio.
- **Editor de capítulos oculto**: el usuario no sabe dónde añadir partidas.
- **Selector de partidas** con UX de buscador, no de catálogo navegable.

El usuario objetivo NO es un product manager probando la app — es un autónomo en una escalera, con guantes a medio quitar, móvil Android gama media-baja, y necesita mandar el presupuesto **antes de bajar de la furgoneta del cliente**.

Este ADR define el flujo objetivo y los cambios concretos para llegar.

## Principio rector

> **"3 toques al primer importe, 7 toques al PDF en WhatsApp."**

Cada decisión se mide contra esto. Si añade un toque al killer flow sin justificación legal o fiscal, se rechaza.

## Diagnóstico priorizado

### Top 5 fricciones que matan conversión

| # | Fricción | Dónde | Impacto |
|---|----------|-------|---------|
| 1 | **Pérdida de datos por red** | Cualquier pantalla con form largo | Usuario rage-quit, no vuelve |
| 2 | **Wizard IVA bloqueante con copy legal** | `/presupuestos/nuevo` antes de partidas | Usuario adivina mal o salta → IVA incorrecto |
| 3 | **Cliente opcional pero requerido al enviar** | Flujo completo | Vuelta atrás al final, frustración máxima |
| 4 | **Editor de capítulos oculto + acordeón** | `CapitulosEditor` | Usuario no encuentra dónde añadir partidas |
| 5 | **Demasiado scroll antes del primer importe** | `/presupuestos/nuevo` ~600 líneas | Abandono antes de la primera partida |

### Top 3 inconsistencias visuales

1. Patrones de tabs distintos en presupuestos vs biblioteca vs clientes.
2. Spacing inconsistente entre forms (`space-y-4`, `space-y-5`).
3. FAB "+" siempre va a `/presupuestos/nuevo`, ignorando contexto (en /clientes debería crear cliente).

## Decisión: 4 cambios estructurales del flujo

### Cambio 1 — Reordenar la creación de presupuesto: "primero las partidas, después el papel"

**Hoy:** Cliente → Datos → IVA wizard → Capítulos → Partidas → Notas → Guardar.

**Propuesto:** En `/presupuestos/nuevo` el primer pantallazo (sin scroll) es:

```
┌───────────────────────────────────────────┐
│ ← Nuevo presupuesto              [Borrador]│
├───────────────────────────────────────────┤
│  ¿Cómo empiezas?                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Plantilla│ │  En blanco│ │ Copiar de│   │
│  │   →      │ │     →    │ │ otro  →  │   │
│  └──────────┘ └──────────┘ └──────────┘   │
└───────────────────────────────────────────┘
```

Tras elegir, el usuario aterriza directamente en el **editor de partidas con un capítulo abierto**, listo para añadir. Todo lo demás (cliente, IVA, notas) baja a una segunda pantalla "Detalles" accesible vía tab superior.

**Tabs en la pantalla de edición:** `Partidas (8) · Detalles · Vista previa`.

Permite picar partidas inmediatamente y llenar la cabecera al final, que es lo que de verdad hace en obra: el constructor sabe **qué cuesta** antes de saber **cómo se llama**.

### Cambio 2 — IVA: del wizard bloqueante al banner inteligente

**Hoy:** 3 preguntas con copy legal antes de poder añadir partidas.

**Propuesto:**

1. Por defecto, el sistema **asume IVA 10%** (caso mayoritario: reforma vivienda) y lo aplica silenciosamente.
2. Aparece un banner ámbar al final del editor:
   > **¿Es reforma de vivienda habitual? IVA 10% aplicado**
   > Si no es así, [revisa el IVA →]

3. Solo si el usuario toca "revisa el IVA", se abre un sheet con las 3 preguntas reformuladas en lenguaje de obra:

   - "¿Es la casa donde vive el cliente todo el año?" (era "vivienda habitual")
   - "¿Es obra nueva, local, oficina o trastero?" (era "vivienda particular del destinatario")
   - "¿Pones tú más material que mano de obra?" (era "material supera el 40%")

4. Cada pregunta tiene **ejemplos visuales** con miniaturas: una casa habitada, un local de cara al público, etc.

5. El motivo legal sigue guardándose en la BD, pero NO se muestra al usuario hasta el PDF. La AEAT lo verá; el cliente final también; el constructor no necesita leerlo cada vez.

**Trade-off:** asumimos por defecto el más común. En producción, si vemos que un % de usuarios pide IVA 21% (por tipo de cliente), invertimos el default. Métricamos.

### Cambio 3 — Cliente: validar al inicio, no al envío

**Hoy:** `cliente_id` opcional → presupuesto se crea → al enviar por WhatsApp, "no hay teléfono".

**Propuesto:**

1. **Al crear presupuesto en blanco**, el primer paso del editor es un selector grande de cliente arriba del todo, **sticky**: nombre + teléfono + botón "Cambiar".

2. Si no hay cliente, muestra inline:
   ```
   ┌───────────────────────────────────────┐
   │  👤  Aún sin cliente                   │
   │  [Buscar cliente]   [+ Nuevo cliente] │
   └───────────────────────────────────────┘
   ```

3. **No bloquea**: el usuario puede ir añadiendo partidas. Pero al pulsar "Guardar borrador", se le pide cliente con un dialog que también permite **crear cliente desde ahí mismo** sin abandonar el presupuesto (mini form 4 campos: nombre, NIF, teléfono, dirección).

4. **Validación previa al envío:** botón "Enviar por WhatsApp" deshabilitado si falta teléfono, con tooltip claro "Falta el teléfono del cliente, [edita el cliente]".

**Por qué no obligamos al inicio:** un constructor en obra a veces empieza la cuenta antes de saber a qué cliente concreto se la va a mandar. Permite el flujo natural pero protege el final.

### Cambio 4 — Capítulos: pestañas horizontales en lugar de acordeón vertical

**Hoy:** Capítulos como acordeón colapsable. Solo el primero abierto. Botón "+ Añadir partida" dentro del capítulo, requiere abrir.

**Propuesto:**

```
┌─────────────────────────────────────────┐
│ Demolición · Albañilería · Pintura · +  │  ← tabs scrolleables
├─────────────────────────────────────────┤
│ Demolición                  Subt: 980€  │
├─────────────────────────────────────────┤
│  • Picar alicatado     12 m² × 18 = 216 │
│  • Retirar escombros   1 pa × 280 = 280 │
│  • ...                                  │
│                                         │
│  [+ Añadir partida]                     │
└─────────────────────────────────────────┘
```

- **Tabs horizontales scrolleables** arriba (snap-x, igual que en biblioteca).
- Solo se ve el contenido del capítulo activo. Cero acordeón.
- Botón "+" al final de la lista de tabs para añadir capítulo nuevo.
- Subtotal del capítulo activo siempre visible bajo la tab.
- **Cambio importante**: cuando el usuario toca "+ Añadir partida", el `SelectorPartidas` se abre **pre-filtrado por el capítulo activo** automáticamente. Hoy lo hace pero la conexión no es visualmente obvia.

**Trade-off:** Pierde la vista global de todos los capítulos a la vez. Compensación: la tab "Vista previa" muestra el árbol completo + totales como aparecerá en el PDF.

## Decisiones tácticas (cambios concretos por pantalla)

### Layout principal (`app/(app)/layout.tsx`)

- **FAB contextual**: en `/clientes` el "+" crea cliente. En `/presupuestos` crea presupuesto. En `/ajustes/biblioteca`, partida. Detect con `usePathname`.
- **Indicador de borrador no guardado** en bottom nav: si hay un borrador en localStorage, badge rojo en la pestaña Presupuestos.

### Auto-save (transversal)

- Hook `useDraftAutoSave(formKey, formData)` que escribe en `localStorage` cada 10s.
- Al entrar a `/presupuestos/nuevo`, si existe draft de hace <24h, banner ámbar arriba: "Tienes un borrador sin guardar de hace 2h. [Recuperar] [Descartar]".
- Al `submit` exitoso, limpia el draft.
- Misma técnica para nuevo cliente y edición de empresa.

### Network resilience

1. **TanStack Query retry policy**: 3 intentos exponential backoff para reads, 1 para writes (evitar duplicados).
2. **Mutation queue**: si la mutación falla por red, se guarda en localStorage y se reintenta cuando vuelva la conexión (event listener `online`).
3. **Status pill** en header global cuando hay conexión flaky:
   - Verde: online (no se muestra).
   - Ámbar: "Sin conexión, los cambios se guardan en tu móvil".
   - Rojo: "No se pudo enviar". CTA "Reintentar".

### Gestión de borradores

- **Eliminar presupuesto** desde detalle: menú "⋮" → "Borrar presupuesto" con confirmación destructiva. Solo permitido si `estado='borrador'`.
- **Lista de presupuestos**: swipe-to-delete en móvil (con undo toast 5s).
- **Confirmación al salir** de `/presupuestos/nuevo` con cambios: dialog "¿Descartar borrador? Los cambios no guardados se perderán".

### IVA banner

Componente nuevo `<IvaInteligente>`:
- Default 10% con copy: "IVA 10% aplicado (reforma vivienda habitual)".
- Tap → sheet con preguntas reformuladas + ejemplos visuales (3 imágenes 80x80 por pregunta).
- Resultado se guarda y persiste; siguiente presupuesto recuerda la última config si es el mismo cliente.

### Selector de cliente

- En el editor: card sticky arriba con cliente actual o "Sin cliente".
- "Buscar cliente" abre bottom-sheet (mismo pattern que `SelectorPartidas`) con search + lista filtrable.
- "+ Nuevo cliente" inline, dialog modal con 4 campos mínimos. Al guardar vuelve al presupuesto con el cliente ya seleccionado.

### "Hacer mía" → "Usar y guardar"

En biblioteca y selector, cambiar copy y comportamiento:
- **Botón "Usar"** (acción primaria): añade al presupuesto actual con precio y cantidad ajustables.
- **Si edita el precio**: aparece checkbox "Guardar este precio en mi biblioteca" (por defecto marcado).
- Eliminar el botón "Hacer mía" como acción separada — la copia se hace al "Usar y guardar con cambios".

### PDF: progreso visible

- Botón "Generar PDF" con estados: idle → "Preparando PDF..." (spinner) → "Subiendo..." → "Listo, abriendo".
- Si tarda >5s, mostrar texto "Esto está tardando más de lo normal. La conexión puede ir lenta."
- Skeleton del PDF mientras se genera (preview blanca con líneas grises) en lugar de spinner solo.

## Cambios visuales (sistema de diseño)

### Tokens unificados

Añadir a `globals.css`:

```css
--space-form-gap: 1.25rem;       /* spacing entre fields */
--space-section-gap: 2rem;       /* spacing entre secciones */
--space-card-padding: 1rem;      /* padding interno de cards */
--touch-target-min: 48px;        /* min altura interactiva */
--touch-target-comfort: 56px;    /* altura cómoda para acciones primarias */
```

Aplicar uniformemente. Auditar cada `space-y-*` y migrar.

### Tabs unificados

Componente `<Tabs variant="pills" />` único en `components/ui/tabs.tsx`. Todos los lugares que usan tabs (presupuestos list, biblioteca, futuro editor de partidas) consumen este componente.

### Empty states con texto fallback

Cada `<EmptyState>` debe tener `title` y `description` además del icono. Si el icono falla, el texto solo es funcional.

### Botones primarios siempre `min-h-14` (56px)

Acciones críticas ("Guardar presupuesto", "Enviar WhatsApp", "Empezar prueba") ocupan **56px de altura mínima**, full-width en móvil. Touch comfortable.

## Métricas para validar

Tras implementar, instrumentar con PostHog (ya en stack):

| Evento | Por qué |
|--------|---------|
| `presupuesto_nuevo_started` | Baseline de funnel |
| `presupuesto_nuevo_first_partida_added` (con tiempo desde started) | Ver si Cambio 1 reduce time-to-first-importe |
| `iva_banner_clicked` | Cuántos usuarios abren el wizard real (esperamos <30%) |
| `presupuesto_nuevo_abandoned` (con last_event) | Saber dónde abandonan |
| `draft_recovered` | Probar que auto-save funciona |
| `presupuesto_sent_whatsapp` (con tiempo desde started) | KPI principal |

**Objetivo p50 a 30 días post-implementación:**
- `time_to_first_partida` < 60 segundos
- `time_to_sent` < 6 minutos
- `funnel_started_to_sent` > 70%
- `draft_recovered` > 0% (significa que está pasando y nos salva conversión)

## Trade-offs explícitos

1. **Tabs horizontales en capítulos vs vista global**: pierdes ver todo a la vez. Compensado con tab "Vista previa". Si tras 4 semanas usuarios piden vista global, la añadimos como toggle.

2. **IVA por defecto 10%**: error fiscal posible si el constructor lo hace sin pensar. Mitigación: PDF y factura siempre muestran motivo legal grande; banner amarillo en pantalla; al primer `payment_failed` o disputa, escalado.

3. **Auto-save en localStorage**: límite 5MB. Suficiente para 50+ presupuestos en cola. Si se llena, expulsamos el más viejo con aviso.

4. **Cliente opcional al inicio**: aumenta presupuestos huérfanos en BD. Mitigación: vista de "borradores incompletos" en la lista para que el usuario los limpie. Y soft-delete tras 90 días sin actividad.

5. **Mutation queue offline**: complejidad operacional. Riesgo de doble envío si el cliente cree que falló pero ya se grabó. Mitigación: idempotency key (UUID generado en cliente) en cada mutación de write.

## Plan de implementación sugerido (3 sesiones)

### Sesión 3: Fundamentos de resiliencia (alta prioridad)
- Auto-save de borradores (presupuesto + cliente).
- Confirmación al salir con cambios.
- Eliminar presupuesto borrador con confirm.
- Status pill de conexión.
- Mutation retry/queue básico.
- FAB contextual.

### Sesión 4: Killer flow rediseñado
- Reorganizar `/presupuestos/nuevo` con tabs Partidas/Detalles/Vista previa.
- IVA banner inteligente.
- Selector de cliente sticky.
- Capítulos como tabs horizontales.
- Eliminar acordeón.

### Sesión 5: Pulido + métricas
- Componentes unificados (Tabs, spacing tokens).
- PostHog events instrumentados.
- "Usar y guardar" en biblioteca.
- PDF con estados de progreso.
- Edición de presupuesto existente (que sigue pendiente desde Sesión 2).

## Lo que NO cambiamos

- **Identidad visual** (azul + ámbar + off-white): funciona, no se toca.
- **Auth SMS**: el flujo telefónico es perfecto para el target.
- **PDF A4**: ya está pulido tras Sesión 2 con capítulos.
- **Biblioteca de sistema**: 186 partidas. Suficientes.
- **WhatsApp send via wa.me**: imposible mejorar; es el canal natural.

## Pregunta abierta para el fundador

**Decisión más importante para tomar antes de implementar Sesión 3:** ¿priorizamos resiliencia (auto-save, offline) o flujo rediseñado (tabs, IVA banner)?

Mi recomendación: **resiliencia primero**. Sin auto-save, cualquier mejora del flujo se pierde el día que el usuario está en una obra con 1 raya de cobertura. Una vez la app no pierde datos, podemos rediseñar el flujo con tranquilidad.

Si elegimos flujo primero, el riesgo es que un usuario early-adopter pierda 30 minutos de presupuesto y no vuelva a abrir la app. **Ese coste de retención es más caro que cualquier mejora de UX**.
