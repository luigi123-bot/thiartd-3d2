"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import { createClient } from "@supabase/supabase-js";
import Loader from "~/components/providers/UiProvider";
import CreateProductModal from "~/components/CreateProductModal";
import ConfiguracionModal from "~/components/ConfiguracionModal";
import { FiSettings, FiEdit2, FiEye, FiStar, FiTrash2 } from "react-icons/fi";
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
		id: string | number;
		nombre: string;
		descripcion: string;
		categoria: string;
		tamano: string;
		stock: number;
		precio: number;
		destacado: boolean;
		image_url?: string;
		producto_imagenes?: { image_url: string }[];
		model_url?: string;
		video_url?: string;
		precios_variantes?: Record<string, unknown>;
	}

	const [productos, setProductos] = useState<Producto[]>([]);
	const [loading, setLoading] = useState(true);
	const [modalOpen, setModalOpen] = useState(false);
	const [editProduct, setEditProduct] = useState<Producto | null>(null);
	const [deleteProduct, setDeleteProduct] = useState<Producto | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [modalDetalle, setModalDetalle] = useState<Producto | null>(null);
	const [destacando, setDestacando] = useState<string | number | null>(null);
	const [urlPopupProduct, setUrlPopupProduct] = useState<Producto | null>(null);
	const [configModalOpen, setConfigModalOpen] = useState(false);

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

	// Destacar o alternar producto como recomendado
	const handleDestacar = async (producto: Producto) => {
		setDestacando(producto.id);
		const nuevoEstado = !producto.destacado;
		await supabase.from("productos").update({ destacado: nuevoEstado }).eq("id", producto.id);
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
						<Button 
							onClick={() => setConfigModalOpen(true)}
							variant="outline" 
							className="h-10 w-10 p-0 rounded-full border border-slate-200 hover:border-slate-900 bg-white text-slate-900 flex items-center justify-center shrink-0 shadow-sm"
							title="Configuración de Parámetros"
						>
							<FiSettings className="w-5 h-5 animate-hover-spin" />
						</Button>
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
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
							{productosPagina.map((producto) => (
								<div
									key={producto.id}
									className="group relative flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 overflow-hidden animate-fadeIn"
								>
									{/* Encabezado / Imagen */}
									<div className="relative w-full aspect-[4/3] bg-gradient-to-b from-slate-50 to-slate-100/60 flex items-center justify-center p-3 border-b border-slate-100 overflow-hidden">
										<Image
											src={producto.image_url ?? producto.producto_imagenes?.[0]?.image_url ?? "/logo.png"}
											alt={producto.nombre}
											fill
											className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
											sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
											priority={false}
										/>

										{/* Badges superiores */}
										<div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
											<span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-white/95 backdrop-blur-md text-slate-700 shadow-sm border border-slate-200/60 uppercase">
												{producto.categoria}
											</span>
											{producto.destacado && (
												<span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-amber-950 shadow-sm">
													<FiStar className="w-3 h-3 fill-amber-950 text-amber-950" />
													Destacado
												</span>
											)}
										</div>

										{/* Botón Destacar (Estrella) */}
										<button
											type="button"
											onClick={() => handleDestacar(producto)}
											disabled={destacando === producto.id}
											title={producto.destacado ? "Quitar de recomendados" : "Marcar como recomendado"}
											className={clsx(
												"absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm backdrop-blur-md",
												producto.destacado
													? "bg-amber-400 text-white hover:bg-amber-500 scale-100 hover:scale-110 shadow-amber-200"
													: "bg-white/85 text-slate-400 hover:text-amber-500 hover:bg-white hover:scale-110"
											)}
										>
											<FiStar className={clsx("w-4 h-4", producto.destacado && "fill-white text-white")} />
										</button>

										{/* Badges inferiores en imagen */}
										<div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
											{/* Stock */}
											<span
												className={clsx(
													"px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-sm backdrop-blur-md flex items-center gap-1.5",
													producto.stock === 0
														? "bg-rose-500/90 text-white"
														: producto.stock <= 5
														? "bg-amber-500/90 text-white"
														: "bg-emerald-600/90 text-white"
												)}
											>
												<span
													className={clsx(
														"w-1.5 h-1.5 rounded-full",
														producto.stock === 0 ? "bg-white" : "bg-white animate-pulse"
													)}
												/>
												{producto.stock === 0 ? "Agotado" : `Stock: ${producto.stock}`}
											</span>

											{/* Tamaño */}
											{producto.tamano && (
												<span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-900/75 backdrop-blur-md text-white shadow-sm">
													{producto.tamano}
												</span>
											)}
										</div>
									</div>

									{/* Cuerpo de la Card */}
									<div className="p-4 flex flex-col flex-1 justify-between gap-3">
										<div>
											<h3
												className="font-bold text-base text-slate-900 line-clamp-1 group-hover:text-[#00a19a] transition-colors"
												title={producto.nombre}
											>
												{producto.nombre}
											</h3>
											<p
												className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed min-h-[2rem]"
												title={producto.descripcion}
											>
												{producto.descripcion || "Sin descripción adicional."}
											</p>
										</div>

										{/* Precio */}
										<div className="flex items-baseline justify-between pt-1 border-t border-slate-100">
											<div className="flex items-baseline gap-1.5">
												<span className="text-[11px] font-bold text-slate-400 uppercase">COP</span>
												<span className="text-lg font-black text-slate-900 tracking-tight">
													${Number(producto.precio || 0).toLocaleString("es-CO")}
												</span>
											</div>
										</div>

										{/* Acciones */}
										<div className="flex items-center gap-2 pt-1 border-t border-slate-100">
											{/* Visualizar */}
											<Button
												size="sm"
												variant="outline"
												className="flex-1 h-9 rounded-xl text-xs font-semibold bg-teal-50/80 hover:bg-teal-100 text-[#00a19a] border-teal-200/60 hover:border-teal-300 transition-colors flex items-center justify-center gap-1.5 shadow-none"
												onClick={() => setUrlPopupProduct(producto)}
												title="Visualizar producto"
											>
												<FiEye className="w-3.5 h-3.5" />
												<span>Ver</span>
											</Button>

											{/* Editar */}
											<Button
												size="sm"
												variant="outline"
												className="flex-1 h-9 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300 transition-colors flex items-center justify-center gap-1.5 shadow-none"
												onClick={() => setEditProduct(producto)}
												title="Editar producto"
											>
												<FiEdit2 className="w-3.5 h-3.5" />
												<span>Editar</span>
											</Button>

											{/* Eliminar */}
											<Button
												size="sm"
												variant="outline"
												className="w-9 h-9 p-0 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border-slate-200 hover:border-rose-200 transition-colors flex items-center justify-center shrink-0 shadow-none"
												onClick={() => setDeleteProduct(producto)}
												title="Eliminar producto"
											>
												<FiTrash2 className="w-3.5 h-3.5" />
											</Button>
										</div>
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
									destacado: editProduct.destacado ?? false,
							  }
							: undefined
					}
				/>
				{/* Modal ajustar inventario — eliminado por requerimiento */}

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
				{/* Modal Visualizar Producto */}
				<Dialog open={!!urlPopupProduct} onOpenChange={(v) => { if (!v) setUrlPopupProduct(null); }}>
					<DialogContent className="rounded-3xl max-w-4xl h-[85vh] flex flex-col p-6 bg-slate-50">
						<DialogHeader className="flex flex-row justify-between items-center pr-8">
							<div>
								<DialogTitle className="text-xl font-bold">Visualización del Producto</DialogTitle>
								<p className="text-xs text-gray-400">Previsualización interactiva de la tienda pública</p>
							</div>
							{urlPopupProduct && (
								<Button
									size="sm"
									variant="outline"
									className="rounded-xl px-4 ml-auto"
									onClick={() => {
										const url = `${window.location.origin}/tienda/productos/${urlPopupProduct.id}`;
										void navigator.clipboard.writeText(url);
										alert("¡Enlace copiado al portapapeles!");
									}}
								>
									Copiar Enlace
								</Button>
							)}
						</DialogHeader>
						<div className="flex-1 w-full bg-white rounded-2xl overflow-hidden shadow-inner border border-slate-100 mt-2">
							{urlPopupProduct && (
								<iframe
									src={`${window.location.origin}/tienda/productos/${urlPopupProduct.id}`}
									className="w-full h-full border-0"
									title="Visualización de Producto"
								/>
							)}
						</div>
						<DialogFooter className="mt-4">
							<Button variant="secondary" className="rounded-xl" onClick={() => setUrlPopupProduct(null)}>
								Cerrar Vista
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Modal Configuraciones */}
				<ConfiguracionModal open={configModalOpen} onOpenChange={setConfigModalOpen} />
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

