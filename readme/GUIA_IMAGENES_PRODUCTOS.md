# 📸 Guía de Uso: Subir Imágenes de Productos

## ✅ Funcionalidad Implementada

Se ha integrado el sistema de subida de imágenes de productos que:

- ✅ Permite subir imágenes al crear nuevos productos
- ✅ Permite editar/actualizar imágenes de productos existentes
- ✅ Guarda las imágenes en Supabase Storage (bucket `productos`)
- ✅ Muestra las imágenes en la portada de productos
- ✅ Optimiza automáticamente las imágenes antes de subirlas
- ✅ Valida el tipo y tamaño de archivo (máximo 5MB)
- ✅ Muestra preview en tiempo real

---

## 🎯 Cómo Usar

### 1. Crear Producto con Imagen

1. Ve a **Admin → Productos**
2. Click en botón **"Crear producto"**
3. Completa los datos del producto:
   - Nombre
   - Precio
   - Descripción
   - Tamaño
   - Categoría
   - Stock
   - Detalles

4. **Subir imagen:**
   - Scroll hasta la sección "Imagen del producto"
   - Click en **"Seleccionar imagen"**
   - Elige una imagen (JPEG, PNG o WebP)
   - Espera a que se suba (verás una barra de progreso)
   - Se mostrará un preview de la imagen

5. Click en **"Guardar producto"**

### 2. Editar Imagen de Producto Existente

1. En la lista de productos, click en **"Editar"** sobre el producto
2. En el modal, scroll hasta "Imagen del producto"
3. Si ya tiene imagen, verás:
   - La imagen actual
   - Un botón ❌ en la esquina para eliminarla
4. Para cambiar la imagen:
   - Click en ❌ para eliminar la actual
   - Click en **"Seleccionar imagen"** para subir una nueva
5. Click en **"Actualizar producto"**

### 3. Ver Imágenes en la Portada

Las imágenes se muestran automáticamente en:
- **Lista de productos en Admin**: Cada tarjeta muestra la imagen del producto
- **Tienda (frontend)**: Los productos mostrarán su imagen

Si un producto no tiene imagen, se muestra el logo por defecto de Thiart.

---

## 🔧 Configuración Técnica

### Archivos Modificados

1. **`src/app/tienda/productos/CreateProductModal.tsx`**
   - Agregado campo `image_url` al formulario
   - Integrado componente `ProductImageUpload`
   - Preview de imagen con opción de eliminar
   - Manejo de estado de imagen

2. **`src/app/admin/productos/page.tsx`**
   - Agregado campo `image_url` a interface Producto
   - Modificado componente Image para mostrar imagen del producto o logo por defecto

3. **`src/app/api/productos/route.ts`**
   - Agregado campo `image_url` al crear productos (POST)

4. **`src/app/api/productos/[id]/route.ts`** (nuevo archivo)
   - Endpoint PUT para actualizar productos
   - Endpoint DELETE para eliminar productos
   - Soporte para campo `image_url`

5. **`next.config.js`**
   - Configurado `remotePatterns` para permitir imágenes de Supabase Storage

### Requisitos de Supabase

**IMPORTANTE:** Debes tener configurado el bucket de Supabase Storage:

1. **Crear bucket `productos`:**
   ```
   - Nombre: productos
   - Público: ✅ SÍ (para que las imágenes se vean sin autenticación)
   - Límite de tamaño: 5 MB por archivo
   - Tipos permitidos: image/jpeg, image/png, image/webp
   ```

2. **Configurar políticas RLS:**
   ```sql
   -- Permitir lectura pública
   CREATE POLICY "Public read access"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'productos');

   -- Permitir upload a usuarios autenticados
   CREATE POLICY "Authenticated users can upload"
   ON storage.objects FOR INSERT
   WITH CHECK (bucket_id = 'productos' AND auth.role() = 'authenticated');

   -- Permitir delete a usuarios autenticados de sus archivos
   CREATE POLICY "Users can delete own files"
   ON storage.objects FOR DELETE
   USING (bucket_id = 'productos' AND auth.uid()::text = (storage.foldername(name))[1]);
   ```

3. **Variables de entorno requeridas:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
   ```

---

## 📋 Validaciones Implementadas

### Validación de Archivo

- ✅ **Tipo:** Solo JPEG, PNG y WebP
- ✅ **Tamaño:** Máximo 5MB
- ✅ **Optimización:** Las imágenes se redimensionan automáticamente a máximo 1200px de ancho
- ✅ **Compresión:** Se aplica compresión JPEG con calidad 80%

### Mensajes de Error

El componente muestra errores claros:
- "El archivo debe ser menor a 5MB"
- "Tipo de archivo no permitido"
- "Error al subir imagen: [detalles del error]"

---

## 🎨 Experiencia de Usuario

### Durante la Subida

1. Selección de archivo
2. Barra de progreso (0% → 20% → 40% → 100%)
3. Preview de la imagen con checkmark verde ✓
4. Opción para eliminar y subir otra

### Después de Guardar

- La imagen se guarda en Supabase Storage
- La URL se guarda en la base de datos (campo `image_url`)
- El producto muestra la imagen en la lista
- La imagen es accesible públicamente

---

## 🐛 Troubleshooting

### "Error al subir imagen"

**Posibles causas:**
1. El bucket `productos` no existe en Supabase
2. Las políticas RLS no están configuradas
3. Variables de entorno incorrectas
4. Archivo muy grande (>5MB)

**Solución:**
1. Verificar que el bucket existe: Supabase Dashboard → Storage
2. Aplicar las políticas RLS mencionadas arriba
3. Verificar `.env.local`
4. Reducir tamaño de imagen

### Las imágenes no se muestran

**Posibles causas:**
1. El bucket no es público
2. Error en `next.config.js`
3. URL incorrecta

**Solución:**
1. Verificar que el bucket tiene acceso público
2. Verificar que `remotePatterns` está configurado en `next.config.js`
3. Inspeccionar la URL en Network tab del navegador

### "Failed to fetch" al guardar producto

**Causa:** El endpoint `/api/productos/[id]` no existe o tiene error

**Solución:**
1. Verificar que existe `src/app/api/productos/[id]/route.ts`
2. Reiniciar el servidor de desarrollo: `npm run dev`

---

## 🚀 Próximos Pasos Recomendados

### Mejoras Opcionales

1. **Múltiples imágenes por producto:**
   - Modificar schema para agregar array `images: string[]`
   - Componente para subir varias imágenes
   - Galería con carousel

2. **Drag & Drop:**
   - Integrar librería como `react-dropzone`
   - Permitir arrastrar imágenes directamente

3. **Recortar imagen:**
   - Integrar `react-image-crop`
   - Permitir al usuario recortar antes de subir

4. **Variantes de imagen:**
   - Generar thumbnails automáticamente
   - Versiones para móvil/desktop

---

## 📊 Estructura de Datos

### Tabla `productos` (campo agregado)

```typescript
interface Producto {
  id: number
  nombre: string
  descripcion: string
  precio: number
  tamano: string
  categoria: string
  stock: number
  detalles: string
  destacado: boolean
  image_url?: string  // ← Campo nuevo
}
```

### Supabase Storage

```
productos/
├── productId_timestamp.jpg
├── productId_timestamp.png
└── productId_timestamp.webp
```

Formato de nombre: `{productId}_{timestamp}.{extension}`

Ejemplo: `new_1730675432123.jpg`

---

## ✨ Componentes Creados

### `ProductImageUpload` 

Componente especializado para subir imágenes de productos:

```tsx
<ProductImageUpload
  productId="123"
  onUploadComplete={(url) => {
    console.log('Imagen subida:', url)
    setImageUrl(url)
  }}
/>
```

**Props:**
- `productId`: ID del producto (puede ser "new" para productos nuevos)
- `onUploadComplete`: Callback con la URL de la imagen subida
- `className`: Clases CSS opcionales

---

## 📝 Notas Importantes

1. **Las imágenes son públicas:** Cualquiera con la URL puede ver la imagen
2. **No se eliminan automáticamente:** Si eliminas un producto, la imagen permanece en Storage
3. **El campo es opcional:** Puedes crear productos sin imagen
4. **Optimización automática:** Las imágenes grandes se redimensionan a 1200px de ancho

---

## 🎉 ¡Listo!

Ahora puedes crear productos con imágenes que se mostrarán automáticamente en:
- Panel de administración
- Tienda frontend
- Detalles de producto

**Recuerda:** Debes tener el bucket `productos` configurado en Supabase antes de usar esta funcionalidad.

---

**Fecha de creación:** 3 de noviembre de 2025  
**Versión:** 1.0  
**Proyecto:** Thiart 3D
