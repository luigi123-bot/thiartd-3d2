"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ShoppingCart, Eye} from "lucide-react";
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
              "flex-shrink-0 relative bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm hover:shadow-2xl hover:shadow-[#00a19a]/10 transition-all duration-500",
              cardsPerView === 1 ? "w-full" : 
              cardsPerView === 2 ? "w-[calc(50%-12px)]" :
              cardsPerView === 3 ? "w-[calc(33.33%-16px)]" : "w-[calc(25%-18px)]"
            )}
          >
            {/* Image Wrap */}
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-50 mb-6 group/img">
               <Image
                  src={prod.image_url ?? "/Logo%20Thiart%20Tiktok.png"}
                  alt={prod.nombre}
                  fill
                  className="object-cover transition-transform duration-700 group-hover/img:scale-110"
                />
                
                {prod.destacado && (
                  <div className="absolute top-4 left-4">
                    <span className="bg-[#00a19a] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
                      Top Obras
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => router.push(`/tienda/productos/${prod.id}`)}
                    className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#00a19a] shadow-xl"
                  >
                    <Eye className="w-5 h-5" />
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-12 h-12 bg-[#00a19a] rounded-2xl flex items-center justify-center text-white shadow-xl"
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </motion.button>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-[#00a19a] uppercase tracking-widest">
                  {prod.categoria}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">By {prod.usuarios?.nombre ?? "Thiart"}</span>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 line-clamp-1">
                {prod.nombre}
              </h3>
              
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {prod.descripcion}
              </p>

              <div className="pt-4 flex items-center justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold text-[#00a19a]">$</span>
                  <span className="text-xl font-black text-slate-900">{prod.precio.toLocaleString()}</span>
                </div>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00a19a]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
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
