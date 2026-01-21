# 🔧 Solución: Error al Subir Imagen

## ❌ Error Actual

```
Error uploading product image: {}
```

Este error vacío generalmente significa que **el bucket "productos" no existe** en Supabase Storage.

---

## ✅ Solución en 3 Pasos

### **Paso 1: Ejecutar Diagnóstico**

Para saber exactamente qué falta:

1. Abre Supabase Dashboard → SQL Editor
2. Copia y pega el contenido de `diagnostico_configuracion.sql`
3. Click en "Run"
4. Lee los resultados:
   - ✅ Verde = Configurado
   - ❌ Rojo = Falta configurar

### **Paso 2: Ejecutar Setup Completo**

1. En Supabase Dashboard → SQL Editor
2. Copia TODO el contenido de `setup_productos_imagenes_completo.sql`
3. Pega en el editor
4. Click en "Run"
5. Espera a que termine (~5 segundos)

Este script creará:
- ✅ Columna `image_url` en tabla productos
- ✅ Bucket `productos` (público, 5MB)
- ✅ 4 políticas RLS para Storage

### **Paso 3: Verificar Logs**

Ahora con el logging mejorado, intenta subir una imagen de nuevo.

En la consola del navegador (F12) verás:

**Si funciona:**
```
📤 Iniciando upload de imagen: { fileName: "foto.jpg", ... }
📝 Nombre de archivo generado: new_1730678123456.jpg
✅ Imagen subida exitosamente: { ... }
🔗 URL pública generada: https://...
```

**Si falla:**
```
❌ Error de Supabase Storage: { message: "Bucket not found", ... }
```

---

## 🔍 Errores Comunes y Soluciones

### Error: "Bucket not found"

**Causa:** El bucket "productos" no existe

**Solución:**
```sql
-- En Supabase SQL Editor:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'productos',
    'productos',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE 
SET public = true;
```

O simplemente ejecuta `setup_productos_imagenes_completo.sql`

### Error: "Policy check violation" 

**Causa:** Faltan políticas RLS

**Solución:** Ejecuta `setup_productos_imagenes_completo.sql` completo

### Error: "File too large"

**Causa:** La imagen supera los 5MB

**Solución:** 
- Reduce el tamaño de la imagen antes de subir
- O aumenta el límite en el bucket

### Error: "Invalid MIME type"

**Causa:** Estás intentando subir un tipo de archivo no permitido

**Solución:** Solo puedes subir:
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)

---

## 🧪 Probar Manualmente

### 1. Verificar que el Bucket Existe

En Supabase Dashboard:
1. Ve a "Storage" en el menú lateral
2. Deberías ver el bucket "productos"
3. Click en él
4. Debería estar marcado como "Public"

### 2. Probar Upload Manual

1. En Storage → productos
2. Click en "Upload file"
3. Selecciona una imagen
4. Si se sube, el problema está en el código
5. Si NO se sube, el problema está en Supabase

### 3. Verificar Variables de Entorno

En tu archivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://fvtqrslsueaxtuyphebl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Estas deben existir:
SUPABASE_S3_ACCESS_KEY_ID=67115d326da118f639ecea40f87cbdb4
SUPABASE_S3_SECRET_ACCESS_KEY=29fd480174691f191b45741e6d23f6e2d0275d1ee86a563432ae726c242411a8
```

**Reinicia el servidor después de cambiar .env.local:**
```bash
Ctrl+C
npm run dev
```

---

## 📊 Verificación Completa

Ejecuta este checklist:

### En Supabase Dashboard:

- [ ] SQL Editor → Ejecutar `diagnostico_configuracion.sql`
- [ ] Verificar que todo muestre ✅
- [ ] Storage → Ver bucket "productos"
- [ ] Bucket "productos" está marcado como público
- [ ] Storage → productos → Intentar subir archivo manualmente

### En tu Proyecto:

- [ ] Archivo `.env.local` tiene todas las variables
- [ ] Variables NEXT_PUBLIC_SUPABASE_URL y ANON_KEY correctas
- [ ] Servidor reiniciado después de cambios en .env
- [ ] Consola del navegador (F12) abierta para ver logs

### Probar Upload:

- [ ] Abrir http://localhost:3000/admin/productos
- [ ] Click en "Crear producto"
- [ ] Scroll hasta "Imagen del producto"
- [ ] Click en "Seleccionar imagen"
- [ ] Elegir imagen JPEG/PNG (menor a 5MB)
- [ ] Ver logs en consola del navegador
- [ ] Imagen debe aparecer como preview
- [ ] Llenar los demás campos
- [ ] Click en "Guardar producto"
- [ ] Producto debe aparecer con imagen en la lista

---

## 🎯 Comando de Emergencia

Si nada funciona, ejecuta esto en Supabase SQL Editor:

```sql
-- 1. Crear columna (si no existe)
ALTER TABLE productos ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Crear bucket (si no existe)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('productos', 'productos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[])
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Políticas RLS
DROP POLICY IF EXISTS "Public read access productos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload productos" ON storage.objects;

CREATE POLICY "Public read access productos"
ON storage.objects FOR SELECT USING (bucket_id = 'productos');

CREATE POLICY "Anyone can upload productos"
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'productos');

-- 4. Verificar
SELECT 'Columna' as tipo, column_name FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'image_url'
UNION ALL
SELECT 'Bucket' as tipo, id FROM storage.buckets WHERE id = 'productos'
UNION ALL
SELECT 'Políticas' as tipo, COUNT(*)::text FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%productos%';
```

Deberías ver 3 filas:
- Columna | image_url
- Bucket | productos
- Políticas | 2 (o más)

---

## 🔄 Después de la Solución

1. **Reinicia el servidor:**
   ```bash
   Ctrl+C
   npm run dev
   ```

2. **Limpia caché del navegador:**
   - F12 → Network tab → Check "Disable cache"
   - O Ctrl+Shift+R para hard refresh

3. **Intenta de nuevo:**
   - Crea un producto
   - Sube una imagen
   - Revisa la consola para ver los nuevos logs detallados

---

## 📞 Si Persiste el Error

Comparte:
1. **Los logs de la consola** (F12 → Console tab)
2. **Resultado del diagnóstico** (`diagnostico_configuracion.sql`)
3. **Captura de Storage** (Dashboard → Storage)
4. **Contenido de .env.local** (oculta las claves secretas)

---

**Fecha:** 3 de noviembre de 2025  
**Archivo:** `diagnostico_configuracion.sql` + `setup_productos_imagenes_completo.sql`
