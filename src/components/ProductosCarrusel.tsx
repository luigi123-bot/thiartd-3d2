"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { BadgeDollarSign, ChevronLeft, ChevronRight, ShoppingCart, Eye } from "lucide-react";
import clsx from "clsx";
import { createClient } from "@supabase/supabase-js";

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  precio: number;
  destacado?: boolean;
  imagen?: string;
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
    nombre: "Figura Dragón",
    descripcion: "Figura 3D de dragón pintada a mano.",
    categoria: "Grandes",
    precio: 350,
    destacado: true,
    imagen: "/Logo%20Thiart%20Tiktok.png", // Imagen que sí existe en public/
  },
  {
    id: 2,
    nombre: "Miniatura Robot",
    descripcion: "Mini robot articulado, ideal para escritorio.",
    categoria: "Pequeños",
    precio: 120,
    destacado: false,
    imagen: "/Logo%20Thiart%20Tiktok.png",
  },
  {
    id: 3,
    nombre: "Jarrón Moderno",
    descripcion: "Jarrón impreso en 3D con diseño geométrico.",
    categoria: "Medianos",
    precio: 200,
    destacado: false,
    imagen: "/Logo%20Thiart%20Tiktok.png",
  },
  {
    id: 4,
    nombre: "Lámpara Luna",
    descripcion: "Lámpara LED con forma de luna, personalizada.",
    categoria: "Personalizados",
    precio: 450,
    destacado: true,
    imagen: "/Logo%20Thiart%20Tiktok.png",
  },
];

export default function ProductosCarrusel({ soloDestacados = false }: ProductosCarruselProps) {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Añadir más productos mock para el movimiento continuo

  const extendedMock = useMemo(
    () => [
      ...mockProductos,
      {
        id: 5,
        nombre: "Soporte Celular",
        descripcion: "Soporte impreso en 3D para tu smartphone.",
        categoria: "Pequeños",
        precio: 90,
        destacado: false,
        imagen: "/Logo%20Thiart%20Tiktok.png",
      },
      {
        id: 6,
        nombre: "Organizador Escritorio",
        descripcion: "Organizador modular para oficina.",
        categoria: "Medianos",
        precio: 180,
        destacado: false,
        imagen: "/Logo%20Thiart%20Tiktok.png",
      },
      {
        id: 7,
        nombre: "Maceta Geométrica",
        descripcion: "Maceta decorativa con diseño moderno.",
        categoria: "Grandes",
        precio: 220,
        destacado: true,
        imagen: "/Logo%20Thiart%20Tiktok.png",
      },
    ],
    []
  );

  // Nueva función para alternar destacado
  useEffect(() => {
    const fetchProductos = async () => {
      setLoading(true);
      try {
        // Traer productos desde Supabase
        const { data } = await supabase
          .from("productos")
          .select("id, nombre, descripcion, categoria, precio, destacado, imagen");
        let productosFiltrados = ((data as Producto[]) ?? []).map((p) => ({
          ...p,
          destacado: p.destacado ?? false,
        }));
        if (!!soloDestacados) {
          productosFiltrados = productosFiltrados.filter((p: Producto) => p.destacado);
        }
        // Si no hay productos, usar mock
        if (!productosFiltrados.length) {
          productosFiltrados = (soloDestacados
            ? extendedMock.filter((p) => p.destacado)
            : extendedMock
          ).map((p) => ({
            ...p,
            destacado: p.destacado ?? false,
          }));
        }
        // Destacados primero
        const destacados = productosFiltrados.filter((p: Producto) => p.destacado);
        const normales = productosFiltrados.filter((p: Producto) => !p.destacado);
        setProductos([...destacados, ...normales]);
      } catch {
        // Si hay error, usar mock
        setProductos(
          soloDestacados
            ? extendedMock.filter((p) => p.destacado)
            : extendedMock
        );
      }
      setLoading(false);
    };
    void fetchProductos();
  }, [soloDestacados, extendedMock]);

  // Responsive: tarjetas por vista
  const [cardsPerView, setCardsPerView] = useState(1);
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 640) setCardsPerView(1);
      else if (window.innerWidth < 1024) setCardsPerView(2);
      else setCardsPerView(4);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Movimiento automático continuo
  useEffect(() => {
    if (isPaused || productos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % productos.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isPaused, productos.length]);

  // Scroll a la tarjeta current
  useEffect(() => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.offsetWidth / cardsPerView;
      scrollRef.current.scrollTo({
        left: current * cardWidth,
        behavior: "smooth",
      });
    }
  }, [current, cardsPerView]);

  // Funcionalidad de botones
  const handleVerDetalles = (producto: Producto) => {
    router.push(`/tienda/productos/${producto.id}`);
  };
  const handleAnadir = (producto: Producto) => {
    alert(`Añadido al carrito: ${producto.nombre}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <span className="text-gray-400">Cargando productos...</span>
      </div>
    );
  }

  if (!productos.length) {
    return (
      <div className="flex justify-center items-center py-16">
        <span className="text-gray-400">No hay productos para mostrar.</span>
      </div>
    );
  }

  // Paginación
  const totalPages = Math.max(1, productos.length - cardsPerView + 1);

  return (
    <div className="w-full flex flex-col items-center bg-white">
      <div
        className={clsx(
          "relative w-full max-w-7xl group transition-colors",
          "bg-white rounded-2xl py-10 px-2 sm:px-6"
        )}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Flechas laterales */}
        <button
          className={clsx(
            "absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white border border-gray-300 rounded-full shadow-md flex items-center justify-center",
            "hover:bg-gray-100 transition",
            current === 0 && "opacity-30 pointer-events-none"
          )}
          aria-label="Anterior"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
        >
          <ChevronLeft className="w-6 h-6 text-black" />
        </button>
        <button
          className={clsx(
            "absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white border border-gray-300 rounded-full shadow-md flex items-center justify-center",
            "hover:bg-gray-100 transition",
            current >= totalPages - 1 && "opacity-30 pointer-events-none"
          )}
          aria-label="Siguiente"
          onClick={() => setCurrent((c) => Math.min(totalPages - 1, c + 1))}
        >
          <ChevronRight className="w-6 h-6 text-black" />
        </button>
        {/* Carrusel */}
        <div
          ref={scrollRef}
          className="flex overflow-x-auto scroll-smooth no-scrollbar snap-x snap-mandatory gap-4 px-2"
        >
          {productos.map((prod, i) => (
            <div
              key={prod.id + "-" + i}
              className={clsx(
                "relative flex flex-col items-center bg-white rounded-xl shadow-md transition-all duration-500 ease-in-out group/card overflow-hidden",
                "min-w-[90vw] max-w-[90vw] sm:min-w-[340px] sm:max-w-[340px] lg:min-w-[270px] lg:max-w-[270px] snap-center",
                "hover:z-10 min-h-[340px]",
                i === 0 && "ml-auto",
                i === productos.length - 1 && "mr-auto"
              )}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {/* Badge Destacado */}
              {prod.destacado && (
                <span className="absolute top-4 right-4 bg-black text-white text-xs font-semibold px-3 py-1 rounded-full z-10 shadow">
                  Destacado
                </span>
              )}
              {/* Imagen */}
              <div className="flex items-center justify-center w-full pt-6 pb-3 px-4">
                <Image
                  src={prod.imagen ?? "/Logo%20Thiart%20Tiktok.png"}
                  alt={prod.nombre}
                  width={120}
                  height={120}
                  className="object-contain w-28 h-28 rounded-xl bg-gray-50"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== window.location.origin + "/Logo%20Thiart%20Tiktok.png") {
                      target.src = "/Logo%20Thiart%20Tiktok.png";
                    }
                  }}
                  priority={i < 2}
                />
              </div>
              {/* Nombre */}
              <div className="flex items-center justify-center w-full mb-1 px-4">
                <span className="text-base font-bold text-center text-black w-full truncate">{prod.nombre}</span>
              </div>
              {/* Descripción */}
              <div className="text-gray-500 text-xs text-center mb-2 px-4 line-clamp-2">{prod.descripcion}</div>
              {/* Chips de categoría */}
              <div className="flex flex-wrap justify-center gap-2 mb-2 px-4">
                <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-700">{prod.categoria}</span>
              </div>
              {/* Precio */}
              <div className="flex items-center justify-end w-full mb-4 px-4">
                <span className="flex items-center gap-1 text-sm font-semibold text-black">
                  <BadgeDollarSign className="w-4 h-4" /> ${prod.precio?.toFixed(2)}
                </span>
              </div>
              {/* Overlay al hacer hover */}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/card:opacity-100 transition-opacity rounded-xl pointer-events-none z-10"></div>
              {/* Botones */}
              <div className="flex w-full gap-2 px-4 pb-6 z-20">
                <button
                  className="flex-1 flex items-center justify-center gap-2 border border-gray-300 rounded-md bg-white text-black py-2 text-xs font-semibold hover:bg-gray-100 transition relative z-20"
                  type="button"
                  onClick={() => handleAnadir(prod)}
                >
                  <ShoppingCart className="w-4 h-4" /> Añadir
                </button>
                <button
                  className="flex-1 flex items-center justify-center gap-2 rounded-md bg-black text-white py-2 text-xs font-semibold hover:bg-gray-900 transition relative z-20"
                  type="button"
                  onClick={() => handleVerDetalles(prod)}
                >
                  <Eye className="w-4 h-4" /> Ver detalles
                </button>
              </div>
            </div>
          ))}
        </div>
        {/* Indicadores de paginación */}
        <div className="flex justify-center items-center gap-2 mt-6">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              className={clsx(
                "h-2 rounded-full transition-all duration-300",
                current === idx
                  ? "bg-black w-6 min-w-[24px]"
                  : "bg-gray-300 w-2 min-w-[8px]"
              )}
              onClick={() => setCurrent(idx)}
              aria-label={`Ir a la página ${idx + 1}`}
            />
          ))}
        </div>
      </div>
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}