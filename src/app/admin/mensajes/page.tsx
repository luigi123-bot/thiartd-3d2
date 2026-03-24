"use client";
import { useEffect, useRef, useState } from "react";
import { FiSend, FiUser, FiSearch, FiMoreVertical, FiCheck, FiMessageCircle, FiArrowLeft } from "react-icons/fi";
import { MdDoneAll } from "react-icons/md";
import { createClient } from "@supabase/supabase-js";
import Loader from "~/components/providers/UiProvider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog";
import { useToast } from "~/components/ui/use-toast";
import { Badge } from "~/components/ui/badge";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "TU_SUPABASE_URL";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "TU_SUPABASE_ANON_KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AdminMensajesPage() {
	interface Mensaje {
		id: number;
		nombre: string;
		email: string;
		mensaje: string;
		respondido: boolean;
		creado_en: string;
		leido: boolean;
	}

	interface Thread {
		email: string;
		nombre: string;
		ultimoMensaje: string;
		fecha: string;
		leido: boolean;
		unreadCount: number;
		cliente_id?: string;
	}

	interface Pedido {
		id: number;
		estado: string;
		created_at: string;
	}

	const [threads, setThreads] = useState<Thread[]>([]);
	const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
	const [mensajes, setMensajes] = useState<Mensaje[]>([]);
	const [msg, setMsg] = useState("");
	const [busqueda, setBusqueda] = useState("");
	const [loading, setLoading] = useState(true);
	const [modalUser, setModalUser] = useState<Thread | null>(null);
	const [pedidos, setPedidos] = useState<Pedido[]>([]);
	const [loadingPedidos, setLoadingPedidos] = useState(false);
	const chatRef = useRef<HTMLDivElement>(null);
	const { toast } = useToast();

	const selectedEmailRef = useRef<string | null>(null);
	useEffect(() => {
		selectedEmailRef.current = selectedEmail;
	}, [selectedEmail]);

	// Cargar hilos de conversación (agrupados por email del cliente)
	useEffect(() => {
		async function fetchThreads(showLoading = true) {
			if (showLoading) setLoading(true);
			const { data, error } = await supabase
				.from("mensajes")
				.select("*")
				.order("creado_en", { ascending: false });

			if (error) {
				console.error("Error fetching messages for threads:", error);
				if (showLoading) setLoading(false);
				return;
			}

			const grouped = new Map<string, Thread>();
			(data as Mensaje[]).forEach((m) => {
				const isFromClient = m.nombre !== "Admin";
				
				if (!grouped.has(m.email)) {
					grouped.set(m.email, {
						email: m.email,
						nombre: m.nombre,
						ultimoMensaje: m.mensaje,
						fecha: m.creado_en,
						leido: m.leido,
						unreadCount: 0,
					});
				}

				if (isFromClient && !m.leido) {
					const thread = grouped.get(m.email)!;
					// Solo incrementa si no es el chat activo
					if (m.email !== selectedEmailRef.current) {
						thread.unreadCount += 1;
					}
				}
			});

			setThreads(Array.from(grouped.values()));
			if (showLoading) setLoading(false);
		}
		void fetchThreads();

		// Realtime para actualizar TODO (Lista de hilos y Mensajes del chat seleccionados)
		// Nombre de canal fijo para el administrador
		const channel = supabase
			.channel('admin-global-mensajes')
			.on(
				"postgres_changes",
				{ event: "INSERT", schema: "public", table: "mensajes" },
				(payload) => {
					console.log("[Admin Realtime] Mensaje detectado en tabla:", payload);
					const newMessage = payload.new as Mensaje;
					
					// 1. Actualizar lista de hilos sin el loading para que no parpadee
					void fetchThreads(false);

					// 2. Si el mensaje es para el correo actualmente seleccionado, agregarlo al chat
					if (newMessage.email === selectedEmailRef.current) {
						setMensajes((prev) => {
							if (prev.some((m) => m.id === newMessage.id)) return prev;
							return [...prev, newMessage];
						});
						
						// Marcar como leído automáticamente porque lo está viendo en vivo
						if (newMessage.nombre !== "Admin" && !newMessage.leido) {
							void supabase.from("mensajes").update({ leido: true }).eq("id", newMessage.id);
						}
					}
				}
			)
			.subscribe((status) => {
				console.log(`[Admin Realtime] Estado conexión Global:`, status);
			});

		return () => {
			void supabase.removeChannel(channel);
		};
	}, []);

	// Cargar mensajes del hilo seleccionado
	useEffect(() => {
		if (!selectedEmail) return;
		
		const fetchMensajes = async () => {
			const { data } = await supabase
				.from("mensajes")
				.select("*")
				.eq("email", selectedEmail)
				.order("creado_en", { ascending: true });
			
			const msgData = Array.isArray(data) ? (data as Mensaje[]) : [];
			setMensajes(msgData);

			const unreadIds = msgData.filter(m => !m.leido && m.nombre !== "Admin").map(m => m.id);
			if (unreadIds.length > 0) {
				await supabase
					.from("mensajes")
					.update({ leido: true })
					.in("id", unreadIds);
			}
            
			// SIEMPRE que se abre el chat, limpiar la burbuja localmente al instante
			setThreads(prev => prev.map(t => 
				t.email === selectedEmail ? { ...t, unreadCount: 0 } : t
			));
		};
		void fetchMensajes();
	}, [selectedEmail]);

	useEffect(() => {
		if (chatRef.current) {
			chatRef.current.scrollTop = chatRef.current.scrollHeight;
		}
	}, [mensajes]);

	useEffect(() => {
		if (!modalUser?.email) return;
		setLoadingPedidos(true);
		// Intentamos buscar pedidos por email ya que es lo que tenemos vinculado
		supabase
			.from("pedidos")
			.select("*")
			.eq("email_cliente", modalUser.email) // Asumiendo que esta es la columna en pedidos
			.then(({ data }) => {
				setPedidos(Array.isArray(data) ? data : []);
				setLoadingPedidos(false);
			});
	}, [modalUser]);

	const threadsFiltrados = threads.filter((t) =>
		t.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
		t.email.toLowerCase().includes(busqueda.toLowerCase())
	);

	const selectedThread = threads.find((t) => t.email === selectedEmail);

	function formatDate(dateStr: string) {
		const date = new Date(dateStr);
		return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	}

	function getInitial(name: string) {
		return name.charAt(0).toUpperCase();
	}

	return (
		<div className="bg-gray-50 flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden w-full">
			{/* Sidebar Izquierda */}
			<div className={`w-full md:w-96 bg-white border-r flex flex-col shadow-sm z-10 h-full ${selectedEmail ? 'hidden md:flex' : 'flex'}`}>
				<div className="p-6 border-b bg-white/50 backdrop-blur-md sticky top-0">
					<div className="flex items-center justify-between mb-6">
						<h1 className="text-2xl font-black text-gray-900 tracking-tight">Chats</h1>
						<Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold">
							{threads.length} hilos
						</Badge>
					</div>
					<div className="relative">
						<FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
						<input
							type="text"
							placeholder="Buscar por nombre o correo..."
							className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
							value={busqueda}
							onChange={(e) => setBusqueda(e.target.value)}
						/>
					</div>
				</div>

				<div className="flex-1 overflow-y-auto custom-scrollbar p-2">
					{loading ? (
						<div className="flex items-center justify-center py-20">
							<Loader />
						</div>
					) : threadsFiltrados.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-20 text-gray-400">
							<FiUser className="text-4xl mb-2 opacity-20" />
							<p className="text-sm">Sin conversaciones</p>
						</div>
					) : (
						threadsFiltrados.map((t) => (
							<div
								key={t.email}
								className={`group flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all mb-1 ${
									selectedEmail === t.email 
										? "bg-emerald-50 border-emerald-100 shadow-sm" 
										: "hover:bg-gray-50 border-transparent"
								} border`}
								onClick={() => setSelectedEmail(t.email)}
							>
								<div className="relative">
									<div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner ${
										selectedEmail === t.email ? "bg-emerald-500" : "bg-gray-400"
									}`}>
										{getInitial(t.nombre)}
									</div>
									<div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
								</div>
								
								<div className="flex-1 min-w-0">
									<div className="flex justify-between items-start mb-0.5">
										<p className={`text-sm font-bold truncate ${selectedEmail === t.email ? "text-emerald-900" : "text-gray-900"}`}>
											{t.nombre}
										</p>
										<span className={`text-[10px] font-medium uppercase tracking-wider whitespace-nowrap ml-2 ${t.unreadCount > 0 ? "text-emerald-500 font-black" : "text-gray-400"}`}>
											{formatDate(t.fecha)}
										</span>
									</div>
									<div className="flex items-center justify-between gap-2">
										<p className={`text-xs truncate flex-1 ${t.unreadCount > 0 ? "text-gray-900 font-bold" : "text-gray-500 font-medium"}`}>
											{t.ultimoMensaje}
										</p>
										{t.unreadCount > 0 && (
											<div className="min-w-[18px] h-[18px] bg-emerald-500 rounded-full flex items-center justify-center px-1 animate-in zoom-in duration-300">
												<span className="text-[10px] text-white font-black leading-none">
													{t.unreadCount}
												</span>
											</div>
										)}
									</div>
								</div>
							</div>
						))
					)}
				</div>
			</div>

			{/* Área de Chat Derecha */}
			<div className={`flex-1 flex flex-col relative bg-[#f8fafc] h-full ${!selectedEmail ? 'hidden md:flex' : 'flex'}`}>
				{selectedThread ? (
					<>
						{/* Header del Chat */}
						<div className="h-20 bg-white/80 backdrop-blur-md border-b flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
							<div className="flex items-center gap-3">
								<button 
									className="md:hidden p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
									onClick={() => setSelectedEmail(null)}
								>
									<FiArrowLeft className="text-xl" />
								</button>
								<div className="flex items-center gap-4 cursor-pointer" onClick={() => setModalUser(selectedThread)}>
									<div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold shadow-sm">
										{getInitial(selectedThread.nombre)}
									</div>
									<div className="hidden sm:block">
										<h2 className="font-bold text-gray-900 leading-none mb-1 group-hover:text-emerald-600 transition-colors">{selectedThread.nombre}</h2>
										<p className="text-xs text-emerald-600 font-semibold">{selectedThread.email}</p>
									</div>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<button className="p-2.5 rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
									<FiMoreVertical />
								</button>
							</div>
						</div>

						{/* Mensajes */}
						<div 
							ref={chatRef}
							className="flex-1 overflow-y-auto p-6 md:p-10 space-y-4 custom-scrollbar"
						>
							<div className="flex justify-center mb-8">
								<span className="bg-white/80 backdrop-blur-sm shadow-sm border border-gray-100 px-4 py-1.5 rounded-full text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">
									Comienzo de la historia
								</span>
							</div>

							{mensajes.map((m) => (
								<div
									key={m.id}
									className={`flex flex-col ${m.nombre === "Admin" ? "items-end" : "items-start"}`}
								>
									<div
										className={`group relative max-w-[85%] md:max-w-[70%] px-5 py-3.5 rounded-2xl shadow-sm transition-all ${
											m.nombre === "Admin"
												? "bg-black text-white rounded-br-none"
												: "bg-white text-gray-800 rounded-bl-none border border-gray-100"
										}`}
									>
										<p className="text-sm leading-relaxed font-medium">{m.mensaje}</p>
										
										<div className={`mt-2 flex items-center gap-2 text-[10px] ${
											m.nombre === "Admin" ? "text-gray-400" : "text-gray-400"
										}`}>
											<span className="font-bold">{formatDate(m.creado_en)}</span>
											{m.nombre === "Admin" && (
												<div className="flex items-center">
													{m.respondido ? (
														<MdDoneAll className="text-blue-500 text-sm" />
													) : (
														<FiCheck className="text-gray-500" />
													)}
												</div>
											)}
										</div>
									</div>
								</div>
							))}
						</div>

						{/* Input */}
						<div className="p-6 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
							<form
								className="max-w-4xl mx-auto relative flex items-center gap-3"
								onSubmit={async (e) => {
									e.preventDefault();
									if (!msg.trim() || !selectedEmail) return;
									const msgText = msg;
									setMsg("");
									
									const { data, error } = await supabase.from("mensajes").insert([
										{
											nombre: "Admin",
											email: selectedEmail,
											mensaje: msgText,
											respondido: true
										},
									]).select().single<Mensaje>();
									
									if (error) {
										console.error("Error al enviar mensaje:", error);
										toast({ title: "Error", description: "No se pudo enviar el mensaje", variant: "destructive" });
										return;
									}
									
									if (data) {
										setMensajes((prev) => [...prev, data]);
									}
								}}
							>
								<div className="flex-1 relative">
									<input
										type="text"
										placeholder="Escribe un mensaje aquí..."
										className="w-full pl-4 md:pl-6 pr-10 md:pr-12 mx-auto py-3 md:py-4 bg-gray-50 border-transparent rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-black/5 transition-all outline-none"
										value={msg}
										onChange={(e) => setMsg(e.target.value)}
									/>
								</div>
								<button
									type="submit"
									disabled={!msg.trim()}
									className="bg-black text-white w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/10 disabled:opacity-50 disabled:scale-100"
								>
									<FiSend className="text-lg md:text-xl" />
								</button>
							</form>
						</div>
					</>
				) : (
					<div className="flex-1 flex flex-col items-center justify-center text-center p-10">
						<div className="w-24 h-24 bg-white rounded-full shadow-xl flex items-center justify-center mb-6">
							<FiMessageCircle className="text-4xl text-emerald-500 animate-pulse" />
						</div>
						<h3 className="text-xl font-black text-gray-900 mb-2 tracking-tight">Tu centro de mensajería</h3>
						<p className="text-gray-500 max-w-xs text-sm font-medium">
							Selecciona un usuario de la lista de la izquierda para comenzar a gestionar sus solicitudes en tiempo real.
						</p>
					</div>
				)}
			</div>
			
			{/* Modal de perfil y pedidos */}
			<Dialog open={!!modalUser} onOpenChange={(v) => !v && setModalUser(null)}>
				<DialogContent className="max-w-md rounded-3xl">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-4">
							<div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
								{modalUser ? getInitial(modalUser.nombre) : ""}
							</div>
							<div className="text-left">
								<h2 className="text-xl font-black text-gray-900 leading-none mb-1">{modalUser?.nombre}</h2>
								<p className="text-xs text-emerald-600 font-bold">{modalUser?.email}</p>
							</div>
						</DialogTitle>
					</DialogHeader>
					
					<div className="py-6">
						<h3 className="text-sm font-black text-gray-900 mb-4 uppercase tracking-widest leading-none flex items-center gap-2">
							<span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
							Historial de Pedidos
						</h3>
						
						{loadingPedidos ? (
							<div className="flex items-center justify-center py-10"><Loader /></div>
						) : pedidos.length === 0 ? (
							<div className="bg-gray-50 rounded-2xl p-8 text-center border border-dashed border-gray-200">
								<p className="text-sm text-gray-400 font-medium italic">Este usuario aún no tiene pedidos.</p>
							</div>
						) : (
							<div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
								{pedidos.map((p) => (
									<div key={p.id} className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex items-center justify-between">
										<div>
											<p className="text-sm font-bold text-gray-900 tracking-tight">Pedido #{p.id}</p>
											<p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{new Date(p.created_at).toLocaleDateString()}</p>
										</div>
										<Badge className={`${p.estado === 'completado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} border-none font-black text-[10px] uppercase tracking-wide`}>
											{p.estado}
										</Badge>
									</div>
								))}
							</div>
						)}
					</div>

					<DialogFooter>
						<button 
							className="w-full py-4 bg-black text-white rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-95 transition-all"
							onClick={() => setModalUser(null)}
						>
							Cerrar Panel
						</button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			
			<style jsx global>{`
				.custom-scrollbar::-webkit-scrollbar {
					width: 6px;
				}
				.custom-scrollbar::-webkit-scrollbar-track {
					background: transparent;
				}
				.custom-scrollbar::-webkit-scrollbar-thumb {
					background: #e2e8f0;
					border-radius: 10px;
				}
				.custom-scrollbar::-webkit-scrollbar-thumb:hover {
					background: #cbd5e1;
				}
			`}</style>
		</div>
	);
}