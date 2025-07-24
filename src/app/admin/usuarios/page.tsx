"use client";
import { useEffect, useState, useCallback } from "react";
import { Card } from "~/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { CreateUserModal } from "~/components/CreateUserModal";
import { useRouter } from "next/navigation";

export default function AdminUsuariosPage() {
  interface Usuario {
    id?: string;
    nombre?: string;
    email?: string;
    clerk_id?: string;
    creado_en?: string;
  }

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/usuarios");
      const data = (await res.json()) as { usuarios?: Usuario[] };
      setUsuarios(Array.isArray(data.usuarios) ? data.usuarios : []);
    } catch {
      setUsuarios([]);
    }
    setLoading(false);
  }, []);

  const syncClerkUsuarios = async () => {
    setLoading(true);
    await fetch("/api/usuarios/clerk-usuarios"); // Llama al endpoint que sincroniza
    await fetchUsuarios(); // Refresca la tabla
    setLoading(false);
  };

  useEffect(() => {
    void fetchUsuarios();
  }, [fetchUsuarios]);

  return (
    <div className="min-h-screen p-10 bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Usuarios Registrados</h1>
        <div className="flex gap-2">
          <Button onClick={() => setModalOpen(true)}>Agregar usuario</Button>
          <Button variant="secondary" onClick={syncClerkUsuarios}>Sincronizar Clerk</Button>
          <Button variant="outline" onClick={() => router.push("/admin/panel")}>Panel</Button>
        </div>
      </div>
      <CreateUserModal
        open={modalOpen}
        onOpenChangeAction={setModalOpen}
        onUserCreated={fetchUsuarios}
      />
      <Card>
        <div className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Clerk ID</TableHead>
                <TableHead>Fecha de registro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    Cargando usuarios...
                  </TableCell>
                </TableRow>
              ) : usuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    No hay usuarios registrados.
                  </TableCell>
                </TableRow>
              ) : (
                usuarios.map((usuario) => (
                  <TableRow key={usuario.id ?? usuario.email}>
                    <TableCell>{usuario.nombre ?? "-"}</TableCell>
                    <TableCell>{usuario.email ?? "-"}</TableCell>
                    <TableCell>{usuario.clerk_id ?? "-"}</TableCell>
                    <TableCell>
                      {usuario.creado_en && typeof usuario.creado_en === "string"
                        ? usuario.creado_en.slice(0, 19).replace("T", " ")
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
