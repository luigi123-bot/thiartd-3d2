"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "~/components/ui/button";
import ContactModal from "~/components/ContactModal";
import ProductosCarrusel from "~/components/ProductosCarrusel";
import UsuariosAdminModal from "~/components/UsuariosAdminModal";
import { useUser } from "@clerk/nextjs";

// Importa componentes que usan datos dinámicos o Clerk con SSR desactivado
const TopbarTienda = dynamic(() => import("./tienda/componentes/TopbarTienda"), { ssr: false });

export default function Home() {
		const [modalOpen, setModalOpen] = useState(false);
		const [usuariosModalOpen, setUsuariosModalOpen] = useState(false);
		const { user } = useUser();
		const [isAdmin, setIsAdmin] = useState(false);

		useEffect(() => {
			let mounted = true;
			async function checkRole() {
				if (user?.publicMetadata?.role === 'admin') {
					if (mounted) setIsAdmin(true);
					return;
				}
				if (!user) {
					if (mounted) setIsAdmin(false);
					return;
				}
				try {
					const res = await fetch('/api/admin/whoami', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ auth_id: user.id }),
					});
					if (!res.ok) {
						if (mounted) setIsAdmin(false);
						return;
					}
					type WhoAmIResponse = { isAdmin?: boolean };
					const json = (await res.json()) as WhoAmIResponse;
					if (mounted) setIsAdmin(Boolean(json?.isAdmin));
				} catch {
					if (mounted) setIsAdmin(false);
				}
			}
			void checkRole();
			return () => { mounted = false; };
		}, [user]);

	return (
		<div className="min-h-screen bg-[#007973]">
			<TopbarTienda /> {/* Renderiza el Topbar aquí */}
			
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
					{/* Icono grande - responsive */}
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
					{/* Tarjeta de categoría */}
					{[
						{
							title: "Pequeños",
							desc: "Perfectos para escritorios y espacios reducidos",
						},
						{
							title: "Medianos",
							desc: "Ideales para estanterías y mesas de centro",
						},
						{
							title: "Grandes",
							desc: "Impresionantes piezas para destacar en cualquier espacio",
						},
						{
							title: "Personalizados",
							desc: "Diseñados específicamente según tus necesidades",
						},
					].map((cat, i) => (
						<div
							key={i}
							className="bg-white rounded-xl shadow p-6 md:p-8 flex flex-col items-center border border-[#b2dfdb] hover:shadow-lg transition-shadow"
						>
							<div className="bg-[#b2dfdb] rounded-full p-3 md:p-4 mb-3 md:mb-4">
								{/* Icono */}
								<svg
									className="w-8 h-8 md:w-10 md:h-10"
									fill="none"
									stroke="#007973"
									strokeWidth="3"
									viewBox="0 0 40 40"
								>
									<rect x="8" y="8" width="24" height="24" rx="6" />
									<path d="M8 20h24M20 8v24" />
								</svg>
							</div>
							<h3 className="font-bold text-xl md:text-2xl mb-2 text-[#007973]">
								{cat.title}
							</h3>
							<p className="text-sm md:text-base text-gray-600 text-center">
								{cat.desc}
							</p>
						</div>
					))}
				</div>
			</section>
			
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
		</div>
	);
}
