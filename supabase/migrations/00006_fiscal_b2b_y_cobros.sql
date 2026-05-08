-- =============================================================================
-- Obralia - Sprint Fiscal B2B + Ciclo de Cobro
--
-- Cambios:
--   1. clientes: distinción fiscal (particular / autónomo / empresa / comunidad),
--      flags de retención e ISP, datos de comunidad de propietarios.
--   2. empresas: fecha_alta_actividad para calcular retención reducida 7%.
--   3. presupuestos y facturas: retención IRPF, ISP, totales con retención.
--   4. facturas: ciclo de cobro (vencimiento, fecha cobro, importe cobrado),
--      tipo (normal / rectificativa / anticipo / proforma / abono),
--      vínculos a factura rectificada / presupuesto anticipado, serie.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. clientes: tipo fiscal y particularidades
-- ---------------------------------------------------------------------------
-- Mantenemos la columna `tipo` por compatibilidad pero añadimos `tipo_fiscal`
-- con la granularidad real. El cliente determina si la factura lleva retención
-- e ISP, así que esta info vive aquí (no en cada factura).
alter table public.clientes
  add column if not exists tipo_fiscal text not null default 'particular'
    check (tipo_fiscal in ('particular','autonomo','empresa','comunidad','administracion')),
  add column if not exists aplica_retencion_irpf boolean not null default false,
  add column if not exists aplica_isp_construccion boolean not null default false,
  -- Comunidades de propietarios: presidente y administrador no son el "cliente"
  -- pero hay que poder contactarles
  add column if not exists contacto_nombre   text,
  add column if not exists contacto_telefono text,
  add column if not exists contacto_email    text,
  add column if not exists administrador_nombre   text,
  add column if not exists administrador_email    text,
  -- Dirección de facturación distinta de dirección por defecto / dirección de obra
  add column if not exists direccion_facturacion text,
  add column if not exists cp_facturacion        text,
  add column if not exists municipio_facturacion text,
  add column if not exists provincia_facturacion text;

-- Backfill: si ya hay clientes 'empresa' con NIF tipo B/A los marcamos como
-- empresa, los demás 'empresa' como autónomo. No es perfecto pero da un punto
-- de partida razonable; el usuario puede corregir.
update public.clientes
   set tipo_fiscal = case
     when tipo = 'empresa' and nif is not null and substr(upper(nif), 1, 1) in ('A','B','C','D','E','F','G','H','J','N','P','Q','R','S','U','V','W')
       then 'empresa'
     when tipo = 'empresa' then 'autonomo'
     else 'particular'
   end
 where tipo_fiscal = 'particular' and tipo = 'empresa';

-- Por defecto, clientes empresa/autónomo aplican retención.
update public.clientes
   set aplica_retencion_irpf = true
 where tipo_fiscal in ('empresa','autonomo','administracion')
   and aplica_retencion_irpf = false;

-- ---------------------------------------------------------------------------
-- 2. empresas: fecha de alta para retención reducida
-- ---------------------------------------------------------------------------
alter table public.empresas
  add column if not exists fecha_alta_actividad date,
  -- Cache del cálculo: ¿estoy en los 3 primeros años? Útil para mostrar el
  -- porcentaje sugerido sin recalcular en cada factura.
  add column if not exists retencion_reducida_hasta date;

-- ---------------------------------------------------------------------------
-- 3. presupuestos: retención e ISP
-- ---------------------------------------------------------------------------
alter table public.presupuestos
  add column if not exists serie text,
  add column if not exists retencion_pct     numeric(5,2) default 0
    check (retencion_pct >= 0 and retencion_pct <= 100),
  add column if not exists retencion_importe decimal(12,2) default 0,
  add column if not exists inversion_sujeto_pasivo boolean not null default false,
  add column if not exists motivo_isp text,
  -- total a cobrar = base + cuota_iva (si no ISP) - retencion
  add column if not exists total_a_cobrar decimal(12,2) default 0;

-- ---------------------------------------------------------------------------
-- 4. facturas: ciclo de cobro + tipos + ISP + retención
-- ---------------------------------------------------------------------------
alter table public.facturas
  add column if not exists serie text,
  -- Tipo de factura (RD 1619/2012 + uso común)
  add column if not exists tipo_factura text not null default 'normal'
    check (tipo_factura in ('normal','rectificativa','anticipo','proforma','abono')),
  add column if not exists factura_rectificada_id uuid references public.facturas(id) on delete set null,
  add column if not exists motivo_rectificacion text,
  -- Cuando una factura final descuenta anticipos previos, los enlaza
  add column if not exists anticipo_de_presupuesto_id uuid references public.presupuestos(id) on delete set null,

  add column if not exists retencion_pct numeric(5,2) default 0
    check (retencion_pct >= 0 and retencion_pct <= 100),
  add column if not exists retencion_importe decimal(12,2) default 0,
  add column if not exists inversion_sujeto_pasivo boolean not null default false,
  add column if not exists motivo_isp text,
  add column if not exists total_a_cobrar decimal(12,2) default 0,

  -- Ciclo de cobro
  add column if not exists dias_pago integer default 30
    check (dias_pago is null or dias_pago >= 0),
  add column if not exists fecha_vencimiento date,
  add column if not exists importe_cobrado decimal(12,2) not null default 0
    check (importe_cobrado >= 0),
  add column if not exists fecha_cobro date,
  add column if not exists notas_cobro text;

-- Ampliamos el check del estado para soportar el ciclo de cobro real.
alter table public.facturas
  drop constraint if exists facturas_estado_check;
alter table public.facturas
  add constraint facturas_estado_check
  check (estado in ('emitida','pagada','rectificada','parcial','vencida','anulada'));

create index if not exists idx_facturas_fecha_vencimiento
  on public.facturas(fecha_vencimiento) where estado in ('emitida','parcial','vencida');

create index if not exists idx_facturas_factura_rectificada_id
  on public.facturas(factura_rectificada_id);

-- ---------------------------------------------------------------------------
-- 5. Contadores: añadir 'serie' al PK para soportar series múltiples (A/B/...)
-- ---------------------------------------------------------------------------
alter table public.contadores
  add column if not exists serie text not null default '';

-- Recreamos el PK con serie
alter table public.contadores drop constraint contadores_pkey;
alter table public.contadores
  add constraint contadores_pkey primary key (empresa_id, tipo, ejercicio, serie);

-- ---------------------------------------------------------------------------
-- 6. Helper: calcular total_a_cobrar consistentemente
--    (no es trigger porque preferimos cálculo en cliente para feedback inmediato,
--    pero la función está disponible para reportes y reconciliación batch)
-- ---------------------------------------------------------------------------
create or replace function public.calcular_total_a_cobrar(
  p_base_imponible decimal,
  p_cuota_iva decimal,
  p_retencion_importe decimal,
  p_isp boolean
) returns decimal
language sql
immutable
as $$
  select coalesce(p_base_imponible, 0)
       + case when p_isp then 0 else coalesce(p_cuota_iva, 0) end
       - coalesce(p_retencion_importe, 0);
$$;
