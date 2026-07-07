import { FaInstagram, FaWhatsapp } from "react-icons/fa";
import { FiMail, FiMapPin, FiHeart } from "react-icons/fi";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 py-8 px-6 mt-auto border-t border-slate-900 relative">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Thiart3D Logo"
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg object-cover"
          />
          <span className="font-black text-lg tracking-tight uppercase text-white">
            Thiart3D
          </span>
        </div>

        {/* Links */}
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {[
            { href: "/", label: "Inicio" },
            { href: "/tienda/productos", label: "Productos" },
            { href: "/tienda/personalizar", label: "Personalizar" },
            { href: "/tienda/sobre-nosotros", label: "Sobre Nosotros" },
            { href: "/tienda/contacto", label: "Contacto" }
          ].map((link, idx) => (
            <Link 
              key={idx}
              href={link.href} 
              className="text-xs font-semibold hover:text-[#00ffd5] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Contact & Socials */}
        <div className="flex flex-col items-center md:items-end gap-2 text-xs">
          <div className="flex flex-col md:flex-row items-center gap-x-4 gap-y-1 text-slate-400">
            <span className="flex items-center gap-1"><FiMapPin className="text-[#00a19a]" /> calle 5 #24A-152, Cali</span>
            <span className="flex items-center gap-1"><FiMail className="text-[#00a19a]" /> thiart3d@gmail.com</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="Instagram"><FaInstagram className="w-4.5 h-4.5" /></a>
            <a href="https://wa.me/573001234567" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="WhatsApp"><FaWhatsapp className="w-4.5 h-4.5" /></a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-6 pt-6 border-t border-slate-900/60 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-slate-500">
        <span>© {new Date().getFullYear()} THIART 3D. Todos los derechos reservados.</span>
        <span className="flex items-center gap-1">
          Hecho con <FiHeart className="w-3 h-3 text-red-500 fill-red-500" /> y botellas recicladas.
        </span>
      </div>
    </footer>
  );
}
