# 📦 Guía de Modelos 3D en Thiart 3D

## 🎯 Resumen de la Implementación

Se ha agregado funcionalidad completa para subir y visualizar modelos 3D en los productos. Los usuarios ahora pueden:

- ✅ Subir archivos 3D en formatos **GLB**, **GLTF** y **STL**
- ✅ Visualizar modelos 3D interactivos con controles de rotación, zoom y pan
- ✅ Previsualizar modelos en tiempo real antes de guardar
- ✅ Gestionar modelos desde el panel de administración

---

## 📋 Pasos de Configuración

### 1. Ejecutar Script SQL en Supabase

1. Ve a tu proyecto en Supabase
2. Abre **SQL Editor**
3. Copia y ejecuta el contenido de `setup_modelos_3d.sql`
4. Verifica que aparezcan los mensajes de éxito:
   - ✅ Columna `model_url` agregada
   - ✅ Bucket `models` creado
   - ✅ 4 políticas RLS configuradas

### 2. Verificar Variables de Entorno

Asegúrate de que tu `.env.local` contiene:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

### 3. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

---

## 🗂️ Archivos Modificados/Creados

### 📄 Base de Datos y Backend

1. **`src/db/schema.ts`**
   - Agregado campo `model_url: text("model_url")`

2. **`src/lib/supabase-storage.ts`**
   - Nuevo bucket: `MODELS = 'models'`
   - Nueva función: `uploadModel3D(file, productId)`
   - Soporta GLB, GLTF, STL (hasta 50MB)

3. **`src/app/api/productos/route.ts`**
   - POST ahora acepta campo `model_url`

4. **`src/app/api/productos/[id]/route.ts`**
   - PUT ahora acepta campo `model_url`

### 🎨 Componentes Frontend

5. **`src/components/Model3DViewer.tsx`** ⭐ NUEVO
   - Visor 3D interactivo con Three.js
   - Controles de rotación, zoom, pan
   - Iluminación y ambiente configurables
   - Grid y sombras opcionales

6. **`src/components/FileUploadWidget.tsx`**
   - Nuevo componente: `ProductModel3DUpload`
   - Acepta `.glb`, `.gltf`, `.stl`

7. **`src/app/tienda/productos/CreateProductModal.tsx`**
   - Nueva sección "Modelo 3D (opcional)"
   - Preview del modelo en tiempo real
   - Botón para eliminar modelo

8. **`src/hooks/useFileUpload.ts`**
   - Soporte para bucket `MODELS`

### 📜 Scripts SQL

9. **`setup_modelos_3d.sql`** ⭐ NUEVO
   - Script completo de configuración
   - Incluye verificaciones y rollback

---

## 🎮 Uso para Desarrolladores

### Subir un Modelo 3D

```typescript
import { uploadModel3D } from '~/lib/supabase-storage'

const file = // archivo seleccionado
const productId = "producto-123"

try {
  const modelUrl = await uploadModel3D(file, productId)
  console.log('Modelo subido:', modelUrl)
} catch (error) {
  console.error('Error:', error.message)
}
```

### Mostrar un Modelo 3D

```tsx
import { Model3DViewer } from '~/components/Model3DViewer'

<Model3DViewer 
  modelUrl={producto.model_url}
  height="400px"
  showControls={true}
  autoRotate={false}
/>
```

### Preview Pequeño (Para Cards)

```tsx
import { Model3DPreview } from '~/components/Model3DViewer'

<Model3DPreview 
  modelUrl={producto.model_url}
  className="rounded-lg"
/>
```

---

## 🎯 Formatos Soportados

| Formato | Extensión | MIME Type | Uso Recomendado |
|---------|-----------|-----------|------------------|
| **GLB** | `.glb` | `model/gltf-binary` | ✅ **Recomendado** - Formato compacto, ideal para web |
| **GLTF** | `.gltf` | `model/gltf+json` | Para desarrollo/edición |
| **STL** | `.stl` | `model/stl`, `application/sla` | Para impresión 3D |

### ⚠️ Nota sobre STL

El visor actual está optimizado para **GLB/GLTF**. Los archivos STL se pueden subir pero necesitarían un loader adicional (`STLLoader` de Three.js) para visualizarse correctamente.

---

## 🎨 Características del Visor 3D

### Controles Interactivos

- 🖱️ **Click y arrastrar**: Rotar el modelo
- 🔍 **Rueda del mouse**: Zoom in/out
- 🖱️ **Click derecho + arrastrar**: Pan (mover cámara)

### Botones de UI

- 🔄 **Rotación automática**: Activa/desactiva rotación continua
- ➕ **Zoom In**: Acercar la cámara
- ➖ **Zoom Out**: Alejar la cámara
- 📐 **Reset**: Restablecer vista inicial

### Ambiente Visual

- 💡 Iluminación realista (ambient + spotlight + point light)
- 🌆 Environment mapping para reflejos
- 📊 Grid inferior opcional
- 🎨 Gradiente de fondo

---

## 📊 Configuración del Bucket

### Detalles Técnicos

```javascript
Bucket ID: 'models'
Público: Sí
Tamaño máximo: 50MB
MIME Types permitidos:
  - model/gltf-binary
  - model/gltf+json
  - model/stl
  - application/sla
  - application/octet-stream
```

### Políticas RLS

1. ✅ **INSERT**: Cualquiera puede subir modelos
2. ✅ **SELECT**: Lectura pública (sin autenticación)
3. ✅ **UPDATE**: Cualquiera puede actualizar
4. ✅ **DELETE**: Cualquiera puede eliminar

---

## 🚀 Flujo de Usuario

### Crear Producto con Modelo 3D

1. Usuario abre modal "Añadir nuevo producto"
2. Completa información básica (nombre, precio, etc.)
3. Sube imagen del producto (opcional)
4. Sube modelo 3D (GLB/GLTF/STL) (opcional)
5. Ve preview en tiempo real del modelo 3D
6. Guarda el producto
7. El modelo 3D se muestra en la tienda

### Ver Producto con Modelo 3D

1. Usuario navega a la tienda
2. Ve productos con sus imágenes
3. Si el producto tiene modelo 3D:
   - Se muestra un visor 3D interactivo
   - Puede rotar, hacer zoom, explorar
4. Puede agregar el producto al carrito

---

## 🛠️ Troubleshooting

### Error: "El bucket models no existe"

**Solución**: Ejecuta el script `setup_modelos_3d.sql` en Supabase SQL Editor

### Error: "Faltan políticas RLS"

**Solución**: Verifica que las 4 políticas se crearon correctamente:
```sql
SELECT policyname FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%modelos 3D%';
```

### El modelo no se visualiza

**Causas comunes**:
1. Archivo STL (necesita loader adicional)
2. Archivo corrupto o mal formateado
3. URL incorrecta

**Solución**: Usa archivos GLB para mejor compatibilidad

### Modelo demasiado grande

**Límite**: 50MB

**Solución**: 
- Usa herramientas como [glTF-Transform](https://gltf-transform.donmccurdy.com/) para comprimir
- Reduce el número de polígonos en Blender
- Optimiza texturas

---

## 📦 Dependencias Instaladas

Las siguientes librerías ya están en el proyecto:

```json
"@react-three/fiber": "^9.1.2",
"@react-three/drei": "^10.3.0", 
"three": "^0.177.0",
"@types/three": "^0.177.0"
```

---

## 🎓 Recursos Adicionales

- [Three.js Documentation](https://threejs.org/docs/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/)
- [glTF Format Specification](https://www.khronos.org/gltf/)
- [Blender (3D Modeling)](https://www.blender.org/)
- [glTF Viewer Online](https://gltf-viewer.donmccurdy.com/)

---

## ✅ Checklist de Implementación

- [x] Agregar campo `model_url` a base de datos
- [x] Crear bucket `models` en Supabase
- [x] Configurar políticas RLS
- [x] Crear función `uploadModel3D()`
- [x] Crear componente `Model3DViewer`
- [x] Crear componente `ProductModel3DUpload`
- [x] Actualizar API POST `/api/productos`
- [x] Actualizar API PUT `/api/productos/[id]`
- [x] Actualizar `CreateProductModal` con sección 3D
- [x] Agregar soporte en `useFileUpload` hook
- [x] Documentación completa

---

## 📝 Próximos Pasos (Opcional)

### Mejoras Sugeridas

1. **Soporte completo para STL**
   ```typescript
   import { STLLoader } from 'three/examples/jsm/loaders/STLLoader'
   ```

2. **Carga diferida de modelos**
   - Mostrar miniatura primero
   - Cargar modelo 3D al hacer click

3. **Editor de modelos básico**
   - Cambiar colores
   - Agregar texturas
   - Escalar modelo

4. **Compresión automática**
   - Comprimir archivos grandes antes de subir
   - Usar Draco compression para GLB

5. **Galería 3D**
   - Vista en galería de todos los modelos
   - Comparar productos en 3D

---

## 🤝 Soporte

Si encuentras problemas:

1. Revisa esta guía completa
2. Verifica que el script SQL se ejecutó correctamente
3. Inspecciona la consola del navegador para errores
4. Verifica logs del servidor con `console.log`

---

**¡La funcionalidad de modelos 3D está completa y lista para usar!** 🎉
