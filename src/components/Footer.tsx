import { FaFacebookF, FaInstagram, FaWhatsapp } from "react-icons/fa";
import { FiMail, FiPhone, FiMapPin } from "react-icons/fi";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-black text-white py-10 px-4 mt-auto">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Descripción */}
        <div>
          <div className="font-bold text-lg mb-2">Thiart3D</div>
          <div className="text-gray-300 mb-4">
            Productos 3D únicos y personalizados.
          </div>
          <div className="flex gap-3 mt-2">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#00a19a]"
              aria-label="Facebook"
            >
              <FaFacebookF />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#00a19a]"
              aria-label="Instagram"
            >
              <FaInstagram />
            </a>
            <a
              href="https://wa.me/XXXXXXXXXXX"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#00a19a]"
              aria-label="WhatsApp"
            >
              <FaWhatsapp />
            </a>
          </div>
        </div>
        {/* Enlaces rápidos */}
        <div>
          <div className="font-bold mb-2">Enlaces rápidos</div>
          <ul className="space-y-1">
            <li>
              <Link href="/" className="hover:underline">
                Inicio
              </Link>
            </li>
            <li>
              <a
                href="/tienda/productos"
                className="hover:underline"
              >
                Productos
              </a>
            </li>
            <li>
              <a
                href="/tienda/personalizar"
                className="hover:underline"
              >
                Personalizar
              </a>
            </li>
            <li>
              <a
                href="/tienda/sobre-nosotros"
                className="hover:underline"
              >
                Sobre Nosotros
              </a>
            </li>
            <li>
              <a
                href="/tienda/contacto"
                className="hover:underline"
              >
                Contacto
              </a>
            </li>
          </ul>
        </div>
        {/* Contacto y newsletter */}
        <div>
          <div className="font-bold mb-2">Contacto</div>
          <div className="flex items-center gap-2 text-gray-300">
            <FiMapPin /> Dirección: Santiago, Chile
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <FiPhone /> +56 9 1234 5678
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <FiMail /> contacto@thiart3d.com
          </div>
          <form className="mt-4 flex gap-2">
            <Input
              type="email"
              placeholder="Tu correo electrónico"
              className="rounded-lg"
            />
            <Button
              type="submit"
              className="rounded-lg bg-white text-black hover:bg-gray-200"
            >
              Suscribirse
            </Button>
          </form>
        </div>
      </div>
      <div className="text-center text-gray-400 text-xs mt-8">
        © {new Date().getFullYear()} Thiart3D. Todos los derechos reservados.
      </div>
    </footer>
  );
}
