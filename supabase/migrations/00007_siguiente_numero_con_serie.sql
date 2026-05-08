-- =============================================================================
-- Obralia - Fix RPC siguiente_numero después de añadir 'serie' al PK de contadores
--
-- Tras 00006 la PK de contadores es (empresa_id, tipo, ejercicio, serie). La RPC
-- original hacía ON CONFLICT (empresa_id, tipo, ejercicio) que ya no es un
-- unique constraint, por lo que la próxima emisión de número fallaría con
-- "no unique or exclusion constraint matching the ON CONFLICT specification".
--
-- Esta migración:
--   1. Reescribe siguiente_numero con un parámetro p_serie opcional (default '').
--   2. Mantiene compatibilidad: el frontend que no pase p_serie usa la serie
--      por defecto ('') y obtiene el comportamiento previo.
--   3. Devuelve el formato '<ejercicio>-<NNNN>' o '<serie>/<ejercicio>-<NNNN>'
--      cuando hay serie, para que el número impreso refleje la serie.
-- =============================================================================

-- Eliminamos firmas antiguas para evitar ambigüedad de overload.
drop function if exists public.siguiente_numero(uuid, text, integer);
drop function if exists public.siguiente_numero(uuid, text, integer, text);

create or replace function public.siguiente_numero(
  p_empresa_id uuid,
  p_tipo       text,
  p_ejercicio  integer,
  p_serie      text default ''
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_numero integer;
  v_serie  text := coalesce(p_serie, '');
begin
  if not exists (
    select 1 from public.miembros
    where empresa_id = p_empresa_id and user_id = auth.uid()
  ) then
    raise exception 'No tienes acceso a esta empresa';
  end if;

  insert into public.contadores (empresa_id, tipo, ejercicio, serie, ultimo_numero)
  values (p_empresa_id, p_tipo, p_ejercicio, v_serie, 1)
  on conflict (empresa_id, tipo, ejercicio, serie)
  do update set ultimo_numero = public.contadores.ultimo_numero + 1
  returning ultimo_numero into v_numero;

  -- Formato: '2026-0001' sin serie, 'A/2026-0001' con serie.
  if v_serie = '' then
    return p_ejercicio::text || '-' || lpad(v_numero::text, 4, '0');
  else
    return v_serie || '/' || p_ejercicio::text || '-' || lpad(v_numero::text, 4, '0');
  end if;
end;
$$;
