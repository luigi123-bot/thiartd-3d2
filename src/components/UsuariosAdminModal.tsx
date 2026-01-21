"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  role: string;
}

interface UsuariosApiResponse {
  usuarios: Usuario[];
  error?: string;
}

export default function UsuariosAdminModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [actualizando, setActualizando] = useState<string | null>(null);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/usuarios");
      const data = (await res.json()) as UsuariosApiResponse;
      setUsuarios(Array.isArray(data.usuarios) ? data.usuarios : []);
    } catch {
      setUsuarios([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) void fetchUsuarios();
  }, [open]);

  const cambiarRol = async (email: string, role: string) => {
    setActualizando(email);
    await fetch("/api/admin/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    await fetchUsuarios();
    setActualizando(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gestión de Usuarios y Roles</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="text-center py-8">Cargando usuarios...</div>
        ) : (
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">Nombre</th>
                <th className="p-2">Email</th>
                <th className="p-2">Rol</th>
                <th className="p-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b">
                  <td className="p-2">{u.nombre}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2 font-bold">{u.role}</td>
                  <td className="p-2">
                    <Button
                      size="sm"
                      variant={u.role === "admin" ? "secondary" : "default"}
                      disabled={actualizando === u.email}
                      onClick={() => cambiarRol(u.email, u.role === "admin" ? "user" : "admin")}
                    >
                      {actualizando === u.email ? "Actualizando..." : u.role === "admin" ? "Quitar admin" : "Asignar admin"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DialogContent>
    </Dialog>
  );
}
