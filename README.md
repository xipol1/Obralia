# Obralia — Presupuestos de obra en minutos

SaaS móvil-first para constructores autónomos y microempresas en España. Crea presupuestos en obra y envíalos por WhatsApp.

## Stack

- **Framework**: Next.js 15 (App Router) + TypeScript strict
- **Estilos**: Tailwind CSS v4 + componentes shadcn/ui
- **Auth**: Supabase Auth con OTP por SMS
- **DB**: Supabase Postgres con RLS
- **Storage**: Supabase Storage (logos, PDFs)
- **Billing**: Stripe Billing + Customer Portal
- **PDF**: @react-pdf/renderer (server-side)
- **Tests**: Vitest + Playwright

## Setup local

### 1. Clonar y dependencias

```bash
git clone <repo-url>
cd obralia
npm install
```

### 2. Variables de entorno

```bash
cp .env.example .env.local
```

Rellena las variables:

| Variable | Dónde obtenerla |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | [Supabase Dashboard](https://supabase.com/dashboard) → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Misma sección |
| `SUPABASE_SERVICE_ROLE_KEY` | Misma sección (⚠️ nunca exponer al cliente) |
| `STRIPE_SECRET_KEY` | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → tu endpoint |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe → API keys |
| `STRIPE_PRICE_*` | Crear productos en Stripe (ver abajo) |
| `NEXT_PUBLIC_SENTRY_DSN` | [Sentry](https://sentry.io) → Project settings |
| `NEXT_PUBLIC_POSTHOG_KEY` | [PostHog EU](https://eu.posthog.com) → Project settings |

### 3. Supabase local (opcional)

```bash
npx supabase start
npx supabase db reset  # aplica migraciones + seed
```

### 4. Stripe: crear productos

En el dashboard de Stripe (modo test), crea 3 productos:

- **Básico**: 19€/mes, 190€/año
- **Pro**: 39€/mes, 390€/año
- **Equipo**: 79€/mes, 790€/año

Copia los Price IDs a `.env.local`.

### 5. Stripe webhook local

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### 6. Arrancar

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Comandos

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo (Turbopack) |
| `npm run build` | Build de producción |
| `npm run typecheck` | Verificar tipos TypeScript |
| `npm run lint` | Lint con Biome |
| `npm run test` | Tests unitarios (Vitest) |
| `npm run test:e2e` | Tests e2e (Playwright) |
| `npm run db:gen-types` | Regenerar tipos de Supabase |

## Estructura del proyecto

```
app/
  (auth)/          → Login y verificación SMS
  (onboarding)/    → Setup empresa + logo + trial
  (app)/           → Zona autenticada (presupuestos, clientes, ajustes)
  (marketing)/     → Landing pública
  api/             → Webhooks Stripe, generación PDF
components/ui/     → Primitivos UI (button, input, card, dialog, toast...)
lib/
  supabase/        → Clients (browser, server, service-role)
  stripe/          → Stripe helpers
  iva/             → Lógica IVA española (con tests)
  pdf/             → Plantilla PDF @react-pdf
  whatsapp.ts      → Generador de links wa.me
schemas/           → Zod schemas compartidos
types/             → TypeScript types
supabase/
  migrations/      → SQL versionado
  seed.sql         → Datos demo
docs/decisions/    → ADRs
```

## Decisiones técnicas

Ver [docs/decisions/](docs/decisions/) para ADRs.
