-- =============================================================================
-- Seed: Biblioteca y plantillas de sistema (Obralia)
-- =============================================================================
-- Precios orientativos mercado español 2026 para reforma residencial.
-- Cada empresa debe ajustar a sus costes y zona.
--
-- IVA: 10% en obras de reforma de vivienda (Art. 91.Uno.2.10 LIVA cuando se
-- cumplen los requisitos), 21% en suministros sueltos, servicios profesionales
-- independientes, boletines, proyectos y tasas administrativas.
--
-- Estructura del archivo:
--   1) Partidas de biblioteca de sistema (~190 partidas, 12 capítulos)
--   2) Plantillas de obra de sistema (5 plantillas)
--   3) Capítulos de cada plantilla
--   4) Partidas de cada plantilla referenciando la biblioteca
--
-- IDs estables:
--   axxxxxxx-...  partidas_biblioteca
--   bxxxxxxx-...  plantillas_obra
--   cxxxxxxx-...  plantilla_capitulos
-- =============================================================================


-- =============================================================================
-- 1) PARTIDAS DE BIBLIOTECA (origen = 'sistema', empresa_id = NULL)
-- =============================================================================

insert into partidas_biblioteca (id, empresa_id, origen, capitulo, codigo, descripcion, unidad, precio_unitario_orientativo, tipo_iva_sugerido, tags) values

-- -----------------------------------------------------------------------------
-- DEMOLICIÓN (capitulo: demolicion) — 16 partidas
-- -----------------------------------------------------------------------------
('a0000001-0000-0000-0000-000000000001', null, 'sistema', 'demolicion', 'DEM-001', 'Demolición de alicatado y solado en baño', 'pa', 650.00, 10, ARRAY['demoler','tirar','quitar','azulejo','baño']),
('a0000001-0000-0000-0000-000000000002', null, 'sistema', 'demolicion', 'DEM-002', 'Demolición de alicatado, solado y sanitarios existentes', 'pa', 650.00, 10, ARRAY['demoler','baño','sanitarios','azulejo']),
('a0000001-0000-0000-0000-000000000003', null, 'sistema', 'demolicion', 'DEM-003', 'Desmontaje de mobiliario, electrodomésticos y alicatado de cocina', 'pa', 750.00, 10, ARRAY['desmontar','cocina','muebles','quitar']),
('a0000001-0000-0000-0000-000000000004', null, 'sistema', 'demolicion', 'DEM-004', 'Demolición de solado existente con medios manuales', 'm2', 12.00, 10, ARRAY['levantar','suelo','quitar','baldosa']),
('a0000001-0000-0000-0000-000000000005', null, 'sistema', 'demolicion', 'DEM-005', 'Picado de alicatado de paredes', 'm2', 14.00, 10, ARRAY['picar','azulejo','quitar','pared']),
('a0000001-0000-0000-0000-000000000006', null, 'sistema', 'demolicion', 'DEM-006', 'Demolición de tabique de ladrillo hueco', 'm2', 22.00, 10, ARRAY['tirar','tabique','pared','derribo']),
('a0000001-0000-0000-0000-000000000007', null, 'sistema', 'demolicion', 'DEM-007', 'Demolición de tabique de pladur', 'm2', 14.00, 10, ARRAY['tirar','tabique','pladur','derribo']),
('a0000001-0000-0000-0000-000000000008', null, 'sistema', 'demolicion', 'DEM-008', 'Apertura de hueco en tabique para puerta', 'ud', 180.00, 10, ARRAY['abrir','hueco','puerta','tabique']),
('a0000001-0000-0000-0000-000000000009', null, 'sistema', 'demolicion', 'DEM-009', 'Retirada de escombros y transporte a vertedero autorizado', 'pa', 280.00, 10, ARRAY['escombros','retirar','vertedero','contenedor']),
('a0000001-0000-0000-0000-000000000010', null, 'sistema', 'demolicion', 'DEM-010', 'Retirada de escombros y transporte (cocina)', 'pa', 320.00, 10, ARRAY['escombros','cocina','contenedor']),
('a0000001-0000-0000-0000-000000000011', null, 'sistema', 'demolicion', 'DEM-011', 'Saca de escombros con medios manuales hasta contenedor', 'm3', 95.00, 10, ARRAY['escombros','sacar','bajar']),
('a0000001-0000-0000-0000-000000000012', null, 'sistema', 'demolicion', 'DEM-012', 'Alquiler de contenedor de escombros 5 m³', 'ud', 220.00, 10, ARRAY['contenedor','escombros','alquiler']),
('a0000001-0000-0000-0000-000000000013', null, 'sistema', 'demolicion', 'DEM-013', 'Demolición de falso techo de escayola', 'm2', 9.00, 10, ARRAY['tirar','falso techo','escayola','quitar']),
('a0000001-0000-0000-0000-000000000014', null, 'sistema', 'demolicion', 'DEM-014', 'Levantado de carpintería interior (puertas y marcos)', 'ud', 35.00, 10, ARRAY['quitar','puerta','marco','desmontar']),
('a0000001-0000-0000-0000-000000000015', null, 'sistema', 'demolicion', 'DEM-015', 'Levantado de carpintería exterior (ventanas y balconeras)', 'ud', 65.00, 10, ARRAY['quitar','ventana','balconera','desmontar']),
('a0000001-0000-0000-0000-000000000016', null, 'sistema', 'demolicion', 'DEM-016', 'Demolición de bañera y mampara existente', 'ud', 120.00, 10, ARRAY['quitar','bañera','mampara','desmontar']),

-- -----------------------------------------------------------------------------
-- ALBAÑILERÍA (capitulo: albanileria) — 16 partidas
-- -----------------------------------------------------------------------------
('a0000002-0000-0000-0000-000000000001', null, 'sistema', 'albanileria', 'ALB-001', 'Tabique de ladrillo hueco doble, recibido con mortero', 'm2', 38.00, 10, ARRAY['tabique','ladrillo','pared','obra']),
('a0000002-0000-0000-0000-000000000002', null, 'sistema', 'albanileria', 'ALB-002', 'Recrecido de mortero de cemento, espesor 4-5 cm', 'm2', 18.00, 10, ARRAY['recrecido','suelo','mortero']),
('a0000002-0000-0000-0000-000000000003', null, 'sistema', 'albanileria', 'ALB-003', 'Nivelación con mortero autonivelante', 'm2', 18.00, 10, ARRAY['nivelar','suelo','autonivelante']),
('a0000002-0000-0000-0000-000000000004', null, 'sistema', 'albanileria', 'ALB-004', 'Enfoscado maestreado de paredes con mortero de cemento', 'm2', 22.00, 10, ARRAY['enfoscar','revestir','pared','mortero']),
('a0000002-0000-0000-0000-000000000005', null, 'sistema', 'albanileria', 'ALB-005', 'Guarnecido y enlucido de yeso en paredes', 'm2', 16.00, 10, ARRAY['enlucir','yeso','pared']),
('a0000002-0000-0000-0000-000000000006', null, 'sistema', 'albanileria', 'ALB-006', 'Impermeabilización de plato de ducha con lámina asfáltica', 'm2', 45.00, 10, ARRAY['impermeabilizar','ducha','tela asfaltica']),
('a0000002-0000-0000-0000-000000000007', null, 'sistema', 'albanileria', 'ALB-007', 'Impermeabilización de terraza con membrana líquida', 'm2', 28.00, 10, ARRAY['impermeabilizar','terraza','membrana']),
('a0000002-0000-0000-0000-000000000008', null, 'sistema', 'albanileria', 'ALB-008', 'Recibido de premarcos de carpintería', 'ud', 45.00, 10, ARRAY['premarco','recibir','puerta']),
('a0000002-0000-0000-0000-000000000009', null, 'sistema', 'albanileria', 'ALB-009', 'Ayudas de albañilería a instalación de fontanería', 'pa', 280.00, 10, ARRAY['ayudas','rozas','fontaneria']),
('a0000002-0000-0000-0000-000000000010', null, 'sistema', 'albanileria', 'ALB-010', 'Ayudas de albañilería a instalación eléctrica', 'pa', 320.00, 10, ARRAY['ayudas','rozas','electricidad']),
('a0000002-0000-0000-0000-000000000011', null, 'sistema', 'albanileria', 'ALB-011', 'Cajeado y rozas para instalaciones', 'ml', 8.50, 10, ARRAY['rozas','cajear','pared']),
('a0000002-0000-0000-0000-000000000012', null, 'sistema', 'albanileria', 'ALB-012', 'Tapado de rozas con mortero', 'ml', 5.50, 10, ARRAY['tapar','rozas','mortero']),
('a0000002-0000-0000-0000-000000000013', null, 'sistema', 'albanileria', 'ALB-013', 'Formación de pendientes en plato de ducha de obra', 'ud', 220.00, 10, ARRAY['ducha','pendiente','obra']),
('a0000002-0000-0000-0000-000000000014', null, 'sistema', 'albanileria', 'ALB-014', 'Recibido de tapa de registro', 'ud', 45.00, 10, ARRAY['registro','tapa','recibir']),
('a0000002-0000-0000-0000-000000000015', null, 'sistema', 'albanileria', 'ALB-015', 'Mano de obra de oficial 1ª albañil', 'h', 28.00, 10, ARRAY['oficial','mano de obra','hora']),
('a0000002-0000-0000-0000-000000000016', null, 'sistema', 'albanileria', 'ALB-016', 'Mano de obra de peón albañil', 'h', 22.00, 10, ARRAY['peon','mano de obra','hora']),

-- -----------------------------------------------------------------------------
-- FONTANERÍA (capitulo: fontaneria) — 16 partidas
-- -----------------------------------------------------------------------------
('a0000003-0000-0000-0000-000000000001', null, 'sistema', 'fontaneria', 'FON-001', 'Fontanería: distribución agua fría/caliente y desagües en baño', 'pa', 850.00, 10, ARRAY['fontaneria','agua','desague','baño']),
('a0000003-0000-0000-0000-000000000002', null, 'sistema', 'fontaneria', 'FON-002', 'Fontanería: tomas agua y desagüe fregadero/lavavajillas', 'pa', 480.00, 10, ARRAY['fontaneria','cocina','fregadero','lavavajillas']),
('a0000003-0000-0000-0000-000000000003', null, 'sistema', 'fontaneria', 'FON-003', 'Instalación de tubería multicapa para agua fría/caliente', 'ml', 14.00, 10, ARRAY['tuberia','multicapa','agua']),
('a0000003-0000-0000-0000-000000000004', null, 'sistema', 'fontaneria', 'FON-004', 'Instalación de tubería de PVC para desagües', 'ml', 12.00, 10, ARRAY['desague','pvc','tuberia']),
('a0000003-0000-0000-0000-000000000005', null, 'sistema', 'fontaneria', 'FON-005', 'Sustitución de llave de paso general', 'ud', 85.00, 10, ARRAY['llave','paso','agua']),
('a0000003-0000-0000-0000-000000000006', null, 'sistema', 'fontaneria', 'FON-006', 'Instalación de llave de corte por aparato', 'ud', 35.00, 10, ARRAY['llave','corte','aparato']),
('a0000003-0000-0000-0000-000000000007', null, 'sistema', 'fontaneria', 'FON-007', 'Punto de toma de agua para lavadora', 'ud', 95.00, 10, ARRAY['lavadora','toma','agua']),
('a0000003-0000-0000-0000-000000000008', null, 'sistema', 'fontaneria', 'FON-008', 'Punto de desagüe para electrodoméstico', 'ud', 75.00, 10, ARRAY['desague','electrodomestico']),
('a0000003-0000-0000-0000-000000000009', null, 'sistema', 'fontaneria', 'FON-009', 'Instalación de termo eléctrico 80L incluido conexionado', 'ud', 420.00, 10, ARRAY['termo','agua caliente','calentador']),
('a0000003-0000-0000-0000-000000000010', null, 'sistema', 'fontaneria', 'FON-010', 'Instalación de caldera mural de gas (sin aparato)', 'ud', 380.00, 10, ARRAY['caldera','gas','instalar']),
('a0000003-0000-0000-0000-000000000011', null, 'sistema', 'fontaneria', 'FON-011', 'Sustitución de bajante de PVC', 'ml', 38.00, 10, ARRAY['bajante','pvc','desague']),
('a0000003-0000-0000-0000-000000000012', null, 'sistema', 'fontaneria', 'FON-012', 'Conexión de toma de gas a cocina', 'ud', 120.00, 10, ARRAY['gas','cocina','conexion']),
('a0000003-0000-0000-0000-000000000013', null, 'sistema', 'fontaneria', 'FON-013', 'Reparación de fuga puntual', 'pa', 180.00, 10, ARRAY['fuga','reparar','agua']),
('a0000003-0000-0000-0000-000000000014', null, 'sistema', 'fontaneria', 'FON-014', 'Mano de obra fontanero oficial 1ª', 'h', 32.00, 10, ARRAY['fontanero','oficial','hora']),
('a0000003-0000-0000-0000-000000000015', null, 'sistema', 'fontaneria', 'FON-015', 'Boletín de gas y tramitación', 'pa', 220.00, 21, ARRAY['boletin','gas','certificado']),
('a0000003-0000-0000-0000-000000000016', null, 'sistema', 'fontaneria', 'FON-016', 'Sustitución de grupo de presión doméstico', 'ud', 480.00, 10, ARRAY['grupo presion','agua','bomba']),

-- -----------------------------------------------------------------------------
-- ELECTRICIDAD (capitulo: electricidad) — 18 partidas
-- -----------------------------------------------------------------------------
('a0000004-0000-0000-0000-000000000001', null, 'sistema', 'electricidad', 'ELE-001', 'Electricidad: punto luz, espejo y enchufes en baño', 'pa', 320.00, 10, ARRAY['electricidad','baño','enchufe','luz']),
('a0000004-0000-0000-0000-000000000002', null, 'sistema', 'electricidad', 'ELE-002', 'Electricidad: circuito independiente para horno y vitro, puntos de luz', 'pa', 620.00, 10, ARRAY['electricidad','cocina','horno','circuito']),
('a0000004-0000-0000-0000-000000000003', null, 'sistema', 'electricidad', 'ELE-003', 'Sustitución de cuadro eléctrico con magnetotérmicos y diferencial', 'ud', 480.00, 10, ARRAY['cuadro','magnetotermico','diferencial']),
('a0000004-0000-0000-0000-000000000004', null, 'sistema', 'electricidad', 'ELE-004', 'Sustitución de cableado en circuitos principales', 'ml', 6.50, 10, ARRAY['cable','sustituir','circuito']),
('a0000004-0000-0000-0000-000000000005', null, 'sistema', 'electricidad', 'ELE-005', 'Instalación de toma de corriente schuko', 'ud', 28.00, 10, ARRAY['enchufe','schuko','toma']),
('a0000004-0000-0000-0000-000000000006', null, 'sistema', 'electricidad', 'ELE-006', 'Instalación de punto de luz con interruptor', 'ud', 35.00, 10, ARRAY['luz','interruptor','punto']),
('a0000004-0000-0000-0000-000000000007', null, 'sistema', 'electricidad', 'ELE-007', 'Instalación de punto de luz conmutado', 'ud', 48.00, 10, ARRAY['luz','conmutado','interruptor']),
('a0000004-0000-0000-0000-000000000008', null, 'sistema', 'electricidad', 'ELE-008', 'Instalación de toma TV y datos', 'ud', 42.00, 10, ARRAY['tv','datos','rj45','antena']),
('a0000004-0000-0000-0000-000000000009', null, 'sistema', 'electricidad', 'ELE-009', 'Instalación de punto de luz para downlight LED', 'ud', 38.00, 10, ARRAY['downlight','led','foco','luz']),
('a0000004-0000-0000-0000-000000000010', null, 'sistema', 'electricidad', 'ELE-010', 'Suministro e instalación de downlight LED empotrable', 'ud', 28.00, 10, ARRAY['downlight','led','foco']),
('a0000004-0000-0000-0000-000000000011', null, 'sistema', 'electricidad', 'ELE-011', 'Instalación de aplique de pared', 'ud', 45.00, 10, ARRAY['aplique','luz','pared']),
('a0000004-0000-0000-0000-000000000012', null, 'sistema', 'electricidad', 'ELE-012', 'Instalación de timbre con pulsador', 'ud', 65.00, 10, ARRAY['timbre','pulsador']),
('a0000004-0000-0000-0000-000000000013', null, 'sistema', 'electricidad', 'ELE-013', 'Instalación de videoportero', 'ud', 280.00, 10, ARRAY['videoportero','portero','telefonillo']),
('a0000004-0000-0000-0000-000000000014', null, 'sistema', 'electricidad', 'ELE-014', 'Línea independiente para aire acondicionado', 'ud', 145.00, 10, ARRAY['aire acondicionado','linea','circuito']),
('a0000004-0000-0000-0000-000000000015', null, 'sistema', 'electricidad', 'ELE-015', 'Boletín eléctrico (CIE) y tramitación', 'pa', 180.00, 21, ARRAY['boletin','cie','certificado']),
('a0000004-0000-0000-0000-000000000016', null, 'sistema', 'electricidad', 'ELE-016', 'Mano de obra electricista oficial 1ª', 'h', 32.00, 10, ARRAY['electricista','oficial','hora']),
('a0000004-0000-0000-0000-000000000017', null, 'sistema', 'electricidad', 'ELE-017', 'Sustitución de mecanismo (interruptor, enchufe)', 'ud', 22.00, 10, ARRAY['mecanismo','sustituir','interruptor']),
('a0000004-0000-0000-0000-000000000018', null, 'sistema', 'electricidad', 'ELE-018', 'Instalación de detector de humo', 'ud', 65.00, 10, ARRAY['detector','humo','seguridad']),

-- -----------------------------------------------------------------------------
-- PINTURA (capitulo: pintura) — 14 partidas
-- -----------------------------------------------------------------------------
('a0000005-0000-0000-0000-000000000001', null, 'sistema', 'pintura', 'PIN-001', 'Protección de suelos, mobiliario y carpinterías', 'pa', 180.00, 10, ARRAY['proteger','plastico','obra']),
('a0000005-0000-0000-0000-000000000002', null, 'sistema', 'pintura', 'PIN-002', 'Lijado, masillado y reparación de imperfecciones en paredes', 'm2', 4.50, 10, ARRAY['lijar','masillar','preparar']),
('a0000005-0000-0000-0000-000000000003', null, 'sistema', 'pintura', 'PIN-003', 'Imprimación selladora en paredes y techos', 'm2', 3.00, 10, ARRAY['imprimacion','sellar','fijador']),
('a0000005-0000-0000-0000-000000000004', null, 'sistema', 'pintura', 'PIN-004', 'Aplicación de dos manos de pintura plástica mate lavable en paredes', 'm2', 8.50, 10, ARRAY['pintar','plastica','lavable','pared']),
('a0000005-0000-0000-0000-000000000005', null, 'sistema', 'pintura', 'PIN-005', 'Aplicación de dos manos de pintura plástica blanca en techos', 'm2', 9.00, 10, ARRAY['pintar','techo','blanco']),
('a0000005-0000-0000-0000-000000000006', null, 'sistema', 'pintura', 'PIN-006', 'Pintura plástica lavable de techo y paredes (cocina)', 'm2', 12.00, 10, ARRAY['pintar','cocina','lavable']),
('a0000005-0000-0000-0000-000000000007', null, 'sistema', 'pintura', 'PIN-007', 'Pintura de techo plástica antihumedad', 'm2', 15.00, 10, ARRAY['pintar','antihumedad','baño']),
('a0000005-0000-0000-0000-000000000008', null, 'sistema', 'pintura', 'PIN-008', 'Esmalte sintético en carpintería metálica o de madera', 'm2', 18.00, 10, ARRAY['esmalte','sintetico','metal','puerta']),
('a0000005-0000-0000-0000-000000000009', null, 'sistema', 'pintura', 'PIN-009', 'Pintura plástica con color y entonado', 'm2', 11.00, 10, ARRAY['pintar','color','entonado']),
('a0000005-0000-0000-0000-000000000010', null, 'sistema', 'pintura', 'PIN-010', 'Estuco veneciano o efecto decorativo', 'm2', 38.00, 10, ARRAY['estuco','decorativo','veneciano']),
('a0000005-0000-0000-0000-000000000011', null, 'sistema', 'pintura', 'PIN-011', 'Pintura de fachada con revestimiento elastomérico', 'm2', 22.00, 10, ARRAY['fachada','elastomerico','exterior']),
('a0000005-0000-0000-0000-000000000012', null, 'sistema', 'pintura', 'PIN-012', 'Limpieza final y retirada de protecciones', 'pa', 220.00, 10, ARRAY['limpieza','final','retirada']),
('a0000005-0000-0000-0000-000000000013', null, 'sistema', 'pintura', 'PIN-013', 'Pintura de radiadores con esmalte específico', 'ud', 45.00, 10, ARRAY['radiador','esmalte','pintar']),
('a0000005-0000-0000-0000-000000000014', null, 'sistema', 'pintura', 'PIN-014', 'Mano de obra pintor oficial 1ª', 'h', 26.00, 10, ARRAY['pintor','oficial','hora']),

-- -----------------------------------------------------------------------------
-- SOLADO Y ALICATADO (capitulo: solado_alicatado) — 18 partidas
-- -----------------------------------------------------------------------------
('a0000006-0000-0000-0000-000000000001', null, 'sistema', 'solado_alicatado', 'SOL-001', 'Alicatado de paredes con porcelánico 30x60', 'm2', 42.00, 10, ARRAY['alicatar','porcelanico','azulejo','pared']),
('a0000006-0000-0000-0000-000000000002', null, 'sistema', 'solado_alicatado', 'SOL-002', 'Alicatado de frente de encimera con porcelánico', 'm2', 42.00, 10, ARRAY['alicatar','cocina','frontal','encimera']),
('a0000006-0000-0000-0000-000000000003', null, 'sistema', 'solado_alicatado', 'SOL-003', 'Solado de gres antideslizante (baño)', 'm2', 38.00, 10, ARRAY['gres','antideslizante','suelo','baño']),
('a0000006-0000-0000-0000-000000000004', null, 'sistema', 'solado_alicatado', 'SOL-004', 'Suministro e instalación de gres porcelánico 60x60 rectificado', 'm2', 45.00, 10, ARRAY['gres','porcelanico','rectificado','suelo']),
('a0000006-0000-0000-0000-000000000005', null, 'sistema', 'solado_alicatado', 'SOL-005', 'Solado vinílico de alta resistencia', 'm2', 35.00, 10, ARRAY['vinilico','suelo','cocina']),
('a0000006-0000-0000-0000-000000000006', null, 'sistema', 'solado_alicatado', 'SOL-006', 'Tarima flotante laminada AC4', 'm2', 32.00, 10, ARRAY['tarima','flotante','laminado','suelo']),
('a0000006-0000-0000-0000-000000000007', null, 'sistema', 'solado_alicatado', 'SOL-007', 'Tarima de madera maciza encolada', 'm2', 78.00, 10, ARRAY['tarima','madera','maciza']),
('a0000006-0000-0000-0000-000000000008', null, 'sistema', 'solado_alicatado', 'SOL-008', 'Rodapié de gres a juego, altura 8 cm', 'ml', 12.00, 10, ARRAY['rodapie','gres','remate']),
('a0000006-0000-0000-0000-000000000009', null, 'sistema', 'solado_alicatado', 'SOL-009', 'Rodapié de DM lacado, altura 8 cm', 'ml', 10.00, 10, ARRAY['rodapie','dm','lacado']),
('a0000006-0000-0000-0000-000000000010', null, 'sistema', 'solado_alicatado', 'SOL-010', 'Sellado de juntas con material epoxi', 'm2', 6.00, 10, ARRAY['junta','epoxi','sellar']),
('a0000006-0000-0000-0000-000000000011', null, 'sistema', 'solado_alicatado', 'SOL-011', 'Sellado perimetral con silicona sanitaria', 'ml', 5.50, 10, ARRAY['silicona','sellar','sanitaria']),
('a0000006-0000-0000-0000-000000000012', null, 'sistema', 'solado_alicatado', 'SOL-012', 'Cenefa decorativa cerámica', 'ml', 18.00, 10, ARRAY['cenefa','decorativa','azulejo']),
('a0000006-0000-0000-0000-000000000013', null, 'sistema', 'solado_alicatado', 'SOL-013', 'Solado de gres rústico exterior antideslizante', 'm2', 52.00, 10, ARRAY['gres','exterior','terraza','rustico']),
('a0000006-0000-0000-0000-000000000014', null, 'sistema', 'solado_alicatado', 'SOL-014', 'Suministro e instalación de plaqueta de barro cocido', 'm2', 48.00, 10, ARRAY['plaqueta','barro','rustico']),
('a0000006-0000-0000-0000-000000000015', null, 'sistema', 'solado_alicatado', 'SOL-015', 'Solado microcemento aplicado in situ', 'm2', 85.00, 10, ARRAY['microcemento','suelo','continuo']),
('a0000006-0000-0000-0000-000000000016', null, 'sistema', 'solado_alicatado', 'SOL-016', 'Peldaños de gres rectificado', 'ml', 38.00, 10, ARRAY['peldaño','escalera','gres']),
('a0000006-0000-0000-0000-000000000017', null, 'sistema', 'solado_alicatado', 'SOL-017', 'Mano de obra alicatador oficial 1ª', 'h', 28.00, 10, ARRAY['alicatador','oficial','hora']),
('a0000006-0000-0000-0000-000000000018', null, 'sistema', 'solado_alicatado', 'SOL-018', 'Pulido y abrillantado de terrazo existente', 'm2', 14.00, 10, ARRAY['pulir','terrazo','abrillantar']),

-- -----------------------------------------------------------------------------
-- CARPINTERÍA (capitulo: carpinteria) — 14 partidas
-- -----------------------------------------------------------------------------
('a0000007-0000-0000-0000-000000000001', null, 'sistema', 'carpinteria', 'CAR-001', 'Suministro e instalación de puerta de paso lacada blanca', 'ud', 320.00, 10, ARRAY['puerta','paso','lacada','interior']),
('a0000007-0000-0000-0000-000000000002', null, 'sistema', 'carpinteria', 'CAR-002', 'Suministro e instalación de puerta corredera empotrada', 'ud', 580.00, 10, ARRAY['puerta','corredera','empotrar']),
('a0000007-0000-0000-0000-000000000003', null, 'sistema', 'carpinteria', 'CAR-003', 'Puerta blindada de entrada a vivienda', 'ud', 1100.00, 10, ARRAY['puerta','blindada','seguridad','entrada']),
('a0000007-0000-0000-0000-000000000004', null, 'sistema', 'carpinteria', 'CAR-004', 'Ventana de PVC con doble acristalamiento', 'm2', 320.00, 10, ARRAY['ventana','pvc','climalit']),
('a0000007-0000-0000-0000-000000000005', null, 'sistema', 'carpinteria', 'CAR-005', 'Ventana de aluminio con rotura puente térmico', 'm2', 380.00, 10, ARRAY['ventana','aluminio','rpt']),
('a0000007-0000-0000-0000-000000000006', null, 'sistema', 'carpinteria', 'CAR-006', 'Frente de armario empotrado con puertas correderas', 'ml', 480.00, 10, ARRAY['armario','frente','corredera']),
('a0000007-0000-0000-0000-000000000007', null, 'sistema', 'carpinteria', 'CAR-007', 'Interior de armario con baldas y barras', 'ml', 220.00, 10, ARRAY['armario','interior','baldas']),
('a0000007-0000-0000-0000-000000000008', null, 'sistema', 'carpinteria', 'CAR-008', 'Suministro e instalación de muebles de cocina (alto y bajo)', 'ml', 480.00, 10, ARRAY['cocina','muebles','alto','bajo']),
('a0000007-0000-0000-0000-000000000009', null, 'sistema', 'carpinteria', 'CAR-009', 'Encimera de cuarzo compacto, espesor 20mm', 'ml', 280.00, 10, ARRAY['encimera','cuarzo','silestone']),
('a0000007-0000-0000-0000-000000000010', null, 'sistema', 'carpinteria', 'CAR-010', 'Encimera laminada postformada', 'ml', 95.00, 10, ARRAY['encimera','laminada','formica']),
('a0000007-0000-0000-0000-000000000011', null, 'sistema', 'carpinteria', 'CAR-011', 'Mueble de baño suspendido con lavabo', 'ud', 480.00, 10, ARRAY['mueble','baño','lavabo','suspendido']),
('a0000007-0000-0000-0000-000000000012', null, 'sistema', 'carpinteria', 'CAR-012', 'Persiana enrollable de aluminio motorizada', 'm2', 180.00, 10, ARRAY['persiana','motorizada','aluminio']),
('a0000007-0000-0000-0000-000000000013', null, 'sistema', 'carpinteria', 'CAR-013', 'Tapajuntas y precercos de DM lacado', 'ml', 14.00, 10, ARRAY['tapajuntas','precerco','remate']),
('a0000007-0000-0000-0000-000000000014', null, 'sistema', 'carpinteria', 'CAR-014', 'Mano de obra carpintero oficial 1ª', 'h', 30.00, 10, ARRAY['carpintero','oficial','hora']),

-- -----------------------------------------------------------------------------
-- PLADUR Y FALSOS TECHOS (capitulo: pladur_falsos_techos) — 12 partidas
-- -----------------------------------------------------------------------------
('a0000008-0000-0000-0000-000000000001', null, 'sistema', 'pladur_falsos_techos', 'PLA-001', 'Tabique de pladur 13+46+13 con aislamiento de lana de roca', 'm2', 48.00, 10, ARRAY['pladur','tabique','aislamiento']),
('a0000008-0000-0000-0000-000000000002', null, 'sistema', 'pladur_falsos_techos', 'PLA-002', 'Trasdosado autoportante de pladur con aislamiento', 'm2', 38.00, 10, ARRAY['trasdosado','pladur','aislamiento']),
('a0000008-0000-0000-0000-000000000003', null, 'sistema', 'pladur_falsos_techos', 'PLA-003', 'Falso techo continuo de pladur', 'm2', 32.00, 10, ARRAY['falso techo','pladur','continuo']),
('a0000008-0000-0000-0000-000000000004', null, 'sistema', 'pladur_falsos_techos', 'PLA-004', 'Falso techo registrable de placas 60x60', 'm2', 28.00, 10, ARRAY['falso techo','registrable','placa']),
('a0000008-0000-0000-0000-000000000005', null, 'sistema', 'pladur_falsos_techos', 'PLA-005', 'Foseado decorativo con luz indirecta en pladur', 'ml', 38.00, 10, ARRAY['foseado','luz indirecta','decorativo']),
('a0000008-0000-0000-0000-000000000006', null, 'sistema', 'pladur_falsos_techos', 'PLA-006', 'Tabique acústico de pladur con doble placa', 'm2', 65.00, 10, ARRAY['acustico','pladur','aislamiento']),
('a0000008-0000-0000-0000-000000000007', null, 'sistema', 'pladur_falsos_techos', 'PLA-007', 'Cargadero de pladur en hueco de paso', 'ml', 22.00, 10, ARRAY['cargadero','pladur']),
('a0000008-0000-0000-0000-000000000008', null, 'sistema', 'pladur_falsos_techos', 'PLA-008', 'Trasdosado de pladur hidrófugo en zonas húmedas', 'm2', 42.00, 10, ARRAY['pladur','hidrofugo','baño']),
('a0000008-0000-0000-0000-000000000009', null, 'sistema', 'pladur_falsos_techos', 'PLA-009', 'Cornisa decorativa de escayola', 'ml', 18.00, 10, ARRAY['cornisa','escayola','decorativa']),
('a0000008-0000-0000-0000-000000000010', null, 'sistema', 'pladur_falsos_techos', 'PLA-010', 'Trampilla de registro en falso techo', 'ud', 75.00, 10, ARRAY['trampilla','registro','falso techo']),
('a0000008-0000-0000-0000-000000000011', null, 'sistema', 'pladur_falsos_techos', 'PLA-011', 'Aislamiento adicional de lana mineral, espesor 50mm', 'm2', 12.00, 10, ARRAY['aislamiento','lana','mineral']),
('a0000008-0000-0000-0000-000000000012', null, 'sistema', 'pladur_falsos_techos', 'PLA-012', 'Mano de obra pladurista oficial 1ª', 'h', 28.00, 10, ARRAY['pladurista','oficial','hora']),

-- -----------------------------------------------------------------------------
-- CLIMATIZACIÓN (capitulo: climatizacion) — 12 partidas
-- -----------------------------------------------------------------------------
('a0000009-0000-0000-0000-000000000001', null, 'sistema', 'climatizacion', 'CLI-001', 'Instalación de aire acondicionado split 1x1 (sin equipo)', 'ud', 380.00, 10, ARRAY['aire','split','instalar']),
('a0000009-0000-0000-0000-000000000002', null, 'sistema', 'climatizacion', 'CLI-002', 'Suministro e instalación de split inverter 3000 frigorías', 'ud', 850.00, 10, ARRAY['aire','inverter','split','frio']),
('a0000009-0000-0000-0000-000000000003', null, 'sistema', 'climatizacion', 'CLI-003', 'Instalación de equipo multisplit 2x1 (sin equipo)', 'ud', 620.00, 10, ARRAY['multisplit','aire','instalar']),
('a0000009-0000-0000-0000-000000000004', null, 'sistema', 'climatizacion', 'CLI-004', 'Instalación de aerotermia bibloc (sin equipo)', 'ud', 1450.00, 10, ARRAY['aerotermia','bomba calor','instalar']),
('a0000009-0000-0000-0000-000000000005', null, 'sistema', 'climatizacion', 'CLI-005', 'Instalación de suelo radiante por agua', 'm2', 65.00, 10, ARRAY['suelo radiante','calefaccion']),
('a0000009-0000-0000-0000-000000000006', null, 'sistema', 'climatizacion', 'CLI-006', 'Sustitución de radiador de aluminio (incluido aparato)', 'ud', 220.00, 10, ARRAY['radiador','aluminio','calefaccion']),
('a0000009-0000-0000-0000-000000000007', null, 'sistema', 'climatizacion', 'CLI-007', 'Instalación de toallero radiador en baño', 'ud', 280.00, 10, ARRAY['toallero','radiador','baño']),
('a0000009-0000-0000-0000-000000000008', null, 'sistema', 'climatizacion', 'CLI-008', 'Sustitución de caldera de gas (sin aparato)', 'ud', 480.00, 10, ARRAY['caldera','gas','sustituir']),
('a0000009-0000-0000-0000-000000000009', null, 'sistema', 'climatizacion', 'CLI-009', 'Conducto de extracción de campana hasta cubierta', 'ml', 45.00, 10, ARRAY['extraccion','campana','conducto']),
('a0000009-0000-0000-0000-000000000010', null, 'sistema', 'climatizacion', 'CLI-010', 'Sistema de ventilación mecánica controlada (VMC) doméstica', 'pa', 1850.00, 10, ARRAY['vmc','ventilacion','aire']),
('a0000009-0000-0000-0000-000000000011', null, 'sistema', 'climatizacion', 'CLI-011', 'Termostato programable cableado', 'ud', 145.00, 10, ARRAY['termostato','calefaccion']),
('a0000009-0000-0000-0000-000000000012', null, 'sistema', 'climatizacion', 'CLI-012', 'Mano de obra instalador climatización oficial 1ª', 'h', 35.00, 10, ARRAY['climatizacion','oficial','hora']),

-- -----------------------------------------------------------------------------
-- CUBIERTAS Y FACHADAS (capitulo: cubiertas_fachadas) — 12 partidas
-- -----------------------------------------------------------------------------
('a000000a-0000-0000-0000-000000000001', null, 'sistema', 'cubiertas_fachadas', 'CUB-001', 'Reparación puntual de cubierta con teja cerámica', 'pa', 480.00, 10, ARRAY['cubierta','teja','reparar']),
('a000000a-0000-0000-0000-000000000002', null, 'sistema', 'cubiertas_fachadas', 'CUB-002', 'Sustitución íntegra de cubierta con teja mixta', 'm2', 95.00, 10, ARRAY['cubierta','teja','sustituir']),
('a000000a-0000-0000-0000-000000000003', null, 'sistema', 'cubiertas_fachadas', 'CUB-003', 'Impermeabilización de cubierta plana con tela asfáltica', 'm2', 38.00, 10, ARRAY['cubierta','impermeabilizar','tela']),
('a000000a-0000-0000-0000-000000000004', null, 'sistema', 'cubiertas_fachadas', 'CUB-004', 'Aislamiento térmico bajo cubierta con XPS', 'm2', 28.00, 10, ARRAY['aislamiento','xps','cubierta']),
('a000000a-0000-0000-0000-000000000005', null, 'sistema', 'cubiertas_fachadas', 'CUB-005', 'Sustitución de canalón de aluminio lacado', 'ml', 32.00, 10, ARRAY['canalon','aluminio','agua']),
('a000000a-0000-0000-0000-000000000006', null, 'sistema', 'cubiertas_fachadas', 'CUB-006', 'Sustitución de bajante exterior de zinc', 'ml', 48.00, 10, ARRAY['bajante','zinc','exterior']),
('a000000a-0000-0000-0000-000000000007', null, 'sistema', 'cubiertas_fachadas', 'CUB-007', 'SATE: aislamiento térmico exterior con EPS y mortero', 'm2', 78.00, 10, ARRAY['sate','fachada','aislamiento']),
('a000000a-0000-0000-0000-000000000008', null, 'sistema', 'cubiertas_fachadas', 'CUB-008', 'Saneado y revoco de fachada', 'm2', 42.00, 10, ARRAY['fachada','revoco','sanear']),
('a000000a-0000-0000-0000-000000000009', null, 'sistema', 'cubiertas_fachadas', 'CUB-009', 'Montaje y desmontaje de andamio europeo', 'm2', 18.00, 10, ARRAY['andamio','montar','altura']),
('a000000a-0000-0000-0000-000000000010', null, 'sistema', 'cubiertas_fachadas', 'CUB-010', 'Alquiler de andamio europeo (mensual)', 'm2', 9.00, 10, ARRAY['andamio','alquiler']),
('a000000a-0000-0000-0000-000000000011', null, 'sistema', 'cubiertas_fachadas', 'CUB-011', 'Limpieza y tratamiento antimoho de fachada', 'm2', 14.00, 10, ARRAY['fachada','limpiar','moho']),
('a000000a-0000-0000-0000-000000000012', null, 'sistema', 'cubiertas_fachadas', 'CUB-012', 'Sellado de fisuras en fachada con masilla elástica', 'ml', 12.00, 10, ARRAY['fisura','sellar','fachada']),

-- -----------------------------------------------------------------------------
-- SANITARIOS Y GRIFERÍA (capitulo: sanitarios_griferia) — 14 partidas
-- -----------------------------------------------------------------------------
('a000000b-0000-0000-0000-000000000001', null, 'sistema', 'sanitarios_griferia', 'SAN-001', 'Suministro e instalación de plato de ducha y mampara', 'ud', 850.00, 10, ARRAY['ducha','plato','mampara']),
('a000000b-0000-0000-0000-000000000002', null, 'sistema', 'sanitarios_griferia', 'SAN-002', 'Suministro e instalación de inodoro suspendido con cisterna empotrada', 'ud', 520.00, 10, ARRAY['inodoro','suspendido','cisterna','wc']),
('a000000b-0000-0000-0000-000000000003', null, 'sistema', 'sanitarios_griferia', 'SAN-003', 'Suministro e instalación de inodoro con tanque bajo', 'ud', 280.00, 10, ARRAY['inodoro','tanque','wc']),
('a000000b-0000-0000-0000-000000000004', null, 'sistema', 'sanitarios_griferia', 'SAN-004', 'Suministro e instalación de mueble de baño con lavabo y grifería', 'ud', 680.00, 10, ARRAY['mueble','lavabo','grifo','baño']),
('a000000b-0000-0000-0000-000000000005', null, 'sistema', 'sanitarios_griferia', 'SAN-005', 'Suministro e instalación de bañera acrílica con grifería', 'ud', 720.00, 10, ARRAY['bañera','acrilica','grifo']),
('a000000b-0000-0000-0000-000000000006', null, 'sistema', 'sanitarios_griferia', 'SAN-006', 'Suministro e instalación de bidé', 'ud', 220.00, 10, ARRAY['bide','sanitario']),
('a000000b-0000-0000-0000-000000000007', null, 'sistema', 'sanitarios_griferia', 'SAN-007', 'Grifería monomando para lavabo gama media', 'ud', 145.00, 10, ARRAY['grifo','monomando','lavabo']),
('a000000b-0000-0000-0000-000000000008', null, 'sistema', 'sanitarios_griferia', 'SAN-008', 'Grifería termostática para ducha', 'ud', 220.00, 10, ARRAY['grifo','termostatico','ducha']),
('a000000b-0000-0000-0000-000000000009', null, 'sistema', 'sanitarios_griferia', 'SAN-009', 'Suministro e instalación de fregadero y grifería monomando', 'ud', 420.00, 10, ARRAY['fregadero','grifo','cocina']),
('a000000b-0000-0000-0000-000000000010', null, 'sistema', 'sanitarios_griferia', 'SAN-010', 'Suministro e instalación de fregadero bajo encimera', 'ud', 320.00, 10, ARRAY['fregadero','bajo encimera','cocina']),
('a000000b-0000-0000-0000-000000000011', null, 'sistema', 'sanitarios_griferia', 'SAN-011', 'Conjunto de accesorios de baño (toallero, percha, jabonera)', 'ud', 180.00, 10, ARRAY['accesorios','toallero','baño']),
('a000000b-0000-0000-0000-000000000012', null, 'sistema', 'sanitarios_griferia', 'SAN-012', 'Espejo retroiluminado LED para baño', 'ud', 240.00, 10, ARRAY['espejo','led','baño']),
('a000000b-0000-0000-0000-000000000013', null, 'sistema', 'sanitarios_griferia', 'SAN-013', 'Sustitución de mampara de ducha corredera', 'ud', 480.00, 10, ARRAY['mampara','ducha','corredera']),
('a000000b-0000-0000-0000-000000000014', null, 'sistema', 'sanitarios_griferia', 'SAN-014', 'Conexión y puesta en marcha de electrodoméstico de cocina', 'ud', 65.00, 10, ARRAY['electrodomestico','conectar','cocina']),

-- -----------------------------------------------------------------------------
-- OTROS (capitulo: otros) — 14 partidas
-- -----------------------------------------------------------------------------
('a000000c-0000-0000-0000-000000000001', null, 'sistema', 'otros', 'OTR-001', 'Limpieza fin de obra', 'pa', 320.00, 10, ARRAY['limpieza','final','obra']),
('a000000c-0000-0000-0000-000000000002', null, 'sistema', 'otros', 'OTR-002', 'Gestión de residuos de construcción y demolición (RCD)', 'pa', 220.00, 10, ARRAY['rcd','residuos','gestion']),
('a000000c-0000-0000-0000-000000000003', null, 'sistema', 'otros', 'OTR-003', 'Plan de seguridad y salud para obra menor', 'pa', 180.00, 21, ARRAY['seguridad','salud','plan']),
('a000000c-0000-0000-0000-000000000004', null, 'sistema', 'otros', 'OTR-004', 'Equipos de protección individual (EPI)', 'pa', 120.00, 21, ARRAY['epi','seguridad','proteccion']),
('a000000c-0000-0000-0000-000000000005', null, 'sistema', 'otros', 'OTR-005', 'Proyecto técnico y dirección de obra (vivienda)', 'pa', 1200.00, 21, ARRAY['proyecto','arquitecto','tecnico']),
('a000000c-0000-0000-0000-000000000006', null, 'sistema', 'otros', 'OTR-006', 'Tasas e impuestos municipales (licencia de obra)', 'pa', 280.00, 21, ARRAY['licencia','tasa','ayuntamiento']),
('a000000c-0000-0000-0000-000000000007', null, 'sistema', 'otros', 'OTR-007', 'Acometida de obra eléctrica provisional', 'pa', 320.00, 10, ARRAY['acometida','provisional','obra']),
('a000000c-0000-0000-0000-000000000008', null, 'sistema', 'otros', 'OTR-008', 'Protección de elementos comunes en zaguán y rellano', 'pa', 180.00, 10, ARRAY['proteger','zaguan','comunidad']),
('a000000c-0000-0000-0000-000000000009', null, 'sistema', 'otros', 'OTR-009', 'Mudanza interna y acopio de mobiliario', 'pa', 280.00, 10, ARRAY['mudanza','acopio','mover']),
('a000000c-0000-0000-0000-000000000010', null, 'sistema', 'otros', 'OTR-010', 'Imprevistos y partida alzada de ajuste', 'pa', 500.00, 10, ARRAY['imprevistos','ajuste','alzada']),
('a000000c-0000-0000-0000-000000000011', null, 'sistema', 'otros', 'OTR-011', 'Visita técnica y replanteo previo', 'h', 45.00, 21, ARRAY['visita','replanteo','tecnico']),
('a000000c-0000-0000-0000-000000000012', null, 'sistema', 'otros', 'OTR-012', 'Mano de obra peón general', 'h', 22.00, 10, ARRAY['peon','mano de obra','hora']),
('a000000c-0000-0000-0000-000000000013', null, 'sistema', 'otros', 'OTR-013', 'Trabajos extra fuera de horario laboral', 'h', 42.00, 10, ARRAY['extra','fuera horario','hora']),
('a000000c-0000-0000-0000-000000000014', null, 'sistema', 'otros', 'OTR-014', 'Desplazamientos y dietas (obra fuera de zona)', 'pa', 180.00, 10, ARRAY['desplazamiento','dietas','viaje'])

on conflict (id) do nothing;


-- =============================================================================
-- 2) PLANTILLAS DE OBRA (origen = 'sistema', empresa_id = NULL)
-- =============================================================================

insert into plantillas_obra (id, empresa_id, origen, slug, nombre, descripcion, icono, tipo_iva_default, titulo_sugerido, orden) values
('b0000000-0000-0000-0000-000000000001', null, 'sistema', 'reforma_bano_completo',         'Reforma baño completo',          'Demolición, fontanería, alicatado, sanitarios, pintura',     '🚿', 10, 'Reforma baño en {dirección}',         10),
('b0000000-0000-0000-0000-000000000002', null, 'sistema', 'reforma_cocina_basica',          'Reforma cocina básica',          'Demolición, instalaciones, alicatado, mobiliario, pintura',  '🍳', 10, 'Reforma cocina',                       20),
('b0000000-0000-0000-0000-000000000003', null, 'sistema', 'pintura_piso_completo',          'Pintura piso completo',          'Preparación de paredes y pintura plástica de un piso',       '🎨', 10, 'Pintura piso completo',                30),
('b0000000-0000-0000-0000-000000000004', null, 'sistema', 'solado_alicatado',               'Solado y alicatado',             'Cambio de suelo y revestimiento de paredes',                 '🧱', 10, 'Solado y alicatado',                   40),
('b0000000-0000-0000-0000-000000000005', null, 'sistema', 'instalacion_electrica_basica',   'Instalación eléctrica básica',   'Renovación cuadro, cableado y mecanismos',                   '⚡', 10, 'Renovación instalación eléctrica',     50)
on conflict (id) do nothing;


-- =============================================================================
-- 3) CAPÍTULOS DE CADA PLANTILLA
-- =============================================================================

insert into plantilla_capitulos (id, plantilla_id, orden, nombre, capitulo_sistema) values

-- Reforma baño completo --------------------------------------------------------
('c0000001-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 1, 'Demolición y desescombro',   'demolicion'),
('c0000001-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 2, 'Fontanería',                  'fontaneria'),
('c0000001-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 3, 'Electricidad',                'electricidad'),
('c0000001-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 4, 'Albañilería y revestimientos','solado_alicatado'),
('c0000001-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 5, 'Sanitarios y grifería',       'sanitarios_griferia'),
('c0000001-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 6, 'Pintura',                     'pintura'),

-- Reforma cocina básica --------------------------------------------------------
('c0000002-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 1, 'Demolición y desescombro',    'demolicion'),
('c0000002-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 2, 'Fontanería',                   'fontaneria'),
('c0000002-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 3, 'Electricidad',                 'electricidad'),
('c0000002-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 4, 'Solado y alicatado',           'solado_alicatado'),
('c0000002-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002', 5, 'Mobiliario y encimera',        'carpinteria'),
('c0000002-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000002', 6, 'Sanitarios y grifería',        'sanitarios_griferia'),
('c0000002-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000002', 7, 'Pintura',                      'pintura'),

-- Pintura piso completo --------------------------------------------------------
('c0000003-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 1, 'Preparación y protección',     'pintura'),
('c0000003-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 2, 'Pintura de paredes y techos',  'pintura'),
('c0000003-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 3, 'Limpieza final',               'pintura'),

-- Solado y alicatado -----------------------------------------------------------
('c0000004-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 1, 'Demolición y desescombro',     'demolicion'),
('c0000004-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 2, 'Preparación de soporte',       'albanileria'),
('c0000004-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004', 3, 'Pavimento y rodapié',          'solado_alicatado'),

-- Instalación eléctrica básica -------------------------------------------------
('c0000005-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 1, 'Cuadro y cableado',            'electricidad'),
('c0000005-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000005', 2, 'Mecanismos y puntos de luz',   'electricidad'),
('c0000005-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000005', 3, 'Tramitación',                  'electricidad')

on conflict (id) do nothing;


-- =============================================================================
-- 4) PARTIDAS DE CADA PLANTILLA (referencian biblioteca vía partida_biblioteca_id)
-- =============================================================================

insert into plantilla_partidas (plantilla_id, plantilla_capitulo_id, partida_biblioteca_id, orden, descripcion, unidad, precio_unitario_orientativo, cantidad_sugerida, tipo_iva_sugerido) values

-- ========== Reforma baño completo (b...001) ==========
-- Cap 1: Demolición y desescombro
('b0000000-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000002', 1, 'Demolición de alicatado, solado y sanitarios existentes', 'pa', 650.00, 1,    10),
('b0000000-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000009', 2, 'Retirada de escombros y transporte a vertedero',          'pa', 280.00, 1,    10),
-- Cap 2: Fontanería
('b0000000-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000002', 'a0000003-0000-0000-0000-000000000001', 1, 'Fontanería: distribución agua fría/caliente y desagües',  'pa', 850.00, 1,    10),
-- Cap 3: Electricidad
('b0000000-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000003', 'a0000004-0000-0000-0000-000000000001', 1, 'Electricidad: punto luz, espejo y enchufes',              'pa', 320.00, 1,    10),
-- Cap 4: Albañilería y revestimientos
('b0000000-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000004', 'a0000002-0000-0000-0000-000000000006', 1, 'Impermeabilización plato de ducha con lámina asfáltica',  'm2',  45.00, 4,    10),
('b0000000-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000004', 'a0000006-0000-0000-0000-000000000001', 2, 'Alicatado de paredes con porcelánico 30x60',              'm2',  42.00, 28,   10),
('b0000000-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000004', 'a0000006-0000-0000-0000-000000000003', 3, 'Solado de gres antideslizante',                           'm2',  38.00, 6,    10),
-- Cap 5: Sanitarios y grifería
('b0000000-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000005', 'a000000b-0000-0000-0000-000000000001', 1, 'Suministro e instalación de plato de ducha y mampara',                       'ud', 850.00, 1, 10),
('b0000000-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000005', 'a000000b-0000-0000-0000-000000000002', 2, 'Suministro e instalación de inodoro suspendido con cisterna empotrada',      'ud', 520.00, 1, 10),
('b0000000-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000005', 'a000000b-0000-0000-0000-000000000004', 3, 'Suministro e instalación de mueble de baño con lavabo y grifería',           'ud', 680.00, 1, 10),
-- Cap 6: Pintura
('b0000000-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000006', 'a0000005-0000-0000-0000-000000000007', 1, 'Pintura de techo plástica antihumedad',                   'm2',  15.00, 6,    10),


-- ========== Reforma cocina básica (b...002) ==========
-- Cap 1: Demolición y desescombro
('b0000000-0000-0000-0000-000000000002', 'c0000002-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000003', 1, 'Desmontaje de mobiliario, electrodomésticos y alicatado', 'pa', 750.00, 1,    10),
('b0000000-0000-0000-0000-000000000002', 'c0000002-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000010', 2, 'Retirada de escombros y transporte a vertedero',          'pa', 320.00, 1,    10),
-- Cap 2: Fontanería
('b0000000-0000-0000-0000-000000000002', 'c0000002-0000-0000-0000-000000000002', 'a0000003-0000-0000-0000-000000000002', 1, 'Fontanería: tomas agua y desagüe fregadero/lavavajillas', 'pa', 480.00, 1,    10),
-- Cap 3: Electricidad
('b0000000-0000-0000-0000-000000000002', 'c0000002-0000-0000-0000-000000000003', 'a0000004-0000-0000-0000-000000000002', 1, 'Electricidad: circuito independiente para horno y vitro, puntos de luz', 'pa', 620.00, 1, 10),
-- Cap 4: Solado y alicatado
('b0000000-0000-0000-0000-000000000002', 'c0000002-0000-0000-0000-000000000004', 'a0000006-0000-0000-0000-000000000002', 1, 'Alicatado de frente de encimera con porcelánico',         'm2',  42.00, 8,    10),
('b0000000-0000-0000-0000-000000000002', 'c0000002-0000-0000-0000-000000000004', 'a0000006-0000-0000-0000-000000000005', 2, 'Solado vinílico de alta resistencia',                     'm2',  35.00, 12,   10),
-- Cap 5: Mobiliario y encimera
('b0000000-0000-0000-0000-000000000002', 'c0000002-0000-0000-0000-000000000005', 'a0000007-0000-0000-0000-000000000008', 1, 'Suministro e instalación de muebles de cocina (alto y bajo)', 'ml', 480.00, 4, 10),
('b0000000-0000-0000-0000-000000000002', 'c0000002-0000-0000-0000-000000000005', 'a0000007-0000-0000-0000-000000000009', 2, 'Encimera de cuarzo compacto, espesor 20mm',                   'ml', 280.00, 4, 10),
-- Cap 6: Sanitarios y grifería
('b0000000-0000-0000-0000-000000000002', 'c0000002-0000-0000-0000-000000000006', 'a000000b-0000-0000-0000-000000000009', 1, 'Suministro e instalación de fregadero y grifería monomando',  'ud', 420.00, 1, 10),
-- Cap 7: Pintura
('b0000000-0000-0000-0000-000000000002', 'c0000002-0000-0000-0000-000000000007', 'a0000005-0000-0000-0000-000000000006', 1, 'Pintura plástica lavable de techo y paredes',                 'm2',  12.00, 35, 10),


-- ========== Pintura piso completo (b...003) ==========
-- Cap 1: Preparación y protección
('b0000000-0000-0000-0000-000000000003', 'c0000003-0000-0000-0000-000000000001', 'a0000005-0000-0000-0000-000000000001', 1, 'Protección de suelos, mobiliario y carpinterías',           'pa', 180.00, 1,   10),
('b0000000-0000-0000-0000-000000000003', 'c0000003-0000-0000-0000-000000000001', 'a0000005-0000-0000-0000-000000000002', 2, 'Lijado, masillado y reparación de imperfecciones en paredes','m2',   4.50, 220, 10),
('b0000000-0000-0000-0000-000000000003', 'c0000003-0000-0000-0000-000000000001', 'a0000005-0000-0000-0000-000000000003', 3, 'Imprimación selladora en paredes y techos',                  'm2',   3.00, 220, 10),
-- Cap 2: Pintura de paredes y techos
('b0000000-0000-0000-0000-000000000003', 'c0000003-0000-0000-0000-000000000002', 'a0000005-0000-0000-0000-000000000004', 1, 'Aplicación de dos manos de pintura plástica mate lavable en paredes','m2', 8.50, 180, 10),
('b0000000-0000-0000-0000-000000000003', 'c0000003-0000-0000-0000-000000000002', 'a0000005-0000-0000-0000-000000000005', 2, 'Aplicación de dos manos de pintura plástica blanca en techos',       'm2', 9.00, 65,  10),
-- Cap 3: Limpieza final
('b0000000-0000-0000-0000-000000000003', 'c0000003-0000-0000-0000-000000000003', 'a0000005-0000-0000-0000-000000000012', 1, 'Limpieza final y retirada de protecciones',                  'pa', 220.00, 1,   10),


-- ========== Solado y alicatado (b...004) ==========
-- Cap 1: Demolición y desescombro
('b0000000-0000-0000-0000-000000000004', 'c0000004-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000004', 1, 'Demolición de solado existente',                            'm2',  12.00, 50, 10),
('b0000000-0000-0000-0000-000000000004', 'c0000004-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000009', 2, 'Retirada de escombros y transporte',                        'pa', 280.00, 1,  10),
-- Cap 2: Preparación de soporte
('b0000000-0000-0000-0000-000000000004', 'c0000004-0000-0000-0000-000000000002', 'a0000002-0000-0000-0000-000000000003', 1, 'Nivelación con mortero autonivelante',                      'm2',  18.00, 50, 10),
-- Cap 3: Pavimento y rodapié
('b0000000-0000-0000-0000-000000000004', 'c0000004-0000-0000-0000-000000000003', 'a0000006-0000-0000-0000-000000000004', 1, 'Suministro e instalación de gres porcelánico 60x60 rectificado','m2', 45.00, 50, 10),
('b0000000-0000-0000-0000-000000000004', 'c0000004-0000-0000-0000-000000000003', 'a0000006-0000-0000-0000-000000000008', 2, 'Rodapié de gres a juego, altura 8 cm',                          'ml', 12.00, 28, 10),
('b0000000-0000-0000-0000-000000000004', 'c0000004-0000-0000-0000-000000000003', 'a0000006-0000-0000-0000-000000000010', 3, 'Sellado de juntas con material epoxi',                          'm2',  6.00, 50, 10),


-- ========== Instalación eléctrica básica (b...005) ==========
-- Cap 1: Cuadro y cableado
('b0000000-0000-0000-0000-000000000005', 'c0000005-0000-0000-0000-000000000001', 'a0000004-0000-0000-0000-000000000003', 1, 'Sustitución de cuadro eléctrico con magnetotérmicos y diferencial', 'ud', 480.00, 1,  10),
('b0000000-0000-0000-0000-000000000005', 'c0000005-0000-0000-0000-000000000001', 'a0000004-0000-0000-0000-000000000004', 2, 'Sustitución de cableado en circuitos principales',                  'ml',   6.50, 80, 10),
-- Cap 2: Mecanismos y puntos de luz
('b0000000-0000-0000-0000-000000000005', 'c0000005-0000-0000-0000-000000000002', 'a0000004-0000-0000-0000-000000000005', 1, 'Instalación de tomas de corriente schuko',                          'ud',  28.00, 18, 10),
('b0000000-0000-0000-0000-000000000005', 'c0000005-0000-0000-0000-000000000002', 'a0000004-0000-0000-0000-000000000006', 2, 'Instalación de puntos de luz con interruptor',                      'ud',  35.00, 12, 10),
('b0000000-0000-0000-0000-000000000005', 'c0000005-0000-0000-0000-000000000002', 'a0000004-0000-0000-0000-000000000008', 3, 'Instalación de toma TV y datos',                                    'ud',  42.00, 4,  10),
-- Cap 3: Tramitación
('b0000000-0000-0000-0000-000000000005', 'c0000005-0000-0000-0000-000000000003', 'a0000004-0000-0000-0000-000000000015', 1, 'Boletín eléctrico (CIE) y tramitación',                             'pa', 180.00, 1,  21);

-- =============================================================================
-- Fin del seed
-- =============================================================================
