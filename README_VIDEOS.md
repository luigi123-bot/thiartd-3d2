# 🎥 Configuración de Videos para Productos

## 📋 Resumen

Esta funcionalidad permite agregar videos a los productos que se almacenarán en Supabase Storage en un bucket llamado `videos`.

## 🚀 Pasos de Configuración

### 1. Ejecutar Script SQL en Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **SQL Editor**
3. Crea una nueva query
4. Copia y pega el contenido del archivo `setup_videos_bucket.sql`
5. Ejecuta el script (botón **Run** o `Ctrl+Enter`)

### 2. Verificar la Configuración

Después de ejecutar el script, verifica:

#### En Storage:
1. Ve a **Storage** en el panel izquierdo
2. Deberías ver el bucket `videos` en la lista
3. El bucket debe estar configurado como **público**

#### En Database:
1. Ve a **Table Editor** → `productos_3d`
2. Verifica que existe la columna `video_url` (tipo TEXT)

### 3. Configurar Variables de Entorno

Asegúrate de tener estas variables en tu archivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

## 📦 Características Implementadas

### Backend (Base de Datos)
- ✅ Bucket `videos` creado en Supabase Storage
- ✅ Políticas RLS configuradas (lectura pública, escritura autenticada)
- ✅ Columna `video_url` agregada a tabla `productos_3d`
- ✅ Límite de 100MB por video
- ✅ Formatos soportados: MP4, WebM, OGG, MOV, AVI

### Frontend (Componentes)
- ✅ Campo de subida de video en formulario de productos
- ✅ Vista previa del video antes de guardar
- ✅ Validación de tipo y tamaño de archivo
- ✅ Indicador de progreso durante la subida
- ✅ Opción para eliminar video seleccionado

### Funciones de Storage
- ✅ `uploadProductVideo()` - Subir video a Supabase
- ✅ Validación automática de archivos
- ✅ Generación de nombres únicos
- ✅ URLs públicas generadas automáticamente

## 📝 Uso

### Agregar Video a un Producto

1. Ve a **Admin → Productos**
2. Click en **Agregar producto** o edita uno existente
3. Completa los campos del formulario
4. En la sección **"Video del producto"**:
   - Click en el área de subida
   - Selecciona tu video (MP4, WebM, OGG, MOV, AVI)
   - Máximo 100MB
5. Verás una vista previa del video
6. Click en **Agregar producto** o **Guardar cambios**
7. El video se subirá automáticamente antes de guardar

### Eliminar Video

- Click en el botón **X** en la esquina superior derecha de la vista previa

## 🔧 Estructura de Archivos

```
src/
├── db/
│   └── schema.ts                    ← Agregado campo video_url
├── lib/
│   └── supabase-storage.ts          ← Función uploadProductVideo()
└── components/
    └── add-product-form.tsx         ← UI para subir videos

setup_videos_bucket.sql              ← Script de configuración
README_VIDEOS.md                     ← Este archivo
```

## 🎯 Tipos de Video Soportados

| Formato | Extensión | MIME Type           | Soporte Navegador |
|---------|-----------|---------------------|-------------------|
| MP4     | .mp4      | video/mp4           | ✅ Universal      |
| WebM    | .webm     | video/webm          | ✅ Chrome, Firefox |
| OGG     | .ogg      | video/ogg           | ✅ Firefox, Opera |
| MOV     | .mov      | video/quicktime     | ✅ Safari        |
| AVI     | .avi      | video/x-msvideo     | ⚠️ Limitado      |

**Recomendación:** Usa MP4 (H.264) para mejor compatibilidad.

## 🔐 Seguridad

- ✅ Solo usuarios autenticados pueden subir videos
- ✅ Los videos son públicos (pueden verse sin autenticación)
- ✅ Validación de tipo de archivo en frontend y backend
- ✅ Límite de 100MB por archivo
- ✅ Nombres de archivo únicos para evitar conflictos

## 🐛 Troubleshooting

### Error: "El bucket 'videos' no existe"
**Solución:** Ejecuta el script `setup_videos_bucket.sql` en Supabase SQL Editor

### Error: "Faltan políticas RLS"
**Solución:** Verifica que las políticas RLS se crearon correctamente ejecutando la sección de verificación del script SQL

### Error: "El video es demasiado grande"
**Solución:** El límite es 100MB. Comprime el video usando herramientas como HandBrake o FFmpeg

### El video no se reproduce
**Solución:** 
- Verifica que el formato sea compatible con navegadores (preferir MP4)
- Asegúrate de que el bucket sea público
- Verifica que la URL del video sea accesible

## 📊 Consultas SQL Útiles

### Ver todos los productos con video
```sql
SELECT id, name, video_url 
FROM productos_3d 
WHERE video_url IS NOT NULL;
```

### Contar productos con/sin video
```sql
SELECT 
  COUNT(*) FILTER (WHERE video_url IS NOT NULL) as con_video,
  COUNT(*) FILTER (WHERE video_url IS NULL) as sin_video
FROM productos_3d;
```

### Listar videos en el bucket
```sql
SELECT name, created_at, metadata->>'size' as size_bytes
FROM storage.objects 
WHERE bucket_id = 'videos'
ORDER BY created_at DESC;
```

## 🎨 Personalización

### Cambiar límite de tamaño

En `supabase-storage.ts`:
```typescript
[StorageBucket.VIDEOS]: { 
  maxSize: 200 * 1024 * 1024, // Cambiar a 200MB
  types: [...]
}
```

Y actualizar en Supabase:
```sql
UPDATE storage.buckets 
SET file_size_limit = 209715200 
WHERE id = 'videos';
```

### Agregar más formatos

En `supabase-storage.ts`:
```typescript
types: [
  'video/mp4',
  'video/webm',
  'video/x-matroska', // .mkv
  // ... más tipos
]
```

## 📞 Soporte

Si tienes problemas:
1. Verifica que ejecutaste el script SQL
2. Revisa la consola del navegador para errores
3. Verifica los logs de Supabase
4. Confirma que las variables de entorno están configuradas

---

✨ **Listo!** Ahora puedes agregar videos a tus productos.
