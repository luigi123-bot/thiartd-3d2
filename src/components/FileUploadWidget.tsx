// components/FileUploadWidget.tsx
'use client'

import React, { useRef } from 'react'
import { Button } from '~/components/ui/button'
import { Progress } from '~/components/ui/progress'
import { useFileUpload } from '~/hooks/useFileUpload'
import { StorageBucket } from '~/lib/supabase-storage'
import { FiUpload, FiX, FiCheck, FiFile } from 'react-icons/fi'
import Image from 'next/image'

interface FileUploadWidgetProps {
  bucket: StorageBucket
  userId?: string
  entityId?: string
  acceptedTypes?: string
  maxSizeMB?: number
  showPreview?: boolean
  label?: string
  buttonText?: string
  onUploadComplete?: (url: string) => void
  className?: string
}

export function FileUploadWidget({
  bucket,
  userId,
  entityId,
  acceptedTypes = 'image/*',
  maxSizeMB = 5,
  showPreview = true,
  label,
  buttonText = 'Seleccionar archivo',
  onUploadComplete,
  className = '',
}: FileUploadWidgetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { uploading, progress, error, fileUrl, preview, uploadFile, resetState } = useFileUpload({
    bucket,
    onSuccess: onUploadComplete,
  })

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      await uploadFile(file, { userId, entityId })
    } catch (err) {
      console.error('Error uploading file:', err)
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleReset = () => {
    resetState()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
        aria-label={label ?? buttonText}
      />

      {/* Botón de selección */}
      {!fileUrl && !uploading && (
        <Button
          type="button"
          onClick={handleButtonClick}
          disabled={uploading}
          variant="outline"
          className="w-full"
        >
          <FiUpload className="mr-2" />
          {buttonText}
        </Button>
      )}

      {/* Progreso de carga */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Subiendo archivo...</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      )}

      {/* Preview de imagen */}
      {showPreview && preview && !error && (
        <div className="relative rounded-lg border border-gray-200 overflow-hidden">
          <Image
            src={preview}
            alt="Preview"
            width={400}
            height={300}
            className="w-full h-auto object-cover"
          />
          {fileUrl && (
            <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-2">
              <FiCheck className="w-4 h-4" />
            </div>
          )}
        </div>
      )}

      {/* Archivo subido (no imagen) */}
      {fileUrl && !preview && !error && (
        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <FiFile className="w-6 h-6 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-900">Archivo subido correctamente</p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-green-600 hover:underline"
              >
                Ver archivo
              </a>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="text-green-600 hover:text-green-800"
            title="Subir otro archivo"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <FiX className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-red-900">Error al subir archivo</p>
              <p className="text-xs text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={handleReset}
              className="ml-3 text-red-600 hover:text-red-800"
              aria-label="Cerrar mensaje de error"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Información adicional */}
      <p className="text-xs text-gray-500">
        Tamaño máximo: {maxSizeMB}MB. Tipos permitidos: {acceptedTypes}
      </p>
    </div>
  )
}

// Componente especializado para productos
export function ProductImageUpload({
  productId,
  onUploadComplete,
  className,
}: {
  productId: string
  onUploadComplete?: (url: string) => void
  className?: string
}) {
  return (
    <FileUploadWidget
      bucket={StorageBucket.PRODUCTOS}
      entityId={productId}
      acceptedTypes="image/jpeg,image/png,image/webp"
      maxSizeMB={5}
      label="Imagen del producto"
      buttonText="Seleccionar imagen"
      onUploadComplete={onUploadComplete}
      className={className}
    />
  )
}

// Componente especializado para modelos 3D de productos
export function ProductModel3DUpload({
  productId,
  onUploadComplete,
  className,
}: {
  productId: string
  onUploadComplete?: (url: string) => void
  className?: string
}) {
  return (
    <FileUploadWidget
      bucket={StorageBucket.MODELS}
      entityId={productId}
      acceptedTypes=".glb,.gltf,.stl"
      maxSizeMB={50}
      showPreview={false}
      label="Modelo 3D (GLB/GLTF/STL)"
      buttonText="Seleccionar modelo 3D"
      onUploadComplete={onUploadComplete}
      className={className}
    />
  )
}

// Componente especializado para archivos STL
export function STLFileUpload({
  userId,
  onUploadComplete,
  className,
}: {
  userId: string
  onUploadComplete?: (url: string) => void
  className?: string
}) {
  return (
    <FileUploadWidget
      bucket={StorageBucket.PERSONALIZACIONES}
      userId={userId}
      acceptedTypes=".stl,.obj"
      maxSizeMB={50}
      showPreview={false}
      label="Archivo 3D (STL/OBJ)"
      buttonText="Seleccionar archivo 3D"
      onUploadComplete={onUploadComplete}
      className={className}
    />
  )
}

// Componente especializado para avatares
export function AvatarUpload({
  userId,
  currentAvatar,
  onUploadComplete,
  className,
}: {
  userId: string
  currentAvatar?: string
  onUploadComplete?: (url: string) => void
  className?: string
}) {
  return (
    <div className={className}>
      {currentAvatar && (
        <div className="mb-4 flex justify-center">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200">
            <Image
              src={currentAvatar}
              alt="Avatar actual"
              fill
              className="object-cover"
            />
          </div>
        </div>
      )}
      <FileUploadWidget
        bucket={StorageBucket.AVATARES}
        userId={userId}
        acceptedTypes="image/jpeg,image/png,image/webp"
        maxSizeMB={2}
        label="Foto de perfil"
        buttonText="Cambiar avatar"
        onUploadComplete={onUploadComplete}
      />
    </div>
  )
}

// Componente especializado para tickets
export function TicketImageUpload({
  ticketId,
  onUploadComplete,
  className,
}: {
  ticketId: string
  onUploadComplete?: (url: string) => void
  className?: string
}) {
  return (
    <FileUploadWidget
      bucket={StorageBucket.TICKETS}
      entityId={ticketId}
      acceptedTypes="image/jpeg,image/png,image/webp"
      maxSizeMB={5}
      label="Captura de pantalla (opcional)"
      buttonText="Adjuntar imagen"
      onUploadComplete={onUploadComplete}
      className={className}
    />
  )
}
