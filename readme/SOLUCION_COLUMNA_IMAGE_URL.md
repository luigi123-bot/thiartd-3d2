# 🔧 Solución: Error "Could not find the 'image_url' column"

## ❌ Error Actual

```
Error al guardar producto: Could not find the 'image_url' column of 'productos' in the schema cache
```

**Causa:** La columna `image_url` no existe en la tabla `productos` de tu base de datos Supabase.

---

## ✅ Solución Rápida (2 minutos)

### **Opción A: Script SQL Automático** (Recomendado)

1. **Abrir Supabase Dashboard:**
   - Ve a https://supabase.com/dashboard
   - Selecciona tu proyecto
   - Click en **"SQL Editor"**

2. **Ejecutar script:**
   - Copia TODO el contenido del archivo `add_image_url_column.sql`
   - Pégalo en el SQL Editor
   - Click en **"Run"** (o presiona Ctrl+Enter)

3. **Verificar resultado:**
   - Deberías ver: "Columna image_url agregada correctamente"
   - Y una tabla mostrando todas las columnas de `productos`

### **Opción B: SQL Manual** (Si prefieres hacerlo paso a paso)

En Supabase Dashboard → SQL Editor, ejecuta:

```sql
-- Agregar la columna image_url
ALTER TABLE productos 
ADD COLUMN image_url TEXT;

-- Verificar que se agregó
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'productos';
```

---

## 🔍 Verificar que Funcionó

Después de ejecutar el script, verifica:

1. **En SQL Editor, ejecuta:**
   ```sql
   SELECT * FROM productos LIMIT 1;
   ```
   
   Deberías ver la columna `image_url` en los resultados.

2. **En la interfaz de Table Editor:**
   - Supabase Dashboard → **"Table Editor"**
   - Selecciona la tabla **"productos"**
   - Deberías ver la columna `image_url` al final

---

## 🎯 Estructura Final de la Tabla

Después de agregar la columna, tu tabla `productos` debería tener:

```
productos
├── id (integer, primary key)
├── nombre (varchar/text)
├── descripcion (text)
├── precio (numeric)
├── tamano (varchar)
├── categoria (varchar)
├── stock (integer)
├── detalles (text)
├── destacado (boolean)
├── image_url (text) ← NUEVA COLUMNA
├── user_id (uuid, foreign key)
├── created_at (timestamp)
└── updated_at (timestamp)
```

---

## 🧪 Probar la Solución

1. **Actualizar el schema en tu código:**
   - No necesitas cambiar nada en el código, ya está preparado
   - El campo `image_url` es opcional (nullable)

2. **Probar crear producto:**
   - Ve a **Admin → Productos**
   - Click en **"Crear producto"**
   - Completa los campos
   - Sube una imagen
   - Click en **"Guardar producto"**
   - ¡Ahora debería funcionar! ✅

---

## 🐛 Si Sigue Sin Funcionar

### Error Persiste Después de Agregar Columna

**Causa:** El schema cache de Supabase necesita actualizarse.

**Solución:**
1. En Supabase Dashboard → **Settings** → **Database**
2. Scroll hasta **"Connection pooling"**
3. Click en **"Reset connection pool"**
4. Espera 30 segundos
5. Intenta de nuevo

### Verificar Permisos RLS

Si la columna existe pero sigue dando error:

```sql
-- Verificar políticas de la tabla productos
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'productos';
```

---

## 📋 Checklist Completo

Para que todo funcione correctamente:

### Base de Datos
- [ ] ✅ Columna `image_url` agregada a tabla `productos`
- [ ] ✅ Script `add_image_url_column.sql` ejecutado sin errores
- [ ] ✅ Columna visible en Table Editor

### Storage
- [ ] ✅ Bucket `productos` creado
- [ ] ✅ Bucket `productos` es público
- [ ] ✅ Políticas RLS de Storage aplicadas (archivo `supabase_storage_policies.sql`)

### Configuración
- [ ] ✅ Credenciales S3 en `.env.local`
- [ ] ✅ Servidor reiniciado (`npm run dev`)

---

## 🎉 Después de la Solución

Una vez agregada la columna, podrás:

✅ Crear productos con imágenes  
✅ Editar productos y cambiar imágenes  
✅ Ver las imágenes en la lista de productos  
✅ Las imágenes se guardan en Supabase Storage  
✅ Las URLs se guardan en la base de datos  

---

## 🔄 Migración de Productos Existentes

Si ya tienes productos en la base de datos sin imagen:

```sql
-- Los productos existentes tendrán image_url = NULL
-- Esto es correcto y no causa problemas

-- Para actualizar un producto específico con una imagen:
UPDATE productos 
SET image_url = 'https://tu-url-de-imagen.com/imagen.jpg'
WHERE id = 123;

-- Verificar productos sin imagen:
SELECT id, nombre, image_url 
FROM productos 
WHERE image_url IS NULL;
```

---

## 📞 Orden de Ejecución

Si estás configurando todo desde cero, sigue este orden:

1. **Primero:** Ejecutar `add_image_url_column.sql` (agregar columna)
2. **Segundo:** Crear bucket `productos` en Storage
3. **Tercero:** Ejecutar `supabase_storage_policies.sql` (políticas RLS)
4. **Cuarto:** Verificar credenciales en `.env.local`
5. **Quinto:** Reiniciar servidor y probar

---

**Fecha:** 3 de noviembre de 2025  
**Proyecto:** Thiart 3D  
**Archivo de referencia:** `add_image_url_column.sql`
