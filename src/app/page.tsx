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
		<div className="min-h-screen bg-[#007973]">
			<TopbarTienda />

			{/* Hero Section */}
			<section className="flex flex-col lg:flex-row items-center justify-between px-4 sm:px-6 md:px-8 lg:px-12 py-10 sm:py-12 md:py-16 lg:py-20 bg-gradient-to-br from-white to-[#e0f2f1]">
				<div className="max-w-xl w-full lg:w-1/2 text-center lg:text-left mb-8 lg:mb-0">
					<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-3 md:mb-4 text-[#007973]">
						Thiart3D
					</h1>
					<p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 md:mb-8 px-4 lg:px-0">
						Descubre nuestros productos 3D únicos y personalizados. Arte
						tridimensional para todos los gustos y espacios.
					</p>
					<div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start px-4 lg:px-0">
						<button className="bg-[#009688] text-white px-5 py-2.5 md:px-6 md:py-3 rounded font-semibold hover:bg-[#007973] transition text-sm md:text-base w-full sm:w-auto">
							Ver Productos
						</button>
						<button className="border border-[#009688] text-[#009688] px-5 py-2.5 md:px-6 md:py-3 rounded font-semibold hover:bg-[#e0f2f1] transition text-sm md:text-base w-full sm:w-auto">
							Personalizar Producto
						</button>
					</div>
				</div>
				<div className="w-full lg:w-1/2 flex justify-center mt-8 lg:mt-0">
					<div className="bg-[#e0f2f1] rounded-xl flex items-center justify-center w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 shadow">
						<svg
							className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40"
							fill="none"
							stroke="#007973"
							strokeWidth="8"
							viewBox="0 0 160 160"
						>
							<rect x="40" y="40" width="80" height="80" rx="12" />
							<path d="M40 80h80M80 40v80" />
						</svg>
					</div>
				</div>
			</section>

			{/* Categorías */}
			<section className="bg-[#e0f2f1] py-10 sm:py-12 md:py-16">
				<div className="text-center mb-8 md:mb-12 px-4">
					<h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-2 text-[#007973]">
						Nuestras Categorías
					</h2>
					<p className="text-base sm:text-lg md:text-xl text-gray-600">
						Explora nuestra variedad de productos 3D en diferentes tamaños y
						estilos
					</p>
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
					{[
						{ title: "Pequeños", desc: "Perfectos para escritorios y espacios reducidos" },
						{ title: "Medianos", desc: "Ideales para estanterías y mesas de centro" },
						{ title: "Grandes", desc: "Impresionantes piezas para destacar en cualquier espacio" },
						{ title: "Personalizados", desc: "Diseñados específicamente según tus necesidades" },
					].map((cat, i) => (
						<div
							key={i}
							className="bg-white rounded-xl shadow p-6 md:p-8 flex flex-col items-center border border-[#b2dfdb] hover:shadow-lg transition-shadow"
						>
							<div className="bg-[#b2dfdb] rounded-full p-3 md:p-4 mb-3 md:mb-4">
								<svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="#007973" strokeWidth="3" viewBox="0 0 40 40">
									<rect x="8" y="8" width="24" height="24" rx="6" />
									<path d="M8 20h24M20 8v24" />
								</svg>
							</div>
							<h3 className="font-bold text-xl md:text-2xl mb-2 text-[#007973]">{cat.title}</h3>
							<p className="text-sm md:text-base text-gray-600 text-center">{cat.desc}</p>
						</div>
					))}
				</div>
			</section>

            {/* ANUNCIO RECLUTAMIENTO CREADORES (Visible para clientes o visitantes) */}
            {(!supaRole || supaRole === "cliente") && (
                <section className="py-12 px-4">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="max-w-7xl mx-auto bg-gradient-to-r from-[#00a19a] to-[#007973] rounded-3xl p-8 md:p-12 shadow-2xl overflow-hidden relative"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <FiStar className="w-64 h-64 text-white rotate-12" />
                        </div>
                        
                        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                            <div className="text-center lg:text-left">
                                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-widest mb-4">
                                    <FiShield /> Programa de Creadores
                                </span>
                                <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
                                    ¿Eres artista 3D? <br className="hidden md:block" />
                                    <span className="text-teal-200">Únete a nuestro equipo</span>
                                </h2>
                                <p className="text-teal-50 text-lg max-w-2xl mb-8 leading-relaxed">
                                    Buscamos talentos que quieran monetizar su arte. Convierte tus diseños en productos físicos 
                                    y llega a miles de clientes. Nosotros nos encargamos de la impresión y logística.
                                </p>
                                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                                    <Button 
                                        onClick={() => setBecomeCreatorModalOpen(true)}
                                        className="bg-white text-[#007973] hover:bg-teal-50 px-8 py-6 rounded-2xl font-black text-lg transition-all flex items-center gap-3 shadow-xl h-auto"
                                    >
                                        Postularse Ahora <FiArrowRight />
                                    </Button>
                                    <p className="text-sm text-teal-100/80 font-medium">Revisamos tu portafolio en menos de 48h</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center">
                                    <div className="text-2xl font-black text-white mb-1">+100</div>
                                    <div className="text-[10px] text-teal-100 font-bold uppercase tracking-widest">Modelos Activos</div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center">
                                    <div className="text-2xl font-black text-white mb-1">Top 10</div>
                                    <div className="text-[10px] text-teal-100 font-bold uppercase tracking-widest">Artistas Globales</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </section>
            )}

			{/* Productos Destacados */}
			<section className="py-10 sm:py-12 md:py-16 bg-white">
				<div className="text-center mb-8 md:mb-12 px-4">
					<h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-2 text-[#007973]">
						Productos Destacados
					</h2>
					<p className="text-base sm:text-lg md:text-xl text-gray-600">
						Descubre nuestros productos más populares y valorados
					</p>
				</div>
				<ProductosCarrusel soloDestacados />
			</section>

			{/* Botones flotantes - responsive */}
			<Button
				onClick={() => setModalOpen(true)}
				className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 z-50 bg-[#007973] text-white text-sm md:text-base px-4 py-2 md:px-6 md:py-3 shadow-lg hover:shadow-xl transition-shadow"
			>
				<span className="hidden sm:inline">Contáctanos</span>
				<span className="sm:hidden">Contacto</span>
			</Button>
			<ContactModal open={modalOpen} onOpenChangeAction={setModalOpen} />

			{isAdmin && (
				<>
					<Button
						onClick={() => setUsuariosModalOpen(true)}
						className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 md:bottom-8 md:left-8 z-50 bg-blue-700 text-white text-sm md:text-base px-4 py-2 md:px-6 md:py-3 shadow-lg hover:shadow-xl transition-shadow"
					>
						<span className="hidden lg:inline">Gestionar usuarios y roles</span>
						<span className="lg:hidden">Usuarios</span>
					</Button>
					<UsuariosAdminModal open={usuariosModalOpen} onOpenChange={setUsuariosModalOpen} />
				</>
			)}

            <BecomeCreatorModal 
                open={becomeCreatorModalOpen} 
                onOpenChange={setBecomeCreatorModalOpen} 
            />
		</div>
	);
}
