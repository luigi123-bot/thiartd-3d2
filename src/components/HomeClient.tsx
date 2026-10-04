"use client";
/**
 * HomeClient — Client Component mínimo para la página principal.
 *
 * Solo maneja el estado de `becomeCreatorOpen` para el TopbarTienda.
 * Todo el contenido estático (Hero, Categorías, Audiencias, Productos) está aquí
 * pero se renderiza del lado del cliente. Los componentes pesados se cargan
 * de forma diferida para no bloquear el hilo principal.
 *
 * Razón: TopbarTienda necesita `setBecomeCreatorOpen` como prop, y AuthGate
 * también lo necesita para el banner. Ambos son Client Components, así que
 * el estado vive aquí como puente mínimo.
 */
import React, { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { FiBriefcase, FiUser, FiCheck } from "react-icons/fi";
import Footer from "~/components/Footer";
import LazyOnVisible from "~/components/LazyOnVisible";

// ── Componentes diferidos — fuera del critical rendering path ──────────────
const TopbarTienda = dynamic(
  () => import("~/app/tienda/componentes/TopbarTienda"),
  {
    ssr: false,
    loading: () => (
      <div className="fixed top-0 left-0 right-0 h-16 bg-[#007973]/95 backdrop-blur-md z-50 flex items-center px-6">
        <div className="w-6 h-6 rounded-full bg-white/20 animate-pulse" />
      </div>
    ),
  }
);

const ProductosCarrusel = dynamic(
  () => import("~/components/ProductosCarrusel"),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-[#00a19a]/20 border-t-[#00a19a] rounded-full animate-spin" />
      </div>
    ),
  }
);

const ClientChatWidgetWrapper = dynamic(
  () => import("~/components/ClientChatWidgetWrapper"),
  { ssr: false, loading: () => null }
);

const AuthGate = dynamic(
  () => import("~/components/AuthGate"),
  { ssr: false, loading: () => null }
);

// ── Datos estáticos ────────────────────────────────────────────────────────
const categorias = [
  { title: "Pequeños", desc: "Perfectos para escritorios y organizadores", icon: "S", color: "from-blue-400 to-cyan-400", shadow: "shadow-cyan-200" },
  { title: "Medianos", desc: "Ideales para estanterías y mesas de centro", icon: "M", color: "from-emerald-400 to-[#00a19a]", shadow: "shadow-teal-200" },
  { title: "Grandes", desc: "Súper piezas para destacar en tu sala", icon: "L", color: "from-violet-400 to-purple-400", shadow: "shadow-purple-200" },
  { title: "A Medida", desc: "Diseñados milímetro a milímetro por ti", icon: "XL", color: "from-rose-400 to-orange-400", shadow: "shadow-orange-200" },
];

const audiencias = [
  {
    icon: <FiBriefcase className="w-6 h-6" />,
    title: "Marcas y empresas",
    desc: "Ideal para marcas con propósito, emprendimientos sostenibles y empresas que buscan merchandising y piezas 3D que cuenten una historia de impacto ambiental.",
    items: ["Merchandising sostenible y diferente.", "Trofeos y reconocimientos ecológicos.", "Prototipos y piezas 3D funcionales."],
  },
  {
    icon: <FiUser className="w-6 h-6" />,
    title: "Personas y creadores",
    desc: "Perfecto para quienes quieren decoración única, regalos personalizados y piezas 3D creativas hechas a partir de botellas recicladas.",
    items: ["Decoración para hogar y oficina.", "Regalos personalizados con historia.", "Figuras y piezas 3D creativas."],
  },
];

export default function HomeClient() {
  const [becomeCreatorModalOpen, setBecomeCreatorModalOpen] = useState(false);

  return (
    <>
      <main className="min-h-screen bg-slate-50 font-sans selection:bg-[#00a19a]/30">
        <TopbarTienda
          becomeCreatorOpen={becomeCreatorModalOpen}
          setBecomeCreatorOpen={setBecomeCreatorModalOpen}
        />

        {/* ─── Hero Section ─────────────────────────────────── */}
        {/* Usa CSS animations en lugar de framer-motion para evitar JS en el critical path */}
        <section className="relative w-full min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#007973] pt-20">
          <div className="absolute inset-0 bg-gradient-to-br from-[#004d49] via-[#007973] to-[#00a19a] opacity-90" />
          <div className="absolute -top-[20%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-bl from-teal-300/20 to-transparent blur-[100px] mix-blend-overlay" />
          <div className="absolute -bottom-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-tr from-cyan-300/20 to-transparent blur-[100px] mix-blend-overlay" />

          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center justify-between gap-12 pt-10 pb-20">
            {/* Text — animación CSS pura, sin framer-motion */}
            <div
              className="w-full lg:w-1/2 text-center lg:text-left animate-[fadeInUp_0.8s_ease-out_both]"
              style={{ animationFillMode: "both" }}
            >
              <span className="inline-block py-1.5 px-4 rounded-full bg-white/10 border border-white/20 text-teal-50 text-xs font-bold tracking-[0.2em] uppercase mb-6 backdrop-blur-md">
                Bienvenidos al futuro
              </span>
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[5rem] font-black text-white leading-[1.05] tracking-tight mb-6 drop-shadow-xl">
                Imprimiendo <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-[#00a19a] filter brightness-125 saturate-150">tus ideas</span> <br />
                <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-teal-100 block mt-2 opacity-95">con un impacto sostenible.</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-teal-50/90 mb-10 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
                En THIART 3D transformamos botellas plásticas recicladas en piezas 3D únicas para marcas y personas que quieren diseño con propósito.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/tienda/productos"
                  className="inline-flex items-center justify-center w-full sm:w-auto h-14 px-8 bg-white text-[#007973] hover:bg-teal-50 rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-black/20 transition-transform active:scale-95 text-sm"
                >
                  Ver Catálogo
                </Link>
                <Link
                  href="/tienda/personalizar"
                  className="inline-flex items-center justify-center w-full sm:w-auto h-14 px-8 bg-black/20 hover:bg-black/30 text-white border border-white/30 backdrop-blur-md rounded-2xl font-bold uppercase tracking-widest transition-transform active:scale-95 text-sm"
                >
                  Cotizar Proyecto
                </Link>
              </div>
            </div>

            {/* SVG 3D decorativo — animación CSS pura (sin framer-motion) */}
            <div
              className="w-full lg:w-1/2 flex justify-center lg:justify-end relative animate-[fadeInUp_1s_0.2s_ease-out_both]"
              style={{ animationFillMode: "both" }}
            >
              <div className="relative w-72 h-72 sm:w-96 sm:h-96 lg:w-[500px] lg:h-[500px]">
                <div className="absolute inset-0 bg-gradient-to-tr from-teal-400 to-[#00a19a] rounded-[3rem] rotate-6 opacity-30 blur-2xl animate-pulse" />
                <div className="absolute inset-0 bg-white/10 backdrop-blur-xl border border-white/30 rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] flex items-center justify-center p-8 overflow-hidden group">
                  {/* Rotación continua con CSS — evita JS de framer-motion */}
                  <div
                    className="w-full h-full relative"
                    style={{ animation: "spin 25s linear infinite" }}
                  >
                    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl opacity-90 group-hover:scale-110 transition-transform duration-700">
                      <polygon points="100,20 180,60 100,100 20,60" fill="rgba(255,255,255,0.9)" />
                      <polygon points="20,60 100,100 100,180 20,140" fill="rgba(255,255,255,0.6)" />
                      <polygon points="100,100 180,60 180,140 100,180" fill="rgba(255,255,255,0.3)" />
                      <polyline points="100,20 100,100" stroke="rgba(0,161,154,0.8)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      <polyline points="20,60 100,100" stroke="rgba(0,161,154,0.8)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      <polyline points="180,60 100,100" stroke="rgba(0,161,154,0.8)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Categorías ────────────────────────────────────── */}
        <section className="bg-slate-50 py-16 md:py-24 relative z-10 -mt-2">
          <div className="text-center mb-16 px-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 text-slate-800 tracking-tight">
              Explora por <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00a19a] to-[#007973]">Tamaño</span>
            </h2>
            <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-medium">
              Encuentra el tamaño ideal para tus espacios. Desde detalles sutiles hasta piezas majestuosas.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-6 max-w-7xl mx-auto">
            {categorias.map((cat) => (
              <div
                key={cat.title}
                className="group relative bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-slate-100 flex flex-col items-center text-center overflow-hidden cursor-pointer"
              >
                <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${cat.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${cat.color} text-white flex items-center justify-center font-black text-3xl shadow-lg ${cat.shadow} mb-6 transform group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300`}>
                  {cat.icon}
                </div>
                <h3 className="font-black text-2xl mb-3 text-slate-800">{cat.title}</h3>
                <p className="text-sm font-medium text-slate-500 leading-relaxed">{cat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── ¿Para quién es THIART 3D? ─────────────────────── */}
        <section className="bg-white py-20 md:py-28 relative z-10">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
                ¿Para quién es <span className="text-[#00a19a]">THIART 3D?</span>
              </h2>
              <p className="text-lg text-slate-500 font-medium leading-relaxed">
                Creamos piezas 3D sostenibles tanto para empresas como para personas que valoran el diseño con propósito.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              {audiencias.map((card) => (
                <div
                  key={card.title}
                  className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100/80 rounded-[2.5rem] p-8 md:p-10 shadow-lg shadow-slate-100/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1.5"
                >
                  <div className="space-y-6">
                    <div className="w-14 h-14 bg-teal-50 text-[#00a19a] rounded-2xl flex items-center justify-center shadow-inner">
                      {card.icon}
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-black text-slate-900">{card.title}</h3>
                      <p className="text-sm font-medium text-slate-500 leading-relaxed">{card.desc}</p>
                    </div>
                    <div className="space-y-3 pt-2">
                      {card.items.map((item) => (
                        <div key={item} className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
                            <FiCheck className="w-3.5 h-3.5 text-[#00a19a] stroke-[3]" />
                          </div>
                          <span className="text-sm font-bold text-slate-700">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Banner Creadores + Modales de Admin (client, diferido) ── */}
        <AuthGate
          becomeCreatorModalOpen={becomeCreatorModalOpen}
          setBecomeCreatorModalOpen={setBecomeCreatorModalOpen}
        />

        {/* ─── Productos Destacados ──────────────────────────── */}
        <section className="py-20 md:py-32 bg-white rounded-t-[3rem] shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.05)] relative z-20">
          <div className="relative max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <span className="text-[#00a19a] font-bold tracking-[0.2em] uppercase text-xs mb-3 block">Los Más Buscados</span>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 text-slate-800 tracking-tight">
                Productos Destacados
              </h2>
              <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
                Descubre nuestras creaciones en 3D más populares y valoradas, esculpidas con la más alta calidad.
              </p>
            </div>
            <LazyOnVisible
              minHeight={400}
              fallback={
                <div className="flex justify-center items-center py-20">
                  <div className="w-10 h-10 border-4 border-[#00a19a]/20 border-t-[#00a19a] rounded-full animate-spin" />
                </div>
              }
            >
              <ProductosCarrusel soloDestacados />
            </LazyOnVisible>
          </div>
        </section>
      </main>
      <Footer />
      <ClientChatWidgetWrapper />
    </>
  );
}
