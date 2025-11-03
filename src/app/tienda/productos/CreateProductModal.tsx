"use client";
import { useState, useEffect, Suspense } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { ProductImageUpload, ProductModel3DUpload } from "~/components/FileUploadWidget";
import { Model3DViewer, Model3DViewerLoading } from "~/components/Model3DViewer";
import Image from "next/image";
import { FiX } from "react-icons/fi";

const categorias = [
  "Abstracto",
  "Clásico",
  "Moderno",
  "Arquitectura",
  "Naturaleza",
  "Decoración",
  "Personalizado",
];

const tamanos = ["Pequeño", "Mediano", "Grande", "Personalizado"];

interface Product {
  id?: string | number;
  nombre: string;
  precio: number;
  descripcion: string;
  tamano: string;
  categoria: string;
  stock: number;
  detalles: string;
  destacado: boolean;
  image_url?: string;
  model_url?: string;
}

export default function CreateProductModal({ open, onOpenChangeAction, onProductCreated, product }: {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  onProductCreated?: () => void;
  product?: Product;
}) {
  const [form, setForm] = useState({
    nombre: "",
    precio: 0,
    descripcion: "",
    tamano: tamanos[0],
    categoria: categorias[0],
    stock: 0,
    detalles: "",
    destacado: false,
    image_url: "",
    model_url: "",
  });
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [modelUrl, setModelUrl] = useState<string>("");

  // Sincronizar form con product si existe
  useEffect(() => {
    if (product) {
      setForm({
        nombre: product.nombre || "",
        precio: product.precio || 0,
        descripcion: product.descripcion || "",
        tamano: product.tamano || tamanos[0],
        categoria: product.categoria || categorias[0],
        stock: product.stock || 0,
        detalles: product.detalles || "",
        destacado: product.destacado || false,
        image_url: product.image_url ?? "",
        model_url: product.model_url ?? "",
      });
      setImageUrl(product.image_url ?? "");
      setModelUrl(product.model_url ?? "");
    } else {
      setForm({
        nombre: "",
        precio: 0,
        descripcion: "",
        tamano: tamanos[0],
        categoria: categorias[0],
        stock: 0,
        detalles: "",
        destacado: false,
        image_url: "",
        model_url: "",
      });
      setImageUrl("");
      setModelUrl("");
    }
  }, [product, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Incluir las URLs de imagen y modelo 3D en el formulario
    const formData = {
      ...form,
      image_url: imageUrl || form.image_url,
      model_url: modelUrl || form.model_url,
    };
    
    let res;
    if (product?.id) {
      // Editar producto
      res = await fetch(`/api/productos/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
    } else {
      // Crear producto
      res = await fetch("/api/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
    }
    setLoading(false);
    if (res.ok) {
      onOpenChangeAction(false);
      onProductCreated?.();
    } else {
      const data = (await res.json()) as { error?: string };
      console.error("Error al guardar producto:", data.error);
      alert("Error al guardar producto: " + (data.error ?? "Error desconocido"));
    }
  };

  const handleRemoveImage = () => {
    setImageUrl("");
    setForm({ ...form, image_url: "" });
  };

  const handleRemoveModel = () => {
    setModelUrl("");
    setForm({ ...form, model_url: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Editar producto" : "Añadir nuevo producto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <Input
            name="nombre"
            placeholder="Nombre del producto"
            value={form.nombre}
            onChange={handleChange}
            required
          />
          <Input
            name="precio"
            type="number"
            placeholder="Precio (€)"
            value={form.precio}
            onChange={handleChange}
            min={0}
            required
          />
          <Textarea
            name="descripcion"
            placeholder="Descripción del producto"
            value={form.descripcion}
            onChange={handleChange}
            required
          />
          <select
            name="tamano"
            value={form.tamano}
            onChange={handleChange}
            className="border rounded px-3 py-2"
            aria-label="Tamaño"
          >
            {tamanos.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            name="categoria"
            value={form.categoria}
            onChange={handleChange}
            className="border rounded px-3 py-2"
            aria-label="Categoría"
          >
            {categorias.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <Input
            name="stock"
            type="number"
            placeholder="Stock"
            value={form.stock}
            onChange={handleChange}
            min={0}
            required
          />
          <Textarea
            name="detalles"
            placeholder="Detalles (opcional)"
            value={form.detalles}
            onChange={handleChange}
          />
          
          {/* Sección de imagen del producto */}
          <div className="border-t pt-4 mt-2">
            <h3 className="text-sm font-semibold mb-3">Imagen del producto</h3>
            
            {/* Mostrar imagen actual si existe */}
            {imageUrl && (
              <div className="relative mb-4 rounded-lg border border-gray-200 overflow-hidden">
                <Image
                  src={imageUrl}
                  alt="Imagen del producto"
                  width={400}
                  height={300}
                  className="w-full h-auto object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition"
                  title="Eliminar imagen"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {/* Widget de subida de imagen */}
            {!imageUrl && (
              <ProductImageUpload
                productId={product?.id?.toString() ?? "new"}
                onUploadComplete={(url) => {
                  setImageUrl(url);
                  setForm({ ...form, image_url: url });
                }}
              />
            )}
          </div>

          {/* Sección de modelo 3D */}
          <div className="border-t pt-4 mt-2">
            <h3 className="text-sm font-semibold mb-3">Modelo 3D (opcional)</h3>
            <p className="text-xs text-gray-500 mb-3">
              Sube un archivo GLB, GLTF o STL para mostrar un visor 3D interactivo del producto
            </p>
            
            {/* Mostrar modelo 3D actual si existe */}
            {modelUrl && (
              <div className="space-y-3">
                <Suspense fallback={<Model3DViewerLoading />}>
                  <Model3DViewer modelUrl={modelUrl} height="300px" />
                </Suspense>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRemoveModel}
                  className="w-full"
                >
                  <FiX className="mr-2" />
                  Eliminar modelo 3D
                </Button>
              </div>
            )}
            
            {/* Widget de subida de modelo 3D */}
            {!modelUrl && (
              <ProductModel3DUpload
                productId={product?.id?.toString() ?? "new"}
                onUploadComplete={(url) => {
                  setModelUrl(url);
                  setForm({ ...form, model_url: url });
                }}
              />
            )}
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {product ? "Actualizar producto" : "Guardar producto"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}