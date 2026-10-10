"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Package, Ruler, Tag, Star, Sparkles, Minus, Plus, Check, Clock, ShieldCheck } from "lucide-react";
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

  // Opciones seleccionadas — multi-selección
  const [selectedEscalas, setSelectedEscalas] = useState<string[]>([ESCALAS_DEFAULT[1]!]);
  const [selectedEstilos, setSelectedEstilos] = useState<string[]>([ESTILOS_DEFAULT[0]!.nombre]);

  // Compatibilidad: primera selección activa para cálculos
  const selectedEscala = selectedEscalas[0] ?? ESCALAS_DEFAULT[1]!;
  const selectedEstilo = selectedEstilos[0] ?? ESTILOS_DEFAULT[0]!.nombre;

  const toggleEscala = (esc: string) => {
    setSelectedEscalas(prev =>
      prev.includes(esc) ? (prev.length > 1 ? prev.filter(e => e !== esc) : prev) : [...prev, esc]
    );
  };

  const toggleEstilo = (est: string) => {
    setSelectedEstilos(prev =>
      prev.includes(est) ? (prev.length > 1 ? prev.filter(e => e !== est) : prev) : [...prev, est]
    );
  };

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

  // Determinar stock y modo POD
  const { stockActual, esPOD, diasFabricacion } = useMemo(() => {
    const varEncontrada = variantes.find(
      (v) => v.escala === selectedEscala && v.estilo === selectedEstilo
    );
    const stock = varEncontrada ? varEncontrada.stock : (producto?.stock ?? 0);
    const es_pod = stock <= 0;
    const dias = varEncontrada?.dias_fabricacion ?? 4;
    return { stockActual: stock, esPOD: es_pod, diasFabricacion: dias };
  }, [variantes, selectedEscala, selectedEstilo, producto?.stock]);

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
    // Agregar una combinación por cada escala × estilo seleccionado
    let alguno = false;
    for (const esc of selectedEscalas) {
      for (const est of selectedEstilos) {
        const varEncontrada = variantes.find(v => v.escala === esc && v.estilo === est);
        const estiloInfo = ESTILOS_DEFAULT.find(e => e.nombre === est);
        const escalaExtra = esc.includes("35 cm") ? 1.5 : esc.includes("15 cm") ? 0.8 : 1;
        const precio = varEncontrada
          ? Number(varEncontrada.precio)
          : Math.round(producto.precio * (estiloInfo?.multiplicador ?? 1) * escalaExtra);
        const stock = varEncontrada ? varEncontrada.stock : (producto.stock ?? 0);

        const ok = await addToCarrito({
          id: `${producto.id}-${esc}-${est}`.replace(/\s/g, "_"),
          nombre: `${producto.nombre} (${esc} — ${est})`,
          precio,
          imagen: producto.image_url,
          cantidad,
          stock,
          categoria: producto.categoria,
          destacado: producto.destacado,
        });
        if (ok) alguno = true;
      }
    }
    if (alguno) {
      const count = selectedEscalas.length * selectedEstilos.length;
      toast.success(count > 1 ? `${count} variantes añadidas al carrito` : "Añadido al carrito con tus especificaciones");
    }
  };

  const handleBuyNow = async () => {
    if (!producto) return;
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

              {/* ── Badge de Disponibilidad y Fabricación ── */}
              <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-start gap-3 ${
                !esPOD && stockActual <= 0
                  ? "bg-red-50 border-red-200"
                  : esPOD
                  ? "bg-blue-50 border-blue-200"
                  : "bg-slate-50 border-slate-200"
              }`}>
                {!esPOD && stockActual <= 0 ? (
                  <>
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-black text-red-800 uppercase tracking-wider">
                        Sin Stock — No disponible
                      </p>
                      <p className="text-slate-500 mt-0.5">Este producto no está disponible actualmente.</p>
                    </div>
                  </>
                ) : !esPOD ? (
                  <>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 animate-pulse" />
                    <div>
                      <p className="font-black text-emerald-800 uppercase tracking-wider">
                        En Stock ({stockActual} unidades disponibles)
                      </p>
                      <p className="text-slate-500 mt-0.5">Listo para despacho hoy o recolección inmediata en taller.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="font-black text-blue-800 uppercase tracking-wider">
                        Print-on-Demand — Se fabrica al comprar
                      </p>
                      <p className="text-slate-500 mt-0.5">
                        Tu pedido se imprime y personaliza cuando lo compras. Listo en aprox. <strong>{diasFabricacion} días hábiles</strong>.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* ── 1. Selector de Escala (Multi-selección) ── */}
              <div className="space-y-2.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>1. Escala de la Obra</span>
                  <span className="text-[10px] text-teal-600 font-bold">
                    {selectedEscalas.length > 1 ? `${selectedEscalas.length} seleccionadas` : "Tamaño de la obra"}
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {ESCALAS_DEFAULT.map((esc) => {
                    const isSelected = selectedEscalas.includes(esc);
                    return (
                      <button
                        key={esc}
                        type="button"
                        onClick={() => toggleEscala(esc)}
                        className={`p-3 rounded-xl text-xs font-black text-center transition-all border relative ${
                          isSelected
                            ? "bg-slate-900 text-white border-slate-900 shadow-md scale-105"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                        }`}
                      >
                        {esc}
                        {isSelected && (
                          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#00a19a] rounded-full flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {selectedEscalas.length > 1 && (
                  <p className="text-[10px] text-teal-700 font-bold bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100">
                    Se agregarán {selectedEscalas.length} escalas al carrito
                  </p>
                )}
              </div>

              {/* ── 2. Selector de Estilo de Obra (Multi-selección) ── */}
              <div className="space-y-2.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>2. Estilo / Acabado</span>
                  <span className="text-[10px] text-teal-600 font-bold">
                    {selectedEstilos.length > 1 ? `${selectedEstilos.length} seleccionados` : "Pintura & Material"}
                  </span>
                </label>
                <div className="space-y-2">
                  {ESTILOS_DEFAULT.map((est) => {
                    const isSelected = selectedEstilos.includes(est.nombre);
                    return (
                      <button
                        key={est.nombre}
                        type="button"
                        onClick={() => toggleEstilo(est.nombre)}
                        className={`w-full p-3.5 rounded-xl text-xs font-bold text-left transition-all border flex items-center justify-between ${
                          isSelected
                            ? "bg-teal-50/70 border-[#00a19a] text-teal-950 ring-1 ring-[#00a19a]"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <span>{est.nombre}</span>
                        <div className="flex items-center gap-2">
                          {est.multiplicador !== 1 && (
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                              isSelected ? "bg-teal-200 text-teal-900" : "bg-slate-100 text-slate-500"
                            }`}>
                              x{est.multiplicador}
                            </span>
                          )}
                          {isSelected && <Check className="w-4 h-4 text-[#00a19a]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {selectedEstilos.length > 1 && (
                  <p className="text-[10px] text-teal-700 font-bold bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100">
                    Se agregarán {selectedEstilos.length} estilos al carrito
                  </p>
                )}
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

              {/* Botones de Compra */}
              <div className="grid gap-3">
                {!esPOD && stockActual <= 0 ? (
                  <div className="h-14 bg-slate-100 border-2 border-slate-200 rounded-2xl flex items-center justify-center text-sm font-black text-slate-400 uppercase tracking-wider">
                    Sin Stock — No disponible
                  </div>
                ) : (
                  <>
                    <Button
                      onClick={handleBuyNow}
                      className="h-14 bg-[#00a19a] hover:bg-[#007973] text-white rounded-2xl text-sm font-black tracking-wider uppercase shadow-xl shadow-[#00a19a]/25 active:scale-95 transition-all"
                    >
                      {esPOD ? "Pedir — Se fabrica al comprar" : "Comprar Ahora"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleAddToCart}
                      className="h-14 border-2 border-slate-200 hover:border-slate-900 text-slate-800 rounded-2xl text-sm font-black uppercase active:scale-95 transition-all"
                    >
                      {selectedEscalas.length * selectedEstilos.length > 1
                        ? `Agregar ${selectedEscalas.length * selectedEstilos.length} variantes al Carrito`
                        : "Agregar al Carrito"}
                    </Button>
                  </>
                )}
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
