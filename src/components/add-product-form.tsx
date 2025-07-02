"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";

export interface ProductFormValues {
  nombre: string;
  descripcion: string;
  precio: number;
  tamaño: string;
  stock: number;
  categoria: string;
  destacado: boolean;
  detalles?: string;
}

interface AddProductFormProps {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  onSuccess?: (values: ProductFormValues) => Promise<void>;
  onSubmit?: (values: ProductFormValues) => void;
  initialValues?: ProductFormValues;
  isEditing?: boolean;
}

export function AddProductForm({
  open,
  onOpenChangeAction,
  onSuccess,
  onSubmit,
  initialValues,
  isEditing,
}: AddProductFormProps) {
  const [form, setForm] = useState<ProductFormValues>({
    nombre: "",
    descripcion: "",
    precio: 0,
    tamaño: "",
    stock: 0,
    categoria: "",
    destacado: false,
    detalles: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialValues) setForm(initialValues);
    else setForm({
      nombre: "",
      descripcion: "",
      precio: 0,
      tamaño: "",
      stock: 0,
      categoria: "",
      destacado: false,
      detalles: "",
    });
  }, [initialValues, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSwitch = (checked: boolean) => {
    setForm((prev) => ({ ...prev, destacado: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (onSuccess) {
      await onSuccess(form);
    } else if (onSubmit) {
      onSubmit(form);
    }
    setLoading(false);
    onOpenChangeAction(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar producto" : "Agregar producto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <Input
            name="nombre"
            placeholder="Nombre del producto"
            value={form.nombre}
            onChange={handleChange}
            required
          />
          <Textarea
            name="descripcion"
            placeholder="Descripción"
            value={form.descripcion}
            onChange={handleChange}
            required
          />
          <div className="flex gap-4">
            <Input
              name="precio"
              type="number"
              placeholder="Precio"
              value={form.precio}
              onChange={handleChange}
              min={0}
              step="0.01"
              required
            />
            <Input
              name="stock"
              type="number"
              placeholder="Stock"
              value={form.stock}
              onChange={handleChange}
              min={0}
              required
            />
          </div>
          <div className="flex gap-4">
            <Input
              name="tamaño"
              placeholder="Tamaño"
              value={form.tamaño}
              onChange={handleChange}
              required
            />
            <Input
              name="categoria"
              placeholder="Categoría"
              value={form.categoria}
              onChange={handleChange}
              required
            />
          </div>
          <Textarea
            name="detalles"
            placeholder="Detalles adicionales"
            value={form.detalles}
            onChange={handleChange}
          />
          <div className="flex items-center gap-2">
            <Switch
              checked={form.destacado}
              onCheckedChange={handleSwitch}
              id="destacado"
            />
            <label htmlFor="destacado" className="text-sm">Destacado</label>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {isEditing ? "Guardar cambios" : "Agregar producto"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
