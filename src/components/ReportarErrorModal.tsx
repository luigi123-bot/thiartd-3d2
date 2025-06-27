"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "TU_SUPABASE_URL";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "TU_SUPABASE_ANON_KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

const CATEGORIAS = ["Error", "Sugerencia", "Consulta", "Otro"];

export default function ReportarErrorModal({
  open,
  onOpenChange,
  clienteId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clienteId: string;
}) {
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    categoria: CATEGORIAS[0],
    imagen: null as File | null,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (e.target.name === "imagen" && e.target instanceof HTMLInputElement && e.target.files) {
      setForm({ ...form, imagen: e.target.files[0] ?? null });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let imagen_url = "";
    if (form.imagen) {
      // Subir imagen a Supabase Storage (bucket: tickets)
      const fileExt = form.imagen.name.split(".").pop();
      const fileName = `ticket-${clienteId}-${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from("tickets")
        .upload(fileName, form.imagen);
      if (!error && data) {
        imagen_url = supabase.storage.from("tickets").getPublicUrl(fileName).data.publicUrl;
      }
    }
    // Guardar ticket en la base de datos de Supabase con la URL de la imagen
    await supabase.from("tickets").insert([
      {
        usuario_id: clienteId,
        titulo: form.titulo,
        descripcion: form.descripcion,
        categoria: form.categoria,
        imagen_url: imagen_url,
        estado: "abierto",
        created_at: new Date().toISOString(),
      },
    ]);
    setLoading(false);
    onOpenChange(false);
    setForm({ titulo: "", descripcion: "", categoria: CATEGORIAS[0], imagen: null });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[10001]">
        <DialogHeader>
          <DialogTitle>Reportar un problema</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="font-medium">Título</label>
          <Input
            name="titulo"
            className="border rounded px-3 py-2"
            placeholder="Título del problema"
            value={form.titulo}
            onChange={handleChange}
            required
          />
          <label className="font-medium">Descripción</label>
          <textarea
            name="descripcion"
            className="border rounded px-3 py-2 min-h-[80px]"
            placeholder="Describe el problema o sugerencia"
            value={form.descripcion}
            onChange={handleChange}
            required
          />
          <label className="font-medium" htmlFor="categoria-select">Categoría</label>
          <select
            id="categoria-select"
            name="categoria"
            className="border rounded px-3 py-2"
            value={form.categoria}
            onChange={handleChange}
          >
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <label className="font-medium">Imagen (opcional)</label>
          <Input
            name="imagen"
            type="file"
            accept="image/*"
            className="rounded"
            onChange={handleChange}
          />
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Enviar ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
