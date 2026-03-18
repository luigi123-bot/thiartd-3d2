"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ShoppingCart, Eye, Sparkles} from "lucide-react";
import clsx from "clsx";
import { createClient } from "@supabase/supabase-js";

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  precio: number;
  destacado?: boolean;
  image_url?: string;
  usuarios?: { nombre: string } | null;
}

interface ProductosCarruselProps {
  soloDestacados?: boolean;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

const mockProductos: Producto[] = [
  {
    id: 1,
    nombre: "Figura Dragón Místico",
    descripcion: "Figura 3D de piezas ensambladas con acabado metálico.",
    categoria: "Figuras",
    precio: 85000,
    destacado: true,
    image_url: "/Logo%20Thiart%20Tiktok.png",
  },
  {
    id: 2,
    nombre: "Robot Articulado X-1",
    descripcion: "Mini robot con 12 puntos de articulación.",
    categoria: "Juguetes",
    precio: 45000,
    destacado: false,
    image_url: "/Logo%20Thiart%20Tiktok.png",
  },
  {
    id: 3,
    nombre: "Jarrón Geométrico V2",
    descripcion: "Decoración moderna con patrón de Voronoi.",
    categoria: "Decoración",
    precio: 65000,
    destacado: false,
    image_url: "/Logo%20Thiart%20Tiktok.png",
  },
  {
    id: 4,
    nombre: "Lámpara Lunar LED",
    descripcion: "Textura realista de la luna con base de madera.",
    categoria: "Personalizados",
    precio: 120000,
    destacado: true,
    image_url: "/Logo%20Thiart%20Tiktok.png",
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
          .select("id, nombre, descripcion, categoria, precio, destacado, image_url, usuarios:user_id(nombre)");

        interface RawProducto {
          id: number;
          nombre: string;
          descripcion: string;
          categoria: string;
          precio: number;
          destacado: boolean | null;
          image_url: string | null;
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
          usuarios: Array.isArray(p.usuarios) ? p.usuarios[0] : p.usuarios
        })) as Producto[];

        if (!!soloDestacados) {
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
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 640) setCardsPerView(1);
      else if (window.innerWidth < 1024) setCardsPerView(2);
      else if (window.innerWidth < 1280) setCardsPerView(3);
      else setCardsPerView(4);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isPaused || productos.length <= cardsPerView) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % (productos.length - cardsPerView + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [isPaused, productos.length, cardsPerView]);

  useEffect(() => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.offsetWidth / cardsPerView;
      scrollRef.current.scrollTo({
        left: current * cardWidth,
        behavior: "smooth",
      });
    }
  }, [current, cardsPerView]);

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="w-10 h-10 border-4 border-[#00a19a]/20 border-t-[#00a19a] rounded-full animate-spin" />
    </div>
  );

  return (
    <section className="relative w-full max-w-[1400px] mx-auto py-10 px-4 sm:px-8 overflow-hidden group">
      {/* Botones de navegación minimalistas */}
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
          <motion.div
            key={prod.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className={clsx(
              "flex-shrink-0 relative bg-white border border-slate-50 rounded-[2.5rem] p-5 shadow-[0_4px_25px_rgba(0,0,0,0.02)] hover:shadow-[0_25px_50px_rgba(0,161,154,0.12)] transition-all duration-700 group flex flex-col",
              cardsPerView === 1 ? "w-full" : 
              cardsPerView === 2 ? "w-[calc(50%-12px)]" :
              cardsPerView === 3 ? "w-[calc(33.33%-16px)]" : "w-[calc(25%-18px)]"
            )}
          >
            {/* Image Wrap with Gradient Background */}
            <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 mb-6 group/img p-8">
               <Image
                  src={prod.image_url ?? "/Logo%20Thiart%20Tiktok.png"}
                  alt={prod.nombre}
                  fill
                  className="object-contain transition-transform duration-700 group-hover/img:scale-110 drop-shadow-xl"
                />
                
                {prod.destacado && (
                  <div className="absolute top-4 left-4">
                    <span className="bg-black/80 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-[0.15em] px-3.5 py-1.5 rounded-full shadow-xl flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-teal-400" />
                      Elite
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 bg-white/40 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => router.push(`/tienda/productos/${prod.id}`)}
                    className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center text-[#00a19a] shadow-xl border border-white/50"
                  >
                    <Eye className="w-5 h-5" />
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-11 h-11 bg-[#00a19a] rounded-2xl flex items-center justify-center text-white shadow-xl"
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </motion.button>
                </div>
            </div>

            {/* Content Details */}
            <div className="space-y-3 flex-1 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-[#00a19a] uppercase tracking-widest px-2.5 py-1 bg-teal-50 rounded-lg">
                  {prod.categoria}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Thiart Original</span>
              </div>
              
              <h3 className="text-lg font-black text-slate-900 line-clamp-1 group-hover:text-[#00a19a] transition-colors leading-tight">
                {prod.nombre}
              </h3>
              
              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-medium mb-4">
                {prod.descripcion}
              </p>

              <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-50">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-bold text-teal-600">$</span>
                  <span className="text-2xl font-black text-slate-900 tracking-tighter">{prod.precio.toLocaleString()}</span>
                  <span className="text-[9px] font-black text-slate-400 ml-0.5">COP</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-100" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Indicadores de progreso minimalistas */}
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
