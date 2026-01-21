"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, ShoppingCart, Package, Ruler, Tag, Star,Sparkles, Video, Heart, Minus, Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Model3DViewer } from "~/components/Model3DViewer";
import ProductosCarrusel from "~/components/ProductosCarrusel";
import { motion } from "framer-motion";

// Componente de error boundary simple
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Error en Model3DViewer:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper para verificar si hay un modelo 3D válido
const hasValidModel = (url?: string | null): boolean => {
  if (!url) return false; // Maneja null, undefined y cadenas vacías
  if (typeof url !== 'string') return false; // Asegura que sea string
  const trimmed = url.trim();
  return trimmed.length > 0 && trimmed !== 'null' && trimmed !== 'undefined';
};

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  tamano: string;
  stock: number;
  categoria: string;
  destacado: boolean;
  detalles?: string;
  image_url: string;
  modelo_url?: string;
  video_url?: string;
}

interface ProductoData {
  id: number;
  nombre: string;
  descripcion: string;
  precio: string;
  tamano: string;
  stock: number;
  categoria: string;
  destacado: boolean;
  detalles: string | null;
  image_url: string | null;
  modelo_url: string | null;
  video_url: string | null;
}

export default function ProductoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModel, setShowModel] = useState(false);
  const [imageZoom, setImageZoom] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [cantidad, setCantidad] = useState(1);

  useEffect(() => {
    const fetchProducto = async () => {
      if (!params.id) return;

      try {
        const { data, error } = await supabase
          .from("productos")
          .select("*")
          .eq("id", params.id)
          .single<ProductoData>();

        if (error) throw error;

        if (data) {
          const isValid = hasValidModel(data.modelo_url);
          console.log('📦 Datos del producto:', {
            id: data.id,
            nombre: data.nombre,
            modelo_url: data.modelo_url,
            modelo_url_type: typeof data.modelo_url,
            modelo_url_length: data.modelo_url?.length,
            hasValidModel: isValid,
            video_url: data.video_url,
            video_url_type: typeof data.video_url,
            video_url_length: data.video_url?.length,
            hasVideoUrl: !!data.video_url,
            mensaje: isValid 
              ? '✅ Modelo 3D válido encontrado' 
              : '❌ No hay modelo 3D - El campo está NULL o vacío. Para agregar un modelo, sube un archivo STL/GLB/GLTF a Supabase Storage y actualiza este campo.',
            videoMensaje: data.video_url 
              ? '✅ Video encontrado' 
              : '⚠️ No hay video - El campo video_url está NULL o vacío. Para agregar un video, sube un archivo de video a Supabase Storage desde el modal de crear/editar producto.'
          });

          setProducto({
            id: data.id,
            nombre: data.nombre ?? "",
            descripcion: data.descripcion ?? "",
            precio: parseFloat(data.precio ?? "0"),
            tamano: data.tamano ?? "",
            stock: data.stock ?? 0,
            categoria: data.categoria ?? "",
            destacado: data.destacado ?? false,
            detalles: data.detalles ?? "",
            image_url: data.image_url ?? "",
            modelo_url: data.modelo_url ?? undefined,
            video_url: data.video_url ?? undefined,
          });
        }
      } catch (err) {
        console.error("Error al cargar producto:", err);
        setError("No se pudo cargar el producto");
      } finally {
        setLoading(false);
      }
    };

    void fetchProducto();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a19a] mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (error || !producto) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Producto no encontrado</h2>
              <p className="text-gray-600 mb-6">{error || "El producto que buscas no existe"}</p>
              <Button onClick={() => router.push("/tienda/productos")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a productos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/30 to-gray-50">
      {/* Contenedor principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Breadcrumb y navegación */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-4 sm:mb-6"
        >
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-3 hover:bg-teal-50 text-gray-700 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a productos
          </Button>
          <div className="text-xs sm:text-sm text-gray-500 flex items-center flex-wrap gap-2">
            <span className="hover:text-teal-600 cursor-pointer transition-colors">Inicio</span>
            <span>›</span>
            <span className="hover:text-teal-600 cursor-pointer transition-colors">{producto.categoria}</span>
            <span>›</span>
            <span className="text-gray-900 font-medium">{producto.nombre}</span>
          </div>
        </motion.div>

        {/* Grid principal: 2 columnas en desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* ========================================
              COLUMNA IZQUIERDA: GALERÍA CON VIDEO INTEGRADO
          ======================================== */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 space-y-4"
          >
            {/* Card principal de galería */}
            <Card className="overflow-hidden border border-gray-200 shadow-lg bg-white rounded-2xl">
              <CardContent className="p-4 sm:p-6">
                <div className="flex gap-3 sm:gap-4">
                  {/* Miniaturas verticales */}
                  <div className="flex flex-col gap-2 sm:gap-3 w-14 sm:w-20">
                    {/* Miniatura: Imagen principal */}
                    <button
                      onClick={() => {
                        setSelectedImage(0);
                        setShowModel(false);
                        setShowVideo(false);
                      }}
                      aria-label="Ver imagen principal"
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === 0 && !showModel && !showVideo
                          ? "border-teal-600 shadow-md ring-2 ring-teal-100"
                          : "border-gray-200 hover:border-teal-300"
                      }`}
                    >
                      {producto.image_url ? (
                        <Image
                          src={producto.image_url}
                          alt="Vista principal"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <Package className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300" />
                        </div>
                      )}
                    </button>

                    {/* Miniatura: Modelo 3D */}
                    {hasValidModel(producto.modelo_url) && (
                      <button
                        onClick={() => {
                          setSelectedImage(1);
                          setShowModel(true);
                          setShowVideo(false);
                        }}
                        aria-label="Ver modelo 3D"
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          showModel
                            ? "border-teal-600 shadow-md ring-2 ring-teal-100"
                            : "border-gray-200 hover:border-teal-300"
                        } bg-gradient-to-br from-teal-50 to-cyan-50`}
                      >
                        <div className="w-full h-full flex items-center justify-center">
                          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" />
                        </div>
                      </button>
                    )}

                    {/* Miniatura: Video */}
                    {producto.video_url && (
                      <button
                        onClick={() => {
                          setSelectedImage(2);
                          setShowModel(false);
                          setShowVideo(true);
                        }}
                        aria-label="Ver video"
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          showVideo
                            ? "border-teal-600 shadow-md ring-2 ring-teal-100"
                            : "border-gray-200 hover:border-teal-300"
                        } bg-gradient-to-br from-purple-50 to-pink-50`}
                      >
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Visor principal */}
                  <div className="flex-1">
                    <div 
                      className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden"
                      onMouseEnter={() => !showModel && !showVideo && setImageZoom(true)}
                      onMouseLeave={() => setImageZoom(false)}
                    >
                      {/* Mostrar Modelo 3D */}
                      {showModel ? (
                        <div className="w-full h-full">
                          {hasValidModel(producto.modelo_url) ? (
                            <ErrorBoundary 
                              fallback={
                                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                  <div className="text-center p-6">
                                    <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-600 text-sm mb-3">No se pudo cargar el modelo 3D</p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setShowModel(false);
                                        setSelectedImage(0);
                                      }}
                                      className="border-teal-600 text-teal-600 hover:bg-teal-50"
                                    >
                                      Ver imagen
                                    </Button>
                                  </div>
                                </div>
                              }
                            >
                              <Suspense 
                                fallback={
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50">
                                    <div className="text-center">
                                      <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-teal-600 mx-auto mb-3"></div>
                                      <p className="text-gray-600 text-sm">Cargando modelo 3D...</p>
                                    </div>
                                  </div>
                                }
                              >
                                <Model3DViewer 
                                  modelUrl={producto.modelo_url!}
                                  height="100%"
                                  showControls={true}
                                  autoRotate={true}
                                />
                              </Suspense>
                            </ErrorBoundary>
                          ) : null}
                        </div>
                      ) : showVideo && producto.video_url ? (
                        /* Mostrar Video */
                        <div className="w-full h-full bg-black flex items-center justify-center">
                          <video
                            controls
                            autoPlay
                            className="w-full h-full object-contain"
                            preload="metadata"
                          >
                            <source src={producto.video_url} type="video/mp4" />
                            <source src={producto.video_url} type="video/webm" />
                            Tu navegador no soporta la reproducción de videos.
                          </video>
                        </div>
                      ) : producto.image_url ? (
                        /* Mostrar Imagen */
                        <Image
                          src={producto.image_url}
                          alt={producto.nombre}
                          fill
                          className={`object-contain p-4 sm:p-8 transition-transform duration-300 ${
                            imageZoom ? "scale-110" : "scale-100"
                          }`}
                          priority
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-16 h-16 sm:w-24 sm:h-24 text-gray-300" />
                        </div>
                      )}

                      {/* Indicador de vista actual */}
                      <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-10">
                        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg backdrop-blur-sm">
                          {showModel ? (
                            <>
                              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline">Vista 3D Interactiva</span>
                              <span className="sm:hidden">3D</span>
                            </>
                          ) : showVideo ? (
                            <>
                              <Video className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline">Video del producto</span>
                              <span className="sm:hidden">Video</span>
                            </>
                          ) : (
                            <>
                              <Package className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline">Imagen principal</span>
                              <span className="sm:hidden">Foto</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contador de medios */}
                    <div className="flex justify-center items-center gap-2 mt-3 sm:mt-4">
                      <div className="flex gap-1.5">
                        <div className={`h-1.5 rounded-full transition-all ${
                          !showModel && !showVideo ? "w-6 bg-teal-600" : "w-1.5 bg-gray-300"
                        }`}></div>
                        {hasValidModel(producto.modelo_url) && (
                          <div className={`h-1.5 rounded-full transition-all ${
                            showModel ? "w-6 bg-teal-600" : "w-1.5 bg-gray-300"
                          }`}></div>
                        )}
                        {producto.video_url && (
                          <div className={`h-1.5 rounded-full transition-all ${
                            showVideo ? "w-6 bg-teal-600" : "w-1.5 bg-gray-300"
                          }`}></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Descripción del producto */}
            <Card className="overflow-hidden border border-gray-200 shadow-md bg-white rounded-2xl">
              <CardContent className="p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" />
                  Descripción
                </h2>
                <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                  {producto.descripcion}
                </p>
              </CardContent>
            </Card>

            {/* Características principales */}
            <Card className="overflow-hidden border border-gray-200 shadow-md bg-white rounded-2xl">
              <CardContent className="p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                  <Star className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" />
                  Características
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {producto.categoria && (
                    <div className="flex items-start gap-3 p-3 sm:p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border border-teal-100">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-teal-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-teal-700 uppercase mb-1">Categoría</p>
                        <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">{producto.categoria}</p>
                      </div>
                    </div>
                  )}
                  
                  {producto.tamano && (
                    <div className="flex items-start gap-3 p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Ruler className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-purple-700 uppercase mb-1">Tamaño</p>
                        <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">{producto.tamano}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3 p-3 sm:p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-green-700 uppercase mb-1">Material</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900">PLA / ABS Premium</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 sm:p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-orange-700 uppercase mb-1">Calidad</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900">Alta resolución</p>
                    </div>
                  </div>
                </div>

                {/* Detalles adicionales */}
                {producto.detalles && (
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3">Detalles adicionales</h3>
                    <p className="text-gray-700 leading-relaxed text-sm sm:text-base whitespace-pre-line">
                      {producto.detalles}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* ========================================
              COLUMNA DERECHA: INFORMACIÓN DE COMPRA
          ======================================== */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-5"
          >
            {/* Card sticky de compra */}
            <div className="lg:sticky lg:top-6">
              <Card className="overflow-hidden border border-gray-200 shadow-lg bg-white rounded-2xl">
                <CardContent className="p-4 sm:p-6">
                  {/* Estado del producto */}
                  {producto.destacado && (
                    <div className="mb-4">
                      <Badge className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white text-xs font-bold px-3 py-1 shadow-md">
                        ⭐ PRODUCTO DESTACADO
                      </Badge>
                    </div>
                  )}

                  {/* Título */}
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-tight">
                    {producto.nombre}
                  </h1>

                  {/* Rating y reviews */}
                  <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`w-4 h-4 sm:w-5 sm:h-5 ${
                            star <= 4 ? "fill-amber-400 text-amber-400" : "text-gray-300"
                          }`} 
                        />
                      ))}
                    </div>
                    <span className="text-sm sm:text-base font-semibold text-gray-900">4.8</span>
                    <span className="text-xs sm:text-sm text-gray-500">
                      ({Math.min(producto.stock * 5, 250)} valoraciones)
                    </span>
                  </div>

                  {/* Precio */}
                  <div className="mb-6">
                    {producto.destacado && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg sm:text-xl text-gray-400 line-through">
                          ${Math.round(producto.precio * 1.5).toLocaleString("es-CO")}
                        </span>
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-xs sm:text-sm px-2 py-0.5">
                          -33% OFF
                        </Badge>
                      </div>
                    )}
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                        ${producto.precio.toLocaleString("es-CO")}
                      </span>
                      <span className="text-lg sm:text-xl text-gray-600">COP</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Envío gratis • Entrega en 3-5 días hábiles
                    </p>
                  </div>

                  {/* Stock disponible */}
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-3 sm:p-4 mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Package className="w-4 h-4 text-teal-600" />
                        Stock disponible
                      </span>
                      <span className={`text-sm font-bold ${
                        producto.stock > 10 ? "text-green-600" : producto.stock > 0 ? "text-amber-600" : "text-red-600"
                      }`}>
                        {producto.stock > 0 ? `${Math.min(producto.stock, 99)}+ unidades` : "Agotado"}
                      </span>
                    </div>
                    
                    {/* Selector de cantidad */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-700">Cantidad:</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                          disabled={cantidad <= 1 || producto.stock === 0}
                          className="h-8 w-8 p-0 border-teal-600 text-teal-600 hover:bg-teal-50"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-12 text-center font-semibold text-gray-900">{cantidad}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCantidad(Math.min(producto.stock, cantidad + 1))}
                          disabled={cantidad >= producto.stock || producto.stock === 0}
                          className="h-8 w-8 p-0 border-teal-600 text-teal-600 hover:bg-teal-50"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="space-y-3 mb-6">
                    <Button
                      onClick={() => {
                        console.log("Comprar ahora:", producto, "Cantidad:", cantidad);
                      }}
                      disabled={producto.stock === 0}
                      className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white py-6 text-base sm:text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                      size="lg"
                    >
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      {producto.stock === 0 ? "Producto agotado" : "Comprar ahora"}
                    </Button>
                    
                    <Button
                      onClick={() => {
                        console.log("Agregar al carrito:", producto, "Cantidad:", cantidad);
                      }}
                      disabled={producto.stock === 0}
                      variant="outline"
                      className="w-full border-2 border-teal-600 text-teal-600 hover:bg-teal-50 py-6 text-base sm:text-lg font-bold rounded-xl transition-all duration-300"
                      size="lg"
                    >
                      Agregar al carrito
                    </Button>
                  </div>

                  {/* Favoritos */}
                  <button className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-teal-600 text-sm font-medium py-3 transition-colors group">
                    <Heart className="w-4 h-4 group-hover:fill-teal-600 transition-all" />
                    Agregar a favoritos
                  </button>

                  {/* Información del vendedor */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Vendido por</p>
                        <p className="text-base sm:text-lg font-bold text-gray-900">Thiart 3D Store</p>
                      </div>
                      <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 font-bold text-xs">
                        Verificado ✓
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-3.5 h-3.5 fill-teal-500 text-teal-500" />
                      ))}
                      <span className="text-sm text-gray-600 ml-1">5.0 • {Math.min(producto.stock * 15, 1000)}+ ventas</span>
                    </div>
                  </div>

                  {/* Garantías y beneficios */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-bold text-gray-900 mb-3">Beneficios de compra</h4>
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2.5 text-sm text-gray-700">
                        <div className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0"></div>
                        <span>Envío gratis a todo el país</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-sm text-gray-700">
                        <div className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0"></div>
                        <span>Garantía de calidad</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-sm text-gray-700">
                        <div className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0"></div>
                        <span>Devolución gratuita</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-sm text-gray-700">
                        <div className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0"></div>
                        <span>Pago seguro</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>

        {/* ========================================
            PRODUCTOS RELACIONADOS
        ======================================== */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 lg:mt-16"
        >
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-teal-600" />
              También te puede interesar
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              Descubre productos similares y complementarios
            </p>
          </div>
          <ProductosCarrusel soloDestacados={false} />
        </motion.div>
      </div>
    </div>
  );
}
