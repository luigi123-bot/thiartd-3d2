"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { useToast } from "~/components/ui/use-toast";
import { useEffect } from "react";

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
  const [role, setRole] = useState<string>("cliente");
  const [rolesOptions, setRolesOptions] = useState<string[]>([]);
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
      const getLabelForValue = (val: string) => {
        const found = rolesOptions.find((rv) => rv.split("|")[1] === val);
        if (!found) return val;
        return found.split("|")[0];
      };
      const payload = { ...form, role, role_label: getLabelForValue(role) };
      console.log("Enviando body a /api/crear-usuario:", payload);
      const res = await fetch("/api/crear-usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
        setRole("cliente");
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

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const res = await fetch('/api/admin/roles');
        if (!res.ok) return setRolesOptions(['cliente','creador','admin']);
        const json = await res.json() as unknown;
        type RoleRow = {
          id?: string;
          key?: string;
          role?: string;
          name?: string;
          label?: string;
          title?: string;
          nombre?: string;
        };
        type RoleOption = { label: string; value: string };

        const maybe = (json as { roles?: unknown }).roles;
        const parsedRoles: RoleOption[] = [];
        if (Array.isArray(maybe)) {
          for (const item of maybe) {
            if (typeof item === 'object' && item !== null) {
              // support both normalized {id,label} from server and legacy rows
              const row = item as RoleRow & { id?: string; label?: string };
              const label = String(row.label ?? row.name ?? row.title ?? row.role ?? row.key ?? row.id ?? 'rol');
              const value = String(row.id ?? row.key ?? row.role ?? row.name ?? '');
              parsedRoles.push({ label, value });
            }
          }
        }

        if (parsedRoles.length === 0) {
          setRolesOptions(['cliente','creador','admin']);
        } else {
          setRolesOptions(parsedRoles.map((r) => `${r.label}|${r.value}`));
          if (role === 'cliente' && parsedRoles[0]) setRole(parsedRoles[0].value);
        }
      } catch {
        setRolesOptions(['cliente','creador','admin']);
      }
    };
    if (open) void loadRoles();
  }, [open, role]);

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
          <div>
            <label className="text-sm font-medium">Rol</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border rounded px-3 py-2 mt-1"
            >
              {rolesOptions.length === 0 ? (
                <>
                  <option value="cliente">Cliente</option>
                  <option value="creador">Creador</option>
                  <option value="admin">Admin</option>
                </>
              ) : (
                  rolesOptions.map((rv) => {
                    const [labelRaw, value] = rv.split("|");
                    const label = labelRaw ?? "";
                    return <option key={value} value={value}>{label}</option>;
                  })
              )}
            </select>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creando..." : "Crear usuario"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}