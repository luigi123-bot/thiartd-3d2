"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";

export default function ContactModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [form, setForm] = useState({ nombre: "", email: "", mensaje: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    const res = await fetch("/api/mensajes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      setSuccess(true);
      setForm({ nombre: "", email: "", mensaje: "" });
    } else {
      alert("Error al enviar el mensaje");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contáctanos</DialogTitle>
        </DialogHeader>
        {success ? (
          <div className="text-green-600 text-center py-4">¡Mensaje enviado correctamente!</div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            <Input name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} required />
            <Input name="email" placeholder="Correo electrónico" value={form.email} onChange={handleChange} type="email" required />
            <Textarea name="mensaje" placeholder="Mensaje" value={form.mensaje} onChange={handleChange} required />
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Enviando..." : "Enviar mensaje"}</Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
