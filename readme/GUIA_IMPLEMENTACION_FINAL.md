# 🚀 Guía de Implementación Final - Thiart 3D

## 📋 Resumen Ejecutivo

Esta guía te llevará paso a paso para implementar completamente tu base de datos y sistema de almacenamiento en Supabase.

**Tiempo estimado:** 30-45 minutos  
**Dificultad:** Media  
**Requisitos previos:** Cuenta de Supabase, credenciales S3 obtenidas

---

## ✅ Checklist de Implementación

### Fase 1: Base de Datos (15 minutos)

- [ ] **Paso 1.1:** Acceder a Supabase Dashboard
  - Ir a https://supabase.com/dashboard
  - Seleccionar tu proyecto
  - Abrir "SQL Editor" en el menú lateral

- [ ] **Paso 1.2:** Ejecutar Schema Principal
  ```sql
  -- Copiar y pegar TODO el contenido de supabase_schema_completo.sql
  -- Click en "Run" o presionar Ctrl+Enter
  ```
  - ⏱️ Tiempo: ~30 segundos
  - ✅ Resultado: 15 tablas creadas
  - ⚠️ Si hay error: Revisar que no existan tablas con el mismo nombre

- [ ] **Paso 1.3:** Ejecutar Configuración Adicional
  ```sql
  -- Copiar y pegar TODO el contenido de supabase_configuracion_adicional.sql
  -- Click en "Run"
  ```
  - ⏱️ Tiempo: ~45 segundos
  - ✅ Resultado: 40+ políticas RLS, 9 funciones, 6 vistas
  - ⚠️ Verificar: Ir a "Authentication" → "Policies" y ver las políticas creadas

- [ ] **Paso 1.4:** Asignar Rol de Admin
  ```sql
  -- Editar asignar_rol_admin.sql con tu email
  -- Ejecutar el script
  UPDATE usuario 
  SET role = 'admin' 
  WHERE email = 'TU_EMAIL_AQUI@ejemplo.com';
  ```
  - ⏱️ Tiempo: ~5 segundos
  - ✅ Resultado: Tu usuario ahora tiene rol de admin

- [ ] **Paso 1.5:** Verificar Instalación
  ```sql
  -- Ejecutar estas queries para verificar
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public';
  
  SELECT routine_name FROM information_schema.routines 
  WHERE routine_schema = 'public';
  
  SELECT viewname FROM pg_views 
  WHERE schemaname = 'public';
  ```
  - ✅ Deberías ver: 15 tablas, 9 funciones, 6 vistas

---

### Fase 2: Storage Configuration (10 minutos)

- [ ] **Paso 2.1:** Obtener Secret Key
  - En Supabase Dashboard → "Settings" → "API"
  - Copiar el valor de "service_role secret"
  - Ir a "Storage" → "Settings" → "S3 Access Keys"
  - Copiar el **SECRET_ACCESS_KEY**

- [ ] **Paso 2.2:** Actualizar .env.local
  ```env
  # Reemplazar TU_SECRET_KEY_AQUI con el valor copiado
  SUPABASE_S3_SECRET_ACCESS_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```

- [ ] **Paso 2.3:** Crear Buckets de Storage
  - Ir a "Storage" en el menú lateral
  - Click en "New bucket" y crear cada uno:

  **Bucket 1: productos**
  - Name: `productos`
  - Public: ✅ Activado
  - File size limit: 5 MB
  - Allowed MIME types: `image/jpeg, image/png, image/webp`

  **Bucket 2: personalizaciones**
  - Name: `personalizaciones`
  - Public: ❌ Desactivado (privado)
  - File size limit: 50 MB
  - Allowed MIME types: `model/stl, application/octet-stream`

  **Bucket 3: avatares**
  - Name: `avatares`
  - Public: ✅ Activado
  - File size limit: 2 MB
  - Allowed MIME types: `image/jpeg, image/png, image/webp`

  **Bucket 4: tickets**
  - Name: `tickets`
  - Public: ❌ Desactivado (privado)
  - File size limit: 5 MB
  - Allowed MIME types: `image/jpeg, image/png, image/webp`

  **Bucket 5: chat**
  - Name: `chat`
  - Public: ❌ Desactivado (privado)
  - File size limit: 10 MB
  - Allowed MIME types: `image/*, application/pdf, application/msword`

- [ ] **Paso 2.4:** Configurar Políticas RLS para Storage
  - Para cada bucket, ir a "Policies" y agregar:

  **Para buckets públicos (productos, avatares):**
  ```sql
  -- Política: Lectura pública
  CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'productos');

  -- Política: Escritura autenticada
  CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'productos' AND auth.role() = 'authenticated');

  -- Política: Usuarios pueden eliminar sus archivos
  CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'productos' AND auth.uid()::text = (storage.foldername(name))[1]);
  ```

  **Para buckets privados (personalizaciones, tickets, chat):**
  ```sql
  -- Política: Usuarios solo ven sus archivos
  CREATE POLICY "Users can view own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'personalizaciones' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

  -- Política: Usuarios pueden subir a su carpeta
  CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'personalizaciones' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

  -- Política: Usuarios pueden eliminar sus archivos
  CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'personalizaciones' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
  ```

---

### Fase 3: Testing (10 minutos)

- [ ] **Paso 3.1:** Insertar Datos de Prueba
  ```sql
  -- Usar queries_ejemplo.sql
  -- Sección: "Insertar datos de ejemplo"
  -- Ejecutar las primeras 10-15 queries
  ```

- [ ] **Paso 3.2:** Verificar Datos
  ```sql
  SELECT COUNT(*) as total_usuarios FROM usuario;
  SELECT COUNT(*) as total_productos FROM productos_3d;
  SELECT COUNT(*) as total_pedidos FROM pedidos;
  ```

- [ ] **Paso 3.3:** Probar Upload desde Frontend
  - Reiniciar servidor Next.js: `npm run dev`
  - Abrir la aplicación en el navegador
  - Intentar subir una imagen de producto
  - Verificar que aparece en Supabase Storage

- [ ] **Paso 3.4:** Verificar Seguridad RLS
  ```sql
  -- Simular usuario no autenticado
  SET request.jwt.claims TO '{}';
  SELECT * FROM usuario; -- Debería retornar 0 filas o error
  
  -- Simular usuario autenticado
  SET request.jwt.claims TO '{"sub": "user-id-aqui", "role": "authenticated"}';
  SELECT * FROM usuario WHERE clerk_id = 'user-id-aqui'; -- Debería funcionar
  ```

---

## 🔧 Uso de Componentes en Frontend

### Ejemplo 1: Subir Imagen de Producto

```tsx
// En tu página de productos
import { ProductImageUpload } from '~/components/FileUploadWidget'

export default function CrearProducto() {
  const [imagenUrl, setImagenUrl] = useState<string>('')

  return (
    <form>
      <ProductImageUpload
        productId="prod-123"
        onUploadComplete={(url) => {
          setImagenUrl(url)
          console.log('Imagen subida:', url)
        }}
      />
      
      {imagenUrl && (
        <input type="hidden" name="imagen_url" value={imagenUrl} />
      )}
    </form>
  )
}
```

### Ejemplo 2: Subir Archivo STL

```tsx
import { STLFileUpload } from '~/components/FileUploadWidget'

export default function PersonalizarProducto() {
  const { userId } = useAuth()
  
  return (
    <STLFileUpload
      userId={userId}
      onUploadComplete={(url) => {
        // Guardar URL en base de datos
        fetch('/api/personalizaciones', {
          method: 'POST',
          body: JSON.stringify({ archivo_stl_url: url })
        })
      }}
    />
  )
}
```

### Ejemplo 3: Cambiar Avatar

```tsx
import { AvatarUpload } from '~/components/FileUploadWidget'

export default function PerfilUsuario() {
  const { user } = useAuth()
  
  return (
    <AvatarUpload
      userId={user.id}
      currentAvatar={user.avatar_url}
      onUploadComplete={(url) => {
        // Actualizar avatar en base de datos
        fetch('/api/usuarios/avatar', {
          method: 'PATCH',
          body: JSON.stringify({ avatar_url: url })
        })
      }}
    />
  )
}
```

### Ejemplo 4: Hook Personalizado

```tsx
import { useFileUpload } from '~/hooks/useFileUpload'
import { StorageBucket } from '~/lib/supabase-storage'

export default function SubidaPersonalizada() {
  const { uploading, progress, error, uploadFile } = useFileUpload({
    bucket: StorageBucket.PRODUCTOS,
    optimizeImages: true,
    onSuccess: (url) => console.log('Subido:', url),
  })

  const handleUpload = async (file: File) => {
    await uploadFile(file, {
      userId: 'user-123',
      entityId: 'producto-456'
    })
  }

  return (
    <div>
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
      {uploading && <p>Progreso: {progress}%</p>}
      {error && <p>Error: {error}</p>}
    </div>
  )
}
```

---

## 📊 Queries Útiles para Desarrollo

### Estadísticas del Dashboard
```sql
SELECT * FROM obtener_estadisticas_dashboard();
```

### Productos con Stock Bajo
```sql
SELECT * FROM productos_stock_bajo;
```

### Clientes VIP
```sql
SELECT * FROM clientes_vip;
```

### Calcular Precio de Personalización
```sql
SELECT calcular_precio_personalizacion(
  'material-pla',
  150.5,  -- gramos
  10.0,   -- horas de impresión
  'alta'  -- complejidad
);
```

### Verificar Stock Disponible
```sql
SELECT verificar_stock_disponible(123, 5);  -- producto_id, cantidad
```

---

## 🔒 Seguridad y Best Practices

### ✅ Implementado
- Row Level Security (RLS) en todas las tablas
- Políticas de acceso basadas en roles (admin/cliente)
- Validación de archivos por tipo y tamaño
- URLs firmadas para archivos privados (STL)
- Triggers automáticos para actualización de fechas
- Índices optimizados en campos clave

### 🛡️ Recomendaciones Adicionales
1. **Rate Limiting:** Implementar límite de uploads por usuario
2. **Virus Scanning:** Considerar servicio de escaneo de archivos
3. **CDN:** Usar Cloudflare o similar para imágenes públicas
4. **Backups:** Configurar backups automáticos diarios en Supabase
5. **Monitoring:** Activar alertas de errores en Supabase

---

## 🐛 Troubleshooting

### Error: "relation already exists"
**Solución:** Ya tienes tablas creadas. Eliminar con:
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

### Error: "invalid input syntax for type uuid"
**Solución:** Verificar que estás usando UUIDs correctos en las queries.

### Storage: "Policy check violation"
**Solución:** Verificar que las políticas RLS están creadas correctamente para el bucket.

### Upload falla silenciosamente
**Solución:** 
1. Verificar SECRET_ACCESS_KEY en .env.local
2. Revisar console del navegador para errores CORS
3. Verificar tamaño del archivo vs límite del bucket

### Imágenes no se muestran
**Solución:**
1. Verificar que el bucket es público
2. Usar `getPublicUrl()` en lugar de `getSignedUrl()`
3. Revisar políticas de CORS en Storage settings

---

## 📞 Soporte

Si encuentras problemas:

1. **Revisar logs:** Supabase Dashboard → Logs
2. **Verificar queries:** SQL Editor con mensajes de error
3. **Documentación:** https://supabase.com/docs
4. **Issues conocidos:** Ver `README_BASE_DATOS.md` sección "Notas Importantes"

---

## 🎉 ¡Listo para Producción!

Una vez completados todos los pasos:

✅ Base de datos PostgreSQL con 15 tablas  
✅ 40+ políticas de seguridad RLS  
✅ 9 funciones personalizadas  
✅ 6 vistas útiles  
✅ Storage configurado con 5 buckets  
✅ Componentes React listos para usar  
✅ Hooks TypeScript con validación  

**Tu aplicación Thiart 3D está lista para escalar** 🚀

---

## 📚 Documentación Relacionada

- `README_BASE_DATOS.md` - Guía completa de la base de datos
- `SUPABASE_STORAGE_CONFIG.md` - Configuración detallada de Storage
- `INICIO_RAPIDO_BASE_DATOS.md` - Guía rápida de inicio
- `queries_ejemplo.sql` - 64+ queries de ejemplo
- `DIAGRAMA_BASE_DATOS.md` - Diagramas ERD en Mermaid

---

**Fecha de creación:** 2024  
**Versión:** 1.0  
**Proyecto:** Thiart 3D - Plataforma de impresión 3D personalizada
