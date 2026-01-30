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
  const [rolesOptions, setRolesOptions] = useState<{ label: string; id: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [actualizando, setActualizando] = useState<string | null>(null);
  const [pendingRoles, setPendingRoles] = useState<Record<string, string>>({});

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/usuarios");
      const data = (await res.json()) as UsuariosApiResponse;
      setUsuarios(Array.isArray(data.usuarios) ? data.usuarios : []);
        // initialize pending roles map
        const map: Record<string, string> = {};
        (Array.isArray(data.usuarios) ? data.usuarios : []).forEach((u) => {
          map[u.email] = u.role;
        });
        setPendingRoles(map);
    } catch {
      setUsuarios([]);
    }
    setLoading(false);
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/admin/roles');
      if (!res.ok) return setRolesOptions([]);
      const json = await res.json() as unknown;
      const maybe = (json as { roles?: unknown }).roles;
      if (Array.isArray(maybe)) {
        const mapped = maybe.map((r) => {
          const obj = r as { id?: string; label?: string; raw?: Record<string, unknown> };
          const label =
            typeof obj.label === "string" ? obj.label
            : typeof obj.raw?.nombre === "string" ? obj.raw.nombre
            : typeof obj.raw?.name === "string" ? obj.raw.name
            : typeof obj.raw?.role === "string" ? obj.raw.role
            : typeof obj.id === "string" ? obj.id
            : '';
          const id = String(obj.id ?? '');
          return { label, id };
        });
        setRolesOptions(mapped);
      }
    } catch {
      setRolesOptions([]);
    }
  };

  useEffect(() => {
    if (open) void fetchUsuarios();
    if (open) void fetchRoles();
  }, [open]);

  const cambiarRol = async (email: string, role: string) => {
    setActualizando(email);
    try {
      await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      await fetchUsuarios();
      setPendingRoles((p) => ({ ...p, [email]: role }));
    } catch (err) {
      console.error("Error cambiando role", err);
    }
    setActualizando(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full">
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
                  <td className="p-2 font-bold">
                    {u.role}
                  </td>
                  <td className="p-2">
                    {rolesOptions.length === 0 ? (
                      <Button size="sm" disabled>Sin roles</Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <select
                          className="border rounded px-2 py-1"
                          value={pendingRoles[u.email] ?? u.role}
                          disabled={actualizando === u.email}
                          onChange={(e) => setPendingRoles((p) => ({ ...p, [u.email]: e.target.value }))}
                        >
                          {rolesOptions.map((r) => (
                            <option key={r.id} value={r.label}>{r.label}</option>
                          ))}
                        </select>
                        { (pendingRoles[u.email] ?? u.role) !== u.role ? (
                          <>
                            <Button size="sm" disabled={actualizando === u.email} onClick={() => void cambiarRol(u.email, pendingRoles[u.email] ?? u.role)}> 
                              {actualizando === u.email ? 'Guardando...' : 'Guardar'}
                            </Button>
                            <Button size="sm" variant="secondary" disabled={actualizando === u.email} onClick={() => setPendingRoles((p) => ({ ...p, [u.email]: u.role }))}>
                              Cancelar
                            </Button>
                          </>
                        ) : null }
                      </div>
                    )}
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
