"use client";
import Link from "next/link";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { IoIosNotifications } from "react-icons/io";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TopbarTienda() {
  const router = useRouter();

  return (
    <nav className="w-full border-b shadow-sm px-6 py-3 flex items-center justify-between sticky top-0 z-50 bg-[#00a19a]">
      {/* Contenedor izquierdo: Logo + Nombre */}
      <div className="flex items-center gap-3 min-w-max">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/IG%20Foto%20de%20Perfil.png"
            alt="Logo Thiart3D"
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover shadow-lg"
          />
          <span className="font-extrabold text-2xl text-white hidden md:inline">
            Thiart3D
          </span>
        </Link>
      </div>
      {/* Contenedor central: Menú + Buscador */}
      <div className="flex-1 flex items-center justify-center gap-8">
        <div className="hidden md:flex gap-6">
          <Link
            href="/"
            className="text-white hover:text-gray-100 font-medium"
          >
            Inicio
          </Link>
          <Link
            href="/tienda/productos"
            className="text-white hover:text-gray-100 font-medium"
          >
            Productos
          </Link>
          <Link
            href="/tienda/personalizar"
            className="text-white hover:text-gray-100 font-medium"
          >
            Personalizar
          </Link>
          <Link
            href="/tienda/sobre-nosotros"
            className="text-white hover:text-gray-100 font-medium"
          >
            Sobre Nosotros
          </Link>
          <Link
            href="/tienda/contacto"
            className="text-white hover:text-gray-100 font-medium"
          >
            Contacto
          </Link>
        </div>
        <div className="hidden md:block ml-8">
          <Input
            placeholder="Buscar productos..."
            className="max-w-xs text-black placeholder:text-gray-700"
          />
        </div>
      </div>
      {/* Contenedor derecho: Accesos rápidos y sesión */}
      <div className="flex items-center gap-3 min-w-max ml-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/tienda/carrito")}
        >
          <ShoppingCart className="w-6 h-6 text-white" />
        </Button>
        <Button variant="ghost" size="icon">
          <IoIosNotifications className="w-6 h-6 text-white" />
        </Button>
        <SignedOut>
          <SignInButton mode="modal">
            <Button
              variant="outline"
              className="bg-white  border-[#00a19a] hover:bg-[#e0f2f1] font-semibold"
            >
              Iniciar sesión
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button
              variant="outline"
              className="bg-white  border-[#00a19a] hover:bg-[#e0f2f1] font-semibold"
            >
              Registrarse
            </Button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: "ring-2 ring-[#00a19a]",
                userButtonPopoverCard: "font-sans",
              },
              variables: {
                colorPrimary: "#00a19a",
                colorText: "#222",
                fontFamily: "var(--font-geist-sans), sans-serif",
              },
            }}
            afterSignOutUrl="/"
            userProfileMode="navigation"
            userProfileUrl="/perfil"
          />
        </SignedIn>
      </div>
    </nav>
  );
}
