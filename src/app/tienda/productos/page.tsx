"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardTitle, CardDescription } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ShoppingCart, X, Filter, Sparkles, Package, Ruler, Tag, BadgeDollarSign } from "lucide-react";
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

const tamanos = ["Pequeño", "Mediano", "Grande"]; // Define aquí los tamaños disponibles

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
      setProductos(Array.isArray(data.productos) ? data.productos : []);
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
      {/* Header Premium */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
          >
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Link href="/" className="text-sm text-slate-500 hover:text-[#00a19a] transition-colors">Inicio</Link>
                <span className="text-slate-300">/</span>
                <span className="text-sm font-semibold text-[#00a19a]">Tienda</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-2">
                Nuestros <span className="text-[#00a19a]">Productos</span>
              </h1>
              <p className="text-slate-500 text-lg max-w-xl">
                Explora el arte tridimensional. Piezas únicas diseñadas con precisión y pasión.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
               <div className="relative group">
                <Input
                  type="text"
                  placeholder="Buscar obras de arte..."
                  className="w-full sm:w-72 pl-10 h-12 rounded-2xl border-slate-200 focus:border-[#00a19a] focus:ring-[#00a19a] transition-all shadow-sm"
                  value={filtros.buscar}
                  onChange={handleBuscar}
                />
                <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#00a19a] transition-colors" />
              </div>
              <Button
                onClick={() => setModalOpen(true)}
                className="bg-[#00a19a] hover:bg-[#007973] text-white h-12 px-8 rounded-2xl font-bold transition-all shadow-lg hover:shadow-[#00a19a]/20 active:scale-95"
              >
                Vender Producto
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar de Filtros Modernizado */}
          <aside className={`w-full lg:w-72 space-y-8 ${mostrarFiltros ? "fixed inset-0 z-50 bg-white p-8 overflow-y-auto" : "hidden lg:block"}`}>
            {mostrarFiltros && (
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">Filtros</h2>
                <Button variant="ghost" onClick={() => setMostrarFiltros(false)}><X className="w-6 h-6" /></Button>
              </div>
            )}

            <div className="space-y-8 sticky top-24">
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

              <FilterSection title="Enfoque" icon={<Sparkles className="w-4 h-4" />}>
                 <select
                  className="w-full h-11 px-4 rounded-xl border-slate-200 text-sm font-medium focus:ring-2 focus:ring-[#00a19a]/20 focus:border-[#00a19a] transition-all bg-white"
                  onChange={handleDestacados}
                  value={filtros.destacados ? "Destacados" : "Todos"}
                >
                  <option value="Todos">Ver todo el catálogo</option>
                  <option value="Destacados">🌟 Obras Destacadas</option>
                </select>
              </FilterSection>

              <FilterSection title="Dimensiones" icon={<Ruler className="w-4 h-4" />}>
                {tamanos.map((t) => (
                  <FilterCheckbox
                    key={t}
                    label={t}
                    checked={filtros.tamano.includes(t)}
                    onChange={() => handleCheckbox("tamano", t)}
                  />
                ))}
              </FilterSection>

              <FilterSection title="Rango de Precio" icon={<BadgeDollarSign className="w-4 h-4" />}>
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
                className="w-full h-12 rounded-2xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all hover:text-slate-900 border-2"
                onClick={limpiarFiltros}
              >
                Restablecer Todo
              </Button>
            </div>
          </aside>

          {/* Grid de Productos Overhaul */}
          <section className="flex-1">
            <AnimatePresence mode="popLayout">
              {loading ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-32"
                >
                  <div className="w-16 h-16 border-4 border-[#00a19a]/20 border-t-[#00a19a] rounded-full animate-spin mb-4" />
                  <p className="text-slate-500 font-medium">Curando obras maestras...</p>
                </motion.div>
              ) : productosFiltrados.length === 0 ? (
                <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="text-center py-32 bg-white rounded-3xl border-2 border-dashed border-slate-200"
                >
                  <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No encontramos resultados</h3>
                  <p className="text-slate-500 mb-6">Prueba ajustando tus filtros o buscando otros términos.</p>
                  <Button variant="outline" onClick={limpiarFiltros} className="rounded-xl">Limpiar búsqueda</Button>
                </motion.div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
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

      {/* Botón Filtros Móvil */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        className="fixed right-6 bottom-24 lg:hidden bg-[#00a19a] text-white p-5 rounded-3xl shadow-2xl z-50 flex items-center justify-center"
        onClick={() => setMostrarFiltros(true)}
      >
        <Filter className="w-6 h-6" />
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
    tamano: "Único"
  };

  const enCarrito = carrito.find((p) => String(p.id) === String(producto.id));
  const cantidadEnCarrito = enCarrito?.cantidad ?? 0;
  const stockDisponible = (producto.stock ?? 1) - cantidadEnCarrito;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.03, duration: 0.4 }}
      whileHover={{ y: -5 }}
    >
      <Card className="group relative h-full bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-[#00a19a]/10 rounded-3xl overflow-hidden transition-all duration-500 flex flex-col">
        {/* Compact Image Container */}
        <div className="h-44 relative bg-gradient-to-br from-slate-50 to-slate-100/50 overflow-hidden">
          {producto.image_url ? (
            <div className="h-full w-full p-4 relative z-0">
              <Image
                src={producto.image_url}
                alt={data.nombre}
                fill
                className="object-contain transition-transform duration-700 group-hover:scale-110 drop-shadow-lg"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-200">
              <Package className="w-8 h-8 stroke-[1.5]" />
            </div>
          )}

          {/* Minimal Floating Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1 z-20">
            {data.destacado && (
              <span className="bg-black/80 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full shadow-lg border border-white/10">
                Elite
              </span>
            )}
            {producto.stock === 0 && (
              <span className="bg-red-500/90 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full shadow-lg">
                SOLD OUT
              </span>
            )}
          </div>
        </div>

        {/* Compact Content Body */}
        <CardContent className="p-4 pt-1 flex flex-col flex-1 relative z-20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[#00a19a] font-black text-[8px] uppercase tracking-tighter opacity-80">
              {data.categoria}
            </span>
            <span className="text-slate-300 font-bold text-[8px] uppercase">
               By {data.creador.split(' ')[0]}
            </span>
          </div>

          <CardTitle className="text-sm font-black text-slate-900 mb-1 line-clamp-1 group-hover:text-[#00a19a] transition-colors leading-tight tracking-tight">
            {data.nombre}
          </CardTitle>
          
          <CardDescription className="text-slate-400 text-[10px] mb-3 line-clamp-2 h-7 leading-tight font-medium">
            {data.desc}
          </CardDescription>

          <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-black text-slate-900 tracking-tighter">
                  <span className="text-[10px] font-bold text-teal-600 mr-0.5">$</span>
                  {data.precio.toLocaleString()}
                </span>
                <span className="text-[8px] font-black text-slate-400">COP</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
               {cantidadEnCarrito > 0 && (
                <div className="w-7 h-7 flex items-center justify-center bg-teal-50 text-teal-600 rounded-lg font-black text-[9px] border border-teal-100 shadow-sm animate-in zoom-in-50">
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
                  else toast.warning("Sin stock ⚠️");
                }}
                className={`
                  w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300 shadow-lg
                  ${stockDisponible <= 0 
                    ? "bg-slate-100 text-slate-300 cursor-not-allowed" 
                    : "bg-black text-white hover:bg-[#00a19a] hover:shadow-teal-100/50"}
                `}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </div>

          <Button
            variant="ghost"
            className="w-full mt-3 rounded-lg h-7 text-slate-400 font-bold text-[8px] hover:bg-slate-50 hover:text-teal-600 transition-all border border-transparent hover:border-slate-100 uppercase tracking-widest"
            onClick={() => router.push(`/tienda/productos/${producto.id}`)}
          >
            Detalles
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
