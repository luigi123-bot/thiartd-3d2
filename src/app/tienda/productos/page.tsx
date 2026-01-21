"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ShoppingCart, X, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import CreateProductModal from "./CreateProductModal";

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
  id: string;
  nombre: string;
  desc: string;
  categoria: string;
  tamano: string;
  precio: number;
  destacado: boolean;
  stock: number;
  image_url?: string;
  // agrega aquí otros campos si tu producto tiene más propiedades
};

// --- Contexto de Carrito ---
type CarritoItem = {
  id: string;
  nombre: string;
  precio: number;
  imagen: string;
  cantidad: number;
  stock: number;
  categoria: string;
  destacado: boolean;
};

type CarritoContextType = {
  carrito: CarritoItem[];
  addToCarrito: (producto: CarritoItem) => Promise<boolean>;
};

const CarritoContext = createContext<CarritoContextType | undefined>(undefined);

function useCarrito() {
  const ctx = useContext(CarritoContext);
  if (!ctx) throw new Error("CarritoContext no disponible");
  return ctx;
}

function CarritoProvider({ children }: { children: React.ReactNode }) {
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);

  // Cargar carrito desde localStorage al iniciar
  useEffect(() => {
    if (typeof window !== "undefined") {
      const carritoLocal = localStorage.getItem("carrito");
      if (carritoLocal) {
        setCarrito(JSON.parse(carritoLocal) as CarritoItem[]);
      }
      // Escuchar cambios en localStorage (multi-tab)
      const syncCarrito = (e: StorageEvent) => {
        if (e.key === "carrito") {
          setCarrito(e.newValue ? (JSON.parse(e.newValue) as CarritoItem[]) : []);
        }
      };
      window.addEventListener("storage", syncCarrito);
      return () => window.removeEventListener("storage", syncCarrito);
    }
  }, []);

  // Sincroniza localStorage cada vez que cambia el carrito
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("carrito", JSON.stringify(carrito));
    }
  }, [carrito]);

  // Añadir producto con validación de stock y guardar en localStorage
  const addToCarrito = async (producto: CarritoItem) => {
    console.log("🛒 Intentando agregar producto:", producto);
    console.log("🛒 Carrito actual:", carrito);
    
    const nuevoCarrito = [...carrito];
    const idx = nuevoCarrito.findIndex((p) => p.id === producto.id);
    let added = false;
    
    if (idx >= 0 && nuevoCarrito[idx]) {
      console.log("🛒 Producto ya existe en el carrito, aumentando cantidad");
      if (nuevoCarrito[idx].cantidad < nuevoCarrito[idx].stock) {
        nuevoCarrito[idx].cantidad += 1;
        added = true;
        console.log("✅ Cantidad aumentada a:", nuevoCarrito[idx].cantidad);
      } else {
        console.log("❌ No hay stock suficiente");
      }
    } else {
      console.log("🛒 Producto nuevo, agregando al carrito");
      if (producto.stock > 0) {
        nuevoCarrito.push({ ...producto, cantidad: 1 });
        added = true;
        console.log("✅ Producto agregado con cantidad 1");
      } else {
        console.log("❌ Stock es 0, no se puede agregar");
      }
    }
    
    if (added) {
      console.log("💾 Guardando en localStorage...");
      setCarrito(nuevoCarrito);
      localStorage.setItem("carrito", JSON.stringify(nuevoCarrito));
      console.log("✅ Carrito guardado:", JSON.parse(localStorage.getItem("carrito") ?? "[]"));
    } else {
      console.log("❌ No se pudo agregar el producto");
    }
    
    return added;
  };

  return (
    <CarritoContext.Provider value={{ carrito, addToCarrito }}>
      {children}
    </CarritoContext.Provider>
  );
}

// --- Toast feedback ---
function showToast(msg: string, success = true) {
  const toast = document.createElement("div");
  toast.textContent = msg;
  toast.className =
    "fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl font-semibold shadow-lg z-[9999] transition bg-white border " +
    (success ? "border-green-400 text-green-700" : "border-red-400 text-red-700");
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => document.body.removeChild(toast), 500);
  }, 1800);
}

export default function ProductosTiendaPage() {
  return (
    <CarritoProvider>
      <ProductosTiendaPageInner />
    </CarritoProvider>
  );
}

// Extrae la lógica principal a un componente interno
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

  // Define fetchProductos ANTES de usarla
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

  // Filtros
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

  // Filtrado de productos
  const productosFiltrados = productos.filter((p) => {
    const matchCategoria =
      filtros.categoria.length === 0 || filtros.categoria.includes(p.categoria);
    const matchTamano =
      filtros.tamano.length === 0 || filtros.tamano.includes(p.categoria);
    const matchPrecio =
      filtros.precio.length === 0 ||
      filtros.precio.some((r) => {
        const rango = rangosPrecio.find((x) => x.label === r);
        return rango ? p.precio >= rango.min && p.precio <= rango.max : true;
      });
    const matchBuscar =
      !filtros.buscar ||
      p.nombre.toLowerCase().includes(filtros.buscar.toLowerCase()) ||
      p.desc.toLowerCase().includes(filtros.buscar.toLowerCase());
    const matchDestacado = !filtros.destacados || p.destacado;
    return matchCategoria && matchTamano && matchPrecio && matchBuscar && matchDestacado;
  });

  // Usa el contexto de carrito
  return (
    <div className="bg-white min-h-screen px-4 md:px-8 py-8">
      {/* Botón flotante para mostrar filtros en móvil */}
      <button
        className={`fixed left-4 top-1/2 transform -translate-y-1/2 bg-[#00a19a] text-white p-3 rounded-full shadow-lg hover:bg-[#007973] transition-all z-50 flex items-center justify-center lg:hidden ${
          mostrarFiltros ? "rotate-45" : "rotate-0"
        }`}
        onClick={() => setMostrarFiltros(!mostrarFiltros)}
        aria-label={mostrarFiltros ? "Cerrar filtros" : "Abrir filtros"}
      >
        {mostrarFiltros ? <X className="w-6 h-6" /> : <Filter className="w-6 h-6" />}
      </button>
      
      {/* Modal para crear producto */}
      <div className="flex justify-end mb-4 sm:mb-6 px-4 sm:px-0">
        <Button
          onClick={() => setModalOpen(true)}
          className="bg-[#00a19a] text-white px-4 sm:px-5 py-2 rounded font-semibold hover:bg-[#007973] transition text-sm sm:text-base"
        >
          <span className="hidden sm:inline">Añadir nuevo producto</span>
          <span className="sm:hidden">Añadir</span>
        </Button>
      </div>
      <CreateProductModal open={modalOpen} onOpenChangeAction={setModalOpen} onProductCreated={fetchProductos} />
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 px-4 sm:px-0 text-sm sm:text-base">
        <Link href="/" className="hover:text-black">Inicio</Link>
        <span>/</span>
        <span className="font-medium text-black">Productos</span>
      </div>
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-1 text-[#222] mt-4 px-4 sm:px-0">
        Nuestros Productos
      </h1>
      <p className="mb-6 sm:mb-8 text-gray-500 text-base sm:text-lg px-4 sm:px-0">
        Explora nuestra colección de productos 3D en diferentes tamaños
      </p>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filtros */}
        <aside
          className={`w-full lg:w-64 min-w-[220px] bg-white lg:bg-transparent lg:relative lg:translate-x-0 lg:shadow-none lg:transition-none ${
            mostrarFiltros ? "fixed top-0 left-0 w-full h-full bg-white z-40 p-4 shadow-lg overflow-y-auto" : "hidden lg:block"
          }`}
        >
          <div className="flex justify-between items-center mb-4 lg:hidden">
            <h2 className="text-xl font-bold">Filtros</h2>
            <button
              className="text-gray-500 hover:text-gray-800"
              onClick={() => setMostrarFiltros(false)}
              aria-label="Cerrar filtros"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <Card className="mb-6 bg-gradient-to-br from-[#00a19a] to-[#007973] text-white shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Categorías</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {categorias.map((cat) => (
                <label
                  key={cat}
                  className={`flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform ${
                    filtros.categoria.includes(cat) ? "bg-[#007973] text-white rounded-lg px-2 py-1" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    className="accent-blue-500 w-4 h-4" // Cambiado a azul
                    checked={filtros.categoria.includes(cat)}
                    onChange={() => handleCheckbox("categoria", cat)}
                  />
                  <span className="text-sm">{cat}</span>
                </label>
              ))}
            </CardContent>
          </Card>
          <Card className="mb-6 bg-gradient-to-br from-[#00a19a] to-[#007973] text-white shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Tamaño</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {tamanos.map((t) => (
                <label
                  key={t}
                  className={`flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform ${
                    filtros.tamano.includes(t) ? "bg-[#007973] text-white rounded-lg px-2 py-1" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    className="accent-blue-500 w-4 h-4" // Cambiado a azul
                    checked={filtros.tamano.includes(t)}
                    onChange={() => handleCheckbox("tamano", t)}
                  />
                  <span className="text-sm">{t}</span>
                </label>
              ))}
            </CardContent>
          </Card>
          <Card className="mb-6 bg-gradient-to-br from-[#00a19a] to-[#007973] text-white shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Precio</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {rangosPrecio.map((r) => (
                <label
                  key={r.label}
                  className={`flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform ${
                    filtros.precio.includes(r.label) ? "bg-[#007973] text-white rounded-lg px-2 py-1" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    className="accent-blue-500 w-4 h-4" // Cambiado a azul
                    checked={filtros.precio.includes(r.label)}
                    onChange={() => handleCheckbox("precio", r.label)}
                  />
                  <span className="text-sm">{r.label}</span>
                </label>
              ))}
            </CardContent>
          </Card>
          <Button
            className="w-full mt-2 bg-[#007973] text-white font-bold py-2 rounded-lg hover:bg-[#005f5a] transition-colors"
            variant="secondary"
            onClick={limpiarFiltros}
          >
            Limpiar Filtros
          </Button>
        </aside>
        {/* Productos y barra superior */}
        <section className="flex-1 px-4 sm:px-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 justify-between">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 w-full sm:w-auto">
              <Input
                type="text"
                placeholder="Buscar productos..."
                className="w-full sm:w-64 text-sm sm:text-base"
                value={filtros.buscar}
                onChange={handleBuscar}
              />
              <select
                className="border rounded px-3 py-2 text-sm sm:text-base"
                onChange={handleDestacados}
                value={filtros.destacados ? "Destacados" : "Todos"}
                aria-label="Filtrar por destacados"
              >
                <option value="Todos">Todos</option>
                <option value="Destacados">Destacados</option>
              </select>
            </div>
          </div>
          {/* Grid de productos */}
          {loading ? (
            <div className="text-center py-12 text-sm sm:text-base">Cargando productos...</div>
          ) : (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {productosFiltrados.map((producto) => {
                const enCarrito: CarritoItem | undefined = carrito.find((p: CarritoItem) => p.id === producto.id);
                const cantidadEnCarrito = enCarrito?.cantidad ?? 0;
                const stockDisponible = producto.stock - cantidadEnCarrito;
                
                // Log de depuración para ver el estado del producto
                console.log(`📦 Producto: ${producto.nombre}`, {
                  id: producto.id,
                  stock: producto.stock,
                  cantidadEnCarrito,
                  stockDisponible,
                  deshabilitado: stockDisponible <= 0
                });
                
                return (
                  <Card key={producto.id} className="relative flex flex-col">
                    <div className="h-48 flex items-center justify-center bg-gray-100 rounded-t-xl relative overflow-hidden">
                      {producto.image_url ? (
                        <Image
                          src={producto.image_url}
                          alt={producto.nombre}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <span className="text-gray-400 text-4xl">🖼️</span>
                      )}
                      {producto.destacado && (
                        <span className="absolute top-3 right-3 bg-black text-white text-xs px-3 py-1 rounded-full font-semibold z-10">
                          Destacado
                        </span>
                      )}
                      {producto.stock === 0 && (
                        <span className="absolute top-3 left-3 bg-red-600 text-white text-xs px-3 py-1 rounded-full font-semibold z-10">
                          Agotado
                        </span>
                      )}
                    </div>
                    <CardHeader>
                      <CardTitle className="font-bold text-lg mb-1">{producto.nombre}</CardTitle>
                      <CardDescription className="mb-2">{producto.desc}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-1 p-3 sm:p-6">
                      <div className="flex gap-2 mb-2 flex-wrap">
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-semibold">
                          {producto.categoria}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-auto mb-3">
                        <span className="font-bold text-base sm:text-lg">${producto.precio.toFixed(2)}</span>
                      </div>
                      <div className="flex flex-col xs:flex-row gap-2 mt-2">
                        <Button
                          className="flex items-center justify-center gap-2 bg-[#00a19a] text-white font-bold rounded-full px-4 sm:px-5 py-2 hover:bg-[#007973] transition text-xs sm:text-sm flex-1"
                          disabled={stockDisponible <= 0}
                          onClick={async () => {
                            const ok = await addToCarrito({
                              id: producto.id,
                              nombre: producto.nombre,
                              precio: producto.precio,
                              imagen: producto.image_url ?? "/Logo%20Thiart%20Tiktok.png",
                              cantidad: cantidadEnCarrito,
                              stock: producto.stock,
                              categoria: producto.categoria,
                              destacado: producto.destacado,
                            });
                            if (ok) {
                              showToast("Producto agregado al carrito ✅", true);
                            } else {
                              showToast("No hay suficiente stock ❌", false);
                            }
                          }}
                        >
                          <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden xs:inline">Añadir</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="text-xs sm:text-sm px-3 sm:px-4 py-2 flex-1"
                          onClick={() => router.push(`/tienda/productos/${producto.id}`)}
                        >
                          <span className="hidden xs:inline">Ver Detalles</span>
                          <span className="xs:hidden">Ver</span>
                        </Button>
                      </div>
                      {cantidadEnCarrito > 0 && (
                        <div className="mt-2 text-xs text-[#00a19a] font-bold text-center xs:text-left">
                          En carrito: {cantidadEnCarrito}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
