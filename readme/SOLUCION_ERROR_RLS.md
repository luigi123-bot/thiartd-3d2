# 🔧 Solución Rápida: Error RLS en Supabase Storage

## ❌ Error Actual

```
Error al subir imagen: new row violates row-level security policy
```

Este error ocurre porque Supabase Storage tiene políticas de seguridad (RLS) que están bloqueando la subida de archivos.

---

## ✅ Solución en 3 Pasos

### **Paso 1: Actualizar Credenciales** ✓ COMPLETADO

Las nuevas credenciales S3 ya están en `.env.local`:
```env
SUPABASE_S3_ACCESS_KEY_ID=67115d326da118f639ecea40f87cbdb4
SUPABASE_S3_SECRET_ACCESS_KEY=29fd480174691f191b45741e6d23f6e2d0275d1ee86a563432ae726c242411a8
```

### **Paso 2: Ejecutar Script SQL en Supabase**

1. **Abrir Supabase Dashboard:**
   - Ve a https://supabase.com/dashboard
   - Selecciona tu proyecto
   - Click en **"SQL Editor"** en el menú lateral

2. **Ejecutar el script:**
   - Copia TODO el contenido del archivo `supabase_storage_policies.sql`
   - Pégalo en el SQL Editor
   - Click en **"Run"** (o Ctrl+Enter)

3. **Verificar resultado:**
   - Deberías ver mensaje: "Success. No rows returned"
   - Esto significa que las políticas se crearon correctamente

### **Paso 3: Verificar Configuración del Bucket**

1. **Ir a Storage:**
   - En Supabase Dashboard → **"Storage"**
   - Busca el bucket **"productos"**

2. **Si NO existe el bucket:**
   ```
   Click en "New bucket"
   ├── Name: productos
   ├── Public bucket: ✅ SÍ (IMPORTANTE)
   ├── File size limit: 5 MB
   └── Allowed MIME types: image/jpeg, image/png, image/webp
   ```

3. **Si YA existe el bucket:**
   - Click en el bucket "productos"
   - Click en el ícono de configuración (⚙️)
   - Asegúrate que **"Public bucket"** esté **ACTIVADO** ✅

---

## 🎯 ¿Por Qué Funciona?

El script SQL crea una política especial llamada **"Anyone can upload productos"** que permite:

```sql
CREATE POLICY "Anyone can upload productos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'productos');
```

Esto permite que **cualquier usuario** (incluso no autenticado) pueda subir imágenes al bucket `productos` usando la clave anónima (`anon_key`).

**Es seguro porque:**
- Solo afecta al bucket `productos`
- Solo permite operaciones de INSERT (subir)
- Las imágenes de productos son públicas por naturaleza
- No expone datos sensibles

---

## 🧪 Probar la Solución

Después de ejecutar el script SQL:

1. **Reiniciar el servidor de desarrollo:**
   ```bash
   # Presiona Ctrl+C en la terminal donde corre npm run dev
   # Luego ejecuta de nuevo:
   npm run dev
   ```

2. **Probar subida de imagen:**
   - Ve a **Admin → Productos**
   - Click en **"Crear producto"**
   - Completa los campos
   - Scroll hasta **"Imagen del producto"**
   - Click en **"Seleccionar imagen"**
   - Elige una imagen
   - Debería subirse sin errores

3. **Verificar resultado:**
   - La imagen debería aparecer como preview
   - Al guardar el producto, debería mostrarse en la lista
   - Puedes verificar en Supabase Storage → productos que el archivo existe

---

## 🐛 Si Sigue Sin Funcionar

### Verificar Políticas Aplicadas

En Supabase Dashboard → SQL Editor, ejecuta:

```sql
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%productos%';
```

**Deberías ver:**
- `Anyone can upload productos` - cmd: INSERT
- `Public read access productos` - cmd: SELECT
- `Authenticated users can update productos` - cmd: UPDATE
- `Authenticated users can delete productos` - cmd: DELETE

### Verificar Bucket

```sql
SELECT 
  id,
  name,
  public
FROM storage.buckets
WHERE name = 'productos';
```

**Debería retornar:**
- name: `productos`
- public: `true` ✓

### Revisar Logs

En Supabase Dashboard → Logs → Storage Logs:
- Busca errores relacionados con `productos`
- Verifica que no haya errores de autenticación

---

## 📋 Checklist Final

Antes de probar de nuevo, verifica:

- [ ] ✅ Credenciales S3 actualizadas en `.env.local`
- [ ] ✅ Script SQL ejecutado sin errores
- [ ] ✅ Bucket `productos` existe
- [ ] ✅ Bucket `productos` es PÚBLICO
- [ ] ✅ Servidor reiniciado (`npm run dev`)
- [ ] ✅ Sin errores en la consola del navegador

---

## 🎉 Resultado Esperado

Después de estos pasos, deberías poder:

✅ Subir imágenes al crear productos  
✅ Ver el preview de la imagen  
✅ Guardar el producto con la imagen  
✅ Ver la imagen en la lista de productos  
✅ Editar y cambiar la imagen  

---

## 📞 Si Necesitas Ayuda

Si después de seguir estos pasos sigue sin funcionar:

1. **Copia el error completo** de la consola del navegador (F12)
2. **Verifica los logs de Supabase** Dashboard → Logs
3. **Comparte:**
   - El mensaje de error exacto
   - El resultado de las queries de verificación
   - Captura de pantalla del bucket en Storage

---

**Fecha:** 3 de noviembre de 2025  
**Proyecto:** Thiart 3D  
**Archivo de referencia:** `supabase_storage_policies.sql`
