// components/Model3DViewer.tsx
'use client'

import React, { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, useGLTF, Stage, Grid, Environment, Center } from '@react-three/drei'
import { Button } from '~/components/ui/button'
import { FiRotateCw, FiZoomIn, FiZoomOut, FiMaximize2 } from 'react-icons/fi'
import type * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'

interface Model3DProps {
  url: string
  autoRotate?: boolean
}

// Detectar el tipo de archivo por la extensión
function getFileExtension(url: string): string {
  const extension = url.split('.').pop()?.toLowerCase() ?? ''
  console.log('🎨 Cargando modelo 3D:', {
    url,
    extension,
    tipo: extension === 'stl' ? 'STL (Stereolithography)' : 
          extension === 'glb' ? 'GLB (GLTF Binary)' : 
          extension === 'gltf' ? 'GLTF (GL Transmission)' : 
          'Desconocido'
  })
  return extension
}

function STLModel({ url, autoRotate = false }: Model3DProps) {
  const geometry = useLoader(STLLoader, url)
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state, delta) => {
    if (autoRotate && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3
    }
  })

  return (
    <mesh ref={meshRef} geometry={geometry}>
      {/* Material mejorado para STL con mejor visualización */}
      <meshStandardMaterial 
        color="#00a19a" 
        metalness={0.6} 
        roughness={0.3}
        flatShading={false}
      />
    </mesh>
  )
}

function GLTFModel({ url, autoRotate = false }: Model3DProps) {
  const gltf = useGLTF(url, true) // true para usar el loader con cache
  const meshRef = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    if (autoRotate && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3
    }
  })

  if (!gltf || !gltf.scene) {
    return null
  }

  return <primitive ref={meshRef} object={gltf.scene} />
}

function Model({ url, autoRotate = false }: Model3DProps) {
  const extension = getFileExtension(url)
  
  if (extension === 'stl') {
    return (
      <Center>
        <STLModel url={url} autoRotate={autoRotate} />
      </Center>
    )
  }
  
  if (extension === 'glb' || extension === 'gltf') {
    return (
      <Center>
        <GLTFModel url={url} autoRotate={autoRotate} />
      </Center>
    )
  }
  
  // Si no es un formato reconocido
  console.error('❌ Formato no soportado:', extension)
  throw new Error(`Formato no soportado: .${extension}. Use STL, GLB o GLTF`)
}

interface Model3DViewerProps {
  modelUrl: string
  className?: string
  height?: string
  showControls?: boolean
  autoRotate?: boolean
}

export function Model3DViewer({
  modelUrl,
  className = '',
  height = '400px',
  showControls = true,
  autoRotate = false,
}: Model3DViewerProps) {
  const [rotate, setRotate] = useState(autoRotate)

  const handleResetView = () => {
    // Resetear vista - la funcionalidad se maneja via OrbitControls
    console.log('Vista restablecida')
  }

  const handleZoomIn = () => {
    console.log('Zoom in')
  }

  const handleZoomOut = () => {
    console.log('Zoom out')
  }

  return (
    <div className={`relative ${className}`}>
      {/* Canvas 3D */}
      <div 
        className={`w-full rounded-lg overflow-hidden border border-gray-200 bg-gradient-to-b from-gray-50 to-gray-100 ${
          height === '400px' ? 'h-[400px]' : 
          height === '200px' ? 'h-[200px]' : 
          height === '500px' ? 'h-[500px]' :
          height === '100%' ? 'h-full' : 'h-[400px]'
        }`}
      >
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          shadows
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            {/* Iluminación */}
            <ambientLight intensity={0.5} />
            <spotLight
              position={[10, 10, 10]}
              angle={0.15}
              penumbra={1}
              intensity={1}
              castShadow
            />
            <pointLight position={[-10, -10, -10]} intensity={0.5} />

            {/* Modelo 3D */}
            <Stage environment="city" intensity={0.6}>
              <Model url={modelUrl} autoRotate={rotate} />
            </Stage>

            {/* Grid opcional */}
            <Grid
              renderOrder={-1}
              position={[0, -1.85, 0]}
              infiniteGrid
              cellSize={0.6}
              cellThickness={0.6}
              sectionSize={3.3}
              sectionThickness={1.5}
              sectionColor="#8080ff"
              fadeDistance={25}
              fadeStrength={1}
              followCamera={false}
            />

            {/* Environment mapping para reflejos */}
            <Environment preset="sunset" />

            {/* Controles de órbita */}
            <OrbitControls
              makeDefault
              minPolarAngle={0}
              maxPolarAngle={Math.PI / 1.75}
              enableZoom={true}
              enablePan={true}
              zoomSpeed={0.5}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Controles de UI */}
      {showControls && (
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-lg border border-gray-200">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setRotate(!rotate)}
            title={rotate ? 'Detener rotación' : 'Activar rotación'}
            className="w-10 h-10 p-0"
          >
            <FiRotateCw className={rotate ? 'animate-spin' : ''} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomIn}
            title="Acercar"
            className="w-10 h-10 p-0"
          >
            <FiZoomIn />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomOut}
            title="Alejar"
            className="w-10 h-10 p-0"
          >
            <FiZoomOut />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleResetView}
            title="Restablecer vista"
            className="w-10 h-10 p-0"
          >
            <FiMaximize2 />
          </Button>
        </div>
      )}

      {/* Instrucciones */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        Arrastra para rotar • Rueda para zoom • Click derecho para mover
      </div>
    </div>
  )
}

// Componente de carga
export function Model3DViewerLoading() {
  return (
    <div className="w-full h-96 flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg border border-gray-200">
      <div className="text-center space-y-3">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="text-sm text-gray-600">Cargando modelo 3D...</p>
      </div>
    </div>
  )
}

// Componente para preview en tarjetas de producto
export function Model3DPreview({ modelUrl, className = '' }: { modelUrl: string; className?: string }) {
  return (
    <Model3DViewer
      modelUrl={modelUrl}
      height="200px"
      showControls={false}
      autoRotate={true}
      className={className}
    />
  )
}
