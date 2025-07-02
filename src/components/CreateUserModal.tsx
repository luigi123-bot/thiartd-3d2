"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { useToast } from "~/components/ui/use-toast";

interface CreateUserModalProps {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  onUserCreated?: () => void;
}

export function CreateUserModal({ open, onOpenChangeAction, onUserCreated }: CreateUserModalProps) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ nombre?: string; email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!form.nombre.trim()) newErrors.nombre = "El nombre es obligatorio.";
    if (!form.email.trim()) newErrors.email = "El correo es obligatorio.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Correo inválido.";
    if (!form.password) newErrors.password = "La contraseña es obligatoria.";
    else if (form.password.length < 6) newErrors.password = "Mínimo 6 caracteres.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      console.log("Enviando body a /api/crear-usuario:", form);
      const res = await fetch("/api/crear-usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      let data: { error?: string } = {};
      try {
        data = (await res.json()) as { error?: string };
      } catch {
        data = {};
      }
      console.log("Respuesta de /api/crear-usuario:", data);

      setLoading(false);
      if (res.ok) {
        toast({ title: "Usuario creado", description: "El usuario fue creado correctamente." });
        setForm({ nombre: "", email: "", password: "" });
        setErrors({});
        onOpenChangeAction(false);
        onUserCreated?.();
      } else {
        toast({
          title: "Error",
          description: data.error ?? "No se pudo crear el usuario.",
          variant: "destructive",
        });
      }
    } catch {
      setLoading(false);
      toast({ title: "Error", description: "Error de red o inesperado.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear usuario</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div>
            <Input
              name="nombre"
              placeholder="Nombre"
              value={form.nombre}
              onChange={handleChange}
              required
            />
            {errors.nombre && <span className="text-xs text-red-600">{errors.nombre}</span>}
          </div>
          <div>
            <Input
              name="email"
              placeholder="Correo electrónico"
              value={form.email}
              onChange={handleChange}
              type="email"
              required
            />
            {errors.email && <span className="text-xs text-red-600">{errors.email}</span>}
          </div>
          <div>
            <Input
              name="password"
              placeholder="Contraseña"
              value={form.password}
              onChange={handleChange}
              type="password"
              required
            />
            {errors.password && <span className="text-xs text-red-600">{errors.password}</span>}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creando..." : "Crear usuario"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}