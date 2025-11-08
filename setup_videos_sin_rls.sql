-- =====================================================
-- CONFIGURACIÓN DEL BUCKET DE VIDEOS SIN RLS
-- =====================================================
-- Este script configura el almacenamiento para videos de productos
-- SIN restricciones RLS (Row Level Security)
-- Ejecutar en el SQL Editor de Supabase

-- 1. Crear el bucket "videos" (público)
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true,  -- Público para que los videos sean accesibles
  209715200,  -- 200MB en bytes (aumentado)
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

-- 2. ELIMINAR todas las políticas RLS existentes
-- =====================================================
DROP POLICY IF EXISTS "Videos públicos - SELECT" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir videos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus videos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus videos" ON storage.objects;

-- 3. Crear políticas PERMISIVAS para todos los usuarios
-- =====================================================

-- Permitir a TODOS ver videos (sin autenticación)
CREATE POLICY "Acceso público total a videos - SELECT"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

-- Permitir a TODOS subir videos (sin autenticación)
CREATE POLICY "Acceso público total a videos - INSERT"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'videos');

-- Permitir a TODOS actualizar videos (sin autenticación)
CREATE POLICY "Acceso público total a videos - UPDATE"
ON storage.objects FOR UPDATE
USING (bucket_id = 'videos');

-- Permitir a TODOS eliminar videos (sin autenticación)
CREATE POLICY "Acceso público total a videos - DELETE"
ON storage.objects FOR DELETE
USING (bucket_id = 'videos');

-- 4. Agregar columna video_url a la tabla productos
-- =====================================================
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 5. Comentarios para documentación
-- =====================================================
COMMENT ON COLUMN productos.video_url IS 'URL pública del video del producto almacenado en Supabase Storage';

-- 6. Índice para mejorar rendimiento de búsqueda por video
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_productos_video_url 
ON productos(video_url) 
WHERE video_url IS NOT NULL;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que el bucket fue creado correctamente
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'videos';

-- Verificar políticas RLS
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%video%';

-- Verificar columna en tabla productos
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'productos' 
AND column_name = 'video_url';

-- =====================================================
-- SCRIPT COMPLETADO
-- =====================================================
-- El bucket "videos" está configurado con:
-- ✅ Almacenar videos de hasta 200MB
-- ✅ Tipos de video: MP4, WebM, OGG, MOV, AVI
-- ✅ Acceso público TOTAL (lectura y escritura sin autenticación)
-- ✅ Sin restricciones RLS
-- ⚠️  ADVERTENCIA: Cualquiera puede subir/eliminar videos
-- =====================================================
