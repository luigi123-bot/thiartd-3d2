"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import { createClient } from "@supabase/supabase-js";
import Loader from "~/components/providers/UiProvider";
import CreateProductModal from "~/app/tienda/productos/CreateProductModal";
import AjustarInventarioModal from "./AjustarInventarioModal";
import { FiSettings, FiEdit2, FiEye, FiStar } from "react-icons/fi";
import { Star, BadgeDollarSign } from "lucide-react";
import clsx from "clsx";
import { ProductDetailModal } from "~/components/ProductDetailModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "TU_SUPABASE_URL";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "TU_SUPABASE_ANON_KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

const CATEGORIAS = ["Todas", "Moderno", "Pequeño", "Sin Stock", "Destacados"];

export default function AdminInventarioPage() {
	const [categoria, setCategoria] = useState("Todas");
	const [busqueda, setBusqueda] = useState("");
	const [orden, setOrden] = useState("nombre");
	const [pagina, setPagina] = useState(1);
	const productosPorPagina = 12;

	interface Producto {
		id: number;
		nombre: string;
		descripcion: string;
		categoria: string;
		tamano: string;
		stock: number;
		precio: number;
		destacado: boolean;
		image_url?: string; // Añadido para evitar error de propiedad inexistente
	}

	const [productos, setProductos] = useState<Producto[]>([]);
	const [loading, setLoading] = useState(true);
	const [modalOpen, setModalOpen] = useState(false);
	const [editProduct, setEditProduct] = useState<Producto | null>(null);
	const [deleteProduct, setDeleteProduct] = useState<Producto | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [modalDetalle, setModalDetalle] = useState<Producto | null>(null);
	const [ajustarProducto, setAjustarProducto] = useState<Producto | null>(null);
	const [destacando, setDestacando] = useState<number | null>(null);

	// Métricas
	const totalProductos = productos.length;
	const destacados = productos.filter((p) => p.destacado).length;
	const stockTotal = productos.reduce((acc, p) => acc + (p.stock || 0), 0);
	const sinStock = productos.filter((p) => p.stock === 0).length;

	// Fetch productos
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

	// Filtros y orden
	let productosFiltrados = productos.filter((p) => {
		const matchCategoria =
			categoria === "Todas"
				? true
				: categoria === "Sin Stock"
				? p.stock === 0
				: categoria === "Destacados"
				? p.destacado
				: p.categoria === categoria;
		const matchBusqueda = p.nombre?.toLowerCase().includes(busqueda.toLowerCase());
		return matchCategoria && matchBusqueda;
	});

	productosFiltrados = [...productosFiltrados].sort((a, b) => {
		if (orden === "stock") return b.stock - a.stock;
		if (orden === "precio") return b.precio - a.precio;
		return a.nombre.localeCompare(b.nombre);
	});

	// Paginación
	const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);
	const productosPagina = productosFiltrados.slice(
		(pagina - 1) * productosPorPagina,
		pagina * productosPorPagina
	);

	// Colores de stock
	const getStockColor = (stock: number) =>
		stock === 0
			? "bg-red-100 text-red-600"
			: stock <= 5
			? "bg-yellow-100 text-yellow-700"
			: "bg-green-100 text-green-700";

	// Eliminar producto
	const handleDelete = async () => {
		if (!deleteProduct) return;
		setDeleting(true);
		await supabase.from("productos").delete().eq("id", deleteProduct.id);
		setDeleting(false);
		setDeleteProduct(null);
		void fetchProductos();
	};

	// Crear/editar producto
	const handleProductCreated = async () => {
		await fetchProductos();
	};

	// Destacar producto como recomendado
	const handleDestacar = async (producto: Producto) => {
		setDestacando(producto.id);
		// Primero, quitar el destacado de todos los productos
		await supabase.from("productos").update({ destacado: false }).neq("id", producto.id);
		// Luego, destacar solo el producto seleccionado
		await supabase.from("productos").update({ destacado: true }).eq("id", producto.id);
		await fetchProductos();
		setDestacando(null);
	};

	return (
		<div className="flex flex-col min-h-screen bg-white text-[#111827] font-[Inter,Poppins,sans-serif]">
			<main className="flex-1 p-2 sm:p-4 md:p-10">
				{/* Métricas */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
					<MetricCard
						icon={
							<span className="text-blue-500">
								<BadgeDollarSign className="w-6 h-6" />
							</span>
						}
						label="Total productos"
						value={totalProductos}
						bg="bg-blue-50"
					/>
					<MetricCard
						icon={
							<span className="text-yellow-500">
								<FiSettings className="w-6 h-6" />
							</span>
						}
						label="Sin stock"
						value={sinStock}
						bg="bg-yellow-50"
					/>
					<MetricCard
						icon={
							<span className="text-pink-500">
								<Star className="w-6 h-6" />
							</span>
						}
						label="Destacados"
						value={destacados}
						bg="bg-pink-50"
					/>
					<MetricCard
						icon={
							<span className="text-green-500">
								<FiSettings className="w-6 h-6" />
							</span>
						}
						label="Stock total"
						value={stockTotal}
						bg="bg-green-50"
					/>
				</div>
				{/* Filtros */}
				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
					<div className="flex flex-wrap gap-2">
						{CATEGORIAS.map((cat) => (
							<button
								key={cat}
								className={clsx(
									"px-4 py-1 rounded-full text-sm font-medium border transition-all",
									categoria === cat
										? "bg-black text-white border-black shadow"
										: "bg-gray-100 text-black border-gray-200 hover:bg-gray-200"
								)}
								onClick={() => setCategoria(cat)}
							>
								{cat}
							</button>
						))}
					</div>
					<div className="flex gap-2 items-center">
						<input
							type="text"
							placeholder="Buscar producto..."
							className="pl-3 pr-3 py-2 rounded-full border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00a19a] text-sm"
							value={busqueda}
							onChange={(e) => setBusqueda(e.target.value)}
						/>
						<select
							className="pl-3 pr-6 py-2 rounded-full border border-gray-200 bg-white shadow-sm text-sm"
							value={orden}
							onChange={(e) => setOrden(e.target.value)}
							title="Ordenar productos por"
						>
							<option value="nombre">Nombre</option>
							<option value="stock">Stock</option>
							<option value="precio">Precio</option>
						</select>
						<Button onClick={() => setModalOpen(true)} className="rounded-full font-semibold">
							Nuevo producto
						</Button>
					</div>
				</div>
				{/* Grid de productos */}
				{loading ? (
					<Loader />
				) : productosFiltrados.length === 0 ? (
					<div className="text-center py-8 text-gray-500">No hay productos registrados.</div>
				) : (
					<>
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
							{productosPagina.map((producto) => (
								<div
									key={producto.id}
									className="flex flex-col items-center bg-white rounded-xl shadow-sm hover:shadow-lg transition-all w-full max-w-[250px] mx-auto p-4 animate-fadeIn overflow-hidden"
								>
									{/* Imagen */}
									<div className="w-full flex justify-center mb-3">
										<div className="bg-gradient-to-br from-cyan-50 to-white rounded-xl shadow p-1 transition-transform duration-200 hover:scale-105 flex items-center justify-center" style={{ width: 120, height: 120 }}>
											{/** Usar image_url real si existe; mantener proporción y cubrir sin salirse del card */}
											<Image
												src={producto.image_url ?? "/Logo%20Thiart%20Tiktok.png"}
												alt={producto.nombre}
												width={120}
												height={120}
												className="object-cover w-[120px] h-[120px] rounded-xl shadow"
												priority={false}
											/>
										</div>
									</div>
									{/* Datos */}
									<div className="flex flex-col w-full space-y-1">
										<div className="flex items-center gap-2">
											<span className="font-bold text-lg text-gray-900 truncate" style={{ maxWidth: 140 }}>{producto.nombre}</span>
											{producto.destacado && (
												<FiStar className="w-5 h-5 text-yellow-400" title="Producto recomendado" />
											)}
										</div>
										<div className="text-gray-500 text-sm line-clamp-2 truncate" style={{ maxWidth: 200 }}>{producto.descripcion}</div>
										<div className="flex flex-wrap gap-2 mt-1">
											<span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{producto.categoria}</span>
											<span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">{producto.tamano}</span>
											<span
												className={clsx(
													"px-2 py-0.5 rounded-full text-xs font-semibold shadow-inner border",
													producto.stock === 0
														? "bg-red-100 text-red-600 border-red-200"
														: producto.stock <= 5
														? "bg-yellow-100 text-yellow-800 border-yellow-200"
														: "bg-green-100 text-green-700 border-green-200"
												)}
												title={
													producto.stock === 0
														? "Sin stock"
														: producto.stock <= 5
														? "Quedan pocas unidades"
														: "Stock suficiente"
												}
											>
												{producto.stock === 0 ? "Sin stock" : `Stock: ${producto.stock}`}
											</span>
										</div>
										<div className="flex items-center gap-2 mt-2">
											<span className="flex items-center gap-1 font-bold text-base text-emerald-600">
												<BadgeDollarSign className="w-5 h-5" /> ${producto.precio}
											</span>
										</div>
									</div>
									{/* Acciones */}
									<div className="flex justify-center gap-2 w-full mt-4">
										<Button
											size="sm"
											variant="outline"
											className="rounded-full text-xs px-3 flex items-center gap-1 bg-gray-100 hover:bg-gray-200"
											onClick={() => setEditProduct(producto)}
										>
											<FiEdit2 className="w-4 h-4" /> Editar
										</Button>
										<Button
											size="sm"
											variant="outline"
											className="rounded-full text-xs px-3 flex items-center gap-1"
											onClick={() => setAjustarProducto(producto)}
										>
											<FiSettings className="w-4 h-4" /> Ajustar
										</Button>
										<Button
											size="sm"
											variant={producto.destacado ? "default" : "outline"}
											className={clsx(
												"rounded-full text-xs px-3 flex items-center gap-1",
												producto.destacado
													? "bg-yellow-400 text-white hover:bg-yellow-500"
													: "bg-gray-100 hover:bg-yellow-100"
											)}
											onClick={() => handleDestacar(producto)}
											disabled={destacando === producto.id}
											title="Marcar como recomendado"
										>
											<FiStar className={producto.destacado ? "text-white" : "text-yellow-400"} />
											{producto.destacado ? "Recomendado" : "Destacar"}
										</Button>
									</div>
									{/* Botón Ver más */}
									<div className="w-full flex justify-center mt-2">
										<Button
											size="sm"
											variant="ghost"
											className="rounded-full text-xs px-3 flex items-center gap-1"
											onClick={() => setModalDetalle(producto)}
										>
											<FiEye className="w-4 h-4" /> Ver más
										</Button>
									</div>
								</div>
							))}
						</div>
						{/* Paginación */}
						{totalPaginas > 1 && (
							<div className="flex justify-center items-center gap-2 mt-8">
								<Button
									size="sm"
									variant="outline"
									className="rounded-full px-3"
									onClick={() => setPagina((p) => Math.max(1, p - 1))}
									disabled={pagina === 1}
								>
									Anterior
								</Button>
								{Array.from({ length: totalPaginas }).map((_, idx) => (
									<button
										key={idx}
										className={clsx(
											"w-8 h-8 rounded-full flex items-center justify-center font-bold",
											pagina === idx + 1
												? "bg-black text-white"
												: "bg-gray-100 text-gray-700 hover:bg-gray-200"
										)}
										onClick={() => setPagina(idx + 1)}
									>
										{idx + 1}
									</button>
								))}
								<Button
									size="sm"
									variant="outline"
									className="rounded-full px-3"
									onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
									disabled={pagina === totalPaginas}
								>
									Siguiente
								</Button>
							</div>
						)}
					</>
				)}
				{/* Modal crear/editar */}
				<CreateProductModal
					open={modalOpen || !!editProduct}
					onOpenChangeAction={(open: boolean) => {
						setModalOpen(open);
						if (!open) setEditProduct(null);
					}}
					onProductCreatedAction={handleProductCreated}
					product={
						editProduct
							? {
									...editProduct,
									detalles: "",
									destacado: false,
							  }
							: undefined
					}
				/>
				{/* Modal ajustar inventario */}
				<AjustarInventarioModal
					open={!!ajustarProducto}
					onOpenChange={(v: boolean) => { if (!v) setAjustarProducto(null); }}
					producto={
						ajustarProducto
							? {
									nombre: ajustarProducto.nombre,
									stock: ajustarProducto.stock,
									precio: ajustarProducto.precio,
							  }
							: { nombre: "", stock: 0, precio: 0 }
					}
					onAjuste={async (_ajuste) => {
						// Aquí deberías implementar la lógica para ajustar el inventario en la base de datos
						// y luego refrescar la lista de productos
						await fetchProductos();
						setAjustarProducto(null);
					}}
					loading={false}
				/>
				{/* Modal eliminar */}
				<Dialog open={!!deleteProduct} onOpenChange={(v) => { if (!v) setDeleteProduct(null); }}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>¿Eliminar producto?</DialogTitle>
						</DialogHeader>
						<div>
							¿Estás seguro de que deseas eliminar <b>{deleteProduct?.nombre}</b>?
						</div>
						<DialogFooter>
							<Button variant="secondary" onClick={() => setDeleteProduct(null)} disabled={deleting}>
								Cancelar
							</Button>
							<Button
								variant="destructive"
								onClick={handleDelete}
								disabled={deleting}
							>
								{deleting ? "Eliminando..." : "Eliminar"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
				{/* Modal ver más */}
				<ProductDetailModal
					open={!!modalDetalle}
					onOpenChange={(v) => { if (!v) setModalDetalle(null); }}
					producto={modalDetalle}
					getStockColor={getStockColor}
				/>
				{/* Animaciones */}
				<style jsx global>{`
					.animate-fade-in {
						animation: fadeInCard 0.6s cubic-bezier(.4,0,.2,1);
					}
					@keyframes fadeInCard {
						from { opacity: 0; transform: translateY(24px);}
						to { opacity: 1; transform: translateY(0);}
					}
					.animate-fadeIn {
						animation: fadeInModal 0.4s cubic-bezier(.4,0,.2,1);
					}
					@keyframes fadeInModal {
						from { opacity: 0; transform: translateY(32px) scale(0.98);}
						to { opacity: 1; transform: translateY(0) scale(1);}
					}
				`}</style>
			</main>
		</div>
	);
}

// Card de métrica
function MetricCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: number; bg: string }) {
	return (
		<div className={`flex flex-col items-center py-6 px-4 border-0 shadow-sm rounded-xl ${bg}`}>
			<div className="mb-2">{icon}</div>
			<div className="text-2xl font-bold text-[#111827]">{value}</div>
			<div className="text-gray-500 text-sm font-medium">{label}</div>
		</div>
	);
}

