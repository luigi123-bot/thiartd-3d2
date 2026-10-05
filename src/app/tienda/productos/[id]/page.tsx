"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Package, Ruler, Tag, Star, Sparkles, Minus, Plus, Check, Clock, ShieldCheck, Printer, AlertCircle } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Model3DViewer } from "~/components/Model3DViewer";
import ProductosCarrusel from "~/components/ProductosCarrusel";
import ProductMediaGallery, { type MediaItem } from "~/components/ProductMediaGallery";
import { motion } from "framer-motion";
import { useCarrito } from "~/components/providers/CarritoProvider";
import { toast } from "sonner";
import Link from "next/link";
import { supabase } from "~/lib/supabaseClient";

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
  precios_variantes?: { escalas?: string[]; estilos?: string[]; es_pod?: boolean; dias_fabricacion?: number } | Record<string, unknown>;
}

interface Variante {
  id: string;
  escala: string;
  estilo: string;
  precio: number;
  stock: number;
  permite_pod: boolean;
  dias_fabricacion: number;
  imagen_url?: string;
}

interface Review {
  id: string;
  nombre_cliente?: string;
  estrellas: number;
  comentario: string;
  created_at: string;
}

const ESCALAS_DEFAULT = ["15 cm (Mini)", "25 cm (Estándar)", "35 cm (Coleccionista)"];
const ESTILOS_DEFAULT = [
  { nombre: "Sin Pintar (Resina Gris)", multiplicador: 1 },
  { nombre: "Pintado a Mano Full Color", multiplicador: 1.4 },
  { nombre: "Acabado Bronce Envejecido", multiplicador: 1.25 },
];

export default function ProductoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const { addToCarrito } = useCarrito();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [variantes, setVariantes] = useState<Variante[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cantidad, setCantidad] = useState(1);

  // Opciones seleccionadas
  const [selectedEscala, setSelectedEscala] = useState<string>(ESCALAS_DEFAULT[1]!);
  const [selectedEstilo, setSelectedEstilo] = useState<string>(ESTILOS_DEFAULT[0]!.nombre);

  const fetchProducto = useCallback(async () => {
    if (!params.id) return;
    const productId = Array.isArray(params.id) ? params.id[0] : params.id;
    try {
      const res = await fetch(`/api/productos/${productId}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Error al obtener producto");
      const data = await res.json() as Record<string, unknown>;
      if (data) {
        setProducto({
          id: String(data.id),
          nombre: String(data.nombre ?? ""),
          descripcion: String(data.descripcion ?? ""),
          precio: parseFloat(String(data.precio ?? "0")),
          tamano: String(data.tamano ?? ""),
          stock: Number(data.stock ?? 0),
          categoria: String(data.categoria ?? ""),
          destacado: Boolean(data.destacado),
          detalles: String(data.detalles ?? ""),
          image_url: String(data.image_url ?? ""),
          producto_imagenes: (data.producto_imagenes as { image_url: string }[]) ?? [],
          modelo_url: data.modelo_url ? String(data.modelo_url) : (data.model_url ? String(data.model_url) : undefined),
          video_url: data.video_url ? String(data.video_url) : undefined,
          usuarios: data.usuarios as { nombre: string } | null,
          precios_variantes: data.precios_variantes
            ? (typeof data.precios_variantes === "string" 
                ? JSON.parse(data.precios_variantes) as Record<string, unknown>
                : data.precios_variantes as Record<string, unknown>)
            : undefined,
        });
      }

      // Cargar variantes si existen en Supabase
      try {
        const { data: varsData } = await supabase
          .from("producto_variantes")
          .select("*")
          .eq("producto_id", productId);
        if (varsData && varsData.length > 0) {
          setVariantes(varsData as unknown as Variante[]);
        }
      } catch (err) {
        console.warn("Variantes no disponibles en BD:", err);
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

  // Listas dinámicas de escalas y estilos desde la configuración del producto
  const listaEscalas = useMemo(() => {
    const pvEscalas = (producto?.precios_variantes as Record<string, unknown>)?.escalas;
    if (Array.isArray(pvEscalas) && pvEscalas.length > 0) return pvEscalas as string[];
    if (producto?.tamano) {
      return producto.tamano.includes(",") 
        ? producto.tamano.split(",").map((s) => s.trim()) 
        : [producto.tamano];
    }
    return ESCALAS_DEFAULT;
  }, [producto]);

  const listaEstilos = useMemo(() => {
    const pvEstilos = (producto?.precios_variantes as Record<string, unknown>)?.estilos;
    if (Array.isArray(pvEstilos) && pvEstilos.length > 0) return pvEstilos as string[];
    return ESTILOS_DEFAULT.map((e) => e.nombre);
  }, [producto]);

  // Sincronizar selección inicial cuando cargue el producto
  useEffect(() => {
    if (listaEscalas.length > 0 && !listaEscalas.includes(selectedEscala)) {
      setSelectedEscala(listaEscalas[0]!);
    }
  }, [listaEscalas, selectedEscala]);

  useEffect(() => {
    if (listaEstilos.length > 0 && !listaEstilos.includes(selectedEstilo)) {
      setSelectedEstilo(listaEstilos[0]!);
    }
  }, [listaEstilos, selectedEstilo]);

  // Calcular precio dinámico según variante/estilo seleccionado
  const precioCalculado = useMemo(() => {
    if (!producto) return 0;
    // Si hay una variante específica en la base de datos
    const varEncontrada = variantes.find(
      (v) => v.escala === selectedEscala && v.estilo === selectedEstilo
    );
    if (varEncontrada) return Number(varEncontrada.precio);

    // Si no, calcular según multiplicador de estilo
    const estiloInfo = ESTILOS_DEFAULT.find((e) => e.nombre === selectedEstilo);
    const escalaExtra = selectedEscala.includes("35 cm") ? 1.5 : selectedEscala.includes("15 cm") ? 0.8 : 1;
    return Math.round(producto.precio * (estiloInfo?.multiplicador ?? 1) * escalaExtra);
  }, [producto, variantes, selectedEscala, selectedEstilo]);

  // Determinar stock y modo POD (Se imprime cuando se compra)
  const { stockActual, esPOD, diasFabricacion } = useMemo(() => {
    const varEncontrada = variantes.find(
      (v) => v.escala === selectedEscala && v.estilo === selectedEstilo
    );
    const stock = varEncontrada ? varEncontrada.stock : (producto?.stock ?? 0);
    const pv = producto?.precios_variantes as Record<string, unknown> | undefined;
    // Si la variante lo especifica, o si el producto tiene es_pod configurado
    const es_pod = varEncontrada ? varEncontrada.permite_pod : Boolean(pv?.es_pod);
    const dias = varEncontrada?.dias_fabricacion ?? (Number(pv?.dias_fabricacion) || 4);
    return { stockActual: stock, esPOD: es_pod, diasFabricacion: dias };
  }, [variantes, selectedEscala, selectedEstilo, producto]);

  // Media items para la galería estilo Mercado Libre
  const mediaItems: MediaItem[] = useMemo(() => {
    if (!producto) return [];
    const items: MediaItem[] = [];

    if (producto.image_url) {
      items.push({ type: "image", url: producto.image_url, label: "Principal" });
    }

    if (producto.producto_imagenes && producto.producto_imagenes.length > 0) {
      producto.producto_imagenes.forEach((img, idx) => {
        if (img.image_url !== producto.image_url) {
          items.push({ type: "image", url: img.image_url, label: `Foto ${idx + 1}` });
        }
      });
    }

    if (producto.video_url) {
      items.push({ type: "video", url: producto.video_url, label: "Video Demostrativo" });
    }

    if (producto.modelo_url) {
      items.push({ type: "model", url: producto.modelo_url, label: "Modelo 3D" });
    }

    return items;
  }, [producto]);

  const handleAddToCart = async () => {
    if (!producto) return;
    if (!esPOD && stockActual <= 0) {
      toast.error("Este producto no está disponible (stock agotado)");
      return;
    }
    const ok = await addToCarrito({
      id: String(producto.id),
      nombre: `${producto.nombre} (${selectedEscala} - ${selectedEstilo})`,
      precio: precioCalculado,
      imagen: producto.image_url,
      cantidad: cantidad,
      stock: stockActual,
      categoria: producto.categoria,
      destacado: producto.destacado,
    });
    if (ok) {
      toast.success(esPOD ? "Añadido al carrito (Fabricación Print on Demand)" : "Añadido al carrito");
    }
  };

  const handleBuyNow = async () => {
    if (!producto) return;
    if (!esPOD && stockActual <= 0) {
      toast.error("Este producto no está disponible (stock agotado)");
      return;
    }
    await handleAddToCart();
    router.push("/tienda/carrito");
  };

  // Reseñas
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
      // ignore
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
      }
    } catch {
      toast.error("Error al enviar reseña");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 font-bold text-slate-500">Cargando pieza...</div>;
  if (error || !producto) return <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8"><Card className="p-8 text-center"><h1 className="text-xl font-bold mb-4">Producto no encontrado</h1><Button onClick={() => router.push("/tienda")}>Volver a la tienda</Button></Card></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.back()} className="rounded-full h-9 w-9 p-0 hover:bg-slate-200">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="text-xs font-semibold text-slate-400">
            <Link href="/" className="hover:text-teal-600">Inicio</Link> / <Link href="/tienda" className="hover:text-teal-600">Tienda</Link> / <span className="text-slate-800 font-bold">{producto.nombre}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* ── Galería estilo Mercado Libre ── */}
          <div className="lg:col-span-7 space-y-6">
            <ProductMediaGallery
              items={mediaItems}
              productName={producto.nombre}
            />

            {/* Visualizador 3D dedicado si existe modelo */}
            {producto.modelo_url && (
              <div className="mt-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-[#00a19a]" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                    Inspección 3D Interactiva
                  </h3>
                </div>
                <div className="w-full h-80 bg-slate-900 rounded-2xl overflow-hidden">
                  <Model3DViewer modelUrl={producto.modelo_url} height="100%" showControls autoRotate />
                </div>
              </div>
            )}

            {/* Descripción */}
            <div className="pt-6 border-t border-slate-200">
              <h3 className="text-lg font-black text-slate-900 mb-3">Descripción Artística</h3>
              <p className="text-slate-600 leading-relaxed text-sm sm:text-base font-medium">{producto.descripcion}</p>
            </div>
          </div>

          {/* ── Panel de Compra y Selección de Opciones ── */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="text-[#00a19a] font-black text-xs uppercase tracking-widest bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
                {producto.categoria}
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight mt-3">
                {producto.nombre}
              </h1>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-400">({reviews.length} valoraciones)</span>
              </div>
            </div>

            <Card className="p-6 sm:p-8 bg-white border-slate-100 rounded-3xl shadow-xl space-y-6">
              {/* Precio */}
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900">
                  ${(precioCalculado * cantidad).toLocaleString("es-CO")}
                </span>
                <span className="text-xs font-black text-slate-400 uppercase">COP</span>
              </div>

              {/* ── Badge de Disponibilidad y Fabricación (POD vs Stock) ── */}
              <div className="p-4 rounded-2xl border text-xs font-semibold flex items-start gap-3 bg-slate-50 border-slate-200">
                {esPOD ? (
                  <>
                    <Clock className="w-5 h-5 text-[#00a19a] flex-shrink-0" />
                    <div>
                      <p className="font-black text-[#007973] uppercase tracking-wider flex items-center gap-1.5">
                        <Printer className="w-3.5 h-3.5" /> Se imprime cuando se compra (Print on Demand)
                      </p>
                      <p className="text-slate-500 mt-0.5">
                        Modelado 3D + impresión y acabado sobre pedido. Listo en aprox. <strong>{diasFabricacion} días hábiles</strong>.
                      </p>
                    </div>
                  </>
                ) : stockActual > 0 ? (
                  <>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 animate-pulse" />
                    <div>
                      <p className="font-black text-emerald-800 uppercase tracking-wider">
                        En Stock ({stockActual} unidades disponibles)
                      </p>
                      <p className="text-slate-500 mt-0.5">Listo para despacho inmediato o recolección en taller.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                    <div>
                      <p className="font-black text-rose-800 uppercase tracking-wider">
                        Producto No Disponible
                      </p>
                      <p className="text-slate-500 mt-0.5">
                        El stock físico para esta obra se ha agotado.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* ── 1. Selector de Escala (Dinámico según producto) ── */}
              <div className="space-y-2.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>1. Selecciona la Escala</span>
                  <span className="text-[10px] text-teal-600 font-bold">{listaEscalas.length} disponible(s)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {listaEscalas.map((esc) => {
                    const isSelected = selectedEscala === esc;
                    return (
                      <button
                        key={esc}
                        type="button"
                        onClick={() => setSelectedEscala(esc)}
                        className={`px-4 py-3 rounded-xl text-xs font-black text-center transition-all border ${
                          isSelected
                            ? "bg-slate-900 text-white border-slate-900 shadow-md scale-105"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                        }`}
                      >
                        {esc}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── 2. Selector de Estilo de Obra (Dinámico según producto) ── */}
              <div className="space-y-2.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>2. Selecciona el Estilo / Acabado</span>
                  <span className="text-[10px] text-teal-600 font-bold">{listaEstilos.length} opción(es)</span>
                </label>
                <div className="space-y-2">
                  {listaEstilos.map((estNombre) => {
                    const isSelected = selectedEstilo === estNombre;
                    return (
                      <button
                        key={estNombre}
                        type="button"
                        onClick={() => setSelectedEstilo(estNombre)}
                        className={`w-full p-3.5 rounded-xl text-xs font-bold text-left transition-all border flex items-center justify-between ${
                          isSelected
                            ? "bg-teal-50/70 border-[#00a19a] text-teal-950 ring-1 ring-[#00a19a]"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <span>{estNombre}</span>
                        {isSelected && <Check className="w-4 h-4 text-[#00a19a]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cantidad */}
              <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-xs font-bold text-slate-700">Cantidad</span>
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                    className="h-8 w-8 rounded-lg bg-white shadow-sm border border-slate-200"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </Button>
                  <span className="font-black text-base w-6 text-center text-slate-900">{cantidad}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCantidad(cantidad + 1)}
                    className="h-8 w-8 rounded-lg bg-white shadow-sm border border-slate-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Botones de Compra (Deshabilitados si el stock físico está agotado) */}
              <div className="grid gap-3">
                <Button
                  disabled={!esPOD && stockActual <= 0}
                  onClick={handleBuyNow}
                  className="h-14 bg-[#00a19a] hover:bg-[#007973] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-2xl text-sm font-black tracking-wider uppercase shadow-xl shadow-[#00a19a]/25 active:scale-95 transition-all"
                >
                  {!esPOD && stockActual <= 0 ? "Producto no disponible" : "Comprar Ahora"}
                </Button>
                <Button
                  disabled={!esPOD && stockActual <= 0}
                  variant="outline"
                  onClick={handleAddToCart}
                  className="h-14 border-2 border-slate-200 hover:border-slate-900 disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed text-slate-800 rounded-2xl text-sm font-black uppercase active:scale-95 transition-all"
                >
                  {!esPOD && stockActual <= 0 ? "Agotado" : "Agregar al Carrito"}
                </Button>
              </div>
            </Card>

            {/* Características */}
            <div className="grid grid-cols-2 gap-3">
              <FeatureBox icon={<Ruler className="w-4 h-4" />} label="Escala" value={selectedEscala} />
              <FeatureBox icon={<Check className="w-4 h-4" />} label="Acabado" value={selectedEstilo.split(" ")[0] ?? "Resina"} />
              <FeatureBox icon={<Package className="w-4 h-4" />} label="Disponibilidad" value={!esPOD ? `${stockActual} en Stock` : "Print on Demand"} />
              <FeatureBox icon={<ShieldCheck className="w-4 h-4" />} label="Garantía" value="Thiart3D Certificado" />
            </div>
          </div>
        </div>

        {/* Reseñas */}
        <div className="mt-24 pt-12 border-t border-slate-200">
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="lg:w-1/3 space-y-6">
              <h2 className="text-2xl font-black text-slate-900">Opiniones del Cliente</h2>
              <form onSubmit={handleSubmitReview} className="p-6 bg-white border border-slate-100 rounded-3xl shadow-lg space-y-4">
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setNewReview({ ...newReview, estrellas: s })}
                    >
                      <Star className={`w-6 h-6 transition-colors ${s <= (hoverRating || newReview.estrellas) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={newReview.nombre}
                  onChange={(e) => setNewReview({ ...newReview, nombre: e.target.value })}
                  className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-teal-500"
                />
                <textarea
                  placeholder="Comentario sobre la calidad de la pieza..."
                  value={newReview.comentario}
                  onChange={(e) => setNewReview({ ...newReview, comentario: e.target.value })}
                  className="w-full h-28 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-teal-500 resize-none"
                />
                <Button type="submit" disabled={isSubmittingReview} className="w-full h-12 bg-[#00a19a] rounded-xl font-black text-xs uppercase">
                  {isSubmittingReview ? "Enviando..." : "Publicar Reseña"}
                </Button>
              </form>
            </div>

            <div className="lg:w-2/3 space-y-4">
              {reviews.length === 0 ? (
                <div className="h-48 flex items-center justify-center bg-white rounded-3xl border border-slate-100 text-slate-400 font-bold text-xs">
                  Sé el primero en calificar esta pieza.
                </div>
              ) : (
                reviews.map((r, i) => (
                  <motion.div key={r.id ?? i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-black text-slate-900 text-sm">{r.nombre_cliente ?? "Cliente"}</p>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-3.5 h-3.5 ${s <= Number(r.estrellas) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-600 text-xs font-medium italic">&quot;{r.comentario}&quot;</p>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Carrusel */}
        <div className="mt-24">
          <h2 className="text-2xl font-black text-slate-900 mb-8">Otras piezas de la colección</h2>
          <ProductosCarrusel soloDestacados={false} />
        </div>
      </div>
    </div>
  );
}

function FeatureBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
      <div className="text-[#00a19a] mb-1">{icon}</div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-xs font-bold text-slate-800 truncate mt-0.5">{value}</p>
    </div>
  );
}
