"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
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

export default function ProductosTiendaPage() {
  const [productos, setProductos] = useState<any[]>([]);
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

  // Define fetchProductos ANTES de usarla
  const fetchProductos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/productos");
      const data = await res.json();
      setProductos(Array.isArray(data.productos) ? data.productos : []);
    } catch (error) {
      setProductos([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProductos();
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
      <CreateProductModal open={modalOpen} onOpenChange={setModalOpen} onProductCreated={fetchProductos} />
      {/* Breadcrumb */}
      <div className="flex gap-2 text-gray-500 mb-8">
        <a href="/" className="hover:text-black">Inicio</a>
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
              {productosFiltrados.map((producto) => (
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
                        className="flex items-center gap-2"
                        disabled={producto.stock === 0}
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}