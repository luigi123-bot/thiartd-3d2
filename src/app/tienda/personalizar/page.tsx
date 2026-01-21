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

const SIZES = [
	{ label: "Pequeño", desc: "5–10 cm", value: "pequeno" },
	{ label: "Mediano", desc: "10–20 cm", value: "mediano" },
	{ label: "Grande", desc: "20–30 cm", value: "grande" },
	{ label: "Personalizado", desc: "Elige tu tamaño", value: "personalizado" },
];

const MATERIALES = ["PLA", "ABS", "PETG", "Resina", "Otro"];
const COLORES = ["Blanco", "Negro", "Rojo", "Azul", "Verde", "Personalizado"];
const ACABADOS = ["Mate", "Brillante", "Texturizado", "Sin acabado"];
const PRESUPUESTOS = [
	"Menos de $20.000",
	"$20.000 – $50.000",
	"$50.000 – $100.000",
	"Más de $100.000",
	"A convenir",
];
const PLAZOS = [
	"1 semana",
	"2 semanas",
	"3 semanas",
	"1 mes",
	"A convenir",
];

const FAQS = [
	{
		q: "¿Cuánto tiempo tarda en completarse un pedido personalizado?",
		a: "El tiempo depende de la complejidad y tamaño, pero normalmente entre 1 y 3 semanas.",
	},
	{
		q: "¿Puedo enviar mis propios diseños o ideas?",
		a: "¡Por supuesto! Puedes adjuntar imágenes de referencia o bocetos en el formulario.",
	},
	{
		q: "¿Qué materiales y colores están disponibles?",
		a: "Trabajamos con PLA, ABS, PETG y resina en una amplia gama de colores.",
	},
	{
		q: "¿Cómo se realiza el pago?",
		a: "Te enviaremos un presupuesto y los métodos de pago disponibles tras revisar tu solicitud.",
	},
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
	const [tab, setTab] = useState<"nuevo" | "modificar">("nuevo");
	const [size, setSize] = useState("pequeno");
	const [material, setMaterial] = useState(MATERIALES[0]);
	const [color, setColor] = useState(COLORES[0]);
	const [acabado, setAcabado] = useState(ACABADOS[0]);
	const [presupuesto, setPresupuesto] = useState(PRESUPUESTOS[0]);
	const [plazo, setPlazo] = useState(PLAZOS[0]);
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

	// Manejar envío de personalización
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		// Guarda los datos personalizados en el carrito local (no en productos)
		const personalizado = {
			nombre: "Producto Personalizado",
			descripcion: (document.querySelector("textarea"))?.value ?? "",
			categoria: "Personalizado",
			precio: 0,
			stock: 1,
			tamano: size,
			detalles: `Material: ${material}, Color: ${color}, Acabado: ${acabado}, Presupuesto: ${presupuesto}, Plazo: ${plazo}`,
			destacado: false,
		};
		addToCarritoLocal({
			id: Date.now().toString(), // ID temporal solo para el carrito
			...personalizado,
			cantidad: 1,
		});
		setLoading(false);
		setShowPago(true);
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
		<div className="bg-white min-h-screen flex flex-col">
			{/* Header */}
			<header className="py-6 sm:py-8 md:py-12 px-4 text-center">
				<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-2 sm:mb-3">Crea tu Producto Personalizado</h1>
				<p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-2">
					Diseñamos y fabricamos productos 3D únicos según tus especificaciones. Cuéntanos tu idea y la haremos realidad.
				</p>
			</header>

			{/* Tabs */}
			<div className="flex justify-center mb-6 sm:mb-8 px-4">
				<div className="inline-flex bg-gray-100 rounded-full p-1">
					<button
						className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-sm sm:text-base font-semibold transition ${tab === "nuevo" ? "bg-black text-white shadow" : "text-gray-700"}`}
						onClick={() => setTab("nuevo")}
					>
						<span className="hidden xs:inline">Nuevo Diseño</span>
						<span className="xs:hidden">Nuevo</span>
					</button>
					<button
						className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-sm sm:text-base font-semibold transition ${tab === "modificar" ? "bg-black text-white shadow" : "text-gray-700"}`}
						onClick={() => setTab("modificar")}
					>
						<span className="hidden xs:inline">Modificar Existente</span>
						<span className="xs:hidden">Modificar</span>
					</button>
				</div>
			</div>

			{/* Formulario */}
			<main className="flex-1 flex flex-col items-center px-4">
				<div className="w-full max-w-2xl bg-white rounded-xl sm:rounded-2xl shadow p-4 sm:p-6 md:p-8 mb-8 sm:mb-12">
					<h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 text-center">
						{tab === "nuevo" ? "Solicitud de Nuevo Diseño" : "Modificar Producto Existente"}
					</h2>
					<form className="flex flex-col gap-3 sm:gap-4 md:gap-5" onSubmit={handleSubmit}>
						<div className="flex flex-col xs:flex-row gap-3 sm:gap-4">
							<Input placeholder="Nombre" className="rounded-lg text-sm sm:text-base" required />
							<Input placeholder="Correo electrónico" type="email" className="rounded-lg text-sm sm:text-base" required />
						</div>
						<Input placeholder="Título del proyecto" className="rounded-lg text-sm sm:text-base" required />

						{/* Selector de tamaño */}
						<div>
							<div className="mb-2 text-sm sm:text-base font-medium">Tamaño</div>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
								{SIZES.map((s) => (
									<button
										type="button"
										key={s.value}
										className={`rounded-lg sm:rounded-xl border-2 p-2 sm:p-3 md:p-4 flex flex-col items-center transition font-semibold text-xs sm:text-sm ${
											size === s.value
												? "border-black bg-gray-100 shadow"
												: "border-gray-200 bg-white hover:border-black"
										}`}
										onClick={() => setSize(s.value)}
									>
										<span>{s.label}</span>
										<span className="text-[10px] sm:text-xs text-gray-500">{s.desc}</span>
									</button>
								))}
							</div>
						</div>

						{/* Material, color, acabado */}
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
							<div>
								<label htmlFor="material-select" className="block mb-1 text-xs sm:text-sm font-medium">Material</label>
								<select
									id="material-select"
									className="w-full border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base"
									value={material}
									onChange={e => setMaterial(e.target.value)}
								>
									{MATERIALES.map((m) => <option key={m}>{m}</option>)}
								</select>
							</div>
							<div>
								<label htmlFor="color-select" className="block mb-1 text-xs sm:text-sm font-medium">Color</label>
								<select
									id="color-select"
									className="w-full border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base"
									value={color}
									onChange={e => setColor(e.target.value)}
								>
									{COLORES.map((c) => <option key={c}>{c}</option>)}
								</select>
							</div>
							<div>
								<label htmlFor="acabado-select" className="block mb-1 text-xs sm:text-sm font-medium">Acabado</label>
								<select
									id="acabado-select"
									className="w-full border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base"
									value={acabado}
									onChange={e => setAcabado(e.target.value)}
								>
									{ACABADOS.map((a) => <option key={a}>{a}</option>)}
								</select>
							</div>
						</div>

						{/* Descripción */}
						<div>
							<label className="block mb-1 text-xs sm:text-sm font-medium">Descripción del Proyecto</label>
							<textarea
								className="w-full border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base min-h-[80px] sm:min-h-[100px]"
								placeholder="Describe tu idea, detalles, medidas, funcionalidades, etc."
								required
							/>
						</div>

						{/* Presupuesto y plazo */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
							<div>
								<label htmlFor="presupuesto-select" className="block mb-1 text-xs sm:text-sm font-medium">Presupuesto aproximado</label>
								<select
									id="presupuesto-select"
									className="w-full border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base"
									value={presupuesto}
									onChange={e => setPresupuesto(e.target.value)}
								>
									{PRESUPUESTOS.map((p) => <option key={p}>{p}</option>)}
								</select>
							</div>
							<div>
								<label htmlFor="plazo-select" className="block mb-1 text-xs sm:text-sm font-medium">Plazo de entrega deseado</label>
								<select
									id="plazo-select"
									className="w-full border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base"
									value={plazo}
									onChange={e => setPlazo(e.target.value)}
								>
									{PLAZOS.map((p) => <option key={p}>{p}</option>)}
								</select>
							</div>
						</div>

						<Button type="submit" className="w-full mt-3 sm:mt-4 rounded-lg font-semibold text-sm sm:text-base" disabled={loading}>
							{loading ? "Enviando..." : "Enviar solicitud"}
						</Button>
						{mensaje && <div className="text-green-600 text-center mt-2 text-sm sm:text-base">{mensaje}</div>}
					</form>
				</div>

				{/* FAQ */}
				<section className="w-full max-w-3xl mb-12 sm:mb-16">
					<h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-center">Preguntas Frecuentes</h3>
					<div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
						{FAQS.map((faq, idx) => (
							<div key={idx} className="bg-gray-100 rounded-lg sm:rounded-xl p-4 sm:p-5 shadow-sm">
								<div className="font-semibold mb-2 text-sm sm:text-base">{faq.q}</div>
								<div className="text-gray-600 text-xs sm:text-sm">{faq.a}</div>
							</div>
						))}
					</div>
				</section>
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
										className={`rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm max-w-[80%] sm:max-w-[70%] ${
											m.remitente === "cliente"
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