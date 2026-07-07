"use client";
import { useState, useEffect, useRef } from "react";
import { FiSend, FiX, FiTruck } from "react-icons/fi";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence, useDragControls } from "framer-motion";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "TU_SUPABASE_URL";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "TU_SUPABASE_ANON_KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

interface Mensaje {
  id?: number;
  nombre: string;
  email: string;
  mensaje: string;
  respondido?: boolean;
  creado_en?: string;
  leido?: boolean;
}

type BotState = "idle" | "waiting_for_order_id" | "waiting_for_email" | "live_chat";

export default function ChatWidget({
  clienteNombre,
  clienteEmail,
}: {
  clienteNombre: string;
  clienteEmail: string;
}) {
  const dragControls = useDragControls();
  const [open, setOpen] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [msg, setMsg] = useState("");
  const [hasNew, setHasNew] = useState(0);
  const [botState, setBotState] = useState<BotState>("idle");
  const [loading, setLoading] = useState(false);

  const chatRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Mensaje inicial del bot al abrir el chat
  useEffect(() => {
    if (open && mensajes.length === 0) {
      setMensajes([
        {
          nombre: "Asistente",
          email: "bot@thiart3d.com",
          mensaje: "¡Hola! Soy el asistente virtual de Thiart3D. ¿Cómo puedo ayudarte hoy?",
          creado_en: new Date().toISOString()
        }
      ]);
    }
  }, [open, mensajes.length]);

  // Suscripción Realtime para chat en vivo
  useEffect(() => {
    if (!clienteEmail || botState !== "live_chat") return;
    
    const safeEmail = clienteEmail.replace(/[^a-zA-Z0-9]/g, '');
    const channelId = `chat-client-${safeEmail}`;
    
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensajes" },
        (payload) => {
          const newMessage = payload.new as Mensaje;
          if (newMessage.email === clienteEmail) {
            setMensajes(prev => {
              if (prev.some(m => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
            if (newMessage.nombre === "Admin" && !openRef.current) {
              setHasNew(prev => prev + 1);
            }
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [clienteEmail, botState]);

  useEffect(() => {
    if (open) {
      setHasNew(0);
    }
    setTimeout(() => {
      if (chatRef.current) {
        chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
      }
    }, 100);
  }, [open, mensajes]);

  // Manejar el flujo de las opciones del Botón del Chatbot
  const handleOptionClick = async (option: string) => {
    if (option === "track_order") {
      setMensajes(prev => [
        ...prev,
        { nombre: clienteNombre, email: clienteEmail, mensaje: "📦 Quiero rastrear un pedido" },
        { nombre: "Asistente", email: "bot@thiart3d.com", mensaje: "Por favor, ingresa el número de tu pedido (ID numérico, ej: 42):" }
      ]);
      setBotState("waiting_for_order_id");
    } else if (option === "resend_credentials") {
      setMensajes(prev => [
        ...prev,
        { nombre: clienteNombre, email: clienteEmail, mensaje: "🔑 Quiero reenviar mis credenciales" },
        { nombre: "Asistente", email: "bot@thiart3d.com", mensaje: "Por favor, ingresa tu correo electrónico registrado:" }
      ]);
      setBotState("waiting_for_email");
    } else if (option === "live_chat") {
      setMensajes(prev => [
        ...prev,
        { nombre: clienteNombre, email: clienteEmail, mensaje: "💬 Hablar con un asesor" },
        { nombre: "Asistente", email: "bot@thiart3d.com", mensaje: "Te estoy conectando con soporte en vivo. Puedes escribir tu mensaje en la parte inferior." }
      ]);
      setBotState("live_chat");
    }
  };

  const enviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msg.trim()) return;

    const userText = msg.trim();
    setMsg("");

    // Agregar mensaje del usuario a la pantalla
    setMensajes(prev => [...prev, { nombre: clienteNombre, email: clienteEmail, mensaje: userText }]);

    if (botState === "waiting_for_order_id") {
      setLoading(true);
      try {
        const res = await fetch(`/api/pedidos?id=${userText}`);
        const data = (await res.json()) as { pedido?: { id: number; estado: string; numero_tracking?: string; empresa_envio?: string } };
        
        if (res.ok && data.pedido) {
          const ped = data.pedido;
          const estadoTraducido: Record<string, string> = {
            pendiente_pago: "Pendiente de pago ⏳",
            pagado: "Pagado (Preparando envío) 📦",
            en_preparacion: "En preparación 🛠️",
            en_envio: "En envío 🚚",
            entregado: "Entregado ✅",
            cancelado: "Cancelado ❌",
          };
          
          let responseMsg = `¡Pedido #${ped.id} encontrado!\n* Estado: ${estadoTraducido[ped.estado] ?? ped.estado}`;
          if (ped.numero_tracking) {
            responseMsg += `\n* Guía de envío: ${ped.numero_tracking}\n* Transportista: ${ped.empresa_envio ?? "Envía"}`;
          } else {
            responseMsg += `\n* Envío: Su guía está siendo procesada.`;
          }
          
          setMensajes(prev => [...prev, { nombre: "Asistente", email: "bot@thiart3d.com", mensaje: responseMsg }]);
        } else {
          setMensajes(prev => [...prev, { nombre: "Asistente", email: "bot@thiart3d.com", mensaje: `❌ No pudimos encontrar el pedido #${userText}. Por favor verifica el número.` }]);
        }
      } catch (_err) {
        setMensajes(prev => [...prev, { nombre: "Asistente", email: "bot@thiart3d.com", mensaje: "❌ Ocurrió un error al consultar el estado de tu pedido." }]);
      } finally {
        setLoading(false);
        setBotState("idle");
      }
    } else if (botState === "waiting_for_email") {
      setLoading(true);
      try {
        // 1. Buscar usuario por email en base de datos
        const { data: userData, error: fetchErr } = await supabase
          .from("usuarios")
          .select("id")
          .eq("email", userText)
          .single();

        if (fetchErr || !userData) {
          setMensajes(prev => [...prev, { nombre: "Asistente", email: "bot@thiart3d.com", mensaje: `❌ No encontramos ninguna cuenta registrada con el correo: ${userText}` }]);
        } else {
          // 2. Llamar API para regenerar contraseña y enviar correo
          const res = await fetch("/api/usuarios/reenviar-credenciales", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: userData.id }),
          });

          if (res.ok) {
            setMensajes(prev => [...prev, { nombre: "Asistente", email: "bot@thiart3d.com", mensaje: `✅ ¡Credenciales reenviadas! Hemos enviado un correo electrónico a ${userText} con tu nueva contraseña temporal.` }]);
          } else {
            const errData = await res.json() as { error?: string };
            setMensajes(prev => [...prev, { nombre: "Asistente", email: "bot@thiart3d.com", mensaje: `❌ Error al enviar credenciales: ${errData.error ?? "problema de conexión SMTP"}` }]);
          }
        }
      } catch (_err) {
        setMensajes(prev => [...prev, { nombre: "Asistente", email: "bot@thiart3d.com", mensaje: "❌ Ocurrió un error al procesar tu solicitud." }]);
      } finally {
        setLoading(false);
        setBotState("idle");
      }
    } else if (botState === "live_chat") {
      // Flujo de chat en vivo con base de datos de mensajes
      await supabase
        .from("mensajes")
        .insert([{ nombre: clienteNombre, email: clienteEmail, mensaje: userText, respondido: false, leido: false }]);
      
      await supabase.from("notificaciones").insert([{
        usuario_id: null,
        tipo: "mensaje",
        mensaje: `Nuevo de ${clienteNombre}: ${userText.slice(0, 30)}...`,
        leido: false,
      }]);
    }
  };

  return (
    <motion.div 
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      className="fixed bottom-6 right-36 md:bottom-10 md:right-72 z-[9999] flex flex-col items-end gap-3 font-sans"
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-[350px] sm:w-[380px] bg-white rounded-[2rem] shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
            style={{ height: 550, maxHeight: '80vh' }}
          >
            {/* Header */}
            <div className="p-6 bg-black text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                  <FiTruck className="text-xl" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight">Rastreo y Asistencia</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Auto-soporte</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <FiX className="text-xl" />
              </button>
            </div>

            {/* Messages Area */}
            <div 
              ref={chatRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50 custom-scrollbar"
            >
              {mensajes.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.nombre === "Asistente" || m.nombre === "Admin" ? "justify-start" : "justify-end"}`}
                >
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm shadow-sm transition-all whitespace-pre-line ${
                    m.nombre === "Asistente" || m.nombre === "Admin"
                      ? "bg-white text-gray-800 rounded-bl-none border border-gray-100"
                      : "bg-black text-white rounded-br-none"
                  }`}>
                    <p className="leading-relaxed">{m.mensaje}</p>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-400 border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-none text-xs flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    Buscando información...
                  </div>
                </div>
              )}

              {/* Botones de respuestas rápidas (solo en estado idle) */}
              {botState === "idle" && !loading && (
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => void handleOptionClick("track_order")}
                    className="w-full py-3 px-4 bg-[#00a19a] hover:bg-[#008f89] text-white rounded-2xl text-xs font-bold uppercase tracking-widest text-left shadow-md transition-all active:scale-[0.98]"
                  >
                    📦 Rastrear un Pedido
                  </button>
                  <button
                    onClick={() => void handleOptionClick("resend_credentials")}
                    className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-850 text-white rounded-2xl text-xs font-bold uppercase tracking-widest text-left shadow-md transition-all active:scale-[0.98]"
                  >
                    🔑 Reenviar mis credenciales
                  </button>
                  <button
                    onClick={() => void handleOptionClick("live_chat")}
                    className="w-full py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl text-xs font-bold uppercase tracking-widest text-left shadow-md transition-all active:scale-[0.98]"
                  >
                    💬 Hablar con un asesor
                  </button>
                </div>
              )}
            </div>

            {/* Input Form (habilitado en live_chat o esperando respuesta) */}
            <form onSubmit={enviarMensaje} className="p-4 bg-white border-t border-gray-50 flex items-center gap-2">
              <input
                type="text"
                placeholder={
                  botState === "idle" 
                    ? "Selecciona una opción de arriba..." 
                    : botState === "waiting_for_order_id"
                    ? "Escribe el ID del pedido..."
                    : botState === "waiting_for_email"
                    ? "Escribe tu correo..."
                    : "Escribe tu mensaje..."
                }
                disabled={botState === "idle" || loading}
                className="flex-1 px-4 py-3 bg-gray-100 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-black/5 transition-all text-black disabled:opacity-50"
                value={msg}
                onChange={e => setMsg(e.target.value)}
              />
              <button 
                type="submit"
                disabled={!msg.trim() || loading}
                className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/10 disabled:opacity-50 disabled:scale-100"
              >
                <FiSend className="text-lg" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón flotante "Rastrear tu pedido" - Versión circular compacta no invasiva */}
      <motion.button
        onPointerDown={(e) => dragControls.start(e)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 bg-black hover:bg-slate-900 text-white rounded-full flex items-center justify-center shadow-xl border border-gray-800 transition-all group relative cursor-pointer"
        onClick={() => setOpen(!open)}
        title="Rastrear tu pedido"
      >
        {open ? <FiX className="text-xl" /> : <FiTruck className="w-6 h-6 text-[#00a19a]" />}
        
        {/* Tooltip visible en hover */}
        {!open && (
          <span className="absolute right-16 scale-0 transition-all rounded bg-gray-900 px-3 py-2 text-xs font-black uppercase tracking-wider text-white group-hover:scale-100 shadow-md whitespace-nowrap">
            Rastrear tu pedido
          </span>
        )}

        {hasNew > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] bg-emerald-500 border-2 border-black rounded-full flex items-center justify-center animate-bounce shadow-lg">
            <span className="text-[10px] text-white font-black leading-none">{hasNew}</span>
          </span>
        )}
      </motion.button>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
      `}</style>
    </motion.div>
  );
}