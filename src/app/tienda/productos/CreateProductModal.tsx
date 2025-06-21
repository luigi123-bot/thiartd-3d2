"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";

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

export default function CreateProductModal({ open, onOpenChange, onProductCreated, product }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductCreated?: () => void;
  product?: any;
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
  });
  const [loading, setLoading] = useState(false);

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
      });
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
      });
    }
  }, [product, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let res;
    if (product && product.id) {
      // Editar producto
      res = await fetch(`/api/productos/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      // Crear producto
      res = await fetch("/api/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setLoading(false);
    if (res.ok) {
      onOpenChange(false);
      onProductCreated?.();
    } else {
      const data = await res.json();
      console.error("Error al guardar producto:", data.error);
      alert("Error al guardar producto: " + (data.error || "Error desconocido"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
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
          <Button type="submit" className="w-full" disabled={loading}>
            {product ? "Actualizar producto" : "Guardar producto"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}