"use client";
import { useState, useEffect } from "react";
import { FiSend } from "react-icons/fi";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { createClient } from "@supabase/supabase-js";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter
} from "~/components/ui/dialog"; // Ajusta la ruta si es necesario
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "TU_SUPABASE_URL";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "TU_SUPABASE_ANON_KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

const PRESUPUESTOS = [
	"Menos de $20.000",
	"$20.000 – $50.000",
	"$50.000 – $100.000",
	"Más de $100.000",
	"A convenir",
];

interface CarritoProducto {
	id: string;
	nombre: string;
	precio: number;
	imagen?: string;
	cantidad: number;
	stock: number;
	categoria: string;
	destacado: boolean;
	descripcion?: string;
	tamano?: string;
	detalles?: string;
}

export default function PersonalizarPage() {
	const [nombre, setNombre] = useState("");
	const [email, setEmail] = useState("");
	const [tipoProyecto, setTipoProyecto] = useState("");
	const [presupuesto, setPresupuesto] = useState(PRESUPUESTOS[0]);
	const [descripcion, setDescripcion] = useState("");

	const [mensaje, setMensaje] = useState("");
	const [loading, setLoading] = useState(false);
	const [showPago, setShowPago] = useState(false);
	const [chatOpen, setChatOpen] = useState(false);
	type Mensaje = {
		id?: string | number;
		conversacion_id: string;
		usuario_id?: string;
		remitente: string;
		texto: string;
		hora: string;
		created_at?: string;
	};
	const [mensajes, setMensajes] = useState<Mensaje[]>([]);
	const [nuevoMensaje, setNuevoMensaje] = useState("");
	const [convId, setConvId] = useState<string | null>(null);
	const [usuario, setUsuario] = useState<{ id?: string; nombre?: string; email?: string } | null>(null);

	useEffect(() => {
		// Obtén el usuario actual de Supabase Auth
		void (async () => {
			const { data } = await supabase.auth.getUser();
			if (data?.user) {
				const userMetadata: { nombre?: string } = data.user.user_metadata ?? {};
				setUsuario({
					id: data.user.id,
					nombre: userMetadata.nombre ?? data.user.email,
					email: data.user.email,
				});
			}
		})();
	}, []);

	// Crear o buscar conversación para el usuario
	useEffect(() => {
		if (!usuario) return;
		void (async () => {
			type Conversacion = { id: string; usuario_id: string; cliente_nombre: string };
			let conv: Conversacion | null = null;
			try {
				const convResult = await supabase
					.from("conversaciones")
					.select("*")
					.eq("usuario_id", usuario.id)
					.single();
				const convData: Conversacion | null = convResult.data as Conversacion | null;
				const convError = convResult.error;
				if (convError) {
					// handle error if needed
				}
				conv = convData;
				if (!conv) {
					const nuevaResult = await supabase
						.from("conversaciones")
						.insert([
							{
								usuario_id: usuario.id,
								cliente_nombre:
									usuario.nombre ??
									usuario.email ??
									"Invitado",
							},
						])
						.select()
						.single();
					if (nuevaResult.error) {
						// handle error if needed
					}
					conv = nuevaResult.data as Conversacion | null;
				}
				if (conv?.id) {
					setConvId(conv.id);
				}
			} catch {
				// handle unexpected errors
			}
		})();
	}, [usuario]);

	// Cargar mensajes y suscripción realtime
	useEffect(() => {
		if (!convId) return;
		let ignore = false;
		supabase
			.from("mensajes")
			.select("*")
			.eq("conversacion_id", convId)
			.order("created_at", { ascending: true })
			.then(({ data }) => {
				if (!ignore) setMensajes(Array.isArray(data) ? data : []);
			});
		// Suscripción realtime
		const channel = supabase
			.channel("mensajes-personalizar")
			.on(
				"postgres_changes",
				{ event: "INSERT", schema: "public", table: "mensajes", filter: `conversacion_id=eq.${convId}` },
				(payload) => {
					setMensajes((prev) => [...prev, payload.new as Mensaje]);
				}
			)
			.subscribe();
		return () => {
			ignore = true;
			void supabase.removeChannel(channel);
		};
	}, [convId]);

	// Añade helpers para el carrito
	function addToCarritoLocal(producto: CarritoProducto) {
		if (typeof window === "undefined") return;
		const carritoLocal = localStorage.getItem("carrito");
		const carrito: CarritoProducto[] = carritoLocal ? JSON.parse(carritoLocal) as CarritoProducto[] : [];
		carrito.push({ ...producto, cantidad: 1 });
		localStorage.setItem("carrito", JSON.stringify(carrito));
		console.log("Producto personalizado agregado al carrito:", producto);
	}

	function clearCarritoLocal() {
		if (typeof window === "undefined") return;
		localStorage.setItem("carrito", "[]");
	}

	// Manejar envío de personalización con integración a API de Pedidos
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setMensaje("");

		if (!usuario) {
			setMensaje("Debes iniciar sesión para enviar una solicitud. Por favor, inicia sesión e inténtalo de nuevo.");
			setLoading(false);
			return;
		}

		try {
			// Construimos el cuerpo del pedido para "Cotización"
			const orderPayload = {
				cliente_id: usuario.id,
				productos: [
					{
						nombre: `Cotización: ${tipoProyecto || "Proyecto Personalizado"}`,
						cantidad: 1,
						precio_unitario: 0,
						categoria: "Cotización",
					}
				],
				total: 0,
				costo_envio: 0,
				estado: "pendiente_cotizacion", // Estado especial para identificar cotizaciones
				datos_contacto: {
					nombre: nombre,
					email: email,
					telefono: ""
				},
				datos_envio: {
					direccion: "Solicitud Digital",
					ciudad: "N/A",
					departamento: "N/A",
					codigoPostal: "000000",
					telefono: "",
					notas: `[Cotización]
Tipo: ${tipoProyecto}
Presupuesto: ${presupuesto}
Descripción: ${descripcion}`
				}
			};

			const res = await fetch("/api/pedidos", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(orderPayload),
			});

			const data = await res.json();

			if (res.ok) {
				setMensaje("¡Solicitud enviada con éxito! Revisa 'Mis Pedidos' para ver el estado.");
				// Limpiar formulario
				setDescripcion("");
				setTipoProyecto("");
				setPresupuesto(PRESUPUESTOS[0]);
			} else {
				setMensaje(`Error al enviar: ${data.error || "Inténtalo de nuevo."}`);
			}
		} catch (error) {
			console.error("Error enviando cotización:", error);
			setMensaje("Ocurrió un error al conectar con el servidor.");
		} finally {
			setLoading(false);
		}
	};

	// Simular pago y crear producto + pedido
	const handlePagar = async () => {
		setLoading(true);
		const carritoLocal = typeof window !== "undefined" ? localStorage.getItem("carrito") : null;
		const carrito: CarritoProducto[] = carritoLocal ? JSON.parse(carritoLocal) as CarritoProducto[] : [];
		if (carrito.length === 0) {
			setMensaje("No hay productos personalizados en el carrito.");
			setShowPago(false);
			setLoading(false);
			return;
		}

		// Envía el pedido al backend
		const res = await fetch("/api/pedidos", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				cliente_id: usuario?.id,
				productos: carrito.map((prod: CarritoProducto) => ({
					nombre: prod.nombre,
					descripcion: prod.descripcion,
					categoria: prod.categoria,
					tamano: prod.tamano,
					detalles: prod.detalles,
					cantidad: prod.cantidad,
					precio_unitario: prod.precio,
				})),
				total: 0, // Gratis por ahora
				estado: "pendiente",
				direccion: "",
				datos_contacto: { nombre: usuario?.nombre, email: usuario?.email },
			}),
		});
		if (res.ok) {
			clearCarritoLocal();
			setShowPago(false);
			setMensaje("¡Pago realizado! Tu producto personalizado está en proceso.");
		} else {
			setMensaje("Error al crear el pedido.");
		}
		setLoading(false);
	};

	// Enviar mensaje
	const enviarMensaje = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!nuevoMensaje.trim() || !convId) return;
		await supabase.from("mensajes").insert([
			{
				conversacion_id: convId,
				usuario_id: usuario?.id,
				remitente: "cliente",
				texto: nuevoMensaje,
				hora: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
			},
		]);
		setNuevoMensaje("");
	};

	return (
		<div className="bg-gray-50 min-h-screen flex flex-col font-sans items-center justify-center py-12 md:py-20">
			{/* Header */}
			<header className="px-4 text-center mb-10 w-full max-w-4xl">
				<h1 className="text-3xl md:text-5xl font-extrabold mb-4 text-[#0f172a] tracking-tight leading-tight">
					Cuéntanos tu idea y la <span className="text-[#009688]">hacemos<br className="hidden md:block" />realidad</span>
				</h1>
				<p className="text-lg text-gray-500 max-w-2xl mx-auto font-medium">
					Completa el formulario y te enviaremos una cotización personalizada.
				</p>
			</header>

			{/* Formulario */}
			<main className="w-full max-w-5xl px-4">
				<div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 p-8 md:p-12">
					<form className="flex flex-col gap-8" onSubmit={handleSubmit}>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
							<div className="space-y-2.5">
								<label className="text-sm font-bold text-gray-800">Nombre *</label>
								<Input
									placeholder="Tu nombre completo"
									className="h-12 rounded-xl border-gray-200 bg-white px-4 text-base focus:ring-2 focus:ring-[#009688] focus:border-transparent transition-all placeholder:text-gray-400"
									value={nombre}
									onChange={(e) => setNombre(e.target.value)}
									required
								/>
							</div>
							<div className="space-y-2.5">
								<label className="text-sm font-bold text-gray-800">Correo electrónico *</label>
								<Input
									type="email"
									placeholder="tu@email.com"
									className="h-12 rounded-xl border-gray-200 bg-white px-4 text-base focus:ring-2 focus:ring-[#009688] focus:border-transparent transition-all placeholder:text-gray-400"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
								/>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
							<div className="space-y-2.5">
								<label className="text-sm font-bold text-gray-800">Tipo de proyecto *</label>
								<div className="relative">
									<select
										className="w-full h-12 rounded-xl border border-gray-200 bg-white px-4 py-2 text-base text-gray-700 focus:ring-2 focus:ring-[#009688] focus:border-transparent transition-all outline-none appearance-none cursor-pointer"
										value={tipoProyecto}
										onChange={(e) => setTipoProyecto(e.target.value)}
										required
									>
										<option value="" disabled>Selecciona una opción</option>
										<option value="impresion_3d">Impresión 3D</option>
										<option value="modelado_3d">Modelado 3D</option>
										<option value="prototipado">Prototipado</option>
										<option value="otro">Otro</option>
									</select>
									<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
										<svg className="h-5 w-5 fill-current" viewBox="0 0 20 20">
											<path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
										</svg>
									</div>
								</div>
							</div>
							<div className="space-y-2.5">
								<label className="text-sm font-bold text-gray-800">Presupuesto aproximado</label>
								<div className="relative">
									<select
										className="w-full h-12 rounded-xl border border-gray-200 bg-white px-4 py-2 text-base text-gray-700 focus:ring-2 focus:ring-[#009688] focus:border-transparent transition-all outline-none appearance-none cursor-pointer"
										value={presupuesto}
										onChange={(e) => setPresupuesto(e.target.value)}
									>
										<option value="" disabled>Selecciona un rango</option>
										{PRESUPUESTOS.map(p => <option key={p} value={p}>{p}</option>)}
									</select>
									<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
										<svg className="h-5 w-5 fill-current" viewBox="0 0 20 20">
											<path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
										</svg>
									</div>
								</div>
							</div>
						</div>

						<div className="space-y-2.5">
							<label className="text-sm font-bold text-gray-800">Descripción de la idea *</label>
							<textarea
								className="w-full rounded-xl border border-gray-200 bg-white p-4 text-base text-gray-700 min-h-[140px] focus:ring-2 focus:ring-[#009688] focus:border-transparent transition-all outline-none resize-none placeholder:text-gray-400"
								placeholder="Cuéntanos qué quieres crear, para qué lo necesitas, cantidad aproximada, etc."
								value={descripcion}
								onChange={(e) => setDescripcion(e.target.value)}
								required
							/>
						</div>

						{mensaje && (
							<div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium text-center animate-fade-in border border-emerald-100">
								{mensaje}
							</div>
						)}

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
							<Button
								type="submit"
								className="w-full bg-[#009688] hover:bg-[#00897b] text-white font-bold h-14 rounded-2xl text-lg shadow-lg shadow-[#009688]/20 transition-all transform hover:scale-[1.01] flex items-center justify-center gap-2.5"
								disabled={loading}
							>
								<FiSend className="w-5 h-5" />
								{loading ? "Enviando..." : "Enviar y cotizar mi proyecto"}
							</Button>

							<a
								href="https://wa.me/573000000000"
								target="_blank"
								rel="noopener noreferrer"
								className="w-full bg-[#25D366] hover:bg-[#22bf5b] text-white font-bold h-14 rounded-2xl text-lg shadow-lg shadow-[#25D366]/20 transition-all transform hover:scale-[1.01] flex items-center justify-center gap-2.5"
							>
								{/* WhatsApp Icon */}
								<svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
									<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
								</svg>
								Prefiero escribir por WhatsApp
							</a>
						</div>
					</form>
				</div>
			</main>
			{/* Modal de pago */}
			<Dialog open={showPago} onOpenChange={setShowPago}>
				<DialogContent className="w-[calc(100%-2rem)] sm:max-w-md mx-auto">
					<DialogHeader>
						<DialogTitle className="text-base sm:text-lg">Pago de Personalización</DialogTitle>
					</DialogHeader>
					<div className="text-center py-3 sm:py-4">
						<div className="text-xl sm:text-2xl font-bold mb-2">Total: $0</div>
						<div className="mb-3 sm:mb-4 text-xs sm:text-sm text-gray-600">Por ahora, la personalización es gratuita para pruebas.</div>
						<Button className="w-full text-sm sm:text-base" onClick={handlePagar} disabled={loading}>
							{loading ? "Procesando..." : "Finalizar compra"}
						</Button>
					</div>
					<DialogFooter>
						<Button variant="secondary" className="text-sm sm:text-base" onClick={() => setShowPago(false)} disabled={loading}>
							Cancelar
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Chat flotante */}
			<button
				className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 bg-black text-white rounded-full p-3 sm:p-4 shadow-lg hover:bg-gray-800 z-[9999]"
				onClick={() => setChatOpen(true)}
				title="Chatea con nosotros"
			>
				<FiSend className="text-lg sm:text-2xl" />
			</button>
			{chatOpen && (
				<div
					className="fixed bottom-16 right-4 sm:bottom-24 sm:right-8 w-[calc(100%-2rem)] xs:w-80 bg-white rounded-xl shadow-lg border flex flex-col z-[9999] chat-float h-[400px] sm:h-auto"
				>
					<div className="flex items-center justify-between p-2 sm:p-3 border-b flex-shrink-0">
						<div className="font-bold text-sm sm:text-base lg:text-lg flex items-center gap-2">
							<FiSend /> <span className="hidden xs:inline">Chat Personalización</span><span className="xs:hidden">Chat</span>
						</div>
						<button onClick={() => setChatOpen(false)} className="p-1 rounded hover:bg-gray-100 text-xl sm:text-2xl" title="Cerrar chat">
							×
						</button>
					</div>
					{/* Área de mensajes con scroll */}
					<div
						className="flex-1 overflow-y-auto chat-messages-area p-2 sm:p-3"
					>
						<div className="flex flex-col gap-1.5 sm:gap-2">
							{mensajes.map((m, idx) => (
								<div
									key={idx}
									className={`flex ${m.remitente === "cliente" ? "justify-end" : "justify-start"}`}
								>
									<div
										className={`rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm max-w-[80%] sm:max-w-[70%] ${m.remitente === "cliente"
											? "bg-black text-white rounded-br-none"
											: "bg-gray-100 text-gray-900 rounded-bl-none"
											}`}
									>
										{m.texto}
										<div className="text-[10px] sm:text-xs text-gray-400 text-right mt-1">{m.hora}</div>
									</div>
								</div>
							))}
						</div>
					</div>
					{/* Input fijo abajo */}
					<form className="flex items-center gap-2 p-2 sm:p-3 border-t flex-shrink-0" onSubmit={enviarMensaje}>
						<input
							type="text"
							className="border rounded px-2 sm:px-3 py-1.5 sm:py-2 w-full text-xs sm:text-sm"
							placeholder="Escribe un mensaje..."
							value={nuevoMensaje}
							onChange={e => setNuevoMensaje(e.target.value)}
						/>
						<button
							type="submit"
							className="bg-black text-white rounded-full p-1.5 sm:p-2 hover:bg-gray-800 flex-shrink-0"
							disabled={!nuevoMensaje.trim()}
							title="Enviar mensaje"
						>
							<FiSend className="text-sm sm:text-base" />
						</button>
					</form>
				</div>
			)}
		</div>
	);
}