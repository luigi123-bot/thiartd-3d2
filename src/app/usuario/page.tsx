import SupabaseAuth from "~/components/SupabaseAuth";

export default function UsuarioPage() {
  // ...puedes agregar lógica para mostrar el panel de usuario si está autenticado...
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SupabaseAuth />
    </div>
  );
}