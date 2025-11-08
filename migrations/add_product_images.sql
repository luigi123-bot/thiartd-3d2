-- Migración para sistema de múltiples imágenes por producto
-- Fecha: 2025-11-07
-- IMPORTANTE: Verificar el tipo de dato de productos.id antes de ejecutar

-- 1. Verificar el tipo de dato de productos.id
DO $$ 
DECLARE
  col_type text;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_name = 'productos' AND column_name = 'id';
  
  RAISE NOTICE 'El tipo de productos.id es: %', col_type;
END $$;

-- 2. Crear tabla para múltiples imágenes de productos
-- Ajustar el tipo de producto_id según el resultado de la consulta anterior
-- Si productos.id es INTEGER, usar INTEGER
-- Si productos.id es UUID, usar UUID
CREATE TABLE IF NOT EXISTS producto_imagenes (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0,
  es_portada BOOLEAN DEFAULT FALSE,
  alt_text VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_producto
    FOREIGN KEY (producto_id)
    REFERENCES productos(id)
    ON DELETE CASCADE
);

-- 3. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_producto_imagenes_producto_id ON producto_imagenes(producto_id);
CREATE INDEX IF NOT EXISTS idx_producto_imagenes_orden ON producto_imagenes(producto_id, orden);
CREATE INDEX IF NOT EXISTS idx_producto_imagenes_portada ON producto_imagenes(producto_id, es_portada);

-- 4. Migrar imágenes existentes de la tabla productos a producto_imagenes
-- Solo migrar si existe image_url y no está vacío
INSERT INTO producto_imagenes (producto_id, image_url, orden, es_portada, alt_text)
SELECT 
  id,
  image_url,
  0,
  TRUE,
  nombre
FROM productos
WHERE image_url IS NOT NULL 
  AND image_url != ''
  AND image_url != 'null'
ON CONFLICT DO NOTHING;

-- 5. Agregar columna para almacenar URLs de videos (si no existe)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'productos' AND column_name = 'video_url'
  ) THEN
    ALTER TABLE productos ADD COLUMN video_url TEXT;
  END IF;
END $$;

-- 6. Agregar columna para almacenar URLs de modelos 3D (si no existe)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'productos' AND column_name = 'modelo_url'
  ) THEN
    ALTER TABLE productos ADD COLUMN modelo_url TEXT;
  END IF;
END $$;

-- 7. Crear función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Crear trigger para producto_imagenes
DROP TRIGGER IF EXISTS update_producto_imagenes_updated_at ON producto_imagenes;
CREATE TRIGGER update_producto_imagenes_updated_at
  BEFORE UPDATE ON producto_imagenes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. Crear función para asegurar solo una imagen portada por producto
CREATE OR REPLACE FUNCTION ensure_single_portada()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.es_portada = TRUE THEN
    -- Si esta imagen se marca como portada, desmarcar las demás
    UPDATE producto_imagenes
    SET es_portada = FALSE
    WHERE producto_id = NEW.producto_id
      AND id != NEW.id
      AND es_portada = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Crear trigger para asegurar una sola portada
DROP TRIGGER IF EXISTS ensure_single_portada_trigger ON producto_imagenes;
CREATE TRIGGER ensure_single_portada_trigger
  BEFORE INSERT OR UPDATE ON producto_imagenes
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_portada();

-- 10. Comentarios de la tabla
COMMENT ON TABLE producto_imagenes IS 'Almacena múltiples imágenes por producto con orden y portada';
COMMENT ON COLUMN producto_imagenes.orden IS 'Orden de visualización de la imagen (0 es primero)';
COMMENT ON COLUMN producto_imagenes.es_portada IS 'Indica si es la imagen principal del producto';

-- Verificación
SELECT 'Migración completada exitosamente' AS status;
