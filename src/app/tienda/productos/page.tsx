"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardTitle, CardDescription } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { 
  ShoppingCart, X, Filter, Sparkles, Package, Tag, 
  BadgeDollarSign, Heart, Truck, Star, Zap, Check, 
  ChevronLeft, ChevronRight, Play, Printer, Clock, AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { type AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { supabase } from "~/lib/supabaseClient";

const categorias = [
  "Figuras",
  "Accesorios",
  "Decoración",
  "Juguetes",
  "Otros"
]; // Define aquí las categorías disponibles

const rangosPrecio = [
  { label: "Menos de $10", min: 0, max: 9.99 },
  { label: "$10 - $25", min: 10, max: 25 },
  { label: "Más de $25", min: 25.01, max: Infinity }
]; // Define aquí los rangos de precio disponibles

type Product = {
  id: string | number;
  nombre?: string;
  name?: string; // API variant
  descripcion?: string;
  description?: string; // API variant
  categoria?: string;
  category?: string; // API variant
  tamano?: string;
  size?: string; // API variant
  precio?: number;
  price?: number; // API variant
  destacado?: boolean;
  featured?: boolean; // API variant
  stock: number;
  image_url?: string;
  producto_imagenes?: { image_url: string }[];
  details?: string;
  usuarios?: { nombre: string } | null;
  precios_variantes?: Record<string, unknown> | string;
  es_pod?: boolean;
};

import { useCarrito, type CarritoItem } from "~/components/providers/CarritoProvider";
import { toast } from "sonner";

import { motion, AnimatePresence } from "framer-motion";


export default function ProductosTiendaPage() {
  return (
    <ProductosTiendaPageInner />
  );
}

function ProductosTiendaPageInner() {
  const [productos, setProductos] = useState<Product[]>([]);
  const [filtros, setFiltros] = useState({
    categoria: [] as string[],
    tamano: [] as string[],
    precio: [] as string[],
    buscar: "",
    destacados: false,
  });
  const [loading, setLoading] = useState(true);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const router = useRouter();
  const { carrito, addToCarrito } = useCarrito();

  const fetchProductos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/productos");
      const data = (await res.json()) as { productos: Product[] };
      const dataArr = Array.isArray(data.productos) ? data.productos : [];
      console.log("[DEBUG Shop] Productos recibidos:", dataArr.map(p => ({ 
        id: p.id, 
        nombre: p.nombre ?? p.name, 
        galeria_count: p.producto_imagenes?.length ?? 0 
      })));
      setProductos(dataArr);
    } catch {
      setProductos([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchProductos();

    // Sincronización en tiempo real del stock y catálogo con Supabase Realtime
    const channel = supabase
      .channel("tienda-productos-realtime-stock")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "productos" },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const updated = payload.new as Partial<Product> & { id: string | number };
            setProductos((prev) =>
              prev.map((p) =>
                String(p.id) === String(updated.id)
                  ? {
                      ...p,
                      ...updated,
                      stock: Number(updated.stock ?? p.stock),
                    }
                  : p
              )
            );
          } else {
            // Cuando se crea (INSERT) o elimina (DELETE) un producto: recargar catálogo
            void fetchProductos();
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const handleCheckbox = (type: "categoria" | "tamano" | "precio", value: string) => {
    setFiltros((prev) => {
      const arr = prev[type];
      return {
        ...prev,
        [type]: arr.includes(value) ? arr.filter((v: string) => v !== value) : [...arr, value],
      };
    });
  };

  const handleBuscar = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiltros({ ...filtros, buscar: e.target.value });
  };

  const handleDestacados = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFiltros({ ...filtros, destacados: e.target.value === "Destacados" });
  };

  const limpiarFiltros = () =>
    setFiltros({ categoria: [], tamano: [], precio: [], buscar: "", destacados: false });

  const getProductData = (p: Product) => ({
    nombre: p.nombre ?? p.name ?? "Sin nombre",
    desc: p.descripcion ?? p.description ?? "",
    categoria: p.categoria ?? p.category ?? "Otros",
    tamano: p.tamano ?? p.size ?? "N/A",
    precio: p.precio ?? p.price ?? 0,
    destacado: p.destacado ?? p.featured ?? false,
    creador: p.usuarios?.nombre ?? "Thiart3D",
  });

  const productosFiltrados = productos.filter((p) => {
    const data = getProductData(p);
    const matchCategoria = filtros.categoria.length === 0 || filtros.categoria.includes(data.categoria);
    const matchTamano = filtros.tamano.length === 0 || filtros.tamano.includes(data.tamano);
    const matchPrecio = filtros.precio.length === 0 || filtros.precio.some((r) => {
        const rango = rangosPrecio.find((x) => x.label === r);
        return rango ? data.precio >= rango.min && data.precio <= rango.max : true;
      });
    const matchBuscar = !filtros.buscar || 
      data.nombre.toLowerCase().includes(filtros.buscar.toLowerCase()) ||
      data.desc.toLowerCase().includes(filtros.buscar.toLowerCase());
    const matchDestacado = !filtros.destacados || data.destacado;
    return matchCategoria && matchTamano && matchPrecio && matchBuscar && matchDestacado;
  });

  return (
    <div className="bg-[#f8fafc] min-h-screen">
      {/* Header Premium - Totalmente Responsivo */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6"
          >
            <div className="w-full lg:max-w-xl">
              <div className="flex items-center gap-2 mb-3">
                <Link href="/" className="text-[10px] font-bold text-slate-400 hover:text-[#00a19a] transition-all uppercase tracking-widest">Inicio</Link>
                <div className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="text-[10px] font-black text-[#00a19a] uppercase tracking-widest">Galeria</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight mb-3 leading-none uppercase">
                Catálogo <span className="text-teal-500">Exclusivo</span>
              </h1>
              <p className="text-slate-500 text-sm sm:text-base font-medium leading-relaxed max-w-lg">
                Colección curada de arte tridimensional para transformar tus espacios favoritos.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto mt-2 lg:mt-0">
               <div className="relative group flex-1 md:w-80">
                <Input
                  type="text"
                  placeholder="Buscar..."
                  className="w-full pl-10 h-12 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#00a19a] transition-all shadow-sm font-medium"
                  value={filtros.buscar}
                  onChange={handleBuscar}
                />
                <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-[#00a19a] transition-colors" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-16">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar de Filtros Modernizado */}
          <aside className={`
            ${mostrarFiltros ? "fixed inset-0 z-[100] bg-white p-6 overflow-y-auto" : "hidden lg:block lg:w-64"}
            transition-all duration-300
          `}>
            <div className="lg:sticky lg:top-24 space-y-10 pb-8">
              <div className="flex justify-between items-center lg:hidden mb-10">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">Filtros</h2>
                  <p className="text-[10px] text-slate-400 font-bold tracking-[0.2em] uppercase mt-2">Refina tu búsqueda</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setMostrarFiltros(false)}
                  className="w-12 h-12 rounded-full border border-slate-100 bg-slate-50"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>

              <FilterSection title="Categorías" icon={<Tag className="w-4 h-4" />}>
                {categorias.map((cat) => (
                  <FilterCheckbox
                    key={cat}
                    label={cat}
                    checked={filtros.categoria.includes(cat)}
                    onChange={() => handleCheckbox("categoria", cat)}
                  />
                ))}
              </FilterSection>

              <FilterSection title="Colecciones" icon={<Sparkles className="w-4 h-4" />}>
                 <select
                  className="w-full h-12 px-5 rounded-2xl border border-slate-200 text-sm font-black focus:ring-4 focus:ring-[#00a19a]/5 focus:border-[#00a19a] transition-all bg-slate-50/50 outline-none cursor-pointer"
                  onChange={handleDestacados}
                  value={filtros.destacados ? "Destacados" : "Todos"}
                >
                  <option value="Todos">Todas las piezas</option>
                  <option value="Destacados">🌟 Obras Premium</option>
                </select>
              </FilterSection>

              <FilterSection title="Inversión" icon={<BadgeDollarSign className="w-4 h-4" />}>
                {rangosPrecio.map((r) => (
                  <FilterCheckbox
                    key={r.label}
                    label={r.label}
                    checked={filtros.precio.includes(r.label)}
                    onChange={() => handleCheckbox("precio", r.label)}
                  />
                ))}
              </FilterSection>

              <Button
                variant="outline"
                className="w-full h-14 rounded-2xl border-slate-200 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all hover:text-[#00a19a] border-2 mt-4"
                onClick={limpiarFiltros}
              >
                Limpiar Selección
              </Button>
              
              {mostrarFiltros && (
                <Button 
                  onClick={() => setMostrarFiltros(false)}
                  className="w-full h-16 bg-[#00a19a] rounded-2xl font-black text-white shadow-2xl mt-8 uppercase tracking-widest"
                >
                  Ver Obras
                </Button>
              )}
            </div>
          </aside>

          {/* Grid de Productos */}
          <section className="flex-1">
            <AnimatePresence mode="popLayout">
              {loading ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-40"
                >
                  <div className="w-16 h-16 border-4 border-slate-100 border-t-[#00a19a] rounded-full animate-spin mb-6" />
                  <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">Cargando Galería...</p>
                </motion.div>
              ) : productosFiltrados.length === 0 ? (
                <motion.div 
                   initial={{ opacity: 0, scale: 0.98 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 shadow-sm"
                >
                  <Package className="w-16 h-16 text-slate-100 mx-auto mb-6" />
                  <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tighter leading-none">Sin obras encontradas</h3>
                  <p className="text-slate-400 mb-8 text-sm font-medium">Ajusta tus filtros para descubrir nuevas piezas.</p>
                  <Button variant="outline" onClick={limpiarFiltros} className="rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest border-2">Ver todo</Button>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
                  {productosFiltrados.map((producto, idx) => (
                    <ProductCardModern 
                      key={producto.id} 
                      producto={producto} 
                      idx={idx} 
                      router={router}
                      addToCarrito={addToCarrito}
                      carrito={carrito}
                    />
                  ))}
                </div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </div>

      {/* Botón Flotante Responsivo */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed right-6 bottom-8 lg:hidden bg-slate-950 text-white px-6 h-16 rounded-full shadow-2xl z-[90] flex items-center gap-3 active:scale-90 transition-all"
        onClick={() => setMostrarFiltros(true)}
      >
        <Filter className="w-5 h-5" />
        <span className="font-black text-[10px] uppercase tracking-widest">Filtros</span>
        {filtros.categoria.length + filtros.precio.length > 0 && (
          <span className="w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center text-[10px] font-black">
            {filtros.categoria.length + filtros.precio.length}
          </span>
        )}
      </motion.button>
    </div>
  );
}

// --- Componentes Atómicos Modernizados ---

function FilterSection({ title, children, icon }: { title: string; children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-slate-900 font-bold text-sm uppercase tracking-widest px-1">
        <span className="text-[#00a19a] opacity-60">{icon}</span>
        {title}
      </div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function FilterCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className={`
      flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-200 border-2
      ${checked 
        ? "bg-[#00a19a]/10 border-[#00a19a] text-[#00a19a] shadow-sm shadow-[#00a19a]/10" 
        : "bg-white border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-100"}
    `}>
      <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${checked ? "bg-[#00a19a] border-[#00a19a]" : "border-slate-300"}`}>
        {checked && <div className="w-2 h-2 bg-white rounded-sm" />}
      </div>
      <input type="checkbox" className="hidden" checked={checked} onChange={onChange} />
      <span className="text-sm font-bold">{label}</span>
    </label>
  );
}

// Sub-componente para la Card de Producto estilo Mercado Libre con Carrusel Automático de Imágenes y Videos
function ProductCardModern({ producto, idx, router, addToCarrito, carrito }: {
  producto: Product & { video_url?: string; model_url?: string; imagen_url?: string };
  idx: number;
  router: AppRouterInstance;
  addToCarrito: (item: CarritoItem) => Promise<boolean>;
  carrito: CarritoItem[];
}) {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const data = {
    id: producto.id,
    nombre: producto.nombre ?? producto.name ?? "Producto Sin Nombre",
    precio: producto.precio ?? producto.price ?? 0,
    categoria: producto.categoria ?? producto.category ?? "General",
    creador: producto.usuarios?.nombre ?? "Thiart 3D",
    desc: producto.descripcion ?? producto.description ?? "Sin descripción",
    destacado: producto.destacado ?? producto.featured ?? false,
    hasModel: Boolean(producto.model_url),
  };

  // Recopilar todos los medios disponibles (imágenes principales, secundarias y videos)
  const mediaList: { type: "image" | "video"; url: string }[] = [];
  if (producto.image_url) {
    mediaList.push({ type: "image", url: producto.image_url });
  }
  if (producto.imagen_url && producto.imagen_url !== producto.image_url) {
    mediaList.push({ type: "image", url: producto.imagen_url });
  }
  if (producto.producto_imagenes && producto.producto_imagenes.length > 0) {
    producto.producto_imagenes.forEach((img) => {
      if (img.image_url && !mediaList.some((m) => m.url === img.image_url)) {
        mediaList.push({ type: "image", url: img.image_url });
      }
    });
  }
  if (producto.video_url) {
    mediaList.push({ type: "video", url: producto.video_url });
  }
  if (mediaList.length === 0) {
    mediaList.push({ type: "image", url: "/logo.png" });
  }

  // Paso Automático de Medios estilo Mercado Libre (Auto-slideshow al hacer hover)
  useEffect(() => {
    if (!isHovered || mediaList.length <= 1) return;
    const interval = setInterval(() => {
      setActiveMediaIndex((prev) => (prev + 1) % mediaList.length);
    }, 2200);

    return () => clearInterval(interval);
  }, [isHovered, mediaList.length]);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setActiveMediaIndex(0); // Regresa a la portada principal al salir, igual que en Mercado Libre
  };

  // Deslizamiento horizontal interactivo por cursor (Scrubbing como Mercado Libre web)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mediaList.length <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(0.999, x / rect.width));
    const newIdx = Math.floor(pct * mediaList.length);
    if (newIdx !== activeMediaIndex) {
      setActiveMediaIndex(newIdx);
    }
  };

  const handlePrevMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMediaIndex((prev) => (prev > 0 ? prev - 1 : mediaList.length - 1));
  };

  const handleNextMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMediaIndex((prev) => (prev + 1) % mediaList.length);
  };

  const activeMedia = mediaList[activeMediaIndex] ?? mediaList[0];

  const enCarrito = carrito.find((p) => String(p.id) === String(producto.id));
  const cantidadEnCarrito = enCarrito?.cantidad ?? 0;
  const stockActual = typeof producto.stock === "number" ? producto.stock : Number(producto.stock ?? 0);
  const stockDisponible = Math.max(0, stockActual - cantidadEnCarrito);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (stockDisponible <= 0) {
      toast.error(`"${data.nombre}" no tiene stock disponible`);
      return;
    }
    const ok = await addToCarrito({
      id: String(producto.id),
      nombre: data.nombre,
      precio: data.precio,
      imagen: producto.image_url ?? "/logo.png",
      cantidad: 1, 
      stock: producto.stock,
      categoria: data.categoria,
      destacado: data.destacado,
    });
    if (ok) toast.success(`"${data.nombre}" agregado al carrito ✨`);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.02, duration: 0.3 }}
      className="h-full"
    >
      <div 
        onClick={() => router.push(`/tienda/productos/${producto.id}`)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="group cursor-pointer relative h-full bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 flex flex-col overflow-hidden"
      >
        {/* Contenedor Visual de Medios (Imágenes y Videos con Auto-play) */}
        <div 
          onMouseMove={handleMouseMove}
          className="h-40 sm:h-44 md:h-48 w-full relative bg-white flex items-center justify-center p-2.5 overflow-hidden border-b border-slate-100 group/media select-none"
        >
          {/* Contenido Visual (Imagen o Video) */}
          <AnimatePresence mode="wait">
            {activeMedia?.type === "image" ? (
              <motion.div
                key={activeMedia.url}
                initial={{ opacity: 0.6 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0.6 }}
                transition={{ duration: 0.18 }}
                className="relative w-full h-full flex items-center justify-center"
              >
                <Image
                  src={activeMedia.url}
                  alt={data.nombre}
                  fill
                  className="object-contain p-1 transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                  priority={idx < 4}
                />
              </motion.div>
            ) : activeMedia?.type === "video" ? (
              <motion.div
                key={activeMedia.url}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative w-full h-full rounded-xl overflow-hidden flex items-center justify-center bg-black/90"
              >
                <video
                  src={activeMedia.url}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-2.5 left-2.5 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-black text-teal-300 uppercase tracking-widest flex items-center gap-1 z-10 shadow-sm">
                  <Play className="w-2.5 h-2.5 fill-current" /> Video 3D
                </div>
              </motion.div>
            ) : (
              <Package className="w-12 h-12 text-slate-200 stroke-[1]" />
            )}
          </AnimatePresence>

          {/* Insignia Superior Izquierda (Mercado Libre Style: "MÁS VENDIDO" / "3D") */}
          <div className="absolute top-2.5 left-2.5 z-20 flex flex-col gap-1 items-start pointer-events-none">
            {data.destacado && (
              <span className="bg-[#ff7733] text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm shadow-sm">
                MÁS VENDIDO
              </span>
            )}
            {data.hasModel && !data.destacado && (
              <span className="bg-[#00a19a] text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm shadow-sm">
                MODELO 3D
              </span>
            )}
          </div>

          {/* Botón de Favoritos (Corazón Mercado Libre) */}
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const next = !isFavorite;
              setIsFavorite(next);
              toast.success(next ? "Guardado en tus favoritos ❤️" : "Eliminado de tus favoritos");
            }}
            className="absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full bg-white/95 hover:bg-white border border-slate-200/80 shadow-sm flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            title="Favorito"
          >
            <Heart className={`w-4 h-4 transition-colors ${isFavorite ? "fill-rose-500 text-rose-500" : "text-slate-400 hover:text-rose-500"}`} />
          </button>

          {/* Flechas de Navegación Manual (Aparecen al pasar el cursor) */}
          {mediaList.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevMedia}
                className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/95 hover:bg-white text-slate-800 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover/media:opacity-100 transition-opacity z-20 hover:scale-110 active:scale-95 border border-slate-200"
                title="Foto anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMedia}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/95 hover:bg-white text-slate-800 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover/media:opacity-100 transition-opacity z-20 hover:scale-110 active:scale-95 border border-slate-200"
                title="Siguiente foto"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Indicadores de Segmento estilo Mercado Libre (Barras delgadas horizontales) */}
              <div className="absolute bottom-2 left-3 right-3 flex items-center gap-1 z-20 pointer-events-auto">
                {mediaList.map((_, mIdx) => (
                  <div
                    key={mIdx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMediaIndex(mIdx);
                    }}
                    className={`h-1 flex-1 rounded-full cursor-pointer transition-all duration-300 ${
                      activeMediaIndex === mIdx
                        ? "bg-[#00a19a] shadow-sm"
                        : "bg-slate-200/90 hover:bg-slate-300"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Información del Producto (Diseño Compacto y Balanceado) */}
        <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between bg-white">
          <div>
            {/* Categoría, Creador y Calificación en una sola línea limpia */}
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#00a19a] truncate">
                {data.categoria} <span className="text-slate-300 font-normal">•</span> <span className="text-slate-400">{data.creador}</span>
              </span>
              <div className="flex items-center gap-0.5 text-amber-400 shrink-0">
                <Star className="w-3 h-3 fill-current" />
                <span className="font-bold text-slate-700 text-[11px]">4.9</span>
                <span className="text-slate-400 text-[10px]">(18)</span>
              </div>
            </div>

            {/* Título conciso y elegante */}
            <h3 className="text-sm sm:text-[15px] font-semibold text-slate-800 line-clamp-1 leading-snug group-hover:text-[#00a19a] transition-colors">
              {data.nombre}
            </h3>

            {/* Precio y Stock en Tiempo Real (Sincronizado con POD y Stock físico) */}
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  ${data.precio.toLocaleString("es-CO")}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  COP
                </span>
              </div>

              {/* Stock disponible / Print on Demand */}
              <div>
                {(() => {
                  let isPOD = Boolean(producto.es_pod);
                  if (producto.precios_variantes) {
                    try {
                      const pv = typeof producto.precios_variantes === "string" 
                        ? JSON.parse(producto.precios_variantes) as Record<string, unknown>
                        : producto.precios_variantes;
                      if (typeof pv?.es_pod === "boolean") isPOD = pv.es_pod;
                    } catch {}
                  }

                  if (isPOD) {
                    return (
                      <span className="text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Printer className="w-3 h-3 text-[#00a19a]" /> Bajo pedido (POD)
                      </span>
                    );
                  }
                  if (stockDisponible > 3) {
                    return (
                      <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        Stock: {stockDisponible} unid.
                      </span>
                    );
                  }
                  if (stockDisponible > 0) {
                    return (
                      <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        ¡Últimas {stockDisponible} unid.!
                      </span>
                    );
                  }
                  return (
                    <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                      No disponible
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Botón de Acción / Carrito Compacto */}
          <div className="mt-3 pt-2.5 border-t border-slate-100">
            {(() => {
              let isPOD = Boolean(producto.es_pod);
              if (producto.precios_variantes) {
                try {
                  const pv = typeof producto.precios_variantes === "string" 
                    ? JSON.parse(producto.precios_variantes) as Record<string, unknown>
                    : producto.precios_variantes;
                  if (typeof pv?.es_pod === "boolean") isPOD = pv.es_pod;
                } catch {}
              }

              const estaAgotado = !isPOD && stockDisponible <= 0;

              if (estaAgotado) {
                return (
                  <button
                    type="button"
                    disabled
                    className="w-full h-8.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed select-none"
                  >
                    Producto no disponible
                  </button>
                );
              }

              if (cantidadEnCarrito > 0) {
                return (
                  <div className="w-full h-8.5 bg-teal-50 border border-teal-200 rounded-xl px-2.5 flex items-center justify-between text-xs font-bold text-[#00a19a]">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Check className="w-3.5 h-3.5" /> En el carrito ({cantidadEnCarrito})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="w-5 h-5 rounded bg-[#00a19a] text-white flex items-center justify-center font-bold text-[11px] hover:bg-[#007973] transition-colors"
                      title="Agregar otra unidad"
                    >
                      +1
                    </button>
                  </div>
                );
              }

              return (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full h-8.5 rounded-xl bg-slate-900 hover:bg-[#00a19a] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:shadow-teal-500/20 transition-all duration-300 active:scale-95"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  {isPOD ? "Pedir (Print on Demand)" : "Agregar al carrito"}
                </button>
              );
            })()}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
