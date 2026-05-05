-- =============================================================================
-- Obralia - Sesión 4: Facturas OCR → Biblioteca
-- Permite subir facturas (PDF/imagen), extraer líneas con IA, e importar
-- materiales/precios a la biblioteca de la empresa.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Tabla principal: factura subida
-- ---------------------------------------------------------------------------
create table public.facturas_subidas (
  id            uuid        primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  empresa_id    uuid        not null references public.empresas(id) on delete cascade,
  subida_por    uuid                 references auth.users(id)       on delete set null,

  -- Storage
  storage_path        text    not null,          -- {empresa_id}/{factura_id}/{filename}
  original_filename   text    not null,
  mime_type           text    not null,
  size_bytes          bigint  not null,

  -- Estado del procesado
  estado        text not null default 'pendiente'
                check (estado in ('pendiente','procesando','procesada','error')),
  error_mensaje text,
  procesada_at  timestamptz,

  -- Datos extraídos (cabecera)
  proveedor_nombre  text,
  proveedor_nif     text,
  numero_factura    text,
  fecha_factura     date,
  total_sin_iva     numeric(12,2),
  total_iva         numeric(12,2),
  total_con_iva     numeric(12,2),
  moneda            text default 'EUR'
);

create index idx_facturas_subidas_empresa_estado
  on public.facturas_subidas (empresa_id, estado, created_at desc);

create trigger trg_facturas_subidas_updated_at
  before update on public.facturas_subidas
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. Líneas extraídas
-- ---------------------------------------------------------------------------
create table public.factura_lineas (
  id            uuid        primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  factura_id    uuid        not null references public.facturas_subidas(id) on delete cascade,
  empresa_id    uuid        not null references public.empresas(id)         on delete cascade,

  orden         smallint    not null default 0,

  -- Datos extraídos
  codigo_articulo text,
  descripcion     text        not null,
  cantidad        numeric(12,3),
  unidad          text,                      -- texto libre del proveedor (ej. "ud", "m2", "saco 25kg")
  precio_unitario numeric(12,4),             -- sin IVA
  importe_linea   numeric(12,2),             -- sin IVA
  tipo_iva        smallint,                  -- 0/4/10/21 si la línea lo desglosa

  -- Vínculo opcional a la biblioteca cuando el usuario "importa" la línea
  partida_biblioteca_id uuid references public.partidas_biblioteca(id) on delete set null,
  importada_at  timestamptz
);

create index idx_factura_lineas_factura
  on public.factura_lineas (factura_id, orden);

create index idx_factura_lineas_empresa
  on public.factura_lineas (empresa_id);

-- ---------------------------------------------------------------------------
-- 3. RLS
-- ---------------------------------------------------------------------------
alter table public.facturas_subidas enable row level security;
alter table public.factura_lineas   enable row level security;

create policy "facturas_subidas_select_own"
on public.facturas_subidas for select
using (empresa_id in (select public.mis_empresa_ids()));

create policy "facturas_subidas_insert_own"
on public.facturas_subidas for insert
with check (empresa_id in (select public.mis_empresa_ids()));

create policy "facturas_subidas_update_own"
on public.facturas_subidas for update
using (empresa_id in (select public.mis_empresa_ids()))
with check (empresa_id in (select public.mis_empresa_ids()));

create policy "facturas_subidas_delete_own"
on public.facturas_subidas for delete
using (empresa_id in (select public.mis_empresa_ids()));

create policy "factura_lineas_select_own"
on public.factura_lineas for select
using (empresa_id in (select public.mis_empresa_ids()));

create policy "factura_lineas_insert_own"
on public.factura_lineas for insert
with check (empresa_id in (select public.mis_empresa_ids()));

create policy "factura_lineas_update_own"
on public.factura_lineas for update
using (empresa_id in (select public.mis_empresa_ids()))
with check (empresa_id in (select public.mis_empresa_ids()));

create policy "factura_lineas_delete_own"
on public.factura_lineas for delete
using (empresa_id in (select public.mis_empresa_ids()));

-- ---------------------------------------------------------------------------
-- 4. Storage bucket privado para facturas
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'facturas',
  'facturas',
  false,
  20971520,                                          -- 20 MB
  array['image/jpeg','image/png','image/webp','application/pdf']
)
on conflict (id) do nothing;

-- Path convention: {empresa_id}/{factura_id}/{filename}
-- El primer segmento del nombre es la empresa: lo usamos en la policy.
create policy "facturas_storage_select_own"
on storage.objects for select to authenticated
using (
  bucket_id = 'facturas'
  and (storage.foldername(name))[1]::uuid in (select public.mis_empresa_ids())
);

create policy "facturas_storage_insert_own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'facturas'
  and (storage.foldername(name))[1]::uuid in (select public.mis_empresa_ids())
);

create policy "facturas_storage_delete_own"
on storage.objects for delete to authenticated
using (
  bucket_id = 'facturas'
  and (storage.foldername(name))[1]::uuid in (select public.mis_empresa_ids())
);

-- ---------------------------------------------------------------------------
-- 5. RPC: importar una línea de factura a la biblioteca
--    Crea (o actualiza si ya existía vínculo) una partida en la biblioteca
--    de la empresa con los datos de la línea. La unidad y el IVA se
--    normalizan/forzan a valores admitidos por partidas_biblioteca.
-- ---------------------------------------------------------------------------
create or replace function public.importar_linea_a_biblioteca(
  p_linea_id      uuid,
  p_capitulo      capitulo_sistema default 'otros',
  p_unidad        text             default null,
  p_tipo_iva      smallint         default null,
  p_descripcion   text             default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_linea       public.factura_lineas%rowtype;
  v_partida_id  uuid;
  v_unidad      text;
  v_iva         smallint;
  v_descripcion text;
  v_precio      numeric(12,2);
begin
  select * into v_linea from public.factura_lineas where id = p_linea_id;
  if v_linea.id is null then
    raise exception 'Línea no encontrada';
  end if;

  if not exists (
    select 1 from public.miembros
    where empresa_id = v_linea.empresa_id and user_id = auth.uid()
  ) then
    raise exception 'No autorizado';
  end if;

  -- Normalizar unidad
  v_unidad := coalesce(p_unidad, v_linea.unidad, 'ud');
  v_unidad := lower(v_unidad);
  if v_unidad not in ('m2','m3','ml','ud','h','kg','pa') then
    v_unidad := 'ud';
  end if;

  -- Normalizar IVA
  v_iva := coalesce(p_tipo_iva, v_linea.tipo_iva, 21);
  if v_iva not in (0,4,10,21) then
    v_iva := 21;
  end if;

  v_descripcion := coalesce(p_descripcion, v_linea.descripcion);
  v_precio := coalesce(v_linea.precio_unitario, 0);

  -- Si la línea ya está importada, actualizamos esa misma partida
  if v_linea.partida_biblioteca_id is not null then
    update public.partidas_biblioteca
    set descripcion = v_descripcion,
        unidad      = v_unidad,
        precio_unitario_orientativo = v_precio,
        tipo_iva_sugerido = v_iva,
        capitulo    = p_capitulo
    where id = v_linea.partida_biblioteca_id
    returning id into v_partida_id;
  else
    insert into public.partidas_biblioteca (
      empresa_id, origen, capitulo, codigo, descripcion, unidad,
      precio_unitario_orientativo, tipo_iva_sugerido, tags, notas
    ) values (
      v_linea.empresa_id,
      'empresa',
      p_capitulo,
      v_linea.codigo_articulo,
      v_descripcion,
      v_unidad,
      v_precio,
      v_iva,
      array['importado-factura'],
      null
    )
    returning id into v_partida_id;

    update public.factura_lineas
    set partida_biblioteca_id = v_partida_id,
        importada_at = now()
    where id = p_linea_id;
  end if;

  return v_partida_id;
end;
$$;

grant execute on function public.importar_linea_a_biblioteca(uuid, capitulo_sistema, text, smallint, text) to authenticated;
