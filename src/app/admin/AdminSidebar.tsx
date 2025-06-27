import Link from "next/link";
import {
  FiBox,
  FiUsers,
  FiLayers,
  FiTruck,
  FiShoppingCart,
  FiMessageCircle,
  FiHome,
  FiAlertCircle,
} from "react-icons/fi";

export default function AdminSidebar() {
  return (
    <aside className="w-64 min-h-screen bg-[#007973] text-white flex flex-col justify-between shadow-lg">
      <div>
        <div className="flex items-center gap-3 px-6 py-6 border-b border-[#00a19a]">
          <img
            src="/IG%20Foto%20de%20Perfil.png"
            alt="Logo Thiart3D"
            className="h-10 w-10 rounded-full object-cover shadow-lg"
          />
          <span className="font-extrabold text-2xl">Thiart3D</span>
        </div>
        <nav className="flex flex-col gap-2 mt-8 px-4">
          <Link
            href="/admin/productos"
            className="flex items-center gap-2 py-2 px-4 rounded hover:bg-[#00a19a] font-medium"
          >
            <FiBox className="text-lg" />
            Productos
          </Link>
          <Link
            href="/admin/usuarios"
            className="flex items-center gap-2 py-2 px-4 rounded hover:bg-[#00a19a] font-medium"
          >
            <FiUsers className="text-lg" />
            Usuarios
          </Link>
          <Link
            href="/admin/inventario"
            className="flex items-center gap-2 py-2 px-4 rounded hover:bg-[#00a19a] font-medium"
          >
            <FiLayers className="text-lg" />
            Inventario
          </Link>
          <Link
            href="/admin/envios"
            className="flex items-center gap-2 py-2 px-4 rounded hover:bg-[#00a19a] font-medium"
          >
            <FiTruck className="text-lg" />
            Envíos
          </Link>
          <Link
            href="/admin/pedidos"
            className="flex items-center gap-2 py-2 px-4 rounded hover:bg-[#00a19a] font-medium"
          >
            <FiShoppingCart className="text-lg" />
            Pedidos
          </Link>
          <Link
            href="/admin/tickets"
            className="flex items-center gap-2 py-2 px-4 rounded hover:bg-[#00a19a] font-medium"
          >
            <FiAlertCircle className="text-lg" />
            Tickets
          </Link>
          <Link
            href="/admin/mensajes"
            className="flex items-center gap-2 py-2 px-4 rounded hover:bg-[#00a19a] font-medium"
          >
            <FiMessageCircle className="text-lg" />
            Mensajes
          </Link>
        </nav>
        <div className="mt-8 px-4">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full text-center bg-white text-[#007973] font-bold py-2 rounded hover:bg-[#e0f2f1] transition"
          >
            <FiHome className="text-lg" />
            Ir a la Tienda
          </Link>
        </div>
      </div>
      <footer className="px-6 py-4 border-t border-[#00a19a] text-xs text-center bg-[#00665f]">
        © {new Date().getFullYear()} Thiart3D. Todos los derechos reservados.
      </footer>
    </aside>
  );
}
