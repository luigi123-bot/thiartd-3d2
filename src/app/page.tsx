"use client";
import React from "react";
import { useRouter } from "next/navigation";
import TopbarTienda from "./tienda/componentes/TopbarTienda"; // Importa el Topbar

const productosDestacados = [
	{
		nombre: "Escultura Geométrica",
		desc: "Figura abstracta con formas geométricas entrelazadas",
		categoria: "Pequeño",
		precio: 29.99,
		destacado: true,
	},
	{
		nombre: "Busto Decorativo",
		desc: "Busto decorativo inspirado en el arte clásico",
		categoria: "Mediano",
		precio: 49.99,
		destacado: false,
	},
	{
		nombre: "Escultura Moderna",
		desc: "Pieza moderna con líneas fluidas y acabado brillante",
		categoria: "Pequeño",
		precio: 39.99,
		destacado: true,
	},
	{
		nombre: "Figura Abstracta",
		desc: "Diseño abstracto con múltiples interpretaciones",
		categoria: "Grande",
		precio: 79.99,
		destacado: false,
	},
	{
		nombre: "Miniatura Arquitectónica",
		desc: "Modelo arquitectónico detallado",
		categoria: "Mediano",
		precio: 59.99,
		destacado: false,
	},
	{
		nombre: "Figura Animal",
		desc: "Figura de animal realista",
		categoria: "Pequeño",
		precio: 24.99,
		destacado: false,
	},
	{
		nombre: "Escultura Orgánica",
		desc: "Formas orgánicas y naturales",
		categoria: "Grande",
		precio: 89.99,
		destacado: true,
	},
];

export default function Home() {
	const router = useRouter();
	return (
		<div className="min-h-screen bg-[#007973]">
			<TopbarTienda /> {/* Renderiza el Topbar aquí */}
			{/* Barra superior con notificaciones y botón Admin */}
			<div className="flex justify-end items-center gap-8 px-5 py-4 bg-white shadow">
				{/* Botón Admin */}
				<button
					className="bg-[#007973] text-white px-5 py-2 rounded font-semibold hover:bg-[#005f56] transition"
					onClick={() => router.push("/admin")}
				>
					Admin
				</button>
			</div>
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
						Descubre nuestros productos más populares y mejor valorados
					</p>
				</div>
				{/* Carrusel de productos fluido con borde */}
				<div className="flex justify-center ">
					<div className="relative overflow-hidden w-[1800px] max-w-full rounded-2xl border-4 shadow-lg border-[#b2dfdb] py-12 bg-[#e0f2f1]">
						{/* Contenedor del carrusel */}
						<div
							className="flex gap-8 animate-carousel carousel-width"
						>
							{[...productosDestacados, ...productosDestacados].map((prod, i) => (
								<div
									key={i}
									className="bg-white rounded-xl shadow w-80 flex-shrink-0 border border-[#b2dfdb]"
								>
									<div className="relative h-72 flex items-center justify-center">
										<img
											src="/Logo%20Thiart%20Tiktok.png"
											alt="Logo producto"
											className="w-32 h-32 object-contain"
										/>
										{prod.destacado && (
											<span className="absolute top-4 right-4 bg-[#007973] text-white text-xs px-3 py-1 rounded-full font-semibold">
												Destacado
											</span>
										)}
									</div>
									<div className="p-6">
										<h4 className="font-bold text-xl mb-1 text-[#007973]">
											{prod.nombre}
										</h4>
										<p className="text-gray-600 mb-3">{prod.desc}</p>
										<div className="flex items-center justify-between">
											<span className="bg-[#e0f2f1] text-[#007973] px-3 py-1 rounded text-sm">
												{prod.categoria}
											</span>
											<span className="font-bold text-lg text-[#007973]">
												${prod.precio.toFixed(2)}
											</span>
										</div>
									</div>
								</div>
							))}
						</div>
						{/* Carousel animation styles */}
						<style jsx>{`
							@keyframes carousel {
								0% {
									transform: translateX(0);
								}
								100% {
									transform: translateX(-${productosDestacados.length * 22}rem);
								}
							}
							.animate-carousel {
								animation: carousel 40s linear infinite;
							}
							.carousel-width {
								width: calc(${productosDestacados.length * 2} * 20rem + ${productosDestacados.length * 2} * 2rem);
							}
						`}</style>
					</div>
				</div>
			</section>
		</div>
	);
}
