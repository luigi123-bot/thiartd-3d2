"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "~/components/ui/button";
import ContactModal from "~/components/ContactModal";
import ProductosCarrusel from "~/components/ProductosCarrusel";
import UsuariosAdminModal from "~/components/UsuariosAdminModal";

// Importa componentes que usan datos dinámicos o Clerk con SSR desactivado
const TopbarTienda = dynamic(() => import("./tienda/componentes/TopbarTienda"), { ssr: false });

export default function Home() {
	const [modalOpen, setModalOpen] = useState(false);
	const [usuariosModalOpen, setUsuariosModalOpen] = useState(false);

	return (
		<div className="min-h-screen bg-[#007973]">
			<TopbarTienda /> {/* Renderiza el Topbar aquí */}
			{/* Hero Section */}
			<section className="flex flex-col md:flex-row items-center justify-between px-12 py-20 bg-gradient-to-br from-white to-[#e0f2f1]">
				<div className="max-w-xl">
					<h1 className="text-6xl font-extrabold mb-4 text-[#007973]">Thiart3D</h1>
					<p className="text-xl text-gray-600 mb-8">
						Descubre nuestros productos 3D únicos y personalizados. Arte
						tridimensional para todos los gustos y espacios.
					</p>
					<div className="flex gap-4">
						<button className="bg-[#009688] text-white px-6 py-3 rounded font-semibold hover:bg-[#007973] transition">
							Ver Productos
						</button>
						<button className="border border-[#009688] text-[#009688] px-6 py-3 rounded font-semibold hover:bg-[#e0f2f1] transition">
							Personalizar Producto
						</button>
					</div>
				</div>
				<div className="w-full md:w-1/2 flex justify-center mt-10 md:mt-0">
					{/* Icono grande */}
					<div className="bg-[#e0f2f1] rounded-xl flex items-center justify-center w-96 h-96 shadow">
						{/* Usa tu ícono aquí */}
						<svg
							width="160"
							height="160"
							fill="none"
							stroke="#007973"
							strokeWidth="8"
						>
							<rect x="40" y="40" width="80" height="80" rx="12" />
							<path d="M40 80h80M80 40v80" />
						</svg>
					</div>
				</div>
			</section>
			{/* Categorías */}
			<section className="bg-[#e0f2f1] py-16">
				<div className="text-center mb-12">
					<h2 className="text-5xl font-extrabold mb-2 text-[#007973]">
						Nuestras Categorías
					</h2>
					<p className="text-xl text-gray-600">
						Explora nuestra variedad de productos 3D en diferentes tamaños y
						estilos
					</p>
				</div>
				<div className="flex flex-wrap justify-center gap-8 px-4 ">
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
							className="bg-white rounded-xl shadow p-8 w-72 flex flex-col items-center border border-[#b2dfdb]"
						>
							<div className="bg-[#b2dfdb] rounded-full p-4 mb-4">
								{/* Icono */}
								<svg
									width="40"
									height="40"
									fill="none"
									stroke="#007973"
									strokeWidth="3"
								>
									<rect x="8" y="8" width="24" height="24" rx="6" />
									<path d="M8 20h24M20 8v24" />
								</svg>
							</div>
							<h3 className="font-bold text-2xl mb-2 text-[#007973]">{cat.title}</h3>
							<p className="text-gray-600 text-center">{cat.desc}</p>
						</div>
					))}
				</div>
			</section>
			{/* Productos Destacados */}
			<section className="py-16 bg-white">
				<div className="text-center mb-12">
					<h2 className="text-5xl font-extrabold mb-2 text-[#007973]">
						Productos Destacados
					</h2>
					<p className="text-xl text-gray-600">
						Descubre nuestros productos más populares y valorados
					</p>
				</div>
				<ProductosCarrusel soloDestacados />
			</section>
			<Button onClick={() => setModalOpen(true)} className="fixed bottom-8 right-8 z-50 bg-[#007973] text-white">
				Contáctanos
			</Button>
			<ContactModal open={modalOpen} onOpenChangeAction={setModalOpen} />
			<Button onClick={() => setUsuariosModalOpen(true)} className="fixed bottom-8 left-8 z-50 bg-blue-700 text-white">
				Gestionar usuarios y roles
			</Button>
			<UsuariosAdminModal open={usuariosModalOpen} onOpenChange={setUsuariosModalOpen} />
		</div>
	);
}
