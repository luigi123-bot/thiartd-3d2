"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, ShoppingCart, Package, Ruler, Tag, Star, Truck, Sparkles, Video, Heart } from "lucide-react";
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-6">
        {/* Botón de volver */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6 hover:bg-gray-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 📸 COLUMNA IZQUIERDA: IMAGEN Y GALERÍA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <div className="flex gap-4">
              {/* Galería de miniaturas vertical */}
              <div className="flex flex-col gap-3 w-20">
                {/* Miniatura 1 - Imagen principal */}
                <button
                  onClick={() => {
                    setSelectedImage(0);
                    setShowModel(false);
                  }}
                  aria-label="Ver imagen principal del producto"
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === 0 && !showModel
                      ? "border-[#00a19a] shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {producto.image_url ? (
                    <Image
                      src={producto.image_url}
                      alt={`${producto.nombre} vista 1`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                </button>

                {/* Miniatura 2 - Modelo 3D (solo si existe modelo_url) */}
                {hasValidModel(producto.modelo_url) && (
                  <button
                    onClick={() => {
                      setSelectedImage(1);
                      setShowModel(true);
                    }}
                    aria-label="Ver modelo 3D interactivo"
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all bg-gradient-to-br from-[#00a19a] to-[#008c87] ${
                      showModel
                        ? "border-[#00a19a] shadow-md"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                  </button>
                )}
              </div>

              {/* Imagen principal grande */}
              <Card className="flex-1 overflow-hidden rounded-2xl shadow-lg border border-gray-200 bg-white relative">
                <div 
                  className={`relative aspect-square transition-transform duration-300 ${
                    imageZoom && !showModel ? "scale-110" : "scale-100"
                  }`}
                  onMouseEnter={() => !showModel && setImageZoom(true)}
                  onMouseLeave={() => setImageZoom(false)}
                >
                  {showModel ? (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200">
                      {hasValidModel(producto.modelo_url) ? (
                        <ErrorBoundary 
                          fallback={
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="text-center p-8">
                                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 text-sm">No se pudo cargar el modelo 3D</p>
                                <Button
                                  variant="outline"
                                  onClick={() => setShowModel(false)}
                                  className="mt-4"
                                >
                                  Ver imagen
                                </Button>
                              </div>
                            </div>
                          }
                        >
                          <Suspense 
                            fallback={
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="text-center">
                                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a19a] mx-auto mb-4"></div>
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
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center p-8">
                            <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 text-sm font-medium mb-2">
                              Modelo 3D no disponible
                            </p>
                            <p className="text-gray-500 text-xs mb-4">
                              Este producto aún no tiene un modelo 3D cargado
                            </p>
                            <Button
                              variant="outline"
                              onClick={() => setShowModel(false)}
                              className="mt-2"
                            >
                              Ver imagen del producto
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : producto.image_url ? (
                    <Image
                      src={producto.image_url}
                      alt={producto.nombre}
                      fill
                      className="object-contain p-8 cursor-zoom-in"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <Package className="w-24 h-24 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Indicador de vista actual */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm z-10">
                  {showModel ? (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Vista 3D Interactiva
                    </span>
                  ) : (
                    <span>Vista Principal</span>
                  )}
                </div>
              </Card>
            </div>

            {/* Botones de acción rápida */}
            {hasValidModel(producto.modelo_url) ? (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowModel(false);
                    setSelectedImage(0);
                  }}
                  className={`${!showModel ? 'bg-gray-100' : ''}`}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Ver Foto
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowModel(true);
                    setSelectedImage(1);
                  }}
                  className={`${showModel ? 'bg-teal-50 border-teal-600 text-teal-700' : ''}`}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Ver en 3D
                </Button>
              </div>
            ) : (
              <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600">
                  Este producto no tiene modelo 3D disponible
                </p>
              </div>
            )}

            {/* Video del producto */}
            {(() => {
              console.log('🎥 Video URL en render:', producto.video_url);
              return null;
            })()}
            {producto.video_url && (
              <Card className="overflow-hidden rounded-2xl shadow-md border border-gray-200 bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Video className="w-5 h-5 text-teal-600" />
                    <h3 className="font-semibold text-gray-900">Video del producto</h3>
                  </div>
                  <video
                    controls
                    className="w-full rounded-lg"
                    preload="metadata"
                  >
                    <source src={producto.video_url} type="video/mp4" />
                    <source src={producto.video_url} type="video/webm" />
                    Tu navegador no soporta la reproducción de videos.
                  </video>
                </CardContent>
              </Card>
            )}
            {!producto.video_url && (
              <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-800">
                  ℹ️ Este producto no tiene video disponible
                </p>
              </div>
            )}
          </motion.div>

          {/* 📄 COLUMNA DERECHA: DETALLES DEL PRODUCTO */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            {/* Card principal de compra - Estilo Mercado Libre */}
            <Card className="rounded-2xl shadow-md border border-gray-200 bg-white overflow-hidden">
              <CardContent className="p-0">
                {/* Header con badges */}
                <div className="p-4 border-b">
                  <div className="flex items-center gap-2 mb-3">
                    {producto.destacado && (
                      <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-2 py-0.5">
                        MÁS VENDIDO
                      </Badge>
                    )}
                    <span className="text-sm text-gray-600">Nuevo | +{producto.stock} vendidos</span>
                  </div>
                  
                  <h1 className="font-normal text-xl sm:text-2xl text-gray-900 mb-4">
                    {producto.nombre}
                  </h1>

                  {/* Rating (puedes agregar esto después) */}
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 fill-blue-500 text-blue-500" />
                      <span className="ml-1 text-gray-900">4.0</span>
                    </div>
                    <span className="text-gray-400">({Math.min(producto.stock * 2, 50)})</span>
                  </div>
                </div>

                {/* Precio y descuento */}
                <div className="p-4 border-b">
                  {producto.destacado && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-gray-400 line-through text-lg">
                        ${Math.round(producto.precio * 1.5).toLocaleString("es-CO")}
                      </span>
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        40% OFF
                      </Badge>
                    </div>
                  )}
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-light text-gray-900">
                      ${Math.floor(producto.precio / 1000).toLocaleString("es-CO")}
                    </span>
                    <span className="text-2xl font-light text-gray-900">
                      .{(producto.precio % 1000).toString().padStart(3, '0')}
                    </span>
                  </div>
                  {producto.destacado && (
                    <p className="text-sm text-green-600 mt-2">
                      3 cuotas de ${Math.round(producto.precio / 3).toLocaleString("es-CO")} con 0% interés
                    </p>
                  )}
                  <p className="text-sm text-gray-600 mt-1">
                    Precio por litro: ${(producto.precio * 10).toLocaleString("es-CO")}
                  </p>
                </div>

                {/* Envío */}
                <div className="p-4 border-b bg-green-50">
                  <div className="flex items-start gap-3">
                    <Truck className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-green-700 font-semibold mb-1">Llega gratis el viernes</p>
                      <button className="text-sm text-blue-600 hover:text-blue-700">
                        Más detalles y formas de entrega
                      </button>
                      <p className="text-sm text-gray-600 mt-2">
                        <span className="font-semibold text-green-600">Retira gratis</span> a partir del viernes en una agencia de Mercado Libre
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stock y cantidad */}
                <div className="p-4 border-b">
                  <div className="mb-4">
                    <p className="text-sm text-gray-700 mb-2">
                      <span className="font-semibold">Stock disponible</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900">Cantidad: </span>
                      <select 
                        className="border border-gray-300 rounded px-3 py-1 text-sm"
                        aria-label="Seleccionar cantidad"
                      >
                        <option>1 unidad</option>
                        {producto.stock >= 2 && <option>2 unidades</option>}
                        {producto.stock >= 3 && <option>3 unidades</option>}
                      </select>
                      <span className="text-sm text-gray-500">
                        ({Math.min(producto.stock, 10)} disponibles)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="p-4 space-y-3">
                  <Button
                    onClick={() => {
                      console.log("Producto añadido al carrito:", producto);
                    }}
                    disabled={producto.stock === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-semibold rounded-lg shadow-sm"
                    size="lg"
                  >
                    Comprar ahora
                  </Button>
                  
                  <Button
                    onClick={() => {
                      console.log("Producto añadido al carrito:", producto);
                    }}
                    disabled={producto.stock === 0}
                    variant="outline"
                    className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 py-3 text-base font-semibold rounded-lg"
                    size="lg"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Agregar al carrito
                  </Button>

                  <div className="pt-2">
                    <button className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1 mx-auto">
                      <Heart className="w-4 h-4" />
                      Agregar a una lista
                    </button>
                  </div>
                </div>

                {/* Vendedor info */}
                <div className="p-4 border-t bg-gray-50">
                  <p className="text-sm text-gray-600 mb-1">Vendido por</p>
                  <button className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
                    MercadoLíder
                    <Badge className="bg-blue-100 text-blue-700 text-xs ml-2">+500 ventas</Badge>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Descripción y specs - Estilo tabs de ML */}
            <Card className="rounded-2xl shadow-md border border-gray-200 bg-white overflow-hidden">
              <CardContent className="p-6">
                {/* Descripción */}
                {producto.descripcion && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Descripción</h2>
                    <p className="text-gray-700 leading-relaxed">
                      {producto.descripcion}
                    </p>
                  </div>
                )}

                {/* Especificaciones */}
                <div className="pt-6 border-t">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Características principales</h2>
                  <div className="grid grid-cols-1 gap-4">
                    {producto.categoria && (
                      <div className="flex gap-3">
                        <Tag className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Categoría</p>
                          <p className="text-sm text-gray-600">{producto.categoria}</p>
                        </div>
                      </div>
                    )}
                    {producto.tamano && (
                      <div className="flex gap-3">
                        <Ruler className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Tamaño</p>
                          <p className="text-sm text-gray-600">{producto.tamano}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <Package className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Material</p>
                        <p className="text-sm text-gray-600">PLA / ABS de alta calidad</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Package className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Volumen de la unidad</p>
                        <p className="text-sm text-gray-600">100 mL</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detalles adicionales */}
                {producto.detalles && (
                  <div className="pt-6 border-t mt-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Detalles adicionales</h2>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {producto.detalles}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* SECCIÓN INFERIOR: PRODUCTOS RELACIONADOS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12"
        >
          <h2 className="text-2xl font-bold mb-6">Productos relacionados</h2>
          <ProductosCarrusel soloDestacados={false} />
        </motion.div>
      </div>
    </div>
  );
}
