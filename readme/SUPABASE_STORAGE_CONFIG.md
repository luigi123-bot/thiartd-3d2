# 📦 Configuración de Supabase Storage - Thiart 3D

## 🔐 Credenciales S3 del Proyecto

### Información de Conexión

**Endpoint:**
```
https://fvtqrslsueaxtuyphebl.storage.supabase.co/storage/v1/s3
```

**Region:**
```
us-east-2
```

**Access Key ID:**
```
6cddcbf974754c4789e1bd5b6471c418
```

**Descripción:** test  
**Creado:** hace 33 días

---

## 🚀 Configuración en el Proyecto

### 1. Variables de Entorno

Agrega estas variables a tu archivo `.env.local`:

```env
# Supabase Storage S3
SUPABASE_S3_ENDPOINT=https://fvtqrslsueaxtuyphebl.storage.supabase.co/storage/v1/s3
SUPABASE_S3_REGION=us-east-2
SUPABASE_S3_ACCESS_KEY_ID=6cddcbf974754c4789e1bd5b6471c418
SUPABASE_S3_SECRET_ACCESS_KEY=tu_secret_key_aqui

# Supabase Storage Public
NEXT_PUBLIC_SUPABASE_STORAGE_URL=https://fvtqrslsueaxtuyphebl.supabase.co/storage/v1
```

⚠️ **IMPORTANTE:** La `SECRET_ACCESS_KEY` debes obtenerla desde el dashboard de Supabase cuando crees o veas la access key.

---

## 📁 Buckets Sugeridos para Thiart 3D

### Crear Buckets en Supabase

Ve a **Storage** en el dashboard de Supabase y crea estos buckets:

1. **`productos`** - Imágenes de productos del catálogo
   - Público: ✅ Sí
   - File size limit: 5MB
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

2. **`personalizaciones`** - Archivos STL de clientes
   - Público: ❌ No (privado)
   - File size limit: 50MB
   - Allowed MIME types: `model/stl`, `model/obj`, `application/octet-stream`

3. **`avatares`** - Fotos de perfil de usuarios
   - Público: ✅ Sí
   - File size limit: 2MB
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

4. **`tickets`** - Imágenes adjuntas en tickets
   - Público: ❌ No (solo admins)
   - File size limit: 5MB
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

5. **`chat`** - Archivos compartidos en chat
   - Público: ❌ No (solo participantes)
   - File size limit: 10MB
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`

---

## 🔧 Integración con Next.js

### Opción 1: Cliente Supabase Nativo (Recomendado)

```typescript
// lib/supabase-storage.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Subir imagen de producto
export async function uploadProductImage(file: File, productId: string) {
  const fileName = `${productId}_${Date.now()}.${file.name.split('.').pop()}`
  
  const { data, error } = await supabase.storage
    .from('productos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) throw error

  // Obtener URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('productos')
    .getPublicUrl(fileName)

  return publicUrl
}

// Subir archivo STL de personalización
export async function uploadSTLFile(file: File, userId: string) {
  const fileName = `${userId}_${Date.now()}.stl`
  
  const { data, error } = await supabase.storage
    .from('personalizaciones')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) throw error

  // Obtener URL privada (con token temporal)
  const { data: { signedUrl } } = await supabase.storage
    .from('personalizaciones')
    .createSignedUrl(fileName, 3600) // 1 hora

  return signedUrl
}

// Eliminar archivo
export async function deleteFile(bucket: string, fileName: string) {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([fileName])

  if (error) throw error
}

// Listar archivos de un usuario
export async function listUserFiles(userId: string, bucket: string) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(userId, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' }
    })

  if (error) throw error
  return data
}
```

### Opción 2: Cliente S3 Compatible

```typescript
// lib/s3-client.ts
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3Client = new S3Client({
  endpoint: process.env.SUPABASE_S3_ENDPOINT,
  region: process.env.SUPABASE_S3_REGION,
  credentials: {
    accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
})

// Subir archivo
export async function uploadToS3(bucket: string, key: string, file: Buffer, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: file,
    ContentType: contentType,
  })

  await s3Client.send(command)
  return `https://${process.env.SUPABASE_S3_ENDPOINT}/${bucket}/${key}`
}

// Obtener URL firmada
export async function getSignedUrlS3(bucket: string, key: string, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  })

  return await getSignedUrl(s3Client, command, { expiresIn })
}

// Eliminar archivo
export async function deleteFromS3(bucket: string, key: string) {
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  })

  await s3Client.send(command)
}
```

---

## 📝 Ejemplo de API Route para Upload

### API Route: `/app/api/upload/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Usar service role para server-side
)

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const bucket = formData.get('bucket') as string
    
    if (!file || !bucket) {
      return NextResponse.json({ error: 'Falta archivo o bucket' }, { status: 400 })
    }

    // Validar tamaño del archivo
    const maxSize = bucket === 'personalizaciones' ? 50 * 1024 * 1024 : 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Archivo demasiado grande' }, { status: 400 })
    }

    // Generar nombre único
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}_${Date.now()}.${fileExt}`

    // Convertir File a Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Subir a Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Error uploading:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Obtener URL pública o firmada según el bucket
    let fileUrl: string
    
    if (bucket === 'productos' || bucket === 'avatares') {
      // Bucket público
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName)
      fileUrl = publicUrl
    } else {
      // Bucket privado - generar URL firmada
      const { data: signedData, error: signedError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(fileName, 3600)
      
      if (signedError) throw signedError
      fileUrl = signedData.signedUrl
    }

    return NextResponse.json({
      success: true,
      fileName,
      fileUrl,
      bucket
    })

  } catch (error) {
    console.error('Error en upload:', error)
    return NextResponse.json({ 
      error: 'Error al subir archivo' 
    }, { status: 500 })
  }
}
```

---

## 🔒 Políticas de Seguridad (Storage RLS)

### Configurar en Supabase Dashboard

Ve a **Storage → Buckets → [Bucket] → Policies**

#### Bucket: `productos` (Público)

```sql
-- Lectura pública
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'productos');

-- Solo admins pueden subir
CREATE POLICY "Admin insert access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'productos' 
  AND EXISTS (
    SELECT 1 FROM usuario 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Solo admins pueden actualizar
CREATE POLICY "Admin update access"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'productos' 
  AND EXISTS (
    SELECT 1 FROM usuario 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Solo admins pueden eliminar
CREATE POLICY "Admin delete access"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'productos' 
  AND EXISTS (
    SELECT 1 FROM usuario 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);
```

#### Bucket: `personalizaciones` (Privado)

```sql
-- Usuario puede ver sus propios archivos
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'personalizaciones' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Usuario puede subir sus propios archivos
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'personalizaciones' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Usuario puede eliminar sus propios archivos
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'personalizaciones' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Admins pueden ver todo
CREATE POLICY "Admins can view all"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'personalizaciones' 
  AND EXISTS (
    SELECT 1 FROM usuario 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);
```

---

## 🎨 Componente de Upload en React

```tsx
// components/FileUpload.tsx
'use client'

import { useState } from 'react'
import { Button } from '~/components/ui/button'

interface FileUploadProps {
  bucket: string
  onUploadComplete?: (url: string) => void
  acceptedTypes?: string
  maxSizeMB?: number
}

export function FileUpload({ 
  bucket, 
  onUploadComplete, 
  acceptedTypes = "image/*",
  maxSizeMB = 5 
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tamaño
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`El archivo debe ser menor a ${maxSizeMB}MB`)
      return
    }

    setUploading(true)

    try {
      // Crear preview si es imagen
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => setPreview(e.target?.result as string)
        reader.readAsDataURL(file)
      }

      // Subir archivo
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', bucket)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al subir archivo')
      }

      if (onUploadComplete) {
        onUploadComplete(data.fileUrl)
      }

      alert('Archivo subido correctamente')
    } catch (error) {
      console.error('Error:', error)
      alert('Error al subir archivo')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept={acceptedTypes}
        onChange={handleUpload}
        disabled={uploading}
        className="block w-full text-sm"
      />
      
      {uploading && (
        <div className="text-sm text-gray-500">Subiendo archivo...</div>
      )}
      
      {preview && (
        <img 
          src={preview} 
          alt="Preview" 
          className="max-w-xs rounded-lg border"
        />
      )}
    </div>
  )
}
```

---

## 📦 Instalación de Dependencias

### Para Cliente Supabase (Recomendado)

```bash
npm install @supabase/supabase-js
```

### Para Cliente S3 (Alternativa)

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

---

## 🧪 Testing

### Probar Upload desde Terminal

```bash
# Usando curl con API Route
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "bucket=productos"
```

---

## 📊 Monitoreo y Límites

### Límites de Supabase Storage (Plan Free)

- **Storage total:** 1 GB
- **Bandwidth mensual:** 2 GB
- **Request rate:** 100 por segundo

### Upgrade si necesitas más:

- **Pro Plan:** 100 GB storage, 200 GB bandwidth
- **Team Plan:** Custom

---

## 🔄 Migración desde Cloudinary (Opcional)

Si actualmente usas Cloudinary y quieres migrar:

```typescript
// scripts/migrate-to-supabase.ts
import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function migrateImage(cloudinaryUrl: string, newFileName: string) {
  // Descargar de Cloudinary
  const response = await fetch(cloudinaryUrl)
  const buffer = await response.arrayBuffer()

  // Subir a Supabase
  const { data, error } = await supabase.storage
    .from('productos')
    .upload(newFileName, Buffer.from(buffer), {
      contentType: 'image/jpeg'
    })

  if (error) throw error
  return data
}

// Uso
// await migrateImage('https://res.cloudinary.com/...', 'producto-123.jpg')
```

---

## ⚠️ Notas Importantes

### Seguridad

1. **NUNCA** expongas `SECRET_ACCESS_KEY` en el frontend
2. Usa `SUPABASE_SERVICE_ROLE_KEY` solo en server-side
3. Implementa validación de archivos (tipo, tamaño)
4. Usa RLS policies para proteger buckets privados

### Performance

1. Optimiza imágenes antes de subir (resize, compress)
2. Usa CDN de Supabase para servir archivos
3. Implementa lazy loading de imágenes
4. Considera usar `next/image` para optimización automática

### Backup

1. Configura backups automáticos en Supabase
2. Mantén copias locales de archivos críticos
3. Documenta estructura de carpetas

---

## 📞 Soporte

- [Documentación Supabase Storage](https://supabase.com/docs/guides/storage)
- [S3 Protocol en Supabase](https://supabase.com/docs/guides/storage/s3)
- [RLS Policies](https://supabase.com/docs/guides/storage/security/access-control)

---

**Versión:** 1.0.0  
**Fecha:** Noviembre 2025  
**Proyecto:** Thiart 3D Storage Configuration
