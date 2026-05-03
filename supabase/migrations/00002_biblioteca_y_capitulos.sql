-- =============================================================================
-- Obralia - Sesión 2: Biblioteca de partidas, plantillas en BD, capítulos
-- ADR-002: docs/decisions/ADR-002-biblioteca-y-capitulos.md
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Enum de capítulos del sistema
-- ---------------------------------------------------------------------------
create type capitulo_sistema as enum (
  'demolicion',
  'albanileria',
  'fontaneria',
  'electricidad',
  'pintura',
  'solado_alicatado',
  'carpinteria',
  'pladur_falsos_techos',
  'climatizacion',
  'cubiertas_fachadas',
  'sanitarios_griferia',
  'otros'
);

-- ---------------------------------------------------------------------------
-- 2. Biblioteca de partidas
-- ---------------------------------------------------------------------------
create table public.partidas_biblioteca (
  id            uuid        primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  empresa_id    uuid        references public.empresas(id) on delete cascade, -- NULL = sistema
  origen        text        not null check (origen in ('sistema','empresa')),

  capitulo      capitulo_sistema not null,
  codigo        text,
  descripcion   text        not null,
  unidad        text        not null check (unidad in ('m2','m3','ml','ud','h','kg','pa')),
  precio_unitario_orientativo numeric(12,2) not null check (precio_unitario_orientativo >= 0),
  tipo_iva_sugerido           smallint      not null default 21
                              check (tipo_iva_sugerido in (0,4,10,21)),

  tags          text[]      not null default '{}',
  notas         text,
  activo        boolean     not null default true,

  origen_biblioteca_id uuid  references public.partidas_biblioteca(id) on delete set null,

  constraint origen_coherente check (
    (origen = 'sistema' and empresa_id is null) or
    (origen = 'empresa' and empresa_id is not null)
  )
);

create index idx_partidas_biblioteca_empresa_capitulo
  on public.partidas_biblioteca (empresa_id, capitulo) where activo;

create index idx_partidas_biblioteca_tags
  on public.partidas_biblioteca using gin (tags);

create index idx_partidas_biblioteca_descripcion_fts
  on public.partidas_biblioteca using gin (to_tsvector('simple', descripcion));

create trigger trg_partidas_biblioteca_updated_at
  before update on public.partidas_biblioteca
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Plantillas (catálogo)
-- ---------------------------------------------------------------------------
create table public.plantillas_obra (
  id            uuid        primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  empresa_id    uuid        references public.empresas(id) on delete cascade, -- NULL = sistema
  origen        text        not null check (origen in ('sistema','empresa')),

  slug          text        not null,
  nombre        text        not null,
  descripcion   text,
  icono         text,                                       -- emoji o nombre lucide
  tipo_iva_default smallint not null default 10
                   check (tipo_iva_default in (0,4,10,21)),
  titulo_sugerido text,
  orden         smallint    not null default 100,
  activa        boolean     not null default true,

  constraint origen_coherente_plantilla check (
    (origen = 'sistema' and empresa_id is null) or
    (origen = 'empresa' and empresa_id is not null)
  )
);

-- Slug único por empresa (con NULL → sistema "compartido")
create unique index idx_plantillas_obra_slug_empresa
  on public.plantillas_obra (
    coalesce(empresa_id, '00000000-0000-0000-0000-000000000000'::uuid),
    slug
  );

create trigger trg_plantillas_obra_updated_at
  before update on public.plantillas_obra
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Capítulos de plantilla (estructura de la plantilla)
-- ---------------------------------------------------------------------------
create table public.plantilla_capitulos (
  id            uuid        primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  plantilla_id  uuid        not null references public.plantillas_obra(id) on delete cascade,
  orden         smallint    not null,
  nombre        text        not null,
  capitulo_sistema capitulo_sistema
);

create index idx_plantilla_capitulos_plantilla
  on public.plantilla_capitulos (plantilla_id, orden);

-- ---------------------------------------------------------------------------
-- 5. Partidas de plantilla (snapshot, sin FK fuerte a biblioteca)
-- ---------------------------------------------------------------------------
create table public.plantilla_partidas (
  id            uuid        primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  plantilla_id  uuid        not null references public.plantillas_obra(id) on delete cascade,
  plantilla_capitulo_id uuid references public.plantilla_capitulos(id) on delete cascade,
  partida_biblioteca_id uuid references public.partidas_biblioteca(id) on delete set null,

  orden         smallint    not null,
  descripcion   text        not null,
  unidad        text        not null check (unidad in ('m2','m3','ml','ud','h','kg','pa')),
  precio_unitario_orientativo numeric(12,2) not null check (precio_unitario_orientativo >= 0),
  cantidad_sugerida           numeric(12,3) not null default 1
                              check (cantidad_sugerida > 0),
  tipo_iva_sugerido           smallint      not null default 21
                              check (tipo_iva_sugerido in (0,4,10,21))
);

create index idx_plantilla_partidas_plantilla
  on public.plantilla_partidas (plantilla_id, plantilla_capitulo_id, orden);

-- ---------------------------------------------------------------------------
-- 6. Extender presupuesto_capitulos y presupuesto_partidas
-- ---------------------------------------------------------------------------
alter table public.presupuesto_capitulos
  add column if not exists capitulo_sistema capitulo_sistema;

alter table public.presupuesto_partidas
  add column if not exists partida_biblioteca_id uuid
    references public.partidas_biblioteca(id) on delete set null,
  add column if not exists capitulo_sistema capitulo_sistema;

create index if not exists idx_presupuesto_partidas_capitulo_orden
  on public.presupuesto_partidas (presupuesto_id, capitulo_id, orden);

-- ---------------------------------------------------------------------------
-- 7. Migración legacy: presupuestos existentes con partidas sin capítulo
-- ---------------------------------------------------------------------------
do $$
declare v_pres record;
        v_capitulo_id uuid;
begin
  for v_pres in
    select distinct p.id as presupuesto_id, p.empresa_id
    from public.presupuestos p
    join public.presupuesto_partidas pp on pp.presupuesto_id = p.id
    where pp.capitulo_id is null
  loop
    insert into public.presupuesto_capitulos (presupuesto_id, orden, nombre)
    values (v_pres.presupuesto_id, 1, 'General')
    returning id into v_capitulo_id;

    update public.presupuesto_partidas
    set capitulo_id = v_capitulo_id
    where presupuesto_id = v_pres.presupuesto_id
      and capitulo_id is null;
  end loop;
end$$;

-- ---------------------------------------------------------------------------
-- 8. RLS para tablas nuevas
-- ---------------------------------------------------------------------------
alter table public.partidas_biblioteca enable row level security;
alter table public.plantillas_obra      enable row level security;
alter table public.plantilla_capitulos  enable row level security;
alter table public.plantilla_partidas   enable row level security;

-- partidas_biblioteca: SELECT sistema (empresa_id NULL) OR mías
create policy "partidas_biblioteca_select"
on public.partidas_biblioteca for select
using (
  empresa_id is null
  or empresa_id = any(public.mis_empresa_ids())
);

-- partidas_biblioteca: INSERT/UPDATE/DELETE solo sobre mías + origen='empresa'
create policy "partidas_biblioteca_insert_propias"
on public.partidas_biblioteca for insert
with check (
  origen = 'empresa'
  and empresa_id = any(public.mis_empresa_ids())
);

create policy "partidas_biblioteca_update_propias"
on public.partidas_biblioteca for update
using (
  origen = 'empresa'
  and empresa_id = any(public.mis_empresa_ids())
)
with check (
  origen = 'empresa'
  and empresa_id = any(public.mis_empresa_ids())
);

create policy "partidas_biblioteca_delete_propias"
on public.partidas_biblioteca for delete
using (
  origen = 'empresa'
  and empresa_id = any(public.mis_empresa_ids())
);

-- plantillas_obra: SELECT sistema OR mías
create policy "plantillas_obra_select"
on public.plantillas_obra for select
using (
  empresa_id is null
  or empresa_id = any(public.mis_empresa_ids())
);

create policy "plantillas_obra_insert_propias"
on public.plantillas_obra for insert
with check (
  origen = 'empresa'
  and empresa_id = any(public.mis_empresa_ids())
);

create policy "plantillas_obra_update_propias"
on public.plantillas_obra for update
using (
  origen = 'empresa'
  and empresa_id = any(public.mis_empresa_ids())
)
with check (
  origen = 'empresa'
  and empresa_id = any(public.mis_empresa_ids())
);

create policy "plantillas_obra_delete_propias"
on public.plantillas_obra for delete
using (
  origen = 'empresa'
  and empresa_id = any(public.mis_empresa_ids())
);

-- plantilla_capitulos: hereda permisos a través de plantilla_id
create policy "plantilla_capitulos_select"
on public.plantilla_capitulos for select
using (
  exists (
    select 1 from public.plantillas_obra pl
    where pl.id = plantilla_capitulos.plantilla_id
      and (pl.empresa_id is null or pl.empresa_id = any(public.mis_empresa_ids()))
  )
);

create policy "plantilla_capitulos_modify"
on public.plantilla_capitulos for all
using (
  exists (
    select 1 from public.plantillas_obra pl
    where pl.id = plantilla_capitulos.plantilla_id
      and pl.origen = 'empresa'
      and pl.empresa_id = any(public.mis_empresa_ids())
  )
)
with check (
  exists (
    select 1 from public.plantillas_obra pl
    where pl.id = plantilla_capitulos.plantilla_id
      and pl.origen = 'empresa'
      and pl.empresa_id = any(public.mis_empresa_ids())
  )
);

-- plantilla_partidas: hereda permisos a través de plantilla_id
create policy "plantilla_partidas_select"
on public.plantilla_partidas for select
using (
  exists (
    select 1 from public.plantillas_obra pl
    where pl.id = plantilla_partidas.plantilla_id
      and (pl.empresa_id is null or pl.empresa_id = any(public.mis_empresa_ids()))
  )
);

create policy "plantilla_partidas_modify"
on public.plantilla_partidas for all
using (
  exists (
    select 1 from public.plantillas_obra pl
    where pl.id = plantilla_partidas.plantilla_id
      and pl.origen = 'empresa'
      and pl.empresa_id = any(public.mis_empresa_ids())
  )
)
with check (
  exists (
    select 1 from public.plantillas_obra pl
    where pl.id = plantilla_partidas.plantilla_id
      and pl.origen = 'empresa'
      and pl.empresa_id = any(public.mis_empresa_ids())
  )
);

-- ---------------------------------------------------------------------------
-- 9. RPC: duplicar partida del sistema a la empresa ("hacer mía")
-- ---------------------------------------------------------------------------
create or replace function public.duplicar_partida_a_empresa(
  p_partida_id uuid,
  p_empresa_id uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_nueva_id uuid;
begin
  -- Verificar membresía
  if not exists (
    select 1 from public.miembros
    where empresa_id = p_empresa_id and user_id = auth.uid()
  ) then
    raise exception 'No autorizado: no perteneces a esta empresa';
  end if;

  -- Insertar copia con origen='empresa', preservando linaje en origen_biblioteca_id
  insert into public.partidas_biblioteca (
    empresa_id, origen, capitulo, codigo, descripcion, unidad,
    precio_unitario_orientativo, tipo_iva_sugerido, tags, notas,
    origen_biblioteca_id
  )
  select
    p_empresa_id,
    'empresa',
    capitulo,
    codigo,
    descripcion,
    unidad,
    precio_unitario_orientativo,
    tipo_iva_sugerido,
    tags,
    notas,
    id
  from public.partidas_biblioteca
  where id = p_partida_id
    and (empresa_id is null or empresa_id = p_empresa_id)
  returning id into v_nueva_id;

  if v_nueva_id is null then
    raise exception 'Partida no encontrada o sin acceso';
  end if;

  return v_nueva_id;
end;
$$;

grant execute on function public.duplicar_partida_a_empresa(uuid, uuid) to authenticated;
