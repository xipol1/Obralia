# ADR-001: Stack tecnológico MVP Obralia

## Estado
Aceptado — 2026-05-02

## Contexto
Obralia es un SaaS móvil-first para constructores autónomos en España. Necesitamos un stack que permita iterar rápido, desplegar barato y que un developer junior pueda mantener. El fundador tiene experiencia previa con Next.js + Supabase + Stripe en Vercel.

## Decisión
Adoptamos el stack propuesto sin cambios significativos:

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Framework | Next.js 15 (App Router) + TypeScript strict | PWA-ready, SSR opcional, deploy simple en Vercel |
| Estilos | Tailwind CSS v4 + shadcn/ui | Velocidad, accesibilidad, mobile-first |
| Auth | Supabase Auth con OTP SMS (Twilio) | Constructores no usan email fiable |
| DB | Supabase Postgres + RLS | Multi-tenant seguro desde día 1 |
| Storage | Supabase Storage | Logos, PDFs, futuras fotos |
| Billing | Stripe Billing + webhooks | Estándar |
| Forms | React Hook Form + Zod | Validación compartida cliente/servidor |
| PDF | @react-pdf/renderer | Render server-side, plantilla declarativa |
| Fechas | date-fns con locale es | Ligero, tree-shakeable |
| i18n | next-intl (solo es-ES activo) | Preparado para expansión |
| Data | TanStack Query v5 + Server Actions | Caché y mutaciones limpias |
| Tests | Vitest + Testing Library + Playwright | Suficiente para MVP |
| Lint | Biome | Más rápido que ESLint+Prettier |
| CI | GitHub Actions | Mínimo viable |
| Deploy | Vercel | Coste cero al arrancar |
| Errores | Sentry free tier | Visibilidad desde el primer cliente |
| Analítica | PostHog Cloud EU | RGPD compliant |

### Cambios propuestos vs briefing original

**Ninguno.** El stack está bien calibrado para el perfil del proyecto. Notas:

1. **next-intl** se configura pero solo con locale `es-ES`. El overhead es mínimo y evita refactor futuro.
2. **@react-pdf/renderer** se usa server-side only (Route Handler). No se envía al bundle del cliente.
3. **Supabase client tipado** se genera con `supabase gen types` en vez de Prisma — menos abstracción, más control.

## Alternativas descartadas
- **Prisma**: añade una capa de abstracción innecesaria cuando Supabase client ya da tipos generados y RLS funciona directo en SQL.
- **tRPC**: Server Actions de Next.js 15 cubren el caso de uso sin dependencia extra.
- **Redux/Zustand**: TanStack Query maneja el estado del servidor; el estado local es mínimo en MVP.
- **Resend/email**: los constructores no revisan email; WhatsApp es el canal natural.

## Consecuencias
- Dependencia fuerte en el ecosistema Supabase (auth, DB, storage). Aceptable: migrar a Postgres puro es viable si hace falta.
- Vercel free tier tiene límites de serverless functions. Suficiente para MVP; si escala, mover PDF gen a edge function o queue.
- Stripe requiere cuenta verificada en España. El fundador debe crearla antes de ir a producción.
