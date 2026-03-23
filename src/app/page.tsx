"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "~/components/ui/button";
import ContactModal from "~/components/ContactModal";
import ProductosCarrusel from "~/components/ProductosCarrusel";
import UsuariosAdminModal from "~/components/UsuariosAdminModal";
import BecomeCreatorModal from "~/components/BecomeCreatorModal";
import { useUser } from "@clerk/nextjs";
import { supabase } from "~/lib/supabaseClient";
import { motion } from "framer-motion";
import { FiStar, FiArrowRight, FiShield } from "react-icons/fi";
import Link from "next/link";

const TopbarTienda = dynamic(() => import("./tienda/componentes/TopbarTienda"), { ssr: false });

export default function Home() {
	const [modalOpen, setModalOpen] = useState(false);
	const [usuariosModalOpen, setUsuariosModalOpen] = useState(false);
	const [becomeCreatorModalOpen, setBecomeCreatorModalOpen] = useState(false);
	const { user } = useUser();
	const [isAdmin, setIsAdmin] = useState(false);
	const [supaRole, setSupaRole] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;
		async function checkRole() {
            // Verificar en Clerk primero (redundancia)
			if (user?.publicMetadata?.role === 'admin') {
				if (mounted) setIsAdmin(true);
			}

            // Verificar en Supabase para una fuente de verdad única
            const { data: authData } = await supabase.auth.getUser();
            const currentUserId = authData?.user?.id;

            if (currentUserId) {
                const { data: userDb } = await supabase
                    .from("usuarios")
                    .select("role")
                    .eq("id", currentUserId)
                    .single() as { data: { role: string } | null };
                
                if (userDb?.role) {
                    const r: string = userDb.role.toLowerCase();
                    setSupaRole(r);
                    if (r === 'admin') setIsAdmin(true);
                }
            } else {
                setSupaRole(null);
                setIsAdmin(false);
            }
		}
		void checkRole();
		return () => { mounted = false; };
	}, [user]);

	return (
		<main className="min-h-screen bg-slate-50 font-sans selection:bg-[#00a19a]/30">
			<TopbarTienda />

			{/* Hero Section */}
            <section className="relative w-full min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#007973] pt-20">
                {/* Background decorative elements */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#004d49] via-[#007973] to-[#00a19a] opacity-90" />
                <div className="absolute -top-[20%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-bl from-teal-300/20 to-transparent blur-[100px] mix-blend-overlay" />
                <div className="absolute -bottom-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-tr from-cyan-300/20 to-transparent blur-[100px] mix-blend-overlay" />

                <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center justify-between gap-12 pt-10 pb-20">
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="w-full lg:w-1/2 text-center lg:text-left"
                    >
                        <span className="inline-block py-1.5 px-4 rounded-full bg-white/10 border border-white/20 text-teal-50 text-xs font-bold tracking-[0.2em] uppercase mb-6 backdrop-blur-md">
                            Bienvenidos al futuro
                        </span>
                        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[5rem] font-black text-white leading-[1.05] tracking-tight mb-6 drop-shadow-xl">
                            Imprimiendo <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-[#00a19a] filter brightness-125 saturate-150">tus ideas</span>
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl text-teal-50/90 mb-10 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
                            Descubre figuras personalizadas, repuestos y arte tridimensional con una calidad excepcional y precisión en cada capa.
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
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ duration: 1, delay: 0.2, type: "spring" }}
                        className="w-full lg:w-1/2 flex justify-center lg:justify-end relative"
                    >
                        <div className="relative w-72 h-72 sm:w-96 sm:h-96 lg:w-[500px] lg:h-[500px]">
                            <div className="absolute inset-0 bg-gradient-to-tr from-teal-400 to-[#00a19a] rounded-[3rem] rotate-6 opacity-30 blur-2xl animate-pulse" />
                            <div className="absolute inset-0 bg-white/10 backdrop-blur-xl border border-white/30 rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] flex items-center justify-center p-8 overflow-hidden group">
                                <motion.div 
                                    animate={{ rotateY: 360, rotateX: 360 }}
                                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                                    className="w-full h-full relative"
                                >
                                    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl opacity-90 group-hover:scale-110 transition-transform duration-700">
                                        <polygon points="100,20 180,60 100,100 20,60" fill="rgba(255,255,255,0.9)" />
                                        <polygon points="20,60 100,100 100,180 20,140" fill="rgba(255,255,255,0.6)" />
                                        <polygon points="100,100 180,60 180,140 100,180" fill="rgba(255,255,255,0.3)" />
                                        <polyline points="100,20 100,100" stroke="rgba(0,161,154,0.8)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                        <polyline points="20,60 100,100" stroke="rgba(0,161,154,0.8)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                        <polyline points="180,60 100,100" stroke="rgba(0,161,154,0.8)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </div>
                
                {/* Bottom Wave Divider */}
                <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-[0] z-20">
                    <svg className="relative block w-full h-[60px] lg:h-[120px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
                        <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118,130.68,124.93,196.5,115.2,240.24,108.76,281.33,83.87,321.39,56.44Z" fill="#f8fafc"></path>
                    </svg>
                </div>
            </section>

			{/* Categorías */}
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
					{[
						{ title: "Pequeños", desc: "Perfectos para escritorios y organizadores", icon: "S", color: "from-blue-400 to-cyan-400", shadow: "shadow-cyan-200" },
						{ title: "Medianos", desc: "Ideales para estanterías y mesas de centro", icon: "M", color: "from-emerald-400 to-[#00a19a]", shadow: "shadow-teal-200"  },
						{ title: "Grandes", desc: "Súper piezas para destacar en tu sala", icon: "L", color: "from-violet-400 to-purple-400", shadow: "shadow-purple-200"  },
						{ title: "A Medida", desc: "Diseñados milímetro a milímetro por ti", icon: "XL", color: "from-rose-400 to-orange-400", shadow: "shadow-orange-200"  },
					].map((cat, i) => (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-100px" }}
							transition={{ delay: i * 0.1, duration: 0.5 }}
							key={i}
							className="group relative bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-slate-100 flex flex-col items-center text-center overflow-hidden cursor-pointer"
						>
                            {/* Decorative Top Line */}
                            <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${cat.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
							
                            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${cat.color} text-white flex items-center justify-center font-black text-3xl shadow-lg ${cat.shadow} mb-6 transform group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300`}>
                                {cat.icon}
							</div>
							<h3 className="font-black text-2xl mb-3 text-slate-800">{cat.title}</h3>
							<p className="text-sm font-medium text-slate-500 leading-relaxed">{cat.desc}</p>
						</motion.div>
					))}
				</div>
			</section>

            {/* ANUNCIO RECLUTAMIENTO CREADORES */}
            {(!supaRole || supaRole === "cliente") && (
                <section className="py-20 md:py-32 px-4 bg-slate-50 relative">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="max-w-7xl mx-auto bg-gradient-to-br from-[#00a19a] via-[#008f89] to-[#00605c] rounded-[3rem] p-10 md:p-16 shadow-[0_20px_50px_-12px_rgba(0,161,154,0.4)] overflow-hidden relative"
                    >
                        {/* Decorative background stars */}
                        <div className="absolute -top-10 -right-10 p-8 opacity-10">
                            <FiStar className="w-96 h-96 text-white rotate-12" />
                        </div>
                        <div className="absolute -bottom-10 -left-10 p-8 opacity-5">
                            <FiStar className="w-64 h-64 text-white -rotate-12" />
                        </div>
                        
                        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                            <div className="text-center lg:text-left lg:w-3/5">
                                <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-black uppercase tracking-[0.2em] mb-6 shadow-xl">
                                    <FiShield className="w-4 h-4" /> Programa de Creadores Oficial
                                </span>
                                <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6 leading-tight drop-shadow-lg">
                                    ¿Eres artista 3D? <br className="hidden md:block" />
                                    <span className="text-teal-200">Únete a Thiart</span>
                                </h2>
                                <p className="text-teal-50 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed font-medium">
                                    Convierte tus diseños en un ingreso constante. Tú haces el arte digital, nosotros nos encargamos de la producción 3D física, envíos y atención al cliente.
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                                    <Button 
                                        onClick={() => setBecomeCreatorModalOpen(true)}
                                        className="w-full sm:w-auto bg-white text-[#007973] hover:bg-teal-50 px-10 py-7 rounded-2xl font-black text-base uppercase tracking-widest transition-transform active:scale-95 flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.2)]"
                                    >
                                        Postularme Ahora <FiArrowRight className="w-5 h-5" />
                                    </Button>
                                    <p className="text-xs text-teal-100 font-bold uppercase tracking-widest mt-4 sm:mt-0 sm:ml-4 bg-black/10 px-4 py-2 rounded-xl">Evaluación en 48h</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 lg:w-2/5 w-full">
                                <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 text-center shadow-xl shadow-black/10">
                                    <div className="text-4xl md:text-5xl font-black text-white mb-2 drop-shadow-md">+100</div>
                                    <div className="text-xs text-teal-100 font-bold uppercase tracking-widest">Modelos Únicos</div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 text-center shadow-xl shadow-black/10">
                                    <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-yellow-500 mb-2 drop-shadow-md">Top</div>
                                    <div className="text-xs text-teal-100 font-bold uppercase tracking-widest">Artistas Globales</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </section>
            )}

			{/* Productos Destacados */}
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
				    <ProductosCarrusel soloDestacados />
                </div>
			</section>

			{/* Botones flotantes - responsive */}
			<Button
				onClick={() => setModalOpen(true)}
				className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[100] h-14 bg-gradient-to-r from-[#00a19a] to-[#007973] hover:from-[#008f89] hover:to-[#00605c] text-white rounded-full px-6 md:px-8 font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(0,161,154,0.4)] hover:shadow-[0_15px_40px_rgba(0,161,154,0.6)] hover:-translate-y-1 transition-all active:scale-95 text-xs border border-teal-400/30"
			>
				<span className="hidden sm:inline">Hablar con Asesor</span>
				<span className="sm:hidden">Contacto</span>
			</Button>
			<ContactModal open={modalOpen} onOpenChangeAction={setModalOpen} />

			{isAdmin && (
				<>
					<Button
						onClick={() => setUsuariosModalOpen(true)}
						className="fixed bottom-6 left-6 md:bottom-10 md:left-10 z-[100] h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 md:px-8 font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(37,99,235,0.4)] hover:-translate-y-1 transition-all active:scale-95 text-xs"
					>
						<span className="hidden lg:inline">Gestión Especializada</span>
						<span className="lg:hidden">Admin</span>
					</Button>
					<UsuariosAdminModal open={usuariosModalOpen} onOpenChange={setUsuariosModalOpen} />
				</>
			)}

            <BecomeCreatorModal 
                open={becomeCreatorModalOpen} 
                onOpenChange={setBecomeCreatorModalOpen} 
            />
		</main>
	);
}
