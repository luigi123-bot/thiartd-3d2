import Footer from "~/components/Footer";
import NotificacionesUsuario from "~/components/NotificacionesUsuario";
import Link from "next/link";
import Image from "next/image";

export default function UsuarioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="flex justify-between items-center px-6 py-4 border-b bg-white shadow-sm">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Thiart3D" width={36} height={36} className="rounded-full" />
          <span className="font-black text-lg tracking-tight text-[#00a19a]">Thiart3D</span>
        </Link>
        <div className="flex items-center gap-4">
          <NotificacionesUsuario />
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
   
