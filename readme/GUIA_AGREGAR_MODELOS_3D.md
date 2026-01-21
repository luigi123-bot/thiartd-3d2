# 📦 Guía para Agregar Modelos 3D a Productos

## Problema Actual
Los productos en la base de datos no tienen la columna `modelo_url` o está vacía (NULL), por eso no se muestran los modelos 3D.

## Solución en 3 Pasos

### 1️⃣ Verificar/Agregar la columna `modelo_url`

1. Ve a Supabase Dashboard → SQL Editor
2. Ejecuta el archivo `supabase_add_modelo_url.sql` que creé
3. Esto agregará la columna `modelo_url` si no existe

### 2️⃣ Configurar Supabase Storage para modelos 3D

1. Ve a Supabase Dashboard → Storage
2. Crea un nuevo bucket llamado `modelos` (o usa uno existente)
3. Configura el bucket como **público** para que los modelos sean accesibles

**Configuración del bucket:**
```sql
-- Ejecuta esto en SQL Editor para hacer el bucket público
INSERT INTO storage.buckets (id, name, public) 
VALUES ('modelos', 'modelos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Agregar política de lectura pública
CREATE POLICY "Permitir lectura pública de modelos"
ON storage.objects FOR SELECT
USING (bucket_id = 'modelos');

-- Agregar política de carga (solo usuarios autenticados)
CREATE POLICY "Permitir carga de modelos autenticados"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'modelos' AND auth.role() = 'authenticated');
```

### 3️⃣ Subir modelos 3D y actualizar productos

**Opción A: Desde Supabase Dashboard (Manual)**

1. Ve a Storage → `modelos` bucket
2. Sube tus archivos **STL**, **GLB** o **GLTF**
3. Copia la URL pública del archivo
4. Ve a Table Editor → `productos`
5. Edita el producto y pega la URL en el campo `modelo_url`

**Ejemplos de URLs válidas:**
```
https://tuproyecto.supabase.co/storage/v1/object/public/modelos/producto1.stl
https://tuproyecto.supabase.co/storage/v1/object/public/modelos/producto2.glb
https://tuproyecto.supabase.co/storage/v1/object/public/modelos/producto3.gltf
```

**Opción B: Desde SQL (Actualización masiva)**

```sql
-- Actualizar un producto específico
UPDATE productos 
SET modelo_url = 'https://tuproyecto.supabase.co/storage/v1/object/public/modelos/producto1.glb'
WHERE id = '267cdd73-148a-4d73-b272-f72ec684804d';

-- Ver todos los productos con sus modelos
SELECT id, nombre, modelo_url 
FROM productos;
```

## 🎯 Para Probar

1. Encuentra un modelo 3D en formato **STL**, **GLB** o **GLTF**
   - Si tienes archivos STL de impresión 3D, ¡úsalos directamente!
   - Si necesitas ejemplos, puedes descargar de Sketchfab o Thingiverse
2. Súbelo a Supabase Storage en el bucket `modelos`
3. Copia la URL pública (asegúrate de que termine en `.stl`, `.glb` o `.gltf`)
4. Actualiza el campo `modelo_url` del producto "prueba 2" (ID: 267cdd73-148a-4d73-b272-f72ec684804d)
5. Recarga la página del producto en tu aplicación

## 📝 Formatos Soportados

El componente `Model3DViewer` soporta los tres formatos principales:

- ✅ **STL** (Stereolithography)
  - Ideal para impresión 3D
  - Solo geometría (sin colores/texturas)
  - Color gris metálico por defecto
  - Extensión: `.stl`

- ✅ **GLB** (GLTF Binary) - **Recomendado para modelos con textura**
  - Archivo único que contiene todo
  - Soporta materiales, texturas y colores
  - Mejor rendimiento
  - Extensión: `.glb`

- ✅ **GLTF** (GL Transmission Format)
  - JSON + archivos externos
  - Soporta materiales y texturas
  - Extensión: `.gltf`

**Recomendación:** 
- Usa **STL** si tus modelos vienen de software de impresión 3D
- Usa **GLB** si necesitas colores, texturas y materiales ricos

## 🔍 Verificación

Una vez que actualices la base de datos, deberías ver en la consola:
```javascript
📦 Datos del producto: {
  id: "267cdd73-148a-4d73-b272-f72ec684804d",
  nombre: "prueba 2",
  modelo_url: "https://tu-url-del-modelo.glb",
  modelo_url_type: "string",
  modelo_url_length: 75,
  hasValidModel: true  // ✅ Ahora es true
}
```

## ⚠️ Solución de Problemas

**Si no aparece el botón 3D:**
- Verifica que `modelo_url` no sea NULL o vacío
- Asegúrate de que la URL sea accesible públicamente
- Revisa la consola del navegador por errores

**Si el modelo no carga:**
- Verifica que el archivo sea GLB o GLTF válido
- Comprueba que el bucket de Storage sea público
- Revisa el tamaño del archivo (máximo 50MB recomendado)

## 🚀 Próximos Pasos (Opcional)

Puedo crear un panel de administración para que puedas:
- Subir modelos 3D desde la interfaz
- Asignar modelos a productos fácilmente
- Ver vista previa de los modelos antes de publicar

¿Quieres que implemente esto?
