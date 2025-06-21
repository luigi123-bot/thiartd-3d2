"use client";
import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import CreateProductModal from "~/app/tienda/productos/CreateProductModal";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { createClient } from "@supabase/supabase-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "TU_SUPABASE_URL";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "TU_SUPABASE_ANON_KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AdminProductosPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editProduct, setEditProduct] = useState<any | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProductos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("productos")
      .select("*")
      .order("id", { ascending: false });
    setProductos(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  const handleDelete = async () => {
    if (!deleteProduct) return;
    setDeleting(true);
    await supabase.from("productos").delete().eq("id", deleteProduct.id);
    setDeleting(false);
    setDeleteProduct(null);
    fetchProductos();
  };

  return (
    <div className="p-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Productos</h1>
        <Button onClick={() => setModalOpen(true)}>Crear producto</Button>
      </div>
      <CreateProductModal
        open={modalOpen || !!editProduct}
        onOpenChange={(open: boolean) => {
          setModalOpen(open);
          if (!open) setEditProduct(null);
        }}
        onProductCreated={fetchProductos}
        product={editProduct}
      />
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
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" onClick={() => setEditProduct(producto)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setDeleteProduct(producto)}>
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
