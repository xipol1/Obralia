-- =============================================================================
-- Obralia - Storage Buckets
-- Crea los buckets y policies de Storage que antes se debían crear manualmente.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Buckets
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES
  ('logos',         'logos',         true,  5242880),   -- 5 MB, público
  ('presupuestos',  'presupuestos', false, 10485760),  -- 10 MB, privado
  ('firmas',        'firmas',       false, 5242880),   -- 5 MB, privado
  ('facturas',      'facturas',     false, 20971520)   -- 20 MB, privado
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Policies — logos (bucket público)
-- ---------------------------------------------------------------------------
CREATE POLICY "logos_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');

CREATE POLICY "logos_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'logos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.empresas WHERE id IN (SELECT public.mis_empresa_ids())
    )
  );

CREATE POLICY "logos_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.empresas WHERE id IN (SELECT public.mis_empresa_ids())
    )
  );

CREATE POLICY "logos_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.empresas WHERE id IN (SELECT public.mis_empresa_ids())
    )
  );

-- ---------------------------------------------------------------------------
-- 3. Policies — presupuestos, firmas, facturas (buckets privados)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  bkt text;
BEGIN
  FOR bkt IN SELECT unnest(ARRAY['presupuestos', 'firmas', 'facturas'])
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR SELECT USING (
        bucket_id = %L
        AND (storage.foldername(name))[1] IN (
          SELECT id::text FROM public.empresas WHERE id IN (SELECT public.mis_empresa_ids())
        )
      )', bkt || '_select', bkt
    );
    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR INSERT WITH CHECK (
        bucket_id = %L
        AND auth.role() = ''authenticated''
        AND (storage.foldername(name))[1] IN (
          SELECT id::text FROM public.empresas WHERE id IN (SELECT public.mis_empresa_ids())
        )
      )', bkt || '_insert', bkt
    );
    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR UPDATE USING (
        bucket_id = %L
        AND (storage.foldername(name))[1] IN (
          SELECT id::text FROM public.empresas WHERE id IN (SELECT public.mis_empresa_ids())
        )
      )', bkt || '_update', bkt
    );
    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR DELETE USING (
        bucket_id = %L
        AND (storage.foldername(name))[1] IN (
          SELECT id::text FROM public.empresas WHERE id IN (SELECT public.mis_empresa_ids())
        )
      )', bkt || '_delete', bkt
    );
  END LOOP;
END $$;
