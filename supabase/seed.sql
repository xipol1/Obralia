-- Seed data for local development
-- Run after migrations: supabase db reset

-- Demo empresa
INSERT INTO public.empresas (
  id, razon_social, nombre_comercial, nif,
  direccion, codigo_postal, municipio, provincia,
  email, telefono, plan, trial_ends_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Reformas López García S.L.',
  'Reformas López',
  'B12345678',
  'Calle Mayor 15, Bajo',
  '28001',
  'Madrid',
  'Madrid',
  'info@reformaslopez.es',
  '+34612345678',
  'trial',
  now() + interval '14 days'
);

-- Demo clientes
INSERT INTO public.clientes (id, empresa_id, tipo, nombre, apellidos, nif, telefono, direccion, codigo_postal, municipio, provincia) VALUES
(
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'particular',
  'María',
  'García Fernández',
  '12345678Z',
  '+34611111111',
  'Calle Gran Vía 42, 3ºB',
  '28013',
  'Madrid',
  'Madrid'
),
(
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000001',
  'particular',
  'Carlos',
  'Martínez Ruiz',
  '87654321X',
  '+34622222222',
  'Avda. de la Constitución 8',
  '41001',
  'Sevilla',
  'Sevilla'
),
(
  '00000000-0000-0000-0000-000000000012',
  '00000000-0000-0000-0000-000000000001',
  'empresa',
  'Comunidad de Propietarios',
  NULL,
  'H28001234',
  '+34633333333',
  'Plaza España 1',
  '28008',
  'Madrid',
  'Madrid'
);

-- Demo presupuesto
INSERT INTO public.presupuestos (
  id, empresa_id, cliente_id, numero,
  fecha_emision, fecha_validez,
  estado, titulo, direccion_obra,
  tipo_iva_default, motivo_iva_reducido,
  base_imponible, cuota_iva, total,
  notas_cliente, exclusiones, forma_pago,
  plazo_ejecucion_dias, garantia_meses
) VALUES (
  '00000000-0000-0000-0000-000000000100',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000010',
  '2026-0001',
  '2026-05-01',
  '2026-06-01',
  'borrador',
  'Reforma integral baño C/ Gran Vía 42',
  'Calle Gran Vía 42, 3ºB, Madrid',
  10,
  'IVA reducido del 10% aplicable a obras de renovación y reparación en vivienda particular que constituye residencia habitual del destinatario, donde el coste de los materiales aportados por el contratista no supera el 40% de la base imponible (Art. 91.Uno.2.10º LIVA).',
  4850.00,
  485.00,
  5335.00,
  'Incluye retirada de escombros y limpieza final.',
  'No incluye permisos municipales ni tasas. No incluye cambio de bajantes comunitarios.',
  '50% al inicio, 50% a la finalización',
  15,
  12
);

-- Partidas del presupuesto demo
INSERT INTO public.presupuesto_partidas (presupuesto_id, orden, descripcion, unidad, cantidad, precio_unitario, tipo_iva) VALUES
('00000000-0000-0000-0000-000000000100', 1, 'Demolición de alicatado y solado existente', 'm2', 12.00, 18.50, 10),
('00000000-0000-0000-0000-000000000100', 2, 'Impermeabilización de plato de ducha con lámina asfáltica', 'm2', 3.50, 45.00, 10),
('00000000-0000-0000-0000-000000000100', 3, 'Alicatado de paredes con azulejo porcelánico 30x60', 'm2', 28.00, 42.00, 10),
('00000000-0000-0000-0000-000000000100', 4, 'Solado de gres antideslizante', 'm2', 6.50, 38.00, 10),
('00000000-0000-0000-0000-000000000100', 5, 'Instalación de plato de ducha y mampara', 'ud', 1.00, 850.00, 10),
('00000000-0000-0000-0000-000000000100', 6, 'Fontanería: cambio de grifería y conexiones', 'pa', 1.00, 420.00, 10),
('00000000-0000-0000-0000-000000000100', 7, 'Electricidad: punto de luz y extractor', 'pa', 1.00, 280.00, 10),
('00000000-0000-0000-0000-000000000100', 8, 'Pintura de techo con pintura antihumedad', 'm2', 6.50, 15.00, 10);

-- Contador
INSERT INTO public.contadores (empresa_id, tipo, ejercicio, ultimo_numero) VALUES
('00000000-0000-0000-0000-000000000001', 'presupuesto', 2026, 1);
