"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft,  Package, Ruler, Tag, Star, Sparkles, Video, Heart, Minus, Plus, Share2, ExternalLink, Check } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Model3DViewer } from "~/components/Model3DViewer";
import ProductosCarrusel from "~/components/ProductosCarrusel";
import { motion, AnimatePresence } from "framer-motion";
import { useCarrito } from "~/components/providers/CarritoProvider";
import { toast } from "sonner";
import Link from "next/link";

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
  if (!url) return false;
  if (typeof url !== 'string') return false;
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
  usuarios?: { nombre: string } | null;
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
  model_url?: string | null;
  video_url: string | null;
  usuarios: { nombre: string } | null;
}

export default function ProductoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const { addToCarrito } = useCarrito();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModel, setShowModel] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [cantidad, setCantidad] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchProducto = async () => {
      if (!params.id) return;

      try {
        const { data, error } = await supabase
          .from("productos")
          .select("*, usuarios:user_id(nombre)")
          .eq("id", params.id)
          .single<ProductoData>();

        if (error) throw error;

        if (data) {
          const resolvedModelUrl = (data.modelo_url ?? data.model_url) ?? undefined;
          
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
            modelo_url: resolvedModelUrl,
            video_url: data.video_url ?? undefined,
            usuarios: data.usuarios,
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

  const handleAddToCart = async () => {
    if (!producto) return;
    const ok = await addToCarrito({
      id: String(producto.id),
      nombre: producto.nombre,
      precio: producto.precio,
      imagen: producto.image_url,
      cantidad: cantidad,
      stock: producto.stock,
      categoria: producto.categoria,
      destacado: producto.destacado,
    });
    if (ok) {
      toast.success("Producto añadido al carrito", {
        description: `${cantidad} x ${producto.nombre} agregados correctamente.`,
      });
    } else {
      toast.error("No se pudo añadir al carrito", {
        description: "Verifica el stock disponible.",
      });
    }
  };

  const handleBuyNow = async () => {
    if (!producto) return;
    const ok = await addToCarrito({
      id: String(producto.id),
      nombre: producto.nombre,
      precio: producto.precio,
      imagen: producto.image_url,
      cantidad: cantidad,
      stock: producto.stock,
      categoria: producto.categoria,
      destacado: producto.destacado,
    });
    if (ok) {
      router.push("/tienda/carrito");
    }
  };

  const handleShare = async () => {
    if (typeof navigator.share !== 'undefined') {
      try {
        await navigator.share({
          title: producto?.nombre,
          text: producto?.descripcion,
          url: window.location.href,
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.info("Enlace copiado al portapapeles");
    }
  };

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
    <div className="min-h-screen bg-[#fcfdfd]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Breadcrumb Mejorado */}
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
             <Button
                variant="ghost"
                onClick={() => router.back()}
                className="h-10 w-10 p-0 rounded-full hover:bg-teal-50 text-slate-600"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="h-4 w-[1px] bg-slate-200 hidden sm:block mx-1" />
              <div className="text-xs sm:text-sm flex items-center gap-2 overflow-hidden">
                <Link href="/" className="text-slate-400 hover:text-teal-600 transition-colors">Inicio</Link>
                <span className="text-slate-300">/</span>
                <Link href="/tienda/productos" className="text-slate-400 hover:text-teal-600 transition-colors">Tienda</Link>
                <span className="text-slate-300">/</span>
                <span className="text-slate-900 font-bold truncate">{producto.nombre}</span>
              </div>
          </div>
          
          <div className="flex items-center gap-2 self-end sm:self-auto">
             <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full h-9 gap-2 border-slate-200 hover:bg-slate-50 text-slate-600"
                onClick={handleShare}
              >
                <Share2 className="w-3.5 h-3.5" />
                Compartir
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className={`rounded-full h-9 gap-2 border-slate-200 transition-all ${isFavorite ? "border-red-100 bg-red-50 text-red-600" : "hover:bg-slate-50 text-slate-600"}`}
                onClick={() => setIsFavorite(!isFavorite)}
              >
                <Heart className={`w-3.5 h-3.5 ${isFavorite ? "fill-red-600" : ""}`} />
                {isFavorite ? "Favorito" : "Guardar"}
              </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* ========================================
              GALERÍA
          ======================================== */}
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-7"
          >
            <div className="sticky top-28 space-y-6">
                <div className="relative aspect-square sm:aspect-[4/3] lg:aspect-square bg-slate-50 rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm group">
                  <AnimatePresence mode="wait">
                  {showModel ? (
                    <motion.div 
                        key="model"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="w-full h-full"
                    >
                       <ErrorBoundary fallback={<div className="flex h-full items-center justify-center">Error cargando modelo</div>}>
                          <Model3DViewer modelUrl={producto.modelo_url!} height="100%" showControls autoRotate />
                       </ErrorBoundary>
                    </motion.div>
                  ) : showVideo ? (
                    <motion.div 
                        key="video"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="w-full h-full bg-slate-900"
                    >
                      <video controls autoPlay className="w-full h-full object-contain" src={producto.video_url} />
                    </motion.div>
                  ) : (
                    <motion.div 
                        key="image"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="relative w-full h-full p-8"
                    >
                      <Image
                        src={producto.image_url || "/Logo%20Thiart%20Tiktok.png"}
                        alt={producto.nombre}
                        fill
                        className="object-contain transition-transform duration-500 hover:scale-105"
                        priority
                      />
                    </motion.div>
                  )}
                  </AnimatePresence>

                  {/* Badges Flotantes */}
                  {producto.destacado && (
                    <div className="absolute top-6 left-6">
                      <span className="bg-[#00a19a] text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full shadow-xl">
                        Edición Especial
                      </span>
                    </div>
                  )}
                  
                  {/* Controles de Vista */}
                  <div className="absolute bottom-6 right-6 flex gap-2">
                     <button 
                        className="w-12 h-12 bg-white/90 backdrop-blur rounded-2xl flex items-center justify-center text-slate-800 shadow-xl border border-white hover:bg-[#00a19a] hover:text-white transition-all scale-100 hover:scale-110"
                        onClick={() => {
                          // TODO: Implement fullscreen view if needed
                          console.log("Maximizar vista");
                        }}
                        title="Ver en pantalla completa"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </button>
                  </div>
                </div>

                {/* Selectores de Medios */}
                <div className="flex gap-4 px-2">
                   <MediaThumb 
                        active={!showModel && !showVideo} 
                        onClick={() => { setShowModel(false); setShowVideo(false); }}
                        icon={<Package className="w-5 h-5" />}
                        label="Imagen" 
                    />
                    {hasValidModel(producto.modelo_url) && (
                       <MediaThumb 
                            active={showModel} 
                            onClick={() => { setShowModel(true); setShowVideo(false); }}
                            icon={<Sparkles className="w-5 h-5" />}
                            label="Modelo 3D" 
                        />
                    )}
                    {producto.video_url && (
                       <MediaThumb 
                            active={showVideo} 
                            onClick={() => { setShowModel(false); setShowVideo(true); }}
                            icon={<Video className="w-5 h-5" />}
                            label="Video" 
                        />
                    )}
                </div>

                {/* Descripción Detallada */}
                <div className="pt-8 border-t border-slate-100">
                   <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                     <div className="w-1 h-6 bg-teal-500 rounded-full" />
                     Inspiración y Detalles
                   </h3>
                   <p className="text-slate-600 leading-relaxed text-lg">
                     {producto.descripcion}
                   </p>
                   {producto.detalles && (
                     <p className="mt-4 text-slate-500 text-base border-l-4 border-slate-100 pl-4 italic">
                       {producto.detalles}
                     </p>
                   )}
                </div>
            </div>
          </motion.div>

          {/* ========================================
              COMPRA
          ======================================== */}
          <motion.div
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-5"
          >
            <div className="space-y-8">
               <div>
                  <span className="text-[#00a19a] font-black text-xs uppercase tracking-widest mb-2 block">
                    {producto.categoria}
                  </span>
                  <h1 className="text-4xl sm:text-5xl font-black text-slate-900 leading-[1.1] mb-4">
                    {producto.nombre}
                  </h1>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                    </div>
                    <span className="text-sm font-bold text-slate-500">4.9 (124 reseñas)</span>
                  </div>
               </div>

               <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                  <div className="flex items-baseline gap-2 mb-8">
                     <span className="text-sm font-black text-teal-600 mb-4">PRECIO TOTAL</span>
                     <div className="flex items-baseline gap-2 w-full">
                        <span className="text-5xl font-black text-slate-900 tracking-tighter">
                          ${(producto.precio * cantidad).toLocaleString()}
                        </span>
                        <span className="text-lg font-bold text-slate-400">COP</span>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-600">Unidades</span>
                        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                           <Button 
                              variant="ghost" size="icon" className="h-10 w-10 rounded-xl"
                              onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                              disabled={cantidad <= 1}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-10 text-center font-black text-slate-900">{cantidad}</span>
                            <Button 
                              variant="ghost" size="icon" className="h-10 w-10 rounded-xl"
                              onClick={() => setCantidad(Math.min(producto.stock, cantidad + 1))}
                              disabled={cantidad >= producto.stock}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                     </div>

                     <div className="space-y-3">
                        <Button 
                           onClick={handleBuyNow}
                           className="w-full h-16 rounded-2xl bg-[#00a19a] hover:bg-[#007973] text-white text-lg font-black shadow-xl shadow-[#00a19a]/20 transition-all hover:-translate-y-1"
                        >
                           COMPRAR AHORA
                        </Button>
                        <Button 
                           variant="outline"
                           onClick={handleAddToCart}
                           className="w-full h-16 rounded-2xl border-2 border-slate-200 text-slate-800 text-lg font-black hover:bg-slate-50 transition-all"
                        >
                           AGREGAR AL CARRITO
                        </Button>
                     </div>
                  </div>
               </div>

               {/* Características Técnicas */}
               <div className="grid grid-cols-2 gap-4">
                  <FeatureBox icon={<Ruler className="w-5 h-5" />} label="Medidas" value={producto.tamano || "Standard"} />
                  <FeatureBox icon={<Check className="w-5 h-5" />} label="Material" value="PLA Bio" />
                  <FeatureBox icon={<Package className="w-5 h-5" />} label="En Stock" value={`${producto.stock} unidades`} />
                  <FeatureBox icon={<Tag className="w-5 h-5" />} label="Boutique" value="Thiart3D" />
               </div>

               {/* Garantía */}
               <div className="flex items-center gap-4 p-6 border-2 border-dashed border-slate-100 rounded-[2rem]">
                  <div className="h-12 w-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Garantía de Satisfacción</p>
                    <p className="text-sm text-slate-500">Recibe tu producto exactamente como lo viste o te devolvemos el dinero.</p>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>

        {/* Recomendaciones */}
        <div className="mt-24">
           <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-black text-slate-900 mb-2">Recomendaciones Curadas</h2>
                <p className="text-slate-500">Seleccionamos piezas que complementan tu estilo.</p>
              </div>
              <Button variant="ghost" className="text-[#00a19a] font-bold" onClick={() => router.push("/tienda/productos")}>
                 EXPLORAR TODO <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
              </Button>
           </div>
           <ProductosCarrusel soloDestacados={false} />
        </div>
      </div>
    </div>
  );
}

function MediaThumb({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
        onClick={onClick}
        className={`flex-1 flex items-center justify-center gap-3 h-14 rounded-2xl border-2 transition-all font-bold text-sm ${
            active 
            ? "bg-[#00a19a] border-[#00a19a] text-white shadow-lg shadow-[#00a19a]/20" 
            : "bg-white border-slate-100 text-slate-500 hover:border-teal-200 hover:text-teal-600"
        }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function FeatureBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm">
       <div className="text-[#00a19a] mb-2 opacity-70">{icon}</div>
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
       <p className="text-sm font-bold text-slate-800 truncate">{value}</p>
    </div>
  );
}
