# 🚀 Guía Paso a Paso: Configurar Imágenes de Productos

## 📋 Resumen del Problema

Tienes 3 errores que resolver en orden:

1. ❌ **Columna faltante:** `image_url` no existe en la tabla
2. ❌ **Bucket faltante:** No existe el bucket `productos` en Storage
3. ❌ **Políticas RLS:** No hay permisos para subir archivos

**Solución:** Un solo script SQL que arregla los 3 problemas

---

## ✅ Solución en 5 Minutos

### **Paso 1: Abrir Supabase Dashboard**

1. Ve a: https://supabase.com/dashboard
2. Inicia sesión
3. Selecciona tu proyecto: **thiartd-3d2** (o el nombre que tenga)

### **Paso 2: Ir al SQL Editor**

1. En el menú lateral izquierdo, busca el ícono **"SQL Editor"** 
2. Click en **"SQL Editor"**
3. Se abrirá un editor de código

### **Paso 3: Ejecutar el Script de Setup**

1. **Abrir el archivo:** `setup_productos_imagenes_completo.sql`
2. **Copiar TODO el contenido** (Ctrl+A, Ctrl+C)
3. **Pegar en el SQL Editor** de Supabase (Ctrl+V)
4. **Click en el botón verde "Run"** (o presiona Ctrl+Enter)

### **Paso 4: Verificar Resultados**

Deberías ver **3 tablas de resultados** en la parte inferior:

**Tabla 1: Columna image_url**
```
column_name | data_type | is_nullable
image_url   | text      | YES
```
✅ Si ves esto, la columna se agregó correctamente

**Tabla 2: Bucket productos**
```
id        | name      | public | file_size_limit
productos | productos | true   | 5242880
```
✅ Si ves esto, el bucket se creó correctamente

**Tabla 3: Políticas RLS (4 filas)**
```
policyname                              | cmd
Anyone can upload productos             | INSERT
Authenticated users can delete productos| DELETE
Authenticated users can update productos| UPDATE
Public read access productos            | SELECT
```
✅ Si ves 4 políticas, todo está configurado

### **Paso 5: Reiniciar Servidor de Desarrollo**

En tu terminal:

```bash
# Presiona Ctrl+C para detener el servidor
# Luego ejecuta de nuevo:
npm run dev
```

### **Paso 6: Probar la Funcionalidad**

1. Ve a: http://localhost:3000/admin/productos
2. Click en **"Crear producto"**
3. Completa todos los campos
4. Scroll hasta **"Imagen del producto"**
5. Click en **"Seleccionar imagen"**
6. Elige una imagen (JPEG, PNG o WebP)
7. Espera a que se suba (verás una barra de progreso)
8. Click en **"Guardar producto"**

**Resultado esperado:**
- ✅ El producto se guarda sin errores
- ✅ La imagen aparece en la tarjeta del producto
- ✅ Puedes ver el producto con su imagen en la lista

---

## 🎯 ¿Qué Hace el Script?

El script `setup_productos_imagenes_completo.sql` ejecuta estas acciones:

### 1. Agrega la Columna `image_url`
```sql
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS image_url TEXT;
```
- Agrega la columna si no existe
- Tipo TEXT para URLs largas
- Permite NULL (productos sin imagen)

### 2. Crea el Bucket `productos`
```sql
INSERT INTO storage.buckets (id, name, public, ...)
```
- Crea el bucket para almacenar imágenes
- Lo marca como PÚBLICO (para verlas sin login)
- Límite de 5MB por archivo
- Solo permite JPEG, PNG, WebP

### 3. Configura Políticas RLS
```sql
CREATE POLICY "Anyone can upload productos"...
```
- Permite LEER imágenes sin autenticación
- Permite SUBIR imágenes con la anon key
- Permite EDITAR/ELIMINAR solo a usuarios autenticados

---

## 🐛 Troubleshooting

### "Error: relation 'productos' does not exist"

**Problema:** La tabla productos no existe en tu base de datos.

**Solución:**
1. Ve a Supabase Dashboard → **Table Editor**
2. Verifica que exista la tabla **productos**
3. Si no existe, necesitas crear primero la estructura base de datos

### "Error: permission denied for schema storage"

**Problema:** No tienes permisos para modificar Storage.

**Solución:**
1. Verifica que estás usando el **SQL Editor** de Supabase (no otro cliente)
2. El script debe ejecutarse con la conexión del dashboard
3. Si persiste, contacta soporte de Supabase

### El Script se Ejecuta pero No Veo Resultados

**Solución:**
1. Scroll hacia abajo en el SQL Editor
2. Los resultados aparecen en la parte inferior
3. Deberías ver 3 tablas con datos

### Sigue Dando Error al Subir Imagen

**Verificar paso a paso:**

1. **Verificar columna:**
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'productos' AND column_name = 'image_url';
   ```
   Debe retornar: `image_url`

2. **Verificar bucket:**
   ```sql
   SELECT id, public FROM storage.buckets WHERE id = 'productos';
   ```
   Debe retornar: `productos | true`

3. **Verificar políticas:**
   ```sql
   SELECT COUNT(*) FROM pg_policies 
   WHERE tablename = 'objects' AND policyname LIKE '%productos%';
   ```
   Debe retornar: `4`

---

## 📊 Estructura Final

Después de ejecutar el script, tu configuración será:

```
Base de Datos
└── Tabla: productos
    ├── id (PK)
    ├── nombre
    ├── descripcion
    ├── precio
    ├── stock
    ├── categoria
    ├── tamano
    ├── detalles
    ├── destacado
    └── image_url ← NUEVO

Storage
└── Bucket: productos (PÚBLICO)
    ├── Tamaño máximo: 5 MB
    ├── Tipos: JPEG, PNG, WebP
    └── Políticas RLS: 4 políticas activas
```

---

## 🎉 Resultado Final

Una vez completados los pasos:

✅ **Podrás crear productos con imágenes**
- Sube imágenes desde el modal de crear producto
- Preview instantáneo de la imagen
- Optimización automática (reduce tamaño si es muy grande)

✅ **Las imágenes se mostrarán en la portada**
- Cada producto muestra su imagen
- Fallback al logo de Thiart si no hay imagen
- Responsive en todos los dispositivos

✅ **Podrás editar las imágenes**
- Click en editar producto
- Elimina la imagen actual
- Sube una nueva imagen

---

## 📞 Si Necesitas Ayuda

Si después de seguir todos los pasos sigue sin funcionar:

1. **Captura de pantalla del error** en la consola del navegador (F12)
2. **Resultado del script SQL** (las 3 tablas de verificación)
3. **Logs de Supabase** (Dashboard → Logs → Storage Logs)

---

## ⏱️ Tiempo Estimado

- **Ejecutar script SQL:** 30 segundos
- **Reiniciar servidor:** 10 segundos
- **Probar subida:** 1 minuto
- **Total:** ~2 minutos

---

**¡IMPORTANTE!** No te saltes ningún paso. Ejecuta en orden:
1. Script SQL → 2. Verificar resultados → 3. Reiniciar servidor → 4. Probar

---

**Fecha:** 3 de noviembre de 2025  
**Proyecto:** Thiart 3D  
**Archivo:** `setup_productos_imagenes_completo.sql`
