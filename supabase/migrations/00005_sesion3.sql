-- =============================================================================
-- Obralia - Sesión 3
--   - Búsqueda en biblioteca insensible a acentos (unaccent)
--   - Firma del cliente sobre presupuesto (columnas adicionales)
--   - Estructura de factura emitida con capítulos / partidas (espejo presupuesto)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. unaccent + reindex de la biblioteca
-- ---------------------------------------------------------------------------
create extension if not exists unaccent;

-- Wrapper inmutable para que el índice sea estable.
-- (la función unaccent() de la extensión es STABLE, no IMMUTABLE).
create or replace function public.unaccent_immutable(text)
returns text
language sql
immutable
parallel safe
strict
set search_path = public, pg_catalog
as $$
  select public.unaccent('public.unaccent', $1)
$$;

create extension if not exists pg_trgm;

drop index if exists public.idx_partidas_biblioteca_descripcion_fts;

-- Columna generada con la descripción normalizada (lowercase, sin acentos).
-- Permite que PostgREST haga `descripcion_norm.ilike.%termino%` desde el
-- cliente sin pasar por una RPC, manteniendo búsqueda insensible a acentos.
alter table public.partidas_biblioteca
  add column if not exists descripcion_norm text
  generated always as (lower(public.unaccent_immutable(descripcion))) stored;

create index if not exists idx_partidas_biblioteca_descripcion_norm
  on public.partidas_biblioteca
  using gin (descripcion_norm gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- 2. Firma del cliente sobre presupuesto
--    presupuestos.firma_url ya existe (00001). Añadimos quién firmó y cuándo,
--    y el estado se actualiza a 'aceptado' al firmar.
-- ---------------------------------------------------------------------------
alter table public.presupuestos
  add column if not exists firma_cliente_nombre text,
  add column if not exists firma_cliente_at     timestamptz;

-- ---------------------------------------------------------------------------
-- 3. Facturas emitidas (con capítulos y partidas espejo de presupuesto)
--    presupuestos --(convertir)--> facturas, manteniendo el formato.
--    La tabla `facturas` ya existe (00001) con cabecera. Añadimos columnas
--    descriptivas y creamos las tablas de detalle.
-- ---------------------------------------------------------------------------
alter table public.facturas
  add column if not exists titulo               text,
  add column if not exists direccion_obra       text,
  add column if not exists tipo_iva_default     integer default 21
    check (tipo_iva_default in (0, 4, 10, 21)),
  add column if not exists motivo_iva_reducido  text,
  add column if not exists notas_cliente        text,
  add column if not exists notas_internas       text,
  add column if not exists forma_pago           text;

-- Detalle: capítulos y partidas idénticos a presupuesto (snapshot).
create table if not exists public.factura_capitulos (
  id              uuid          primary key default gen_random_uuid(),
  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now(),

  factura_id      uuid          not null references public.facturas(id) on delete cascade,
  orden           integer       not null default 0,
  nombre          text          not null,
  capitulo_sistema capitulo_sistema,
  subtotal        decimal(12,2) default 0
);

create trigger set_factura_capitulos_updated_at
  before update on public.factura_capitulos
  for each row execute function public.set_updated_at();

create index idx_factura_capitulos_factura_id
  on public.factura_capitulos(factura_id);

create table if not exists public.factura_partidas (
  id              uuid          primary key default gen_random_uuid(),
  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now(),

  factura_id      uuid          not null references public.facturas(id) on delete cascade,
  capitulo_id     uuid          references public.factura_capitulos(id) on delete set null,
  partida_biblioteca_id uuid    references public.partidas_biblioteca(id) on delete set null,

  orden           integer       not null default 0,
  descripcion     text          not null,
  unidad          text          not null default 'ud'
    check (unidad in ('m2','m3','ml','ud','h','kg','pa')),

  cantidad          decimal(12,3) not null default 1,
  precio_unitario   decimal(12,2) not null default 0,
  importe           decimal(12,2) generated always as (cantidad * precio_unitario) stored,

  tipo_iva          integer       not null default 21
    check (tipo_iva in (0,4,10,21))
);

create trigger set_factura_partidas_updated_at
  before update on public.factura_partidas
  for each row execute function public.set_updated_at();

create index idx_factura_partidas_factura_id
  on public.factura_partidas(factura_id);
create index idx_factura_partidas_capitulo_id
  on public.factura_partidas(capitulo_id);

-- ---------------------------------------------------------------------------
-- 4. RLS factura_capitulos / factura_partidas
-- ---------------------------------------------------------------------------
alter table public.factura_capitulos enable row level security;
alter table public.factura_partidas  enable row level security;

create policy "factura_capitulos_select" on public.factura_capitulos
  for select using (
    factura_id in (
      select id from public.facturas
      where empresa_id in (select public.mis_empresa_ids())
    )
  );

create policy "factura_capitulos_write" on public.factura_capitulos
  for all using (
    factura_id in (
      select id from public.facturas
      where empresa_id in (select public.mis_empresa_ids())
    )
  ) with check (
    factura_id in (
      select id from public.facturas
      where empresa_id in (select public.mis_empresa_ids())
    )
  );

create policy "factura_partidas_select" on public.factura_partidas
  for select using (
    factura_id in (
      select id from public.facturas
      where empresa_id in (select public.mis_empresa_ids())
    )
  );

create policy "factura_partidas_write" on public.factura_partidas
  for all using (
    factura_id in (
      select id from public.facturas
      where empresa_id in (select public.mis_empresa_ids())
    )
  ) with check (
    factura_id in (
      select id from public.facturas
      where empresa_id in (select public.mis_empresa_ids())
    )
  );
