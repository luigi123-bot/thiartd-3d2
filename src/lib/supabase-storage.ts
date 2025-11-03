// lib/supabase-storage.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Buckets disponibles en el proyecto
 */
export enum StorageBucket {
  PRODUCTOS = 'productos',
  MODELS = 'models',
  PERSONALIZACIONES = 'personalizaciones',
  AVATARES = 'avatares',
  TICKETS = 'tickets',
  CHAT = 'chat',
}

/**
 * Configuración de límites por bucket
 */
const BUCKET_LIMITS = {
  [StorageBucket.PRODUCTOS]: { maxSize: 5 * 1024 * 1024, types: ['image/jpeg', 'image/png', 'image/webp'] },
  [StorageBucket.MODELS]: { 
    maxSize: 50 * 1024 * 1024, 
    types: [
      'model/gltf-binary',       // .glb
      'model/gltf+json',         // .gltf
      'model/stl',               // .stl
      'model/x.stl-binary',      // .stl binary
      'model/x.stl-ascii',       // .stl ascii
      'application/sla',         // .stl alternativo
      'application/octet-stream', // fallback para archivos binarios
      'application/vnd.ms-pki.stl', // otro MIME type STL
      'model/obj',               // .obj
      'text/plain'               // algunos archivos 3D como texto
    ]
  },
  [StorageBucket.PERSONALIZACIONES]: { maxSize: 50 * 1024 * 1024, types: ['model/stl', 'model/obj', 'application/octet-stream'] },
  [StorageBucket.AVATARES]: { maxSize: 2 * 1024 * 1024, types: ['image/jpeg', 'image/png', 'image/webp'] },
  [StorageBucket.TICKETS]: { maxSize: 5 * 1024 * 1024, types: ['image/jpeg', 'image/png', 'image/webp'] },
  [StorageBucket.CHAT]: { maxSize: 10 * 1024 * 1024, types: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] },
}

/**
 * Validar archivo antes de subir
 */
export function validateFile(file: File, bucket: StorageBucket): { valid: boolean; error?: string } {
  const limits = BUCKET_LIMITS[bucket]
  
  if (!limits) {
    return { valid: false, error: 'Bucket no válido' }
  }

  if (file.size > limits.maxSize) {
    const sizeMB = (limits.maxSize / 1024 / 1024).toFixed(0)
    return { valid: false, error: `El archivo debe ser menor a ${sizeMB}MB` }
  }

  // Para el bucket MODELS, validar por extensión si el MIME type no coincide
  if (bucket === StorageBucket.MODELS) {
    const extension = file.name.split('.').pop()?.toLowerCase()
    const validExtensions = ['glb', 'gltf', 'stl', 'obj']
    
    if (extension && validExtensions.includes(extension)) {
      console.log('✅ Archivo validado por extensión:', extension)
      return { valid: true }
    }
  }

  if (!limits.types.includes(file.type)) {
    return { valid: false, error: 'Tipo de archivo no permitido' }
  }

  return { valid: true }
}

/**
 * Generar nombre único para archivo
 */
export function generateFileName(userId: string, originalName: string): string {
  const timestamp = Date.now()
  const extension = originalName.split('.').pop()
  return `${userId}_${timestamp}.${extension}`
}

/**
 * Subir imagen de producto (público)
 */
export async function uploadProductImage(file: File, productId: string): Promise<string> {
  try {
    console.log('📤 Iniciando upload de imagen:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      productId
    })

    const validation = validateFile(file, StorageBucket.PRODUCTOS)
    if (!validation.valid) {
      console.error('❌ Validación falló:', validation.error)
      throw new Error(validation.error)
    }

    const fileName = generateFileName(productId, file.name)
    console.log('📝 Nombre de archivo generado:', fileName)
    
    const { data, error } = await supabase.storage
      .from(StorageBucket.PRODUCTOS)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('❌ Error de Supabase Storage:', {
        message: error.message,
        name: error.name,
        error: error
      })
      
      // Mensajes de error más específicos
      if (error.message?.includes('not found')) {
        throw new Error('El bucket "productos" no existe. Ejecuta el script setup_productos_imagenes_completo.sql en Supabase.')
      }
      if (error.message?.includes('policy')) {
        throw new Error('Faltan políticas RLS. Ejecuta el script setup_productos_imagenes_completo.sql en Supabase.')
      }
      if (error.message?.includes('size')) {
        throw new Error('La imagen es demasiado grande. Máximo 5MB.')
      }
      
      throw new Error(`Error al subir imagen: ${error.message || 'Error desconocido'}`)
    }

    console.log('✅ Imagen subida exitosamente:', data)

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(StorageBucket.PRODUCTOS)
      .getPublicUrl(fileName)

    console.log('🔗 URL pública generada:', publicUrl)

    return publicUrl
  } catch (err) {
    console.error('❌ Error crítico en uploadProductImage:', err)
    throw err
  }
}

/**
 * Subir archivo STL de personalización (privado)
 */
export async function uploadSTLFile(file: File, userId: string): Promise<{ fileName: string; signedUrl: string }> {
  const validation = validateFile(file, StorageBucket.PERSONALIZACIONES)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const fileName = `${userId}/${generateFileName(userId, file.name)}`

  const { error } = await supabase.storage
    .from(StorageBucket.PERSONALIZACIONES)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Error uploading STL file:', error)
    throw new Error(`Error al subir archivo: ${error.message}`)
  }

  // Obtener URL firmada (válida por 1 hora)
  const { data: signedData, error: signedError } = await supabase.storage
    .from(StorageBucket.PERSONALIZACIONES)
    .createSignedUrl(fileName, 3600)

  if (signedError) {
    throw new Error(`Error al generar URL: ${signedError.message}`)
  }

  return {
    fileName,
    signedUrl: signedData.signedUrl
  }
}

/**
 * Subir modelo 3D de producto (público) - GLB/GLTF/STL
 */
export async function uploadModel3D(file: File, productId: string): Promise<string> {
  try {
    console.log('📤 Iniciando upload de modelo 3D:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      productId
    })

    const validation = validateFile(file, StorageBucket.MODELS)
    if (!validation.valid) {
      console.error('❌ Validación falló:', validation.error)
      throw new Error(validation.error)
    }

    const fileName = generateFileName(productId, file.name)
    console.log('📝 Nombre de archivo generado:', fileName)
    
    const { data, error } = await supabase.storage
      .from(StorageBucket.MODELS)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('❌ Error de Supabase Storage:', {
        message: error.message,
        name: error.name,
        error: error
      })
      
      if (error.message?.includes('not found')) {
        throw new Error('El bucket "models" no existe. Ejecuta el script de configuración en Supabase.')
      }
      if (error.message?.includes('policy')) {
        throw new Error('Faltan políticas RLS para el bucket de modelos 3D.')
      }
      if (error.message?.includes('size')) {
        throw new Error('El modelo 3D es demasiado grande. Máximo 50MB.')
      }
      
      throw new Error(`Error al subir modelo 3D: ${error.message || 'Error desconocido'}`)
    }

    console.log('✅ Modelo 3D subido exitosamente:', data)

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(StorageBucket.MODELS)
      .getPublicUrl(fileName)

    console.log('🔗 URL pública generada:', publicUrl)

    return publicUrl
  } catch (err) {
    console.error('❌ Error crítico en uploadModel3D:', err)
    throw err
  }
}

/**
 * Subir avatar de usuario
 */
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const validation = validateFile(file, StorageBucket.AVATARES)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const fileName = `${userId}.${file.name.split('.').pop()}`
  
  // Eliminar avatar anterior si existe
  await supabase.storage
    .from(StorageBucket.AVATARES)
    .remove([fileName])

  const { error } = await supabase.storage
    .from(StorageBucket.AVATARES)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    })

  if (error) {
    console.error('Error uploading avatar:', error)
    throw new Error(`Error al subir avatar: ${error.message}`)
  }

  const { data: { publicUrl } } = supabase.storage
    .from(StorageBucket.AVATARES)
    .getPublicUrl(fileName)

  return publicUrl
}

/**
 * Subir imagen de ticket
 */
export async function uploadTicketImage(file: File, ticketId: string): Promise<string> {
  const validation = validateFile(file, StorageBucket.TICKETS)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const fileName = generateFileName(ticketId, file.name)

  const { error } = await supabase.storage
    .from(StorageBucket.TICKETS)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Error uploading ticket image:', error)
    throw new Error(`Error al subir imagen: ${error.message}`)
  }

  // Generar URL firmada (privada)
  const { data: signedData, error: signedError } = await supabase.storage
    .from(StorageBucket.TICKETS)
    .createSignedUrl(fileName, 86400) // 24 horas

  if (signedError) {
    throw new Error(`Error al generar URL: ${signedError.message}`)
  }

  return signedData.signedUrl
}

/**
 * Subir archivo de chat
 */
export async function uploadChatFile(file: File, conversationId: string): Promise<string> {
  const validation = validateFile(file, StorageBucket.CHAT)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const fileName = `${conversationId}/${generateFileName(conversationId, file.name)}`

  const { error } = await supabase.storage
    .from(StorageBucket.CHAT)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Error uploading chat file:', error)
    throw new Error(`Error al subir archivo: ${error.message}`)
  }

  // Generar URL firmada
  const { data: signedData, error: signedError } = await supabase.storage
    .from(StorageBucket.CHAT)
    .createSignedUrl(fileName, 3600) // 1 hora

  if (signedError) {
    throw new Error(`Error al generar URL: ${signedError.message}`)
  }

  return signedData.signedUrl
}

/**
 * Eliminar archivo
 */
export async function deleteFile(bucket: StorageBucket, fileName: string): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([fileName])

  if (error) {
    console.error('Error deleting file:', error)
    throw new Error(`Error al eliminar archivo: ${error.message}`)
  }
}

/**
 * Listar archivos de un usuario en un bucket
 */
export async function listUserFiles(userId: string, bucket: StorageBucket) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(userId, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' }
    })

  if (error) {
    console.error('Error listing files:', error)
    throw new Error(`Error al listar archivos: ${error.message}`)
  }

  return data
}

/**
 * Obtener URL firmada de un archivo privado
 */
export async function getSignedUrl(bucket: StorageBucket, fileName: string, expiresIn = 3600): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(fileName, expiresIn)

  if (error) {
    console.error('Error creating signed URL:', error)
    throw new Error(`Error al generar URL: ${error.message}`)
  }

  return data.signedUrl
}

/**
 * Obtener URL pública de un archivo
 */
export function getPublicUrl(bucket: StorageBucket, fileName: string): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName)

  return data.publicUrl
}

/**
 * Obtener información de un archivo
 */
export async function getFileInfo(bucket: StorageBucket, fileName: string) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list('', {
      search: fileName
    })

  if (error) {
    console.error('Error getting file info:', error)
    throw new Error(`Error al obtener información: ${error.message}`)
  }

  return data[0]
}

/**
 * Mover archivo entre buckets (copiar y eliminar)
 */
export async function moveFile(
  sourceBucket: StorageBucket,
  sourceFileName: string,
  destBucket: StorageBucket,
  destFileName: string
): Promise<void> {
  // Descargar de origen
  const { data: fileData, error: downloadError } = await supabase.storage
    .from(sourceBucket)
    .download(sourceFileName)

  if (downloadError) {
    throw new Error(`Error al descargar: ${downloadError.message}`)
  }

  // Subir a destino
  const { error: uploadError } = await supabase.storage
    .from(destBucket)
    .upload(destFileName, fileData)

  if (uploadError) {
    throw new Error(`Error al subir: ${uploadError.message}`)
  }

  // Eliminar original
  await deleteFile(sourceBucket, sourceFileName)
}

/**
 * Optimizar imagen antes de subir (reducir tamaño)
 */
export async function optimizeImage(file: File, maxWidth = 1200): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const optimizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              })
              resolve(optimizedFile)
            } else {
              reject(new Error('Error al optimizar imagen'))
            }
          },
          'image/jpeg',
          0.8
        )
      }
      
      img.onerror = () => reject(new Error('Error al cargar imagen'))
    }
    
    reader.onerror = () => reject(new Error('Error al leer archivo'))
  })
}
