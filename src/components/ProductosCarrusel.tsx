"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { BadgeDollarSign } from "lucide-react";
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function ProductosCarrusel() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductos = async () => {
      setLoading(true);
      try {
        // Traer productos desde Supabase
        const { data, error } = await supabase
          .from("productos")
          .select("id, nombre, descripcion, categoria, precio, destacado, imagen");
        if (error) throw error;
        // Destacados primero
        const destacados = (data ?? []).filter((p: Producto) => p.destacado);
        const normales = (data ?? []).filter((p: Producto) => !p.destacado);
        setProductos([...destacados, ...normales]);
      } catch {
        setProductos([]);
      }
      setLoading(false);
    };
    void fetchProductos();
  }, []);

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

  return (
    <div className="flex justify-center">
      <div className="relative overflow-hidden w-[1800px] max-w-full rounded-2xl border-4 shadow-lg border-[#b2dfdb] py-12 bg-[#e0f2f1]">
        <div className="flex gap-8 animate-carousel carousel-width">
          {[...productos, ...productos].map((prod, i) => (
            <div
              key={prod.id + "-" + i}
              className="bg-white rounded-xl shadow w-80 flex-shrink-0 border border-[#b2dfdb] relative flex flex-col"
            >
              <div>
                <Image
                  src={prod.imagen ?? "/Logo%20Thiart%20Tiktok.png"}
                  alt={prod.nombre}
                  width={128}
                  height={128}
                  className="w-32 h-32 object-contain"
                  priority={i < 2}
                />
                {prod.destacado && (
                  <span className="absolute top-4 right-4 bg-[#007973] text-white text-xs px-3 py-1 rounded-full font-semibold">
                    Recomendado
                  </span>
                )}
              </div>
              <div className="p-6">
                <h4 className="font-bold text-xl mb-1 text-[#007973]">
                  {prod.nombre}
                </h4>
                <p className="text-gray-600 mb-3 line-clamp-2">{prod.descripcion}</p>
                <div className="flex items-center justify-between">
                  <span className={clsx(
                    "bg-[#e0f2f1] text-[#007973] px-3 py-1 rounded text-sm",
                    prod.destacado && "font-bold"
                  )}>
                    {prod.categoria}
                  </span>
                  <span className="font-bold text-lg text-[#007973] flex items-center gap-1">
                    <BadgeDollarSign className="w-5 h-5" /> ${prod.precio?.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <style jsx>{`
          @keyframes carousel {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-${productos.length * 22}rem);
            }
          }
          .animate-carousel {
            animation: carousel 40s linear infinite;
          }
          .carousel-width {
            width: calc(${productos.length * 2} * 20rem + ${productos.length * 2} * 2rem);
          }
        `}</style>
      </div>
    </div>
  );
}