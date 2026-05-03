-- =============================================================================
-- Obralia - Initial Schema Migration
-- SaaS para contratistas de construccion en Espana
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. Helper: updated_at trigger function
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------------------

-- 2.1 empresas (tenant) -------------------------------------------------
create table public.empresas (
  id            uuid        default gen_random_uuid() primary key,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),

  nombre_comercial text,
  razon_social     text        not null,
  nif              text        not null,

  direccion        text,
  codigo_postal    text,
  municipio        text,
  provincia        text,

  email            text,
  telefono         text,
  web              text,

  logo_url         text,
  iban             text,

  regimen_fiscal   text default 'estimacion_directa'
    check (regimen_fiscal in ('estimacion_directa', 'estimacion_objetiva')),

  stripe_customer_id     text,
  stripe_subscription_id text,
  plan             text default 'trial'
    check (plan in ('trial', 'basico', 'pro', 'equipo')),
  trial_ends_at    timestamptz
);

create trigger set_empresas_updated_at
  before update on public.empresas
  for each row execute function public.set_updated_at();

-- 2.2 miembros (user <-> empresa link) -----------------------------------
create table public.miembros (
  id          uuid        default gen_random_uuid() primary key,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),

  empresa_id  uuid        not null references public.empresas(id) on delete cascade,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  rol         text        default 'owner'
    check (rol in ('owner', 'admin', 'usuario')),

  unique (empresa_id, user_id)
);

create trigger set_miembros_updated_at
  before update on public.miembros
  for each row execute function public.set_updated_at();

-- 2.3 clientes -----------------------------------------------------------
create table public.clientes (
  id          uuid        default gen_random_uuid() primary key,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),

  empresa_id  uuid        not null references public.empresas(id) on delete cascade,

  tipo        text        default 'particular'
    check (tipo in ('particular', 'empresa')),

  nombre      text,
  apellidos   text,
  razon_social text,
  nif         text,
  email       text,
  telefono    text,

  direccion      text,
  codigo_postal  text,
  municipio      text,
  provincia      text,

  notas       text
);

create trigger set_clientes_updated_at
  before update on public.clientes
  for each row execute function public.set_updated_at();

-- 2.4 presupuestos -------------------------------------------------------
create table public.presupuestos (
  id          uuid        default gen_random_uuid() primary key,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),

  empresa_id  uuid        not null references public.empresas(id) on delete cascade,
  cliente_id  uuid        references public.clientes(id) on delete set null,

  numero      text        not null,
  fecha_emision  date     default current_date,
  fecha_validez  date,

  estado      text        default 'borrador'
    check (estado in ('borrador', 'enviado', 'aceptado', 'rechazado', 'caducado')),

  titulo         text,
  direccion_obra text,

  tipo_iva_default integer default 21
    check (tipo_iva_default in (0, 4, 10, 21)),
  motivo_iva_reducido text,

  base_imponible decimal(12,2) default 0,
  cuota_iva      decimal(12,2) default 0,
  total          decimal(12,2) default 0,

  notas_cliente    text,
  notas_internas   text,
  exclusiones      text,

  forma_pago           text,
  plazo_ejecucion_dias integer,
  garantia_meses       integer,

  pdf_url     text,
  enviado_at  timestamptz,
  aceptado_at timestamptz,
  firma_url   text
);

create trigger set_presupuestos_updated_at
  before update on public.presupuestos
  for each row execute function public.set_updated_at();

-- 2.5 presupuesto_capitulos ----------------------------------------------
create table public.presupuesto_capitulos (
  id              uuid          default gen_random_uuid() primary key,
  created_at      timestamptz   default now(),
  updated_at      timestamptz   default now(),

  presupuesto_id  uuid          not null references public.presupuestos(id) on delete cascade,
  orden           integer       default 0,
  nombre          text          not null,
  subtotal        decimal(12,2) default 0
);

create trigger set_presupuesto_capitulos_updated_at
  before update on public.presupuesto_capitulos
  for each row execute function public.set_updated_at();

-- 2.6 presupuesto_partidas -----------------------------------------------
create table public.presupuesto_partidas (
  id              uuid          default gen_random_uuid() primary key,
  created_at      timestamptz   default now(),
  updated_at      timestamptz   default now(),

  presupuesto_id  uuid          not null references public.presupuestos(id) on delete cascade,
  capitulo_id     uuid          references public.presupuesto_capitulos(id) on delete set null,

  orden           integer       default 0,
  descripcion     text          not null,

  unidad          text          default 'ud'
    check (unidad in ('m2', 'm3', 'ml', 'ud', 'h', 'kg', 'pa')),

  cantidad          decimal(12,3) default 1,
  precio_unitario   decimal(12,2) default 0,
  importe           decimal(12,2) generated always as (cantidad * precio_unitario) stored,

  tipo_iva          integer       default 21
    check (tipo_iva in (0, 4, 10, 21)),

  coste_unitario_interno decimal(12,2),
  notas              text
);

create trigger set_presupuesto_partidas_updated_at
  before update on public.presupuesto_partidas
  for each row execute function public.set_updated_at();

-- 2.7 facturas (structure only, not used in MVP) -------------------------
create table public.facturas (
  id          uuid        default gen_random_uuid() primary key,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),

  empresa_id     uuid        not null references public.empresas(id) on delete cascade,
  presupuesto_id uuid        references public.presupuestos(id) on delete set null,
  cliente_id     uuid        references public.clientes(id) on delete set null,

  numero         text        not null,
  fecha_emision  date,
  fecha_devengo  date,

  base_imponible  decimal(12,2),
  cuota_iva       decimal(12,2),
  total           decimal(12,2),
  retencion_irpf  decimal(12,2),

  estado text default 'emitida'
    check (estado in ('emitida', 'pagada', 'rectificada')),

  pdf_url text
);

create trigger set_facturas_updated_at
  before update on public.facturas
  for each row execute function public.set_updated_at();

-- 2.8 contadores (sequential numbering) ----------------------------------
-- No id, no created_at/updated_at. Composite PK.
create table public.contadores (
  empresa_id    uuid    not null references public.empresas(id) on delete cascade,
  tipo          text    not null check (tipo in ('presupuesto', 'factura')),
  ejercicio     integer not null,
  ultimo_numero integer default 0,

  primary key (empresa_id, tipo, ejercicio)
);

-- 2.9 eventos_audit (audit log) ------------------------------------------
-- Only id and created_at, no updated_at.
create table public.eventos_audit (
  id          uuid        default gen_random_uuid() primary key,
  created_at  timestamptz default now(),

  empresa_id  uuid        references public.empresas(id) on delete set null,
  user_id     uuid        references auth.users(id) on delete set null,

  entidad     text        not null,
  entidad_id  uuid,
  accion      text        not null
    check (accion in ('create', 'update', 'send', 'delete')),

  payload     jsonb
);

-- ---------------------------------------------------------------------------
-- 3. Indexes
-- ---------------------------------------------------------------------------
create index idx_miembros_user_id       on public.miembros(user_id);
create index idx_miembros_empresa_id    on public.miembros(empresa_id);
create index idx_clientes_empresa_id    on public.clientes(empresa_id);
create index idx_presupuestos_empresa_id on public.presupuestos(empresa_id);
create index idx_presupuestos_cliente_id on public.presupuestos(cliente_id);
create index idx_presupuesto_capitulos_presupuesto_id on public.presupuesto_capitulos(presupuesto_id);
create index idx_presupuesto_partidas_presupuesto_id  on public.presupuesto_partidas(presupuesto_id);
create index idx_presupuesto_partidas_capitulo_id     on public.presupuesto_partidas(capitulo_id);
create index idx_facturas_empresa_id    on public.facturas(empresa_id);
create index idx_eventos_audit_empresa_id on public.eventos_audit(empresa_id);
create index idx_eventos_audit_entidad    on public.eventos_audit(entidad, entidad_id);

-- ---------------------------------------------------------------------------
-- 4. Row Level Security
-- ---------------------------------------------------------------------------

-- Helper: returns all empresa_ids the current user belongs to.
create or replace function public.mis_empresa_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select empresa_id
  from public.miembros
  where user_id = auth.uid();
$$;

-- 4.1 empresas ------------------------------------------------------------
alter table public.empresas enable row level security;

create policy "empresas_select" on public.empresas
  for select using (id in (select public.mis_empresa_ids()));

create policy "empresas_insert" on public.empresas
  for insert with check (true);
  -- Anyone authenticated can create a new empresa (they then add themselves as miembro).

create policy "empresas_update" on public.empresas
  for update using (id in (select public.mis_empresa_ids()));

create policy "empresas_delete" on public.empresas
  for delete using (id in (select public.mis_empresa_ids()));

-- 4.2 miembros ------------------------------------------------------------
alter table public.miembros enable row level security;

create policy "miembros_select" on public.miembros
  for select using (user_id = auth.uid());

create policy "miembros_insert" on public.miembros
  for insert with check (
    -- Only existing members of the empresa can add new members
    empresa_id in (select public.mis_empresa_ids())
    -- Or this is the first member (owner) being added
    or not exists (select 1 from public.miembros m where m.empresa_id = miembros.empresa_id)
  );

create policy "miembros_update" on public.miembros
  for update using (empresa_id in (select public.mis_empresa_ids()));

create policy "miembros_delete" on public.miembros
  for delete using (empresa_id in (select public.mis_empresa_ids()));

-- 4.3 clientes ------------------------------------------------------------
alter table public.clientes enable row level security;

create policy "clientes_select" on public.clientes
  for select using (empresa_id in (select public.mis_empresa_ids()));

create policy "clientes_insert" on public.clientes
  for insert with check (empresa_id in (select public.mis_empresa_ids()));

create policy "clientes_update" on public.clientes
  for update using (empresa_id in (select public.mis_empresa_ids()));

create policy "clientes_delete" on public.clientes
  for delete using (empresa_id in (select public.mis_empresa_ids()));

-- 4.4 presupuestos --------------------------------------------------------
alter table public.presupuestos enable row level security;

create policy "presupuestos_select" on public.presupuestos
  for select using (empresa_id in (select public.mis_empresa_ids()));

create policy "presupuestos_insert" on public.presupuestos
  for insert with check (empresa_id in (select public.mis_empresa_ids()));

create policy "presupuestos_update" on public.presupuestos
  for update using (empresa_id in (select public.mis_empresa_ids()));

create policy "presupuestos_delete" on public.presupuestos
  for delete using (empresa_id in (select public.mis_empresa_ids()));

-- 4.5 presupuesto_capitulos -----------------------------------------------
alter table public.presupuesto_capitulos enable row level security;

create policy "presupuesto_capitulos_select" on public.presupuesto_capitulos
  for select using (
    presupuesto_id in (select id from public.presupuestos where empresa_id in (select public.mis_empresa_ids()))
  );

create policy "presupuesto_capitulos_insert" on public.presupuesto_capitulos
  for insert with check (
    presupuesto_id in (select id from public.presupuestos where empresa_id in (select public.mis_empresa_ids()))
  );

create policy "presupuesto_capitulos_update" on public.presupuesto_capitulos
  for update using (
    presupuesto_id in (select id from public.presupuestos where empresa_id in (select public.mis_empresa_ids()))
  );

create policy "presupuesto_capitulos_delete" on public.presupuesto_capitulos
  for delete using (
    presupuesto_id in (select id from public.presupuestos where empresa_id in (select public.mis_empresa_ids()))
  );

-- 4.6 presupuesto_partidas ------------------------------------------------
alter table public.presupuesto_partidas enable row level security;

create policy "presupuesto_partidas_select" on public.presupuesto_partidas
  for select using (
    presupuesto_id in (select id from public.presupuestos where empresa_id in (select public.mis_empresa_ids()))
  );

create policy "presupuesto_partidas_insert" on public.presupuesto_partidas
  for insert with check (
    presupuesto_id in (select id from public.presupuestos where empresa_id in (select public.mis_empresa_ids()))
  );

create policy "presupuesto_partidas_update" on public.presupuesto_partidas
  for update using (
    presupuesto_id in (select id from public.presupuestos where empresa_id in (select public.mis_empresa_ids()))
  );

create policy "presupuesto_partidas_delete" on public.presupuesto_partidas
  for delete using (
    presupuesto_id in (select id from public.presupuestos where empresa_id in (select public.mis_empresa_ids()))
  );

-- 4.7 facturas ------------------------------------------------------------
alter table public.facturas enable row level security;

create policy "facturas_select" on public.facturas
  for select using (empresa_id in (select public.mis_empresa_ids()));

create policy "facturas_insert" on public.facturas
  for insert with check (empresa_id in (select public.mis_empresa_ids()));

create policy "facturas_update" on public.facturas
  for update using (empresa_id in (select public.mis_empresa_ids()));

create policy "facturas_delete" on public.facturas
  for delete using (empresa_id in (select public.mis_empresa_ids()));

-- 4.8 contadores ----------------------------------------------------------
-- NO client access. Only accessible via RPC (security definer functions).
alter table public.contadores enable row level security;
-- No policies = no access from client.

-- 4.9 eventos_audit -------------------------------------------------------
alter table public.eventos_audit enable row level security;

-- Insert-only: users can insert audit events for their empresas.
create policy "eventos_audit_insert" on public.eventos_audit
  for insert with check (empresa_id in (select public.mis_empresa_ids()));

-- Users can read audit events for their empresas.
create policy "eventos_audit_select" on public.eventos_audit
  for select using (empresa_id in (select public.mis_empresa_ids()));

-- No update or delete policies = no modification from client.

-- ---------------------------------------------------------------------------
-- 5. RPC: siguiente_numero
-- ---------------------------------------------------------------------------
create or replace function public.siguiente_numero(
  p_empresa_id uuid,
  p_tipo       text,
  p_ejercicio  integer
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_numero integer;
begin
  -- Verify the caller is a member of the empresa
  if not exists (
    select 1 from public.miembros
    where empresa_id = p_empresa_id and user_id = auth.uid()
  ) then
    raise exception 'No tienes acceso a esta empresa';
  end if;

  -- Upsert with lock: insert if not exists, otherwise increment
  insert into public.contadores (empresa_id, tipo, ejercicio, ultimo_numero)
  values (p_empresa_id, p_tipo, p_ejercicio, 1)
  on conflict (empresa_id, tipo, ejercicio)
  do update set ultimo_numero = public.contadores.ultimo_numero + 1
  returning ultimo_numero into v_numero;

  -- Return formatted number: '2026-0001'
  return p_ejercicio::text || '-' || lpad(v_numero::text, 4, '0');
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Storage Buckets (informational)
-- ---------------------------------------------------------------------------
-- Supabase Storage buckets cannot be created via SQL migrations.
-- Create the following buckets via the Supabase Dashboard or the Management API:
--
--   1. "logos"       - Public bucket for company logos
--   2. "presupuestos" - Private bucket for presupuesto PDFs
--   3. "firmas"      - Private bucket for signature images
--   4. "facturas"    - Private bucket for factura PDFs
--
-- Recommended RLS policies for storage.objects (apply via Dashboard > Storage > Policies):
--
--   SELECT: authenticated users can read files in their empresa's folder
--     bucket_id = '<bucket>' AND (storage.foldername(name))[1] IN (
--       SELECT id::text FROM public.empresas WHERE id IN (SELECT public.mis_empresa_ids())
--     )
--
--   INSERT: same condition as SELECT
--   UPDATE: same condition as SELECT
--   DELETE: same condition as SELECT
--
-- File path convention: {bucket}/{empresa_id}/{filename}
-- Example: presupuestos/abc-123-def/2026-0001.pdf

-- ---------------------------------------------------------------------------
-- Done.
-- ---------------------------------------------------------------------------
