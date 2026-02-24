// hooks/useFileUpload.ts
'use client'

import { useState, useCallback } from 'react'
import {
  uploadProductImage,
  uploadSTLFile,
  uploadAvatar,
  uploadTicketImage,
  uploadChatFile,
  uploadModel3D,
  uploadProductVideo,
  optimizeImage,
  StorageBucket,
  validateFile
} from '~/lib/supabase-storage'

interface UseFileUploadOptions {
  bucket: StorageBucket
  onSuccess?: (url: string) => void
  onError?: (error: Error) => void
  optimizeImages?: boolean
  maxWidth?: number
}

interface UploadState {
  uploading: boolean
  progress: number
  error: string | null
  fileUrl: string | null
  preview: string | null
}

export function useFileUpload(options: UseFileUploadOptions) {
  const { bucket, onSuccess, onError, optimizeImages = true, maxWidth = 1200 } = options

  const [state, setState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
    fileUrl: null,
    preview: null,
  })

  const resetState = useCallback(() => {
    setState({
      uploading: false,
      progress: 0,
      error: null,
      fileUrl: null,
      preview: null,
    })
  }, [])

  const uploadFile = useCallback(
    async (file: File, metadata?: { userId?: string; entityId?: string }) => {
      try {
        setState((prev) => ({ ...prev, uploading: true, error: null, progress: 0 }))

        // Validar archivo
        const validation = validateFile(file, bucket)
        if (!validation.valid) {
          throw new Error(validation.error)
        }

        // Optimizar imagen si es necesario
        let fileToUpload = file
        if (optimizeImages && file.type.startsWith('image/')) {
          setState((prev) => ({ ...prev, progress: 20 }))
          fileToUpload = await optimizeImage(file, maxWidth)
        }

        // Generar preview si es imagen
        if (file.type.startsWith('image/')) {
          const reader = new FileReader()
          reader.onload = (e) => {
            setState((prev) => ({ ...prev, preview: e.target?.result as string }))
          }
          reader.readAsDataURL(file)
        }

        setState((prev) => ({ ...prev, progress: 40 }))

        // Subir según el bucket
        let url: string

        switch (bucket) {
          case StorageBucket.PRODUCTOS:
            url = await uploadProductImage(fileToUpload, metadata?.entityId ?? 'temp')
            break

          case StorageBucket.MODELS:
            url = await uploadModel3D(fileToUpload, metadata?.entityId ?? 'temp')
            break

          case StorageBucket.PERSONALIZACIONES:
            const stlResult = await uploadSTLFile(fileToUpload, metadata?.userId ?? 'temp')
            url = stlResult.signedUrl
            break

          case StorageBucket.AVATARES:
            url = await uploadAvatar(fileToUpload, metadata?.userId ?? 'temp')
            break

          case StorageBucket.TICKETS:
            url = await uploadTicketImage(fileToUpload, metadata?.entityId ?? 'temp')
            break

          case StorageBucket.CHAT:
            url = await uploadChatFile(fileToUpload, metadata?.entityId ?? 'temp')
            break

          case StorageBucket.VIDEOS:
            url = await uploadProductVideo(fileToUpload, metadata?.entityId ?? 'temp')
            break

          default:
            throw new Error('Bucket no soportado')
        }

        setState((prev) => ({ ...prev, progress: 100, fileUrl: url, uploading: false }))

        if (onSuccess) {
          onSuccess(url)
        }

        return url
      } catch (error) {
        const err = error as Error
        setState((prev) => ({
          ...prev,
          error: err.message,
          uploading: false,
          progress: 0
        }))

        if (onError) {
          onError(err)
        }

        throw error
      }
    },
    [bucket, onSuccess, onError, optimizeImages, maxWidth]
  )

  return {
    ...state,
    uploadFile,
    resetState,
  }
}

// Hook simplificado para upload de productos
export function useProductImageUpload(productId: string, onSuccess?: (url: string) => void) {
  return useFileUpload({
    bucket: StorageBucket.PRODUCTOS,
    onSuccess,
    optimizeImages: true,
  })
}

// Hook simplificado para upload de archivos STL
export function useSTLUpload(userId: string, onSuccess?: (url: string) => void) {
  return useFileUpload({
    bucket: StorageBucket.PERSONALIZACIONES,
    onSuccess,
    optimizeImages: false,
  })
}

// Hook simplificado para upload de avatares
export function useAvatarUpload(userId: string, onSuccess?: (url: string) => void) {
  return useFileUpload({
    bucket: StorageBucket.AVATARES,
    onSuccess,
    optimizeImages: true,
    maxWidth: 400,
  })
}

// Hook simplificado para upload de imágenes de tickets
export function useTicketImageUpload(ticketId: string, onSuccess?: (url: string) => void) {
  return useFileUpload({
    bucket: StorageBucket.TICKETS,
    onSuccess,
    optimizeImages: true,
  })
}

// Hook simplificado para upload de archivos de chat
export function useChatFileUpload(conversationId: string, onSuccess?: (url: string) => void) {
  return useFileUpload({
    bucket: StorageBucket.CHAT,
    onSuccess,
    optimizeImages: true,
  })
}
