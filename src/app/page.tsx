"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "~/components/ui/button";

// Importa componentes que usan datos dinámicos o Clerk con SSR desactivado
const TopbarTienda = dynamic(() => import("./tienda/componentes/TopbarTienda"), { ssr: false });
const ContactModal = dynamic(() => import("~/components/ContactModal"), { ssr: false });
const ProductosCarrusel = dynamic(() => import("~/components/ProductosCarrusel"), { ssr: false });

type TrackResult = Record<string, unknown> | null;
type PedidoResult = Record<string, unknown> | null;

export default function Home() {
	const router = useRouter();
	const [modalOpen, setModalOpen] = useState(false);
	// Modal para probar la API de envío/rastreo
	const [trackModalOpen, setTrackModalOpen] = useState(false);
	const [trackingNumber, setTrackingNumber] = useState("");
	const [result, setResult] = useState<TrackResult>(null);
	const [loading, setLoading] = useState(false);
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [pedido, setPedido] = useState({
		recipient: "",
		address: "",
		package: "",
	});
	const [pedidoResult, setPedidoResult] = useState<PedidoResult>(null);
	const [pedidoLoading, setPedidoLoading] = useState(false);

	const handleTrack = async () => {
		setLoading(true);
		setResult(null);
		const res = await fetch("/api/envia/track", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ trackingNumber }),
		});
		const data: unknown = await res.json();
		if (data && typeof data === "object" && !Array.isArray(data)) {
			setResult(data as TrackResult);
		} else {
			setResult(null);
		}
		setLoading(false);
	};

	const handleCreatePedido = async () => {
		setPedidoLoading(true);
		setPedidoResult(null);
		const res = await fetch("/api/envia/create", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(pedido),
		});
		const data: unknown = await res.json();
		if (data && typeof data === "object" && !Array.isArray(data)) {
			setPedidoResult(data as PedidoResult);
		} else {
			setPedidoResult(null);
		}
		setPedidoLoading(false);
	};

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
						Descubre nuestros productos más populares y valorados
					</p>
				</div>
				<ProductosCarrusel soloDestacados />
			</section>
			<Button onClick={() => setModalOpen(true)} className="fixed bottom-8 right-8 z-50 bg-[#007973] text-white">
				Contáctanos
			</Button>
			<ContactModal open={modalOpen} onOpenChangeAction={setModalOpen} />

			{/* Botón para abrir el modal de prueba de API */}
			<button
				className="fixed bottom-24 right-8 z-50 bg-blue-600 text-white px-6 py-3 rounded shadow"
				onClick={() => setTrackModalOpen(true)}
			>
				Probar envío/rastreo API
			</button>

			{/* Modal para probar la API */}
			{trackModalOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 shadow-lg min-w-[320px] relative">
						<button
							className="absolute top-2 right-2 text-gray-500"
							onClick={() => setTrackModalOpen(false)}
						>
							✕
						</button>
						<h2 className="text-lg font-semibold mb-4">Rastrear producto</h2>
						<input
							className="border p-2 w-full mb-3"
							value={trackingNumber}
							onChange={(e) => setTrackingNumber(e.target.value)}
							placeholder="Número de guía"
						/>
						<button
							onClick={handleTrack}
							className="w-full px-4 py-2 bg-blue-500 text-white rounded"
							disabled={loading || !trackingNumber}
						>
							{loading ? "Consultando..." : "Rastrear"}
						</button>
						{result && (
							<pre className="mt-4 bg-gray-100 p-2 rounded text-sm max-h-60 overflow-auto">
								{JSON.stringify(result, null, 2)}
							</pre>
						)}
					</div>
				</div>
			)}
			{/* Botón para abrir el modal de crear pedido */}
			<button
				className="fixed bottom-40 right-8 z-50 bg-green-600 text-white px-6 py-3 rounded shadow"
				onClick={() => setCreateModalOpen(true)}
			>
				Crear pedido (API Envia)
			</button>
			{/* Modal para crear pedido */}
			{createModalOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 shadow-lg min-w-[320px] relative">
						<button
							className="absolute top-2 right-2 text-gray-500"
							onClick={() => setCreateModalOpen(false)}
						>
							✕
						</button>
						<h2 className="text-lg font-semibold mb-4">Crear pedido</h2>
						<input
							className="border p-2 w-full mb-3"
							value={pedido.recipient}
							onChange={e => setPedido({ ...pedido, recipient: e.target.value })}
							placeholder="Nombre del destinatario"
						/>
						<input
							className="border p-2 w-full mb-3"
							value={pedido.address}
							onChange={e => setPedido({ ...pedido, address: e.target.value })}
							placeholder="Dirección"
						/>
						<input
							className="border p-2 w-full mb-3"
							value={pedido.package}
							onChange={e => setPedido({ ...pedido, package: e.target.value })}
							placeholder="Descripción del paquete"
						/>
						<button
							onClick={handleCreatePedido}
							className="w-full px-4 py-2 bg-green-500 text-white rounded"
							disabled={pedidoLoading || !pedido.recipient || !pedido.address || !pedido.package}
						>
							{pedidoLoading ? "Enviando..." : "Crear pedido"}
						</button>
						{pedidoResult && (
							<pre className="mt-4 bg-gray-100 p-2 rounded text-sm max-h-60 overflow-auto">
								{JSON.stringify(pedidoResult, null, 2)}
							</pre>
						)}
					</div>
				</div>
			)}
		</div>
	);
}