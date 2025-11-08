# 🚀 Guía Rápida: Agregar Modelo STL a tu Producto

## Paso 1: Subir el archivo STL a Supabase

1. Ve a tu proyecto en Supabase Dashboard
2. Click en **Storage** en el menú izquierdo
3. Si no existe, crea un bucket llamado `modelos`:
   - Click en "New bucket"
   - Nombre: `modelos`
   - **Marca como Public** ✅
   - Click en "Create bucket"

4. Abre el bucket `modelos`
5. Click en "Upload file"
6. Selecciona tu archivo `.stl`
7. Una vez subido, click en el archivo
8. Click en "Copy URL" o "Get public URL"

## Paso 2: Actualizar tu producto

1. Ve a **Table Editor** → `productos`
2. Busca el producto "prueba 2" (ID: `267cdd73-148a-4d73-b272-f72ec684804d`)
3. Click para editar
4. En el campo `modelo_url`, pega la URL que copiaste
5. Debería verse algo así:
   ```
   https://tuproyecto.supabase.co/storage/v1/object/public/modelos/tu-figura.stl
   ```
6. Guarda los cambios

## Paso 3: Ver el resultado

1. Recarga la página del producto en tu aplicación
2. Deberías ver el botón con el ícono de ✨ (sparkles)
3. Click en "Ver en 3D"
4. Tu modelo STL aparecerá en color turquesa (`#00a19a`) con efecto metálico

## ✅ Verificación

En la consola del navegador deberías ver:
```javascript
📦 Datos del producto: {
  modelo_url: "https://...tu-archivo.stl",
  hasValidModel: true  ✅
}

🎨 Cargando modelo 3D: {
  extension: "stl",
  tipo: "STL (Stereolithography)"
}
```

## ⚠️ Si no funciona

**Problema:** El botón 3D no aparece
- Verifica que la URL termine en `.stl`
- Asegúrate de que el bucket sea público
- Revisa que el campo `modelo_url` no esté vacío

**Problema:** Error al cargar el modelo
- Verifica que el archivo STL sea válido
- Comprueba que la URL sea accesible (cópiala y pégala en el navegador)
- Revisa la consola del navegador por errores específicos

**Problema:** Modelo aparece muy pequeño o muy grande
- Los modelos STL mantienen sus dimensiones originales
- Usa las ruedas del mouse para hacer zoom
- Los controles te permiten alejar/acercar

## 🎨 Personalización del Color

Si quieres cambiar el color del modelo STL, edita el archivo:
`src/components/Model3DViewer.tsx` línea ~30:

```tsx
<meshStandardMaterial 
  color="#00a19a"  // 👈 Cambia este color
  metalness={0.6}
  roughness={0.3}
/>
```

Colores sugeridos:
- `#00a19a` - Turquesa (actual)
- `#808080` - Gris plata
- `#FFD700` - Dorado
- `#C0C0C0` - Plateado
- `#CD7F32` - Bronce
