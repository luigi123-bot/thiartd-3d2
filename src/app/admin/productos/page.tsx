"use client";
import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import CreateProductModal from "~/app/tienda/productos/CreateProductModal";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export default function AdminProductosPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProductos = async () => {
    setLoading(true);
    const res = await fetch("/api/productos");
    const data = await res.json();
    setProductos(Array.isArray(data.productos) ? data.productos : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  return (
    <div className="p-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Productos</h1>
        <Button onClick={() => setModalOpen(true)}>Crear producto</Button>
      </div>
      <CreateProductModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onProductCreated={fetchProductos}
      />
      {loading ? (
        <div className="text-center py-8">Cargando productos...</div>
      ) : productos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay productos registrados.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {productos.map((producto) => (
            <Card key={producto.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <img
                    src="/Logo%20Thiart%20Tiktok.png"
                    alt="Logo producto"
                    className="h-12 w-12 rounded object-cover border"
                  />
                  <CardTitle>{producto.nombre}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-2 text-gray-700">{producto.descripcion}</div>
                <div className="mb-2 text-sm text-gray-500">
                  Categoría: {producto.categoria}
                </div>
                <div className="mb-2 text-sm text-gray-500">
                  Tamaño: {producto.tamano}
                </div>
                <div className="mb-2 text-sm text-gray-500">
                  Stock: {producto.stock}
                </div>
                <div className="font-bold text-lg text-[#007973]">
                  ${producto.precio}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
