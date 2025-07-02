"use client";
import { useEffect, useRef, useState } from "react";
import { FiSend, FiCheck, FiUser } from "react-icons/fi";
import { MdDoneAll } from "react-icons/md";
import { createClient } from "@supabase/supabase-js";
import Loader from "~/components/providers/UiProvider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog";
import Image from "next/image";
import { useToast } from "~/components/ui/use-toast";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "TU_SUPABASE_URL";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "TU_SUPABASE_ANON_KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AdminMensajesPage() {
	interface Conversation {
		id: number;
		cliente_nombre: string;
		cliente_email: string;
		cliente_avatar_url?: string;
		// Add other fields as needed
	}

	const [convs, setConvs] = useState<Conversation[]>([]);
	const [convId, setConvId] = useState<number | null>(null);
	interface Mensaje {
		id: number;
		conversacion_id: number;
		remitente: string;
		texto: string;
		hora: string;
		leido_cliente: boolean;
		created_at: string;
	}

	const [mensajes, setMensajes] = useState<Mensaje[]>([]);
	const [msg, setMsg] = useState("");
	const [busqueda, setBusqueda] = useState("");
	const [loading, setLoading] = useState(true);
	interface ModalUser {
		cliente_id: number;
		cliente_nombre: string;
		cliente_email: string;
		cliente_avatar_url?: string;
	}

	const [modalUser, setModalUser] = useState<ModalUser | null>(null);
	interface Pedido {
		id: number;
		estado: string;
		created_at: string;
		// Add other fields as needed
	}

	const [pedidos, setPedidos] = useState<Pedido[]>([]);
	const [loadingPedidos, setLoadingPedidos] = useState(false);
	const [isTyping, setIsTyping] = useState(false);
	const [typingUsers] = useState<string[]>([]);
	const [nuevosIds, setNuevosIds] = useState<number[]>([]);
	const chatRef = useRef<HTMLDivElement>(null);
	const { toast } = useToast();

	// Cargar conversaciones (solo usuarios)
	useEffect(() => {
		async function fetchConvs() {
			setLoading(true);
			const { data } = await supabase
				.from("conversaciones")
				.select("*")
				.order("id", { ascending: false });
			setConvs(Array.isArray(data) ? data : []);
			setLoading(false);
		}
		void fetchConvs();
	}, []);

	// Cargar mensajes de la conversación seleccionada y suscripción realtime
	useEffect(() => {
		if (!convId) return;
		setLoading(true);
		let ignore = false;
		const fetchMensajes = async () => {
			const { data } = await supabase
				.from("mensajes")
				.select("*")
				.eq("conversacion_id", convId)
				.order("created_at", { ascending: true });
			if (!ignore) setMensajes(Array.isArray(data) ? data : []);
			setLoading(false);
		};
		void fetchMensajes();

		const channel = supabase
			.channel("mensajes-admin")
			.on(
				"postgres_changes",
				{ event: "INSERT", schema: "public", table: "mensajes", filter: `conversacion_id=eq.${convId}` },
				(payload) => {
					setMensajes((prev) => {
						const newMessage = payload.new as Mensaje;
						if (prev.some((m) => m.id === newMessage.id)) return prev;
						// Si el mensaje es de cliente, marca como nuevo y muestra notificación
						if (newMessage.remitente !== "admin") {
							setNuevosIds((ids) => [...ids, newMessage.id]);
							toast({
								title: "Nuevo mensaje",
								description: newMessage.texto?.length > 40 ? newMessage.texto.slice(0, 40) + "..." : newMessage.texto,
								variant: "default",
							});
						}
						return [...prev, newMessage];
					});
				}
			)
			.subscribe();
		return () => {
			ignore = true;
			void supabase.removeChannel(channel);
		};
	}, [convId, toast]);

	// Scroll automático al último mensaje
	useEffect(() => {
		if (chatRef.current) {
			chatRef.current.scrollTop = chatRef.current.scrollHeight;
		}
	}, [mensajes.length]);

	// Buscar pedidos del usuario al abrir el modal
	useEffect(() => {
		if (!modalUser) return;
		setLoadingPedidos(true);
		supabase
			.from("pedidos")
			.select("*")
			.eq("cliente_id", modalUser.cliente_id)
			.then(({ data }) => {
				setPedidos(Array.isArray(data) ? data : []);
				setLoadingPedidos(false);
			});
	}, [modalUser]);

	const convFiltradas = convs.filter((c) =>
		c.cliente_nombre.toLowerCase().includes(busqueda.toLowerCase())
	);
	const convSeleccionada = convs.find((c) => c.id === convId);

	// Helper para obtener la imagen de perfil Clerk (si la guardas en la conversación)
	const getProfileImage = (user: Conversation | ModalUser) =>
			user.cliente_avatar_url ??
			"https://ui-avatars.com/api/?name=User&background=cccccc&color=666666&size=80";

	// Resumen de pedidos
	const resumenPedidos = (pedidos: Pedido[]) => {
		const total = pedidos.length;
		const enEnvio = pedidos.filter((p) => p.estado === "en_envio").length;
		const pendientes = pedidos.filter((p) => p.estado === "pendiente").length;
		const completados = pedidos.filter((p) => p.estado === "completado").length;
		return { total, enEnvio, pendientes, completados };
	};

	// Indicador de escritura (broadcast typing)
	const handleTyping = () => {
		if (!convId) return;
		if (!isTyping) {
			setIsTyping(true);
			void supabase.channel("typing").send({
				type: "broadcast",
				event: "typing",
				payload: { conversacion_id: convId, user: "admin", typing: true },
			});
		}
		// Detener typing después de 2s sin escribir
		setTimeout(() => {
			setIsTyping(false);
			void supabase.channel("typing").send({
				type: "broadcast",
				event: "typing",
				payload: { conversacion_id: convId, user: "admin", typing: false },
			});
		}, 2000);
	};

	const renderEstado = (m: Mensaje) => {
		if (m.remitente === "admin") {
			if (m.leido_cliente) {
				return <MdDoneAll className="inline ml-1 text-blue-500" title="Leído" />;
			}
			return <FiCheck className="inline ml-1 text-gray-400" title="Enviado" />;
		}
		return null;
	};

	function formatDate(dateStr: string) {
		if (typeof window === "undefined") return dateStr;
		return new Date(dateStr).toLocaleString();
	}

	return (
		<div className="min-h-screen p-2 md:p-10 bg-gray-50">
			<h1 className="text-2xl font-bold mb-6">Mensajes de Contacto</h1>
			<div className="flex flex-col md:flex-row gap-6">
				{/* Conversaciones */}
				<div className="w-full md:max-w-sm bg-white rounded-xl border p-4 flex flex-col min-h-[400px]">
					<input
						type="text"
						placeholder="Buscar conversaciones..."
						className="border rounded px-3 py-2 w-full text-sm mb-3"
						value={busqueda}
						onChange={(e) => setBusqueda(e.target.value)}
					/>
					<div className="flex-1 overflow-y-auto">
						{loading ? (
							<Loader />
						) : convFiltradas.length === 0 ? (
							<div className="text-gray-400 text-center mt-10">Sin conversaciones</div>
						) : (
							convFiltradas.map((conv) => (
								<div
									key={conv.id}
									className={`flex items-center gap-3 p-2 rounded cursor-pointer mb-1 ${
										convId === conv.id ? "bg-gray-100" : ""
									}`}
									onClick={() => setConvId(conv.id)}
								>
									<div
										className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 font-bold text-lg overflow-hidden cursor-pointer border"
										onClick={(e) => {
											e.stopPropagation();
											setModalUser({
												cliente_id: conv.id,
												cliente_nombre: conv.cliente_nombre,
												cliente_email: conv.cliente_email,
												cliente_avatar_url: conv.cliente_avatar_url,
											});
										}}
										title="Ver perfil y pedidos"
									>
										<Image
											src={getProfileImage(conv)}
											alt={conv.cliente_nombre}
											width={40}
											height={40}
											className="object-cover w-10 h-10 rounded-full"
										/>
									</div>
									<div className="flex-1 min-w-0">
										<div className="font-semibold text-sm truncate">
											{conv.cliente_nombre}
										</div>
										<div className="text-xs text-gray-500 truncate">
											{conv.cliente_email}
													</div>
												</div>
											</div>
									))
								)}
					</div>
				</div>
				{/* Chat */}
				<div className="flex-1 bg-white rounded-xl border p-2 md:p-6 flex flex-col min-h-[400px]">
					{convSeleccionada ? (
						<>
							{/* Encabezado fijo */}
							<div className="flex items-center gap-3 mb-4 flex-shrink-0">
								<div
									className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 font-bold text-xl overflow-hidden cursor-pointer border"
									onClick={() =>
										setModalUser(
											convSeleccionada
												? {
														cliente_id: convSeleccionada.id,
														cliente_nombre: convSeleccionada.cliente_nombre,
														cliente_email: convSeleccionada.cliente_email,
														cliente_avatar_url: convSeleccionada.cliente_avatar_url,
												  }
												: null
										)
									}
									title="Ver perfil y pedidos"
								>
									<Image
										src={getProfileImage(convSeleccionada)}
										alt={convSeleccionada.cliente_nombre}
										width={48}
										height={48}
										className="object-cover w-12 h-12 rounded-full"
									/>
								</div>
								<div>
									<div className="font-bold text-lg">
										{convSeleccionada.cliente_nombre}
									</div>
									<div className="text-xs text-gray-500">
										{convSeleccionada.cliente_email}
									</div>
								</div>
							</div>
							{/* Área de mensajes con scroll y tamaño fijo */}
							<div
								className="flex-1 overflow-y-auto mb-4"
								ref={chatRef}
								style={{
									minHeight: 0,
									maxHeight: 420,
									height: 420,
									borderRadius: 12,
									background: "#fff",
									border: "1px solid #f3f4f6",
									padding: "0.5rem",
									marginBottom: "1rem",
								}}
							>
								<div className="flex flex-col gap-2">
									{mensajes.map((m, idx) => (
										<div
											key={idx}
											className={`flex ${
												m.remitente === "admin" ? "justify-end" : "justify-start"
											}`}
										>
											<div
												className={`rounded-lg px-4 py-2 text-sm max-w-[80%] md:max-w-[70%] break-words shadow relative ${
													m.remitente === "admin"
														? "bg-blue-600 text-white rounded-br-none"
														: "bg-gray-100 text-gray-900 rounded-bl-none"
												} ${nuevosIds.includes(m.id) ? "ring-2 ring-green-400" : ""}`}
											>
												<div className="flex items-center">
													{m.remitente !== "admin" && (
														<FiUser className="mr-1 text-gray-400" />
													)}
													<span>{m.texto}</span>
													{renderEstado(m)}
													{nuevosIds.includes(m.id) && (
														<span className="ml-2 inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Nuevo mensaje"></span>
													)}
												</div>
												<div className="text-xs text-gray-300 text-right mt-1">
													{m.created_at ? formatDate(m.created_at) : m.hora}
												</div>
											</div>
										</div>
									))}
									{typingUsers.length > 0 && (
										<div className="flex justify-start">
											<div className="rounded-lg px-4 py-2 text-xs bg-gray-200 text-gray-700 animate-pulse">
												{typingUsers.join(", ")} está escribiendo...
											</div>
										</div>
									)}
								</div>
							</div>
							{/* Input fijo abajo */}
							<form
								className="flex items-center gap-2 flex-shrink-0"
								style={{ background: "#fff", borderRadius: 12 }}
								onSubmit={async (e) => {
									e.preventDefault();
									if (!msg.trim() || !convId) return;
									const { error } = await supabase.from("mensajes").insert([
										{
											conversacion_id: convId,
											remitente: "admin",
											texto: msg,
											hora: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
											leido_cliente: false,
											created_at: new Date().toISOString(),
										},
									]);
									setMsg("");
									if (error) {
										console.error("Error al enviar el mensaje:", error);
										return;
									}
									// Mensaje enviado, ahora manejar el estado de 'enviado' o 'entregado'
									setMensajes((prev) => {
										const nuevoMensaje = {
											conversacion_id: convId,
											remitente: "admin",
											texto: msg,
											hora: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
											leido_cliente: false,
											created_at: new Date().toISOString(),
											id: Date.now(), // Temporal, para que React reconozca el nuevo mensaje
										};
										return [...prev, nuevoMensaje];
									});
								}}
							>
								<input
									type="text"
									placeholder="Escribe un mensaje..."
									className="border rounded px-3 py-2 w-full text-sm"
									value={msg}
									onChange={(e) => setMsg(e.target.value)}
									onKeyUp={handleTyping}
								/>
								<button
									type="submit"
									className="bg-blue-600 text-white rounded px-4 py-2 text-sm flex items-center gap-2"
								>
									<FiSend />
									Enviar
								</button>
							</form>
						</>
					) : (
									<div className="flex-1 flex items-center justify-center text-gray-400">
										Selecciona una conversación para ver los mensajes.
									</div>
								)}
						</div>
					</div>
			{/* Modal de perfil y pedidos */}
			<Dialog open={!!modalUser} onOpenChange={(v) => !v && setModalUser(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							<div className="flex items-center gap-3">
								<Image
									src={modalUser ? getProfileImage(modalUser) : "https://ui-avatars.com/api/?name=User&background=cccccc&color=666666&size=80"}
									alt={modalUser?.cliente_nombre ?? ""}
									width={48}
									height={48}
									className="object-cover w-12 h-12 rounded-full"
								/>
								<span>{modalUser?.cliente_nombre}</span>
							</div>
						</DialogTitle>
					</DialogHeader>
					<div className="mb-2 text-xs text-gray-500">{modalUser?.cliente_email}</div>
					<div className="mb-4">
						{loadingPedidos ? (
							<div className="text-center text-gray-400">Cargando pedidos...</div>
						) : (
							<>
								<div className="font-semibold mb-2">Resumen de pedidos</div>
								<ul className="text-sm mb-2">
									<li>Total: <b>{resumenPedidos(pedidos).total}</b></li>
									<li>En envío: <b>{resumenPedidos(pedidos).enEnvio}</b></li>
									<li>Pendientes: <b>{resumenPedidos(pedidos).pendientes}</b></li>
									<li>Completados: <b>{resumenPedidos(pedidos).completados}</b></li>
								</ul>
								{pedidos.length > 0 && (
									<div className="max-h-32 overflow-y-auto border-t pt-2">
										<div className="font-semibold text-xs mb-1">Pedidos recientes:</div>
										<ul className="text-xs">
											{pedidos.slice(0, 5).map((p, idx) => (
												<li key={p.id || idx}>
													#{p.id} - {p.estado} - {new Date(p.created_at).toLocaleDateString()}
												</li>
											))}
										</ul>
									</div>
								)}
							</>
						)}
					</div>
					<DialogFooter>
						<button className="px-4 py-2 rounded bg-black text-white" onClick={() => setModalUser(null)}>
							Cerrar
						</button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}