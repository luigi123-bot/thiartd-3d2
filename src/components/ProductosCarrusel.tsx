"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Eye, Sparkles, Play, Star } from "lucide-react";
import { supabase } from "~/lib/supabaseClient";

interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  precio: number;
  stock?: number;
  destacado?: boolean;
  image_url?: string;
  video_url?: string;
  producto_imagenes?: { image_url: string }[];
  usuarios?: { nombre: string } | null;
}

interface ProductosCarruselProps {
  soloDestacados?: boolean;
}

export default function ProductosCarrusel({ soloDestacados = false }: ProductosCarruselProps) {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Consulta directa de productos a Supabase
  const fetchProductos = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("productos")
        .select(`
          id,
          nombre,
          descripcion,
          categoria,
          precio,
          stock,
          destacado,
          image_url,
          video_url,
          usuarios:user_id(nombre),
          producto_imagenes(*)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("[ProductosCarrusel] Error en consulta directa, usando fallback:", error.message);
        throw error;
      }

      const rawList = Array.isArray(data) ? data : [];
      const listaMapeada: Producto[] = rawList.map((p) => {
        let autor: { nombre: string } | null = null;
        if (p.usuarios && typeof p.usuarios === "object") {
          autor = Array.isArray(p.usuarios)
            ? (p.usuarios[0] as { nombre: string })
            : (p.usuarios as { nombre: string });
        }

        return {
          id: String(p.id),
          nombre: String(p.nombre ?? "Sin nombre"),
          descripcion: String(p.descripcion ?? ""),
          categoria: String(p.categoria ?? "General"),
          precio: Number(p.precio ?? 0),
          stock: Number(p.stock ?? 0),
          destacado: Boolean(p.destacado),
          image_url: p.image_url ? String(p.image_url) : undefined,
          video_url: p.video_url ? String(p.video_url) : undefined,
          producto_imagenes: Array.isArray(p.producto_imagenes)
            ? (p.producto_imagenes as { image_url: string }[])
            : [],
          usuarios: autor,
        };
      });

      if (soloDestacados) {
        const destacados = listaMapeada.filter((p) => p.destacado);
        setProductos(destacados.length > 0 ? destacados : listaMapeada);
      } else {
        setProductos(listaMapeada);
      }
    } catch (err) {
      console.warn("[ProductosCarrusel] Fallback a /api/productos:", err);
      try {
        const res = await fetch("/api/productos", { cache: "no-store" });
        const json = (await res.json()) as { productos?: Record<string, unknown>[] };
        if (Array.isArray(json?.productos)) {
          const list: Producto[] = json.productos.map((p) => ({
            id: String(p.id),
            nombre: String(p.nombre ?? "Sin nombre"),
            descripcion: String(p.descripcion ?? ""),
            categoria: String(p.categoria ?? "General"),
            precio: Number(p.precio ?? 0),
            stock: Number(p.stock ?? 0),
            destacado: Boolean(p.destacado),
            image_url: p.image_url ? String(p.image_url) : undefined,
            video_url: p.video_url ? String(p.video_url) : undefined,
            producto_imagenes: Array.isArray(p.producto_imagenes)
              ? (p.producto_imagenes as { image_url: string }[])
              : [],
            usuarios: p.usuarios ? (p.usuarios as { nombre: string }) : null,
          }));

          if (soloDestacados) {
            const dest = list.filter((p) => p.destacado);
            setProductos(dest.length > 0 ? dest : list);
          } else {
            setProductos(list);
          }
        }
      } catch {
        setProductos([]);
      }
    } finally {
      setLoading(false);
    }
  }, [soloDestacados]);

  // Carga inicial y suscripción Realtime a Supabase
  useEffect(() => {
    void fetchProductos();

    const channel = supabase
      .channel("carrusel-productos-realtime-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "productos" },
        () => {
          void fetchProductos();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchProductos]);

  // Actualizar visibilidad de flechas al scrollear
  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 20);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 20);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    checkScroll();
    return () => el.removeEventListener("scroll", checkScroll);
  }, [productos, checkScroll]);

  // Auto-scroll suave cada 5 segundos si no hay interacción
  useEffect(() => {
    if (isPaused || productos.length <= 3) return;
    const interval = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 30) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: 290, behavior: "smooth" });
      }
    }, 5500);

    return () => clearInterval(interval);
  }, [isPaused, productos.length]);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -300, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 300, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-[#00a19a]/20 border-t-[#00a19a] rounded-full animate-spin" />
      </div>
    );
  }

  if (productos.length === 0) {
    return (
      <div className="text-center py-12 px-4 max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 text-[#00a19a] flex items-center justify-center mx-auto mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-1">
          Nuevas Obras en Fabricación
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          Estamos preparando nuevas esculturas y creaciones 3D sostenibles en el taller.
        </p>
        <button
          type="button"
          onClick={() => router.push("/tienda/productos")}
          className="px-5 py-2.5 rounded-xl bg-[#00a19a] hover:bg-[#007973] text-white text-xs font-black uppercase tracking-wider shadow-md shadow-[#00a19a]/20 transition-all"
        >
          Ver Tienda Completa
        </button>
      </div>
    );
  }

  return (
    <section className="relative w-full max-w-[1340px] mx-auto py-2 px-2 sm:px-6 group">
      {/* Botón Flecha Izquierda */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={scrollLeft}
          className="absolute -left-2 sm:left-1 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/95 hover:bg-white text-slate-800 shadow-xl border border-slate-200/80 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          aria-label="Ver productos anteriores"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* Botón Flecha Derecha */}
      {canScrollRight && (
        <button
          type="button"
          onClick={scrollRight}
          className="absolute -right-2 sm:right-1 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/95 hover:bg-white text-slate-800 shadow-xl border border-slate-200/80 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          aria-label="Ver siguientes productos"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Contenedor Carrusel Horizontal (Elegante, fluido y sin tarjetas gigantes) */}
      <div
        ref={scrollRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="flex overflow-x-auto scroll-smooth gap-4 sm:gap-5 pb-4 pt-1 px-1 select-none"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {productos.map((prod, idx) => (
          <CarruselCardItem
            key={prod.id}
            prod={prod}
            idx={idx}
            router={router}
          />
        ))}
      </div>
    </section>
  );
}

function CarruselCardItem({
  prod,
  idx,
  router,
}: {
  prod: Producto;
  idx: number;
  router: ReturnType<typeof useRouter>;
}) {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  // Lista unificada de medios (portada + imágenes secundarias + video)
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

  // Deslizamiento con cursor estilo Mercado Libre
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mediaList.length <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(0.999, x / rect.width));
    const newIdx = Math.floor(pct * mediaList.length);
    if (newIdx !== activeMediaIndex) setActiveMediaIndex(newIdx);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04, duration: 0.3 }}
      onClick={() => router.push(`/tienda/productos/${prod.id}`)}
      className="w-[235px] sm:w-[255px] md:w-[270px] shrink-0 snap-start bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-3 sm:p-3.5 shadow-sm hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 cursor-pointer flex flex-col group/card"
    >
      {/* Contenedor Visual de Medios (Proporciones compactas idénticas a Mercado Libre) */}
      <div
        onMouseMove={handleMouseMove}
        className="relative h-40 sm:h-44 md:h-48 w-full rounded-xl overflow-hidden bg-slate-50 mb-3 flex items-center justify-center border border-slate-100 group/media"
      >
        <AnimatePresence mode="wait">
          {activeMedia?.type === "image" ? (
            <motion.div
              key={activeMedia.url}
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0.6 }}
              transition={{ duration: 0.18 }}
              className="relative w-full h-full p-2"
            >
              <Image
                src={activeMedia.url}
                alt={prod.nombre}
                fill
                priority={idx < 4}
                sizes="(max-width: 640px) 240px, 270px"
                className="object-contain transition-transform duration-300 group-hover/card:scale-105"
              />
            </motion.div>
          ) : activeMedia?.type === "video" ? (
            <motion.div
              key={activeMedia.url}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative w-full h-full bg-black/90 rounded-xl overflow-hidden flex items-center justify-center"
            >
              <video
                src={activeMedia.url}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-contain"
              />
              <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-black text-teal-300 uppercase tracking-widest flex items-center gap-1 z-10">
                <Play className="w-2.5 h-2.5 fill-current" /> Video 3D
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Insignia Superior de Destacado */}
        {prod.destacado && (
          <div className="absolute top-2 left-2 z-20 pointer-events-none">
            <span className="bg-[#00a19a] text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm shadow-sm flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-white" /> Destacado
            </span>
          </div>
        )}

        {/* Indicadores de segmentos estilo Mercado Libre */}
        {mediaList.length > 1 && (
          <div className="absolute bottom-1.5 left-2 right-2 flex items-center gap-1 z-20 pointer-events-none">
            {mediaList.map((_, mIdx) => (
              <div
                key={mIdx}
                className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${
                  activeMediaIndex === mIdx ? "bg-[#00a19a]" : "bg-slate-300/80"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Información del Producto (Compacta y balanceada) */}
      <div className="flex flex-col flex-1 justify-between">
        <div>
          {/* Categoría y Calificación */}
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#00a19a] truncate">
              {prod.categoria}
            </span>
            <div className="flex items-center gap-0.5 text-amber-400 shrink-0">
              <Star className="w-3 h-3 fill-current" />
              <span className="font-bold text-slate-700 text-[10px]">4.9</span>
            </div>
          </div>

          {/* Nombre */}
          <h3 className="text-xs sm:text-sm font-semibold text-slate-800 line-clamp-1 leading-snug group-hover/card:text-[#00a19a] transition-colors">
            {prod.nombre}
          </h3>

          {/* Descripción corta */}
          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-medium">
            {prod.descripcion}
          </p>
        </div>

        {/* Precio y Botón Ver */}
        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              ${prod.precio.toLocaleString("es-CO")}
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase">
              COP
            </span>
          </div>
          <span className="text-[11px] font-bold text-[#00a19a] group-hover/card:translate-x-0.5 transition-transform flex items-center gap-0.5">
            Ver obra →
          </span>
        </div>
      </div>
    </motion.div>
  );
}
