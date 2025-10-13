"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
    const nuevoCarrito = [...carrito];
    const idx = nuevoCarrito.findIndex((p) => p.id === producto.id);
    let added = false;
    if (idx >= 0 && nuevoCarrito[idx]) {
      if (nuevoCarrito[idx].cantidad < nuevoCarrito[idx].stock) {
        nuevoCarrito[idx].cantidad += 1;
        added = true;
      }
    } else {
      if (producto.stock > 0) {
        nuevoCarrito.push({ ...producto, cantidad: 1 });
        added = true;
      }
    }
    if (added) {
      setCarrito(nuevoCarrito);
      localStorage.setItem("carrito", JSON.stringify(nuevoCarrito));
      console.log("Producto guardado en carrito (localStorage):", producto);
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
    <div className="bg-white min-h-screen px-8 py-8">
      {/* Botón para abrir modal */}
      <div className="flex justify-end mb-6">
        <Button
          onClick={() => setModalOpen(true)}
          className="bg-[#00a19a] text-white px-5 py-2 rounded font-semibold hover:bg-[#007973] transition"
        >
          Añadir nuevo producto
        </Button>
      </div>
      <CreateProductModal open={modalOpen} onOpenChangeAction={setModalOpen} onProductCreated={fetchProductos} />
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4">
        <Link href="/" className="hover:text-black">Inicio</Link>
        <span>/</span>
        <span className="font-medium text-black">Productos</span>
      </div>
      <h1 className="text-4xl font-extrabold mb-1 text-[#222] mt-4">Nuestros Productos</h1>
      <p className="mb-8 text-gray-500 text-lg">
        Explora nuestra colección de productos 3D en diferentes tamaños
      </p>
      <div className="flex gap-8">
        {/* Filtros */}
        <aside className="w-64 min-w-[220px]">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Categorías</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              {categorias.map((cat) => (
                <label key={cat} className="flex items-center gap-2 text-gray-700">
                  <input
                    type="checkbox"
                    checked={filtros.categoria.includes(cat)}
                    onChange={() => handleCheckbox("categoria", cat)}
                  />
                  {cat}
                </label>
              ))}
            </CardContent>
          </Card>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Tamaño</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              {tamanos.map((t) => (
                <label key={t} className="flex items-center gap-2 text-gray-700">
                  <input
                    type="checkbox"
                    checked={filtros.tamano.includes(t)}
                    onChange={() => handleCheckbox("tamano", t)}
                  />
                  {t}
                </label>
              ))}
            </CardContent>
          </Card>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Precio</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              {rangosPrecio.map((r) => (
                <label key={r.label} className="flex items-center gap-2 text-gray-700">
                  <input
                    type="checkbox"
                    checked={filtros.precio.includes(r.label)}
                    onChange={() => handleCheckbox("precio", r.label)}
                  />
                  {r.label}
                </label>
              ))}
            </CardContent>
          </Card>
          <Button
            className="w-full mt-2"
            variant="secondary"
            onClick={limpiarFiltros}
          >
            Limpiar Filtros
          </Button>
        </aside>
        {/* Productos y barra superior */}
        <section className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 justify-between">
            <div className="flex gap-2 items-center">
              <Input
                type="text"
                placeholder="Buscar productos..."
                className="w-64"
                value={filtros.buscar}
                onChange={handleBuscar}
              />
              <select
                className="border rounded px-3 py-2 text-base"
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
            <div className="text-center py-12">Cargando productos...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {productosFiltrados.map((producto) => {
                const enCarrito: CarritoItem | undefined = carrito.find((p: CarritoItem) => p.id === producto.id);
                const cantidadEnCarrito = enCarrito?.cantidad ?? 0;
                const stockDisponible = producto.stock - cantidadEnCarrito;
                return (
                  <Card key={producto.id} className="relative flex flex-col">
                    <div className="h-48 flex items-center justify-center bg-gray-200 rounded-t-xl">
                      <span className="text-gray-400 text-4xl">🖼️</span>
                      {producto.destacado && (
                        <span className="absolute top-3 right-3 bg-black text-white text-xs px-3 py-1 rounded-full font-semibold">
                          Destacado
                        </span>
                      )}
                      {producto.stock === 0 && (
                        <span className="absolute top-3 left-3 bg-red-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                          Agotado
                        </span>
                      )}
                    </div>
                    <CardHeader>
                      <CardTitle className="font-bold text-lg mb-1">{producto.nombre}</CardTitle>
                      <CardDescription className="mb-2">{producto.desc}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-1">
                      <div className="flex gap-2 mb-2">
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-semibold">
                          {producto.categoria}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="font-bold text-lg">${producto.precio.toFixed(2)}</span>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          className="flex items-center gap-2 bg-[#00a19a] text-white font-bold rounded-full px-5 py-2 hover:bg-[#007973] transition"
                          disabled={stockDisponible <= 0}
                          onClick={async () => {
                            const ok = await addToCarrito({
                              id: producto.id,
                              nombre: producto.nombre,
                              precio: producto.precio,
                              imagen: "/Logo%20Thiart%20Tiktok.png",
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
                          <ShoppingCart className="w-4 h-4" />
                          Añadir
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/tienda/productos/${producto.id}`)}
                        >
                          Ver Detalles
                        </Button>
                      </div>
                      {cantidadEnCarrito > 0 && (
                        <div className="mt-2 text-xs text-[#00a19a] font-bold">
                          Cantidad en carrito: {cantidadEnCarrito}
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

// --- CarritoProvider, useCarrito, showToast, etc. ---