-- =====================================================
-- SETUP BUCKET VIDEOS + POLÍTICAS RLS
-- =====================================================
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =====================================================

-- PASO 1: Crear / actualizar el bucket "videos"
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true,
  209715200,  -- 200 MB
  ARRAY[
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-msvideo'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 209715200,
  allowed_mime_types = ARRAY[
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-msvideo'
  ];

-- =====================================================
-- PASO 2: Eliminar TODAS las políticas que apliquen
--         al bucket "videos" para evitar conflictos
-- =====================================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'objects'
      AND schemaname = 'storage'
      AND (qual LIKE '%videos%' OR with_check LIKE '%videos%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    RAISE NOTICE 'Dropped policy: %', pol.policyname;
  END LOOP;
END $$;

-- =====================================================
-- PASO 3: Crear políticas RLS permisivas para "videos"
-- =====================================================

-- Lectura pública (cualquier visitante puede ver los videos)
CREATE POLICY "videos_select_public"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

-- Subida: usuarios autenticados
CREATE POLICY "videos_insert_authenticated"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'videos'
  AND auth.role() = 'authenticated'
);

-- Actualización: usuarios autenticados
CREATE POLICY "videos_update_authenticated"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'videos'
  AND auth.role() = 'authenticated'
);

-- Borrado: usuarios autenticados
CREATE POLICY "videos_delete_authenticated"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'videos'
  AND auth.role() = 'authenticated'
);

-- =====================================================
-- PASO 4: Asegurar que la columna video_url existe
-- =====================================================
ALTER TABLE productos
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- =====================================================
-- PASO 5: Verificación
-- =====================================================
SELECT
  'Bucket' AS tipo,
  id AS nombre,
  public::text AS detalle
FROM storage.buckets
WHERE id = 'videos'

UNION ALL

SELECT
  'Política' AS tipo,
  policyname AS nombre,
  cmd AS detalle
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE 'videos_%'

ORDER BY tipo, nombre;
