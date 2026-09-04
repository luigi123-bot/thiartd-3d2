"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Eye, Sparkles } from "lucide-react";
import clsx from "clsx";
import { supabase } from "~/lib/supabaseClient";

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  precio: number;
  destacado?: boolean;
  image_url?: string;
  video_url?: string;
  producto_imagenes?: { image_url: string }[];
  usuarios?: { nombre: string } | null;
}

interface ProductosCarruselProps {
  soloDestacados?: boolean;
}

const mockProductos: Producto[] = [
  {
    id: 1,
    nombre: "Figura Dragón Místico",
    descripcion: "Figura 3D de piezas ensambladas con acabado metálico.",
    categoria: "Figuras",
    precio: 85000,
    destacado: true,
    image_url: "/logo.png",
  },
  {
    id: 2,
    nombre: "Robot Articulado X-1",
    descripcion: "Mini robot con 12 puntos de articulación.",
    categoria: "Juguetes",
    precio: 45000,
    destacado: false,
    image_url: "/logo.png",
  },
  {
    id: 3,
    nombre: "Jarrón Geométrico V2",
    descripcion: "Decoración moderna con patrón de Voronoi.",
    categoria: "Decoración",
    precio: 65000,
    destacado: false,
    image_url: "/logo.png",
  },
  {
    id: 4,
    nombre: "Lámpara Lunar LED",
    descripcion: "Textura realista de la luna con base de madera.",
    categoria: "Personalizados",
    precio: 120000,
    destacado: true,
    image_url: "/logo.png",
  },
];

export default function ProductosCarrusel({ soloDestacados = false }: ProductosCarruselProps) {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const fetchProductos = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from("productos")
          .select("id, nombre, descripcion, categoria, precio, destacado, image_url, video_url, usuarios:user_id(nombre), producto_imagenes(*)");

        interface RawProducto {
          id: number;
          nombre: string;
          descripcion: string;
          categoria: string;
          precio: number;
          destacado: boolean | null;
          image_url: string | null;
          video_url?: string | null;
          producto_imagenes?: { image_url: string }[];
          usuarios: { nombre: string } | { nombre: string }[] | null;
        }

        const rawData = (data as unknown as RawProducto[]) ?? [];
        let productosFiltrados = rawData.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          descripcion: p.descripcion,
          categoria: p.categoria,
          precio: p.precio,
          destacado: p.destacado ?? false,
          image_url: p.image_url ?? undefined,
          video_url: p.video_url ?? undefined,
          producto_imagenes: p.producto_imagenes ?? [],
          usuarios: Array.isArray(p.usuarios) ? p.usuarios[0] : p.usuarios
        })) as Producto[];

        if (soloDestacados) {
          productosFiltrados = productosFiltrados.filter((p: Producto) => p.destacado);
        }
        
        if (!productosFiltrados.length) {
          productosFiltrados = soloDestacados ? mockProductos.filter(p => p.destacado) : mockProductos;
        }

        setProductos(productosFiltrados);
      } catch {
        setProductos(soloDestacados ? mockProductos.filter(p => p.destacado) : mockProductos);
      }
      setLoading(false);
    };
    void fetchProductos();
  }, [soloDestacados]);

  const [cardsPerView, setCardsPerView] = useState(1);

  // ResizeObserver — no fuerza reflow a diferencia de leer offsetWidth/innerWidth
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let debounceTimer: ReturnType<typeof setTimeout>;
    const observer = new ResizeObserver((entries) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const width = entries[0]?.contentRect.width ?? container.offsetWidth;
        if (width < 640) setCardsPerView(1);
        else if (width < 1024) setCardsPerView(2);
        else if (width < 1280) setCardsPerView(3);
        else setCardsPerView(4);
      }, 150);
    });

    observer.observe(container);
    return () => {
      clearTimeout(debounceTimer);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (isPaused || productos.length <= cardsPerView) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % (productos.length - cardsPerView + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, productos.length, cardsPerView]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Usar requestAnimationFrame para agrupar la lectura de offsetWidth
    // con la escritura de scrollTo, evitando layout thrashing
    const raf = requestAnimationFrame(() => {
      const cardWidth = el.offsetWidth / cardsPerView;
      el.scrollTo({ left: current * cardWidth, behavior: "smooth" });
    });
    return () => cancelAnimationFrame(raf);
  }, [current, cardsPerView]);

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="w-10 h-10 border-4 border-[#00a19a]/20 border-t-[#00a19a] rounded-full animate-spin" />
    </div>
  );

  return (
    <section className="relative w-full max-w-[1400px] mx-auto py-10 px-4 sm:px-8 overflow-hidden group">
      {/* Botones de navegación del carrusel */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-2 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={() => setCurrent(c => Math.max(0, c - 1))}
          className="p-4 bg-white/90 backdrop-blur-md rounded-full shadow-2xl pointer-events-auto hover:bg-[#00a19a] hover:text-white transition-all transform hover:scale-110 active:scale-95 text-slate-800"
          disabled={current === 0}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => setCurrent(c => Math.min(productos.length - cardsPerView, c + 1))}
          className="p-4 bg-white/90 backdrop-blur-md rounded-full shadow-2xl pointer-events-auto hover:bg-[#00a19a] hover:text-white transition-all transform hover:scale-110 active:scale-95 text-slate-800"
          disabled={current >= productos.length - cardsPerView}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Carrusel */}
      <div
        ref={scrollRef}
        className="flex overflow-x-hidden transition-all duration-500 gap-6"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {productos.map((prod, idx) => (
          <CarruselCardItem
            key={prod.id}
            prod={prod}
            idx={idx}
            cardsPerView={cardsPerView}
            router={router}
          />
        ))}
      </div>
      
      {/* Indicadores de progreso */}
      <div className="flex justify-center gap-2 mt-12 pb-2">
        {Array.from({ length: Math.max(0, productos.length - cardsPerView + 1) }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={clsx(
              "h-1.5 transition-all duration-500 rounded-full",
              current === i ? "w-10 bg-[#00a19a]" : "w-1.5 bg-slate-200"
            )}
          />
        ))}
      </div>
    </section>
  );
}

function CarruselCardItem({
  prod,
  idx,
  cardsPerView,
  router,
}: {
  prod: Producto;
  idx: number;
  cardsPerView: number;
  router: ReturnType<typeof useRouter>;
}) {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const mediaList: { type: "image" | "video"; url: string }[] = [];
  if (prod.image_url) mediaList.push({ type: "image", url: prod.image_url });
  if (prod.producto_imagenes && prod.producto_imagenes.length > 0) {
    prod.producto_imagenes.forEach((img) => {
      if (img.image_url && img.image_url !== prod.image_url) {
        mediaList.push({ type: "image", url: img.image_url });
      }
    });
  }
  if (prod.video_url) mediaList.push({ type: "video", url: prod.video_url });

  const activeMedia = mediaList[activeMediaIndex] ?? mediaList[0];

  const handlePrevMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMediaIndex((p) => (p > 0 ? p - 1 : mediaList.length - 1));
  };

  const handleNextMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMediaIndex((p) => (p + 1) % mediaList.length);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: idx * 0.05 }}
      className={clsx(
        "flex-shrink-0 relative bg-white border border-slate-50 rounded-[2.5rem] p-5 shadow-[0_4px_25px_rgba(0,0,0,0.02)] hover:shadow-[0_25px_50px_rgba(0,161,154,0.12)] transition-all duration-700 group flex flex-col",
        cardsPerView === 1 ? "w-full" : 
        cardsPerView === 2 ? "w-[calc(50%-12px)]" :
        cardsPerView === 3 ? "w-[calc(33.33%-16px)]" : "w-[calc(25%-18px)]"
      )}
    >
      {/* Image / Video Showcase with In-Card Slider */}
      <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 mb-6 group/img p-4 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {activeMedia?.type === "image" ? (
            <motion.div
              key={activeMedia.url}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative w-full h-full"
            >
              <Image
                src={activeMedia.url}
                alt={prod.nombre}
                fill
                priority={idx === 0}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-contain transition-transform duration-700 group-hover/img:scale-105 drop-shadow-xl p-2"
              />
            </motion.div>
          ) : activeMedia?.type === "video" ? (
            <motion.div
              key={activeMedia.url}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative w-full h-full bg-black rounded-2xl overflow-hidden flex items-center justify-center"
            >
              <video
                src={activeMedia.url}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[8px] font-black text-teal-300 uppercase tracking-widest flex items-center gap-1">
                <span>▶</span> Video
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
        
        {prod.destacado && (
          <div className="absolute top-4 left-4 z-10">
            <span className="bg-black/80 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-[0.15em] px-3.5 py-1.5 rounded-full shadow-xl flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-teal-400" />
              Destacado
            </span>
          </div>
        )}

        {/* In-Card Media Controls */}
        {mediaList.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevMedia}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white text-slate-800 rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity z-20 hover:scale-110 active:scale-95"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={handleNextMedia}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white text-slate-800 rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity z-20 hover:scale-110 active:scale-95"
            >
              ›
            </button>

            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1 z-20">
              {mediaList.map((m, mIdx) => (
                <button
                  key={mIdx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMediaIndex(mIdx);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeMediaIndex === mIdx
                      ? "w-4 bg-[#00a19a]"
                      : "w-1.5 bg-slate-300/80 hover:bg-slate-400"
                  }`}
                />
              ))}
            </div>
          </>
        )}

        <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 pointer-events-none">
          <motion.button 
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(`/tienda/productos/${prod.id}`)}
            className="h-10 px-4 bg-white rounded-xl flex items-center gap-2 text-slate-900 shadow-xl font-black text-xs uppercase pointer-events-auto"
          >
            <Eye className="w-4 h-4 text-[#00a19a]" />
            Ver Opciones
          </motion.button>
        </div>
      </div>

      {/* Content Details */}
      <div 
        onClick={() => router.push(`/tienda/productos/${prod.id}`)} 
        className="space-y-3 flex-1 flex flex-col cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-[#00a19a] uppercase tracking-widest px-2.5 py-1 bg-teal-50 rounded-lg">
            {prod.categoria}
          </span>
          <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-tight bg-emerald-50 px-2 py-0.5 rounded-md">
            Recogida Gratis
          </span>
        </div>
        
        <h3 className="text-base font-black text-slate-900 line-clamp-1 group-hover:text-[#00a19a] transition-colors leading-tight">
          {prod.nombre}
        </h3>
        
        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-medium mb-3">
          {prod.descripcion}
        </p>

        <div className="mt-auto pt-3 flex items-center justify-between border-t border-slate-100">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900 tracking-tight">${prod.precio.toLocaleString("es-CO")}</span>
            <span className="text-[9px] font-black text-slate-400">COP</span>
          </div>
          <div className="text-[10px] font-black text-[#00a19a] group-hover:translate-x-1 transition-transform">
            Ver detalle →
          </div>
        </div>
      </div>
    </motion.div>
  );
}
