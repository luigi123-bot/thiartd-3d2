# 📸 Sistema de Múltiples Imágenes por Producto

## 🎯 Características Implementadas

### ✅ Nuevas Funcionalidades
1. **Múltiples imágenes por producto** - Cada producto puede tener varias imágenes
2. **Sistema de portada** - La primera imagen es automáticamente la portada
3. **Orden personalizado** - Las imágenes se ordenan según su posición
4. **Videos integrados** - URL de video almacenada en base de datos
5. **Modelos 3D** - URL del modelo 3D almacenada en base de datos
6. **Galería mejorada** - Renderiza todas las imágenes en el carrusel

---

## 📊 Estructura de Base de Datos

### Tabla: `producto_imagenes`
```sql
- id: SERIAL PRIMARY KEY
- producto_id: INTEGER (FK a productos)
- image_url: TEXT (URL de la imagen)
- orden: INTEGER (orden de visualización, 0 es primero)
- es_portada: BOOLEAN (indica si es la imagen principal)
- alt_text: VARCHAR(255) (texto alternativo para SEO)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Tabla: `productos` (actualizada)
```sql
- ... columnas existentes ...
- image_url: TEXT (deprecated, usar producto_imagenes)
- modelo_url: TEXT (URL del modelo 3D GLB/GLTF)
- video_url: TEXT (URL del video MP4/WEBM)
```

---

## 🚀 Pasos de Instalación

### 1️⃣ Ejecutar Migración en Supabase

```bash
# Opción A: Desde Supabase Dashboard
1. Ve a tu proyecto en https://supabase.com
2. Navega a SQL Editor
3. Copia y pega el contenido de: migrations/add_product_images.sql
4. Ejecuta el script
5. Verifica que no haya errores

# Opción B: Desde línea de comandos
npx supabase db push
```

### 2️⃣ Verificar la Migración

Ejecuta este SQL para verificar:
```sql
-- Verificar que la tabla existe
SELECT * FROM producto_imagenes LIMIT 1;

-- Verificar columnas en productos
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'productos' 
AND column_name IN ('modelo_url', 'video_url');

-- Ver imágenes migradas
SELECT p.nombre, pi.image_url, pi.orden, pi.es_portada
FROM productos p
LEFT JOIN producto_imagenes pi ON p.id = pi.producto_id
LIMIT 10;
```

---

## 💻 Uso en el Código

### Consultar Producto con Imágenes

```typescript
// En tu API o componente
const { data: producto } = await supabase
  .from('productos')
  .select(`
    *,
    producto_imagenes(
      id,
      image_url,
      orden,
      es_portada,
      alt_text
    )
  `)
  .eq('id', productoId)
  .order('orden', { 
    foreignTable: 'producto_imagenes', 
    ascending: true 
  })
  .single();

// Resultado:
// {
//   id: 1,
//   nombre: "Producto X",
//   video_url: "https://...",
//   modelo_url: "https://...",
//   producto_imagenes: [
//     { id: 1, image_url: "...", orden: 0, es_portada: true },
//     { id: 2, image_url: "...", orden: 1, es_portada: false },
//     { id: 3, image_url: "...", orden: 2, es_portada: false }
//   ]
// }
```

### Insertar Producto con Múltiples Imágenes

```typescript
// 1. Crear el producto
const { data: producto, error } = await supabase
  .from('productos')
  .insert({
    nombre: "Mi Producto",
    descripcion: "Descripción...",
    precio: 50000,
    video_url: "https://storage.supabase.co/videos/...",
    modelo_url: "https://storage.supabase.co/models/..."
  })
  .select()
  .single();

// 2. Insertar las imágenes
if (producto) {
  const imagenes = [
    { 
      producto_id: producto.id, 
      image_url: "https://...", 
      orden: 0, 
      es_portada: true, // Primera imagen es portada
      alt_text: "Vista frontal"
    },
    { 
      producto_id: producto.id, 
      image_url: "https://...", 
      orden: 1, 
      es_portada: false,
      alt_text: "Vista lateral"
    },
    { 
      producto_id: producto.id, 
      image_url: "https://...", 
      orden: 2, 
      es_portada: false,
      alt_text: "Vista superior"
    }
  ];

  await supabase
    .from('producto_imagenes')
    .insert(imagenes);
}
```

### Actualizar Orden de Imágenes

```typescript
// Cambiar orden de una imagen
await supabase
  .from('producto_imagenes')
  .update({ orden: 1 })
  .eq('id', imagenId);

// Cambiar portada
await supabase
  .from('producto_imagenes')
  .update({ es_portada: true })
  .eq('id', nuevaPortadaId);
// Nota: El trigger automáticamente desmarcará las otras
```

---

## 🎨 Componente de Galería (Ejemplo)

```tsx
interface ProductoConImagenes {
  id: number;
  nombre: string;
  video_url?: string;
  modelo_url?: string;
  producto_imagenes: Array<{
    id: number;
    image_url: string;
    orden: number;
    es_portada: boolean;
    alt_text?: string;
  }>;
}

function GaleriaProducto({ producto }: { producto: ProductoConImagenes }) {
  const [indiceActual, setIndiceActual] = useState(0);
  
  // Ordenar imágenes por el campo 'orden'
  const imagenes = [...producto.producto_imagenes].sort((a, b) => a.orden - b.orden);
  
  // Obtener imagen de portada
  const portada = imagenes.find(img => img.es_portada) || imagenes[0];
  
  return (
    <div>
      {/* Imagen principal */}
      <div className="aspect-square">
        <Image 
          src={imagenes[indiceActual]?.image_url || portada.image_url}
          alt={imagenes[indiceActual]?.alt_text || producto.nombre}
          fill
          className="object-contain"
        />
      </div>
      
      {/* Miniaturas */}
      <div className="flex gap-2 mt-4">
        {imagenes.map((img, idx) => (
          <button
            key={img.id}
            onClick={() => setIndiceActual(idx)}
            className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
              idx === indiceActual ? 'border-teal-600' : 'border-gray-200'
            }`}
          >
            <Image src={img.image_url} alt={img.alt_text || ''} fill />
          </button>
        ))}
        
        {/* Miniatura de video */}
        {producto.video_url && (
          <button className="w-20 h-20 bg-purple-100 rounded-lg">
            <Video className="w-8 h-8 text-purple-600 mx-auto" />
          </button>
        )}
        
        {/* Miniatura de modelo 3D */}
        {producto.modelo_url && (
          <button className="w-20 h-20 bg-teal-100 rounded-lg">
            <Sparkles className="w-8 h-8 text-teal-600 mx-auto" />
          </button>
        )}
      </div>
    </div>
  );
}
```

---

## 🔧 Configuración de Storage en Supabase

### Buckets Necesarios

1. **product-images** - Para imágenes de productos
2. **product-videos** - Para videos de productos  
3. **product-models** - Para modelos 3D (GLB/GLTF)

```sql
-- Configurar políticas de Storage (RLS)

-- Bucket: product-images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true);

-- Política de lectura pública
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- Política de upload para usuarios autenticados
CREATE POLICY "Authenticated Upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Repetir para product-videos y product-models
```

---

## 📝 Notas Importantes

### ⚠️ Advertencias
- La columna `image_url` en `productos` está **deprecated**
- Usa `producto_imagenes` para nuevos productos
- Solo puede haber **una imagen portada** por producto (controlado por trigger)
- El orden de las imágenes es importante para la galería

### 💡 Mejores Prácticas
1. **Siempre** subir al menos una imagen (portada)
2. **Ordenar** las imágenes lógicamente (frontal, lateral, detalle)
3. **Optimizar** imágenes antes de subir (WebP, tamaño máximo 2MB)
4. **Usar alt_text** para mejor SEO y accesibilidad
5. **Videos**: Formato MP4, máximo 50MB
6. **Modelos 3D**: Formato GLB comprimido, máximo 10MB

### 🎯 Próximos Pasos
- [ ] Ejecutar migración en Supabase
- [ ] Actualizar componente de formulario de productos
- [ ] Implementar galería de imágenes mejorada
- [ ] Agregar botón de vista 3D
- [ ] Testear upload de múltiples imágenes

---

## 🆘 Solución de Problemas

### Error: "relation producto_imagenes does not exist"
**Solución**: Ejecuta la migración SQL primero

### No se ven las imágenes
**Solución**: Verifica las políticas de Storage en Supabase

### Solo muestra la primera imagen
**Solución**: Verifica el orden en la consulta SQL (usa `.order()`)

---

¿Necesitas ayuda? Contacta al equipo de desarrollo.
