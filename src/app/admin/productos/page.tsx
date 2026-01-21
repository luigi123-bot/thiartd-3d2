"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import CreateProductModal from "~/app/tienda/productos/CreateProductModal";
import { Card } from "~/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog";
import Loader from "~/components/providers/UiProvider";
import { useUser } from "@clerk/nextjs";
import { Package, Star, AlertTriangle, Layers, ChevronDown, Search, Filter, BadgeDollarSign } from "lucide-react";
import clsx from "clsx";
import { createClient } from "@supabase/supabase-js";
import { ProductDetailModal } from "../../../components/ProductDetailModal";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "TU_SUPABASE_URL";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "TU_SUPABASE_ANON_KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

const CATEGORIAS = ["Todas", "Moderno", "Pequeño", "Sin Stock", "Destacados"];

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  tamano: string;
  stock: number;
  precio: number;
  destacado: boolean;
  image_url?: string;
}

export default function AdminProductosPage() {
  const { user, isLoaded } = useUser();
  const [modalOpen, setModalOpen] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editProduct, setEditProduct] = useState<Producto | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Producto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [categoria, setCategoria] = useState("Todas");
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState("nombre");
  const [modalDetalle, setModalDetalle] = useState<Producto | null>(null);
  const [pagina, setPagina] = useState(1);
  const productosPorPagina = 12; 

  // Estadísticas para las burbujas
  const totalProductos = productos.length;
  const destacados = productos.filter((p) => p.destacado).length;
  const stockTotal = productos.reduce((acc, p) => acc + (p.stock || 0), 0);
  const sinStock = productos.filter((p) => p.stock === 0).length;

  // Validación de rol
  const isAdmin = user?.publicMetadata?.role === "admin";

  const fetchProductos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("productos")
      .select("*")
      .order("id", { ascending: false });
    setProductos(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) void fetchProductos();
  }, [isAdmin]);

  const handleDelete = async () => {
    if (!deleteProduct) return;
    setDeleting(true);
    await supabase.from("productos").delete().eq("id", deleteProduct.id);
    setDeleting(false);
    setDeleteProduct(null);
    void fetchProductos();
  };

  const handleProductCreated = async () => {
    await fetchProductos();
  };

  // Nueva función para alternar destacado
  const toggleDestacado = async (producto: Producto) => {
    const { error } = await supabase
      .from("productos")
      .update({ destacado: !producto.destacado })
      .eq("id", producto.id);
    if (!error) {
      setProductos((prev) =>
        prev.map((p) =>
          p.id === producto.id ? { ...p, destacado: !p.destacado } : p
        )
      );
    }
    // Podrías mostrar un mensaje de error si error !== null
  };

  // Ordena los productos: los más nuevos primero
  const productosOrdenados = [...productos].sort((a, b) => b.id - a.id);

  // Filtros y orden
  let productosFiltrados = productosOrdenados.filter((p) => {
    const matchCategoria =
      categoria === "Todas"
        ? true
        : categoria === "Sin Stock"
        ? p.stock === 0
        : categoria === "Destacados"
        ? p.destacado
        : p.categoria === categoria;
    const matchBusqueda = p.nombre?.toLowerCase().includes(busqueda.toLowerCase());
    return matchCategoria && matchBusqueda;
  });

  productosFiltrados = [...productosFiltrados].sort((a, b) => {
    if (orden === "stock") return b.stock - a.stock;
    if (orden === "precio") return b.precio - a.precio;
    return a.nombre.localeCompare(b.nombre);
  });

  // Paginación
  const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);
  const productosPagina = productosFiltrados.slice(
    (pagina - 1) * productosPorPagina,
    pagina * productosPorPagina
  );

  // Colores de stock
  const getStockColor = (stock: number) =>
    stock === 0
      ? "bg-red-100 text-red-600"
      : stock <= 5
      ? "bg-yellow-100 text-yellow-700"
      : "bg-green-100 text-green-700";

  if (!isLoaded) return <Loader />;
  if (!isAdmin)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-2xl font-bold mb-2">Acceso denegado</div>
        <div className="text-gray-500">No tienes permisos para ver esta página.</div>
      </div>
    );

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#111827] font-[Inter,Poppins,sans-serif]">
      {/* Encabezado principal y métricas */}
      <main className="flex-1 p-2 sm:p-4 md:p-10">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Gestión de Productos</h1>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-10">
          <MetricCard
            icon={<Package className="w-6 h-6 text-blue-500" />}
            label="Total productos"
            value={totalProductos}
            bg="bg-blue-50"
          />
          <MetricCard
            icon={<AlertTriangle className="w-6 h-6 text-yellow-500" />}
            label="Sin stock"
            value={sinStock}
            bg="bg-yellow-50"
          />
          <MetricCard
            icon={<Star className="w-6 h-6 text-pink-500" />}
            label="Destacados"
            value={destacados}
            bg="bg-pink-50"
          />
          <MetricCard
            icon={<Layers className="w-6 h-6 text-green-500" />}
            label="Stock total"
            value={stockTotal}
            bg="bg-green-50"
          />
        </div>
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="flex flex-wrap gap-2">
            {CATEGORIAS.map((cat) => (
              <button
                key={cat}
                className={clsx(
                  "px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-medium border border-transparent transition-all",
                  categoria === cat
                    ? "bg-black text-white shadow"
                    : "bg-gray-100 text-[#111827] hover:bg-gray-200"
                )}
                onClick={() => setCategoria(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar producto..."
                className="pl-9 pr-3 py-2 rounded-full border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00a19a] text-sm w-full sm:w-56"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="relative w-full sm:w-auto">
              <Filter className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
              <select
                aria-label="Ordenar productos por"
                className="pl-9 pr-6 py-2 rounded-full border border-gray-200 bg-white shadow-sm text-sm w-full sm:w-40"
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
              >
                <option value="nombre">Nombre</option>
                <option value="stock">Stock</option>
                <option value="precio">Precio</option>
              </select>
            </div>
            <Button onClick={() => setModalOpen(true)} className="rounded-full font-semibold w-full sm:w-auto">
              Crear producto
            </Button>
          </div>
        </div>
        {/* Listado de productos */}
        {loading ? (
          <Loader />
        ) : productosFiltrados.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No hay productos registrados.</div>
        ) : (
          <>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-8 sm:gap-10 productos-grid"
            >
              {productosPagina.map((producto) => (
                <Card
                  key={producto.id}
                  className="flex flex-col items-center shadow-sm border border-gray-100 rounded-xl bg-white animate-fade-in h-auto max-w-xs mx-auto p-4"
                >
                  {/* Imagen centrada */}
                  <div className="flex items-center justify-center w-full mb-4">
                    <Image
                      src={producto.image_url ?? "/Logo%20Thiart%20Tiktok.png"}
                      alt={producto.nombre}
                      width={120}
                      height={120}
                      className="object-cover w-24 h-24 rounded-xl shadow"
                    />
                  </div>
                  {/* Título + estrella */}
                  <div className="flex items-center justify-center gap-2 w-full mb-1">
                    <span className="text-lg font-bold text-center">{producto.nombre}</span>
                    {producto.destacado && <Star className="w-5 h-5 text-yellow-400" />}
                  </div>
                  {/* Descripción */}
                  <div className="text-gray-500 text-sm text-center mb-2 line-clamp-2">{producto.descripcion}</div>
                  {/* Chips de categoría */}
                  <div className="flex flex-wrap justify-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{producto.categoria}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">{producto.tamano}</span>
                    {producto.stock === 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">Sin stock</span>
                    )}
                  </div>
                  {/* Stock y precio alineados */}
                  <div className="flex items-center justify-between w-full mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStockColor(producto.stock)}`}>
                      <span className="inline-flex items-center gap-1">
                        <Layers className="w-4 h-4" /> {producto.stock}
                      </span>
                    </span>
                    <span className="flex items-center gap-1 font-bold text-base text-[#00a19a]">
                      <BadgeDollarSign className="w-5 h-5" /> ${producto.precio}
                    </span>
                  </div>
                  {/* Botones secundarios centrados */}
                  <div className="flex flex-col w-full gap-2">
                    <div className="flex justify-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full text-xs px-4"
                        onClick={() => setModalDetalle(producto)}
                      >
                        Ver más
                        <ChevronDown className="w-4 h-4 ml-1" />
                      </Button>
                      <Button
                        size="sm"
                        variant={producto.destacado ? "secondary" : "outline"}
                        className="rounded-full text-xs px-4"
                        onClick={() => toggleDestacado(producto)}
                      >
                        {producto.destacado ? "Quitar destacado" : "Destacar"}
                      </Button>
                    </div>
                    <div className="flex justify-between gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full text-xs px-4 w-1/2"
                        onClick={() => setEditProduct(producto)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="rounded-full text-xs px-4 w-1/2"
                        onClick={() => setDeleteProduct(producto)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full px-3"
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                >
                  Anterior
                </Button>
                {Array.from({ length: totalPaginas }).map((_, idx) => (
                  <button
                    key={idx}
                    className={clsx(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold",
                      pagina === idx + 1
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                    onClick={() => setPagina(idx + 1)}
                  >
                    {idx + 1}
                  </button>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full px-3"
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={pagina === totalPaginas}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </>
        )}
        {/* Modal crear/editar */}
        <CreateProductModal
          open={modalOpen || !!editProduct}
          onOpenChangeAction={(open: boolean) => {
            setModalOpen(open);
            if (!open) setEditProduct(null);
          }}
          onProductCreated={handleProductCreated}
          product={
            editProduct
              ? {
                  ...editProduct,
                  detalles: "",
                  destacado: false,
                }
              : undefined
          }
        />
        {/* Modal eliminar */}
        <Dialog open={!!deleteProduct} onOpenChange={v => { if (!v) setDeleteProduct(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Eliminar producto?</DialogTitle>
            </DialogHeader>
            <div>¿Estás seguro de que deseas eliminar <b>{deleteProduct?.nombre}</b>?</div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setDeleteProduct(null)} disabled={deleting}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>{deleting ? "Eliminando..." : "Eliminar"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Modal ver más */}
        <ProductDetailModal
          open={!!modalDetalle}
          onOpenChange={v => { if (!v) setModalDetalle(null); }}
          producto={modalDetalle}
          getStockColor={getStockColor}
        />
        {/* Animaciones */}
        <style jsx global>{`
          .animate-fade-in {
            animation: fadeInCard 0.6s cubic-bezier(.4,0,.2,1);
          }
          @keyframes fadeInCard {
            from { opacity: 0; transform: translateY(24px);}
            to { opacity: 1; transform: translateY(0);}
          }
          .animate-fadeIn {
            animation: fadeInModal 0.4s cubic-bezier(.4,0,.2,1);
          }
          @keyframes fadeInModal {
            from { opacity: 0; transform: translateY(32px) scale(0.98);}
            to { opacity: 1; transform: translateY(0) scale(1);}
          }
        `}</style>
      </main>
      {/* Si tienes un Footer global, se unirá automáticamente por el min-h-screen y flex-col */}
    </div>
  );
}

// Card de métrica
function MetricCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: number; bg: string }) {
  return (
    <Card className={`flex flex-col items-center py-6 px-4 border-0 shadow-sm rounded-xl ${bg}`}>
      <div className="mb-2">{icon}</div>
      <div className="text-3xl font-bold text-[#111827]">{value}</div>
      <div className="text-gray-500 text-sm font-medium">{label}</div>
    </Card>
  );
}