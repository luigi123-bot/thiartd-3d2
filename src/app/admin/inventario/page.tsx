"use client";
import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { createClient } from "@supabase/supabase-js";
import Loader from "~/components/providers/UiProvider";
import CreateProductModal from "~/app/tienda/productos/CreateProductModal";
import AjustarInventarioModal from "./AjustarInventarioModal";
import { FiSettings } from "react-icons/fi";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "TU_SUPABASE_URL";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "TU_SUPABASE_ANON_KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

const categorias = ["Todas las categorías", "Moderno", "Abstracto"];
const estados = ["Todos", "Disponibles", "Sin Stock"];

export default function AdminInventarioPage() {
	const [categoria, setCategoria] = useState("Todas las categorías");
	const [estado, setEstado] = useState("Todos");
	const [busqueda, setBusqueda] = useState("");
	interface Producto {
		id: number;
		nombre: string;
		categoria: string;
		stock: number;
		precio: number;
	}

	const [productos, setProductos] = useState<Producto[]>([]);
	const [loading, setLoading] = useState(true);
	const [modalOpen, setModalOpen] = useState(false);
	interface AjustarProducto {
		id: number;
		nombre: string;
		categoria: string;
		stock: number;
		precio: number;
	}

	const [ajustarProducto, setAjustarProducto] = useState<AjustarProducto | null>(null);
	const [ajustando, setAjustando] = useState(false);

	const fetchProductos = async () => {
		setLoading(true);
		const { data } = await supabase
			.from("productos")
			.select("*")
			.order("id", { ascending: false });
		setProductos(Array.isArray(data) ? data : []);
		setLoading(false);
	};

	useEffect(() => {
		void fetchProductos();
	}, []);

	const handleRevalidate = async () => {
		setLoading(true);
		await fetchProductos();
		setLoading(false);
	};

	const handleAjuste = async ({
		tipo,
		cantidad,
		precio,
	}: {
		tipo: string;
		cantidad: number;
		razon: string;
		precio: number;
	}) => {
		if (!ajustarProducto) return;
		setAjustando(true);
		const nuevoStock =
			tipo === "add"
				? ajustarProducto.stock + cantidad
				: Math.max(ajustarProducto.stock - cantidad, 0);
		await supabase
			.from("productos")
			.update({ stock: nuevoStock, precio })
			.eq("id", ajustarProducto.id);
		setAjustando(false);
		setAjustarProducto(null);
		 void fetchProductos();
	};

	// Filtros
	const productosFiltrados = productos.filter((p) => {
		const matchCategoria = categoria === "Todas las categorías" || p.categoria === categoria;
		const matchEstado =
			estado === "Todos" ||
			(estado === "Disponibles" && p.stock > 0) ||
			(estado === "Sin Stock" && p.stock === 0);
		const matchBusqueda = p.nombre?.toLowerCase().includes(busqueda.toLowerCase());
		return matchCategoria && matchEstado && matchBusqueda;
	});

	// Resumen
	const resumen = [
		{ label: "Total Productos", value: productos.length, icon: "📦" },
		{ label: "Stock Total", value: productos.reduce((acc, p) => acc + (p.stock || 0), 0), icon: "↗️" },
		{ label: "Sin Stock", value: productos.filter((p) => p.stock === 0).length, icon: "⛔" },
		{ label: "Stock Bajo", value: productos.filter((p) => p.stock > 0 && p.stock <= 5).length, icon: "⚠️" },
	];

	return (
		<div className="p-8">
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
				<div>
					<h1 className="text-3xl font-bold">Gestión de Inventario</h1>
					<p className="text-gray-500">Administra el stock de tus productos</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" onClick={handleRevalidate} className="flex gap-2 items-center">
						<span className="material-icons text-base">sync</span>
						Sincronizar Caché
					</Button>
					<Button onClick={() => setModalOpen(true)} className="flex gap-2 items-center">
						<span className="material-icons text-base">add</span>
						Nuevo Producto
					</Button>
				</div>
			</div>
			{/* Modal para crear producto */}
			<CreateProductModal
				open={modalOpen}
				onOpenChangeAction={(open: boolean) => setModalOpen(open)}
				onProductCreated={fetchProductos}
			/>
			{/* Resumen */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
				{resumen.map((item) => (
					<div key={item.label} className="bg-white rounded-lg border p-4 flex flex-col items-center shadow-sm">
						<div className="text-2xl mb-1">{item.icon}</div>
						<div className="text-2xl font-bold">{item.value}</div>
						<div className="text-gray-500 text-sm">{item.label}</div>
					</div>
				))}
			</div>
			{/* Filtros */}
			<div className="bg-white rounded-lg border p-4 mb-6">
				<h2 className="font-semibold mb-4">Filtros</h2>
				<div className="flex flex-col md:flex-row gap-4">
					<input
						type="text"
						placeholder="Buscar productos..."
						className="border rounded px-3 py-2 w-full md:w-1/3"
						value={busqueda}
						onChange={(e) => setBusqueda(e.target.value)}
					/>
					<select
						className="border rounded px-3 py-2 w-full md:w-1/4"
						value={categoria}
						onChange={(e) => setCategoria(e.target.value)}
						aria-label="Filtrar por categoría"
					>
						{categorias.map((cat) => (
							<option key={cat} value={cat}>
								{cat}
							</option>
						))}
					</select>
					<select
						className="border rounded px-3 py-2 w-full md:w-1/4"
						value={estado}
						onChange={(e) => setEstado(e.target.value)}
						aria-label="Filtrar por estado"
					>
						{estados.map((est) => (
							<option key={est} value={est}>
								{est}
							</option>
						))}
					</select>
				</div>
			</div>
			{/* Tabs */}
			<div className="flex gap-2 mb-4">
				{["Todos", "Disponibles", "Sin Stock"].map((tab) => (
					<button
						key={tab}
						className={`px-4 py-1 rounded-full text-sm font-medium border ${
							estado === tab
								? "bg-black text-white border-black"
								: "bg-white text-black border-gray-200"
						}`}
						onClick={() => setEstado(tab)}
					>
						{tab} (
						{tab === "Todos"
							? productos.length
							: tab === "Disponibles"
							? productos.filter((p) => p.stock > 0).length
							: productos.filter((p) => p.stock === 0).length}
						)
					</button>
				))}
			</div>
			{/* Productos */}
			{loading ? (
				<Loader />
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
					{productosFiltrados.map((producto) => (
						<div key={producto.id} className="bg-white rounded-lg border p-4 flex flex-col gap-2 shadow-sm">
							<div className="flex justify-between items-center mb-2">
								<div className="font-semibold">{producto.nombre}</div>
								<span className="bg-black text-white text-xs rounded px-2 py-0.5 font-semibold">
									Stock: {producto.stock}
								</span>
							</div>
							<div className="text-lg font-bold mb-1">${producto.precio}</div>
							<div className="flex gap-2 items-center mb-2">
								<span className="bg-gray-100 text-xs px-2 py-0.5 rounded">{producto.categoria}</span>
								<Button
									size="sm"
									variant="outline"
									className="ml-auto flex gap-1 items-center"
									onClick={() => setAjustarProducto(producto)}
								>
									<FiSettings className="text-base" />
									Ajustar
								</Button>
							</div>
						</div>
					))}
				</div>
			)}
			{ajustarProducto && (
				<AjustarInventarioModal
					open={!!ajustarProducto}
					onOpenChange={(open) => setAjustarProducto(open ? ajustarProducto : null)}
					producto={{
						nombre: ajustarProducto.nombre,
						stock: ajustarProducto.stock,
						precio: ajustarProducto.precio,
					}}
					onAjuste={handleAjuste}
					loading={ajustando}
				/>
			)}
		</div>
	);
}
