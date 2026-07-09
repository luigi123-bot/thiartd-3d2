"use client";
import { FaInstagram, FaWhatsapp, FaTiktok } from "react-icons/fa";
import { FiMail, FiMapPin } from "react-icons/fi";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-[#004d49] text-slate-400 mt-auto overflow-hidden">
      {/* Wave SVG separator */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-none rotate-180">
        <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" className="w-full h-12 text-slate-50 fill-current">
          <path d="M0,30 C360,60 1080,0 1440,30 L1440,0 L0,0 Z" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-20 pb-10">
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">

          {/* Brand Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <Link href="/" className="flex items-center gap-3 mb-5 group">
              <div className="relative">
                <div className="absolute inset-0 bg-[#00a19a]/30 rounded-2xl blur-md group-hover:blur-lg transition-all" />
                <Image
                  src="/logo.png"
                  alt="Thiart3D Logo"
                  width={48}
                  height={48}
                  className="relative h-12 w-12 rounded-2xl object-cover border border-white/10 shadow-xl"
                />
              </div>
              <div>
                <span className="font-black text-2xl tracking-tight text-white block leading-none">
                  Thiart<span className="text-[#00a19a]">3D</span>
                </span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Diseño Sostenible</span>
              </div>
            </Link>

            <h2 className="text-white font-black text-xl leading-snug mb-3">
              Imprimiendo tus Ideas con un<br/>
              <span className="text-[#00a19a]">impacto sostenible.</span>
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm mb-6 font-medium">
              En THIART 3D transformamos botellas plásticas recicladas en piezas 3D únicas para marcas y personas que quieren diseño con propósito.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-3">
              {[
                { href: "https://instagram.com", icon: <FaInstagram className="w-4 h-4" />, label: "Instagram" },
                { href: "https://wa.me/573001234567", icon: <FaWhatsapp className="w-4 h-4" />, label: "WhatsApp" },
                { href: "#", icon: <FaTiktok className="w-4 h-4" />, label: "TikTok" },
              ].map(({ href, icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#00a19a] hover:border-[#00a19a] hover:text-white text-slate-400 transition-all duration-300 hover:-translate-y-1"
                >
                  {icon}
                </a>
              ))}
            </div>
          </motion.div>

          {/* Nav Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-5">Navegación</h3>
            <nav className="flex flex-col gap-3">
              {[
                { href: "/", label: "Inicio" },
                { href: "/tienda/productos", label: "Catálogo" },
                { href: "/tienda/personalizar", label: "Cotizar Proyecto" },
                { href: "/tienda/sobre-nosotros", label: "Sobre Nosotros" },
                { href: "/envios", label: "Rastrear Pedido" },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-sm font-semibold text-slate-400 hover:text-[#00a19a] transition-colors flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 rounded-full bg-[#00a19a] opacity-0 group-hover:opacity-100 transition-all" />
                  {label}
                </Link>
              ))}
            </nav>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-5">Contacto</h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#00a19a]/10 border border-[#00a19a]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <FiMapPin className="w-3.5 h-3.5 text-[#00a19a]" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Dirección</p>
                  <p className="text-sm text-slate-400 font-medium">Calle 5 #24A-152, Cali, Colombia</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#00a19a]/10 border border-[#00a19a]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <FiMail className="w-3.5 h-3.5 text-[#00a19a]" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Email</p>
                  <a href="mailto:thiart3d@gmail.com" className="text-sm text-slate-400 font-medium hover:text-[#00a19a] transition-colors">
                    thiart3d@gmail.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#00a19a]/10 border border-[#00a19a]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <FaWhatsapp className="w-3.5 h-3.5 text-[#00a19a]" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">WhatsApp</p>
                  <a href="https://wa.me/573001234567" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 font-medium hover:text-[#00a19a] transition-colors">
                    +57 300 123 4567
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-[11px] text-slate-600 font-medium">
            © {new Date().getFullYear()} THIART 3D. Todos los derechos reservados.
          </span>
          <span className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#00a19a] animate-pulse" />
            Hecho con botellas recicladas 🌱
          </span>
        </div>
      </div>
    </footer>
  );
}
