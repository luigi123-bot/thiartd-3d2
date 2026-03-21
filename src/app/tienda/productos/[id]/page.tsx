"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Package, Ruler, Tag, Star, Sparkles, Video, Minus, Plus, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
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

// Helper para verificar si hay un modelo 3D válido
const hasValidModel = (url?: string | null): boolean => {
  if (!url) return false;
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  return trimmed.length > 0 && trimmed !== 'null' && trimmed !== 'undefined';
};

interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  tamano: string;
  stock: number;
  categoria: string;
  destacado: boolean;
  detalles?: string;
  image_url: string;
  producto_imagenes?: { image_url: string }[];
  modelo_url?: string;
  video_url?: string;
  usuarios?: { nombre: string } | null;
}

interface Review {
  id: string;
  nombre_cliente?: string;
  estrellas: number;
  comentario: string;
  created_at: string;
}

interface ProductoData {
  id: string;
  nombre?: string;
  descripcion?: string;
  precio?: string;
  tamano?: string;
  stock?: number;
  categoria?: string;
  destacado?: boolean;
  detalles?: string;
  image_url?: string;
  producto_imagenes?: { image_url: string }[];
  modelo_url?: string;
  model_url?: string;
  video_url?: string;
  usuarios?: { nombre: string } | null;
}

export default function ProductoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const { addToCarrito } = useCarrito();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const mediaItems = useMemo(() => {
    if (!producto) return [];

    const imgs = [];
    if (producto.image_url) imgs.push({ type: "image" as const, url: producto.image_url, label: "Principal" });
    if (producto.producto_imagenes) {
      producto.producto_imagenes.forEach((img) => {
        if (img.image_url !== producto.image_url) {
          imgs.push({ type: "image" as const, url: img.image_url, label: `Vista ${imgs.length + 1}` });
        }
      });
    }

    return [
      ...imgs,
      ...(hasValidModel(producto.modelo_url) ? [{ type: "model" as const, url: producto.modelo_url!, label: "Modelo 3D", icon: <Sparkles className="w-5 h-5" /> }] : []),
      ...(producto.video_url ? [{ type: "video" as const, url: producto.video_url, label: "Video", icon: <Video className="w-5 h-5" /> }] : []),
    ];
  }, [producto]);

  const activeMediaItem = useMemo(() => mediaItems[currentImageIndex] ?? mediaItems[0], [mediaItems, currentImageIndex]);

  useEffect(() => {
    if (mediaItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % mediaItems.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [mediaItems.length]);

  const fetchProducto = useCallback(async () => {
    if (!params.id) return;
    const productId = Array.isArray(params.id) ? params.id[0] : params.id;
    try {
      const res = await fetch(`/api/productos/${productId}`, { cache: 'no-store' });
      if (!res.ok) throw new Error("Error al obtener producto");
      const data = await res.json() as ProductoData;
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
          producto_imagenes: data.producto_imagenes ?? [],
          modelo_url: resolvedModelUrl,
          video_url: data.video_url ?? undefined,
          usuarios: data.usuarios,
        });
      }
    } catch {
      setError("No se pudo cargar el producto");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void fetchProducto();
  }, [fetchProducto]);

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
      toast.success("Añadido al carrito");
    }
  };

  const handleBuyNow = async () => {
    if (!producto) return;
    await handleAddToCart();
    router.push("/tienda/carrito");
  };

  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({ estrellas: 5, comentario: "", nombre: "" });
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchReviews = useCallback(async () => {
    const productId = Array.isArray(params.id) ? params.id[0] : params.id;
    try {
      const res = await fetch(`/api/productos/${productId}/reviews`);
      if (res.ok) {
        const data = await res.json() as Review[];
        setReviews(data);
      }
    } catch {
    }
  }, [params.id]);

  useEffect(() => {
    void fetchReviews();
  }, [fetchReviews]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.comentario) return;
    setIsSubmittingReview(true);
    const productId = Array.isArray(params.id) ? params.id[0] : params.id;
    try {
      const res = await fetch(`/api/productos/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_cliente: newReview.nombre || "Cliente Anónimo",
          estrellas: newReview.estrellas,
          comentario: newReview.comentario
        })
      });
      if (res.ok) {
        setNewReview({ estrellas: 5, comentario: "", nombre: "" });
        toast.success("¡Gracias por tu reseña!");
        await fetchReviews();
      } else {
        const data = await res.json() as { error?: string; details?: string };
        toast.error(`Error: ${data.details ?? data.error ?? "No se pudo enviar"}`);
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Cargando...</div>;
  if (error || !producto) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-center p-8"><Card className="p-8"><h1>Producto no encontrado</h1><Button onClick={() => router.push("/tienda")}>Volver</Button></Card></div>;

  return (
    <div className="min-h-screen bg-[#fcfdfd]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header/Breadcrumb */}
        <div className="mb-8 flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()} className="rounded-full h-10 w-10 p-0"><ArrowLeft className="w-5 h-5" /></Button>
          <div className="text-sm font-medium text-slate-400">
            <Link href="/" className="hover:text-teal-600">Inicio</Link> / <Link href="/tienda/productos" className="hover:text-teal-600">Tienda</Link> / <span className="text-slate-900 font-bold">{producto.nombre}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Gallery */}
          <div className="lg:col-span-6 space-y-6">
            <div className="relative aspect-square bg-slate-50 rounded-[2.5rem] overflow-hidden border border-slate-100 group">
              <AnimatePresence mode="wait">
                {activeMediaItem?.type === "model" ? (
                  <motion.div key="model" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full">
                    <ErrorBoundary fallback={<div className="flex items-center justify-center h-full">Error modelo 3D</div>}>
                      <Model3DViewer modelUrl={activeMediaItem.url} height="100%" showControls autoRotate />
                    </ErrorBoundary>
                  </motion.div>
                ) : activeMediaItem?.type === "video" ? (
                  <motion.div key="video" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full">
                    <video controls autoPlay muted playsInline loop className="w-full h-full object-contain" src={activeMediaItem.url} />
                  </motion.div>
                ) : (
                  <motion.div key={activeMediaItem?.url} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative w-full h-full p-8">
                    <Image src={activeMediaItem?.url ?? "/placeholder.png"} alt="Product" fill className="object-contain" />
                  </motion.div>
                )}
              </AnimatePresence>
              
              {mediaItems.length > 1 && (
                <>
                  <button onClick={() => setCurrentImageIndex((p) => (p > 0 ? p - 1 : mediaItems.length - 1))} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft className="w-6 h-6" /></button>
                  <button onClick={() => setCurrentImageIndex((p) => (p + 1) % mediaItems.length)} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight className="w-6 h-6" /></button>
                </>
              )}
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-2">
              {mediaItems.map((item, idx) => (
                <button key={idx} onClick={() => setCurrentImageIndex(idx)} className={`relative w-20 h-20 flex-shrink-0 rounded-2xl border-2 overflow-hidden ${currentImageIndex === idx ? "border-[#00a19a]" : "border-slate-100 opacity-60"}`}>
                   {item.type === "image" ? <Image src={item.url} alt="thumb" fill className="object-cover" /> : <div className="flex flex-col items-center justify-center h-full text-teal-600 bg-teal-50"><Star className="w-4 h-4" /><span className="text-[8px] font-bold">{item.label}</span></div>}
                </button>
              ))}
            </div>

            <div className="pt-8 border-t border-slate-100">
               <h3 className="text-xl font-black text-slate-900 mb-4 divider-teal">Descripción Artística</h3>
               <p className="text-slate-600 leading-[1.8] text-lg">{producto.descripcion}</p>
            </div>
          </div>

          {/* Buy Section */}
          <div className="lg:col-span-6 space-y-8">
            <div>
              <span className="text-teal-600 font-black text-xs uppercase tracking-widest">{producto.categoria}</span>
              <h1 className="text-5xl font-black text-slate-900 leading-tight mt-2">{producto.nombre}</h1>
              <div className="flex items-center gap-4 mt-4">
                 <div className="flex gap-1">{[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />)}</div>
                 <span className="text-sm font-bold text-slate-400">({reviews.length} opiniones)</span>
              </div>
            </div>

            <Card className="p-8 bg-slate-50 border-slate-100 rounded-[2.5rem]">
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-5xl font-black text-slate-900">${(producto.precio * cantidad).toLocaleString()}</span>
                <span className="text-slate-400 font-bold">COP</span>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
                  <span className="font-bold text-slate-700">Cantidad</span>
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setCantidad(Math.max(1, cantidad - 1))} className="h-8 w-8 rounded-lg"><Minus className="w-4 h-4" /></Button>
                    <span className="font-black text-lg w-6 text-center">{cantidad}</span>
                    <Button variant="ghost" size="icon" onClick={() => setCantidad(cantidad + 1)} className="h-8 w-8 rounded-lg"><Plus className="w-4 h-4" /></Button>
                  </div>
                </div>
                
                <div className="grid gap-3">
                  <Button onClick={handleBuyNow} className="h-16 bg-[#00a19a] hover:bg-[#007973] rounded-2xl text-lg font-black shadow-xl shadow-[#00a19a]/20">COMPRAR AHORA</Button>
                  <Button variant="outline" onClick={handleAddToCart} className="h-16 border-2 border-slate-200 rounded-2xl text-lg font-black">AGREGAR AL CARRITO</Button>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <FeatureBox icon={<Ruler className="w-5 h-5" />} label="Medidas" value={producto.tamano || "Standard"} />
              <FeatureBox icon={<Check className="w-5 h-5" />} label="Material" value="PLA Bio" />
              <FeatureBox icon={<Package className="w-5 h-5" />} label="En Stock" value={`${producto.stock} uds`} />
              <FeatureBox icon={<Tag className="w-5 h-5" />} label="Garantía" value="Thiart3D" />
            </div>
          </div>
        </div>

        {/* Reseñas */}
        <div className="mt-32 pt-16 border-t border-slate-100">
           <div className="flex flex-col lg:flex-row gap-16">
              <div className="lg:w-1/3 space-y-8">
                 <h2 className="text-4xl font-black text-slate-900">Opiniones</h2>
                 <form onSubmit={handleSubmitReview} className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl space-y-6">
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map(s => (
                        <button key={s} type="button" onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)} onClick={() => setNewReview({...newReview, estrellas: s})}>
                          <Star className={`w-8 h-8 transition-colors ${s <= (hoverRating || newReview.estrellas) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                        </button>
                      ))}
                    </div>
                    <input type="text" placeholder="Tu nombre" value={newReview.nombre} onChange={e => setNewReview({...newReview, nombre: e.target.value})} className="w-full p-4 bg-slate-50 border-transparent focus:bg-white focus:border-teal-500 rounded-xl outline-none transition-all" />
                    <textarea placeholder="Deja tu comentario artístico..." value={newReview.comentario} onChange={e => setNewReview({...newReview, comentario: e.target.value})} className="w-full h-32 p-4 bg-slate-50 border-transparent focus:bg-white focus:border-teal-500 rounded-xl outline-none transition-all resize-none" />
                    <Button type="submit" disabled={isSubmittingReview} className="w-full h-14 bg-[#00a19a] rounded-xl font-black">{isSubmittingReview ? "ENVIANDO..." : "PUBLICAR"}</Button>
                 </form>
              </div>
              <div className="lg:w-2/3 space-y-6">
                 {reviews.length === 0 ? <div className="h-full min-h-[300px] flex items-center justify-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-slate-400 font-bold italic">Sé el primero en calificar esta pieza.</div> : reviews.map((r, i) => (
                   <motion.div key={r.id ?? i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
                      <div className="flex justify-between mb-4">
                         <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-teal-50 rounded-xl flex items-center justify-center font-black text-teal-600">{(r.nombre_cliente ?? "C").charAt(0)}</div>
                            <div><p className="font-black text-slate-900">{r.nombre_cliente ?? "Anónimo"}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(r.created_at).toLocaleDateString()}</p></div>
                         </div>
                         <div className="flex gap-1">
                           {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= (Number(r.estrellas) ?? 0) ? "fill-amber-400 text-amber-400" : "text-slate-100"}`} />)}
                         </div>
                      </div>
                      <p className="text-slate-600 font-medium italic">&quot;{r.comentario}&quot;</p>
                   </motion.div>
                 ))}
              </div>
           </div>
        </div>

        <div className="mt-32">
          <h2 className="text-3xl font-black text-slate-900 mb-12">Otras piezas de la colección</h2>
          <ProductosCarrusel soloDestacados={false} />
        </div>
      </div>
    </div>
  );
}

function FeatureBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm">
      <div className="text-[#00a19a] mb-2">{icon}</div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-bold text-slate-800 truncate">{value}</p>
    </div>
  );
}
