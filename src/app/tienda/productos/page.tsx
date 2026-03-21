"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardTitle, CardDescription } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ShoppingCart, X, Filter, Sparkles, Package, Tag, BadgeDollarSign, Heart, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import CreateProductModal from "./CreateProductModal";
import { type AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

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
  const [modalOpen, setModalOpen] = useState(false);
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
               <div className="relative group flex-1 md:w-64">
                <Input
                  type="text"
                  placeholder="Buscar..."
                  className="w-full pl-10 h-12 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#00a19a] transition-all shadow-sm font-medium"
                  value={filtros.buscar}
                  onChange={handleBuscar}
                />
                <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-[#00a19a] transition-colors" />
              </div>
              <Button
                onClick={() => setModalOpen(true)}
                className="bg-slate-950 hover:bg-slate-800 text-white h-12 px-6 rounded-2xl font-black transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Vender
              </Button>
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
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
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

      <CreateProductModal open={modalOpen} onOpenChangeAction={setModalOpen} onProductCreatedAction={fetchProductos} />
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

// Sub-componente para la Card de Producto (Diseño Minimal Compacto)
function ProductCardModern({ producto, idx, router, addToCarrito, carrito }: {
  producto: Product;
  idx: number;
  router: AppRouterInstance;
  addToCarrito: (item: CarritoItem) => Promise<boolean>;
  carrito: CarritoItem[];
}) {
  const data = {
    id: producto.id,
    nombre: producto.nombre ?? producto.name ?? "Producto Sin Nombre",
    precio: producto.precio ?? producto.price ?? 0,
    categoria: producto.categoria ?? producto.category ?? "General",
    creador: producto.usuarios?.nombre ?? "Thiart",
    desc: producto.descripcion ?? producto.description ?? "Sin descripción",
    destacado: producto.destacado ?? producto.featured ?? false,
  };

  const enCarrito = carrito.find((p) => String(p.id) === String(producto.id));
  const cantidadEnCarrito = enCarrito?.cantidad ?? 0;
  const stockDisponible = (producto.stock ?? 1) - cantidadEnCarrito;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.01, duration: 0.4 }}
      whileHover={{ y: -6 }}
      className="h-full"
    >
      <Card 
        onClick={() => router.push(`/tienda/productos/${producto.id}`)}
        className="group cursor-pointer relative h-full bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-[#00a19a]/10 rounded-[2rem] overflow-hidden transition-all duration-500 flex flex-col"
      >
        {/* Visual Showcase (Shorter) */}
        <div className="h-32 sm:h-36 md:h-40 relative bg-slate-50/50 overflow-hidden flex items-center justify-center p-3">
          {producto.image_url ? (
            <div className="relative w-full h-full transform transition-transform duration-700 group-hover:scale-105">
              <Image
                src={producto.image_url}
                alt={data.nombre}
                fill
                className="object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.1)]"
                sizes="(max-width: 768px) 50vw, 25vw"
                priority={idx < 6}
              />
            </div>
          ) : (
            <Package className="w-8 h-8 text-slate-200 stroke-[1]" />
          )}

          {/* Discreet Badge */}
          {data.destacado && (
            <div className="absolute top-3 left-3">
               <span className="bg-black text-white text-[6px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full shadow-lg">Premium</span>
            </div>
          )}

          <div className="absolute top-3 right-3 z-20">
             <button className="w-7 h-7 rounded-lg bg-white/80 backdrop-blur-md flex items-center justify-center text-slate-300 hover:text-red-500 transition-all border border-slate-100">
                <Heart className="w-3 h-3 fill-current" />
             </button>
          </div>
        </div>

        {/* Info Hub (More Compact) */}
        <CardContent className="px-3.5 py-3 flex flex-col flex-1 bg-white">
          <div className="mb-1.5">
            <span className="text-[#00a19a] font-black text-[6px] uppercase tracking-[0.2em] mb-0.5 block opacity-60">
              {data.categoria}
            </span>
            <CardTitle className="text-xs font-black text-slate-900 leading-tight line-clamp-1 uppercase tracking-tighter">
              {data.nombre}
            </CardTitle>
          </div>
          
          <CardDescription className="text-slate-400 text-[9px] mb-3 line-clamp-1 h-3 leading-none font-medium italic overflow-hidden">
            {data.desc}
          </CardDescription>

          <div className="mt-auto flex items-center justify-between pt-2.5 border-t border-slate-50">
            <div className="flex flex-col">
              <span className="text-[6px] font-black text-slate-300 uppercase tracking-widest leading-none mb-0.5">Precio</span>
              <div className="flex items-baseline gap-0.5">
                <span className="text-sm sm:text-base font-black text-slate-950 tracking-tighter group-hover:text-[#00a19a] transition-colors">
                  <span className="text-[9px] font-bold mr-0.5">$</span>
                  {data.precio.toLocaleString()}
                </span>
                <span className="text-[6px] font-bold text-slate-300 uppercase">Cop</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {cantidadEnCarrito > 0 && (
                <div className="w-6 h-6 flex items-center justify-center bg-teal-50 text-[#00a19a] rounded-lg font-black text-[8px] border border-teal-100">
                  {cantidadEnCarrito}
                </div>
              )}
              
              <motion.button
                whileTap={{ scale: 0.9 }}
                disabled={stockDisponible <= 0}
                onClick={async (e) => {
                  e.stopPropagation();
                  const ok = await addToCarrito({
                    id: String(producto.id),
                    nombre: data.nombre,
                    precio: data.precio,
                    imagen: producto.image_url ?? "/Logo%20Thiart%20Tiktok.png",
                    cantidad: 1, 
                    stock: producto.stock,
                    categoria: data.categoria,
                    destacado: data.destacado,
                  });
                  if (ok) toast.success("Añadido ✨");
                }}
                className={`
                  w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-500
                  ${stockDisponible <= 0 
                    ? "bg-slate-100 text-slate-200" 
                    : "bg-slate-950 text-white hover:bg-[#00a19a] shadow-lg hover:shadow-teal-500/30"}
                `}
              >
                <ShoppingCart className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
