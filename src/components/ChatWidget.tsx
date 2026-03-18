"use client";
import { useState, useEffect, useRef } from "react";
import { FiMessageCircle, FiSend, FiX, FiCheck } from "react-icons/fi";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "TU_SUPABASE_URL";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "TU_SUPABASE_ANON_KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function ChatWidget({
  clienteNombre,
  clienteEmail,
}: {
  clienteNombre: string;
  clienteEmail: string;
}) {
  const [open, setOpen] = useState(false);
  type Mensaje = {
    id: number;
    nombre: string;
    email: string;
    mensaje: string;
    respondido: boolean;
    creado_en: string;
  };
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [msg, setMsg] = useState("");
  const [hasNew, setHasNew] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  // Ref to always have current 'open' value inside Realtime callback without re-subscribing
  const openRef = useRef(open);
  useEffect(() => { openRef.current = open; }, [open]);

  // Initial fetch
  useEffect(() => {
    if (!clienteEmail || !open) return;
    supabase
      .from("mensajes")
      .select("*")
      .eq("email", clienteEmail)
      .order("creado_en", { ascending: true })
      .then(({ data }) => setMensajes(Array.isArray(data) ? data : []));
  }, [clienteEmail, open]);

  const clienteEmailRef = useRef(clienteEmail);
  useEffect(() => { clienteEmailRef.current = clienteEmail; }, [clienteEmail]);

  // Suscripción Realtime Global
  useEffect(() => {
    if (!clienteEmail) return;
    
    // Usamos un ID único por correo electrónico pero que se mantenga estable entre recargas
    const safeEmail = clienteEmail.replace(/[^a-zA-Z0-9]/g, '');
    const channelId = `chat-client-${safeEmail}`;
    
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensajes" },
        (payload) => {
          console.log("[Client Realtime] Nuevo mensaje detectado:", payload);
          const newMessage = payload.new as Mensaje;
          
          if (newMessage.email === clienteEmailRef.current) {
            setMensajes(prev => {
              if (prev.some(m => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
            
            // Notificar si está cerrado y lo envía el admin
            if (newMessage.nombre === "Admin" && !openRef.current) {
               setHasNew(true);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log("[Client Realtime] Estado conexión:", status);
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [clienteEmail]); // Depender de clienteEmail asegura que se inicie cuando haya correo

  useEffect(() => {
    if (open) setHasNew(false);
    setTimeout(() => {
      if (chatRef.current) chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
  }, [open, mensajes.length]);

  const enviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msg.trim() || !clienteEmail) return;
    const currentText = msg;
    setMsg("");
    
    const { data: inserted, error } = await supabase
      .from("mensajes")
      .insert([{ nombre: clienteNombre, email: clienteEmail, mensaje: currentText, respondido: false }])
      .select().single<Mensaje>();
      
    if (!error && inserted) {
      setMensajes(prev => [...prev, inserted]);
      // Notify admin
      await supabase.from("notificaciones").insert([{
        usuario_id: null,
        tipo: "mensaje",
        mensaje: `Nuevo de ${clienteNombre}: ${currentText.slice(0, 30)}...`,
        leido: false,
      }]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 font-sans">
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
                  <FiMessageCircle className="text-xl" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight">Soporte Thiart3D</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">En línea</span>
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
              <div className="text-center mb-6">
                <span className="px-3 py-1 bg-white border border-gray-100 rounded-full text-[10px] text-gray-400 font-bold uppercase tracking-widest shadow-sm">
                  Hoy
                </span>
              </div>

              {mensajes.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 opacity-30">
                  <FiMessageCircle className="text-4xl" />
                  <p className="text-xs font-medium">¡Hola! ¿En qué podemos ayudarte?</p>
                </div>
              )}

              {mensajes.map((m, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  key={m.id || idx}
                  className={`flex ${m.nombre === "Admin" ? "justify-start" : "justify-end"}`}
                >
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm shadow-sm transition-all ${
                    m.nombre === "Admin"
                      ? "bg-white text-gray-800 rounded-bl-none border border-gray-100"
                      : "bg-black text-white rounded-br-none"
                  }`}>
                    <p className="leading-relaxed">{m.mensaje}</p>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                       <span className={`text-[9px] font-bold ${m.nombre === "Admin" ? "text-gray-400" : "text-gray-500"}`}>
                        {new Date(m.creado_en).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {m.nombre !== "Admin" && (
                        <FiCheck className="text-[10px] text-emerald-500" />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={enviarMensaje} className="p-4 bg-white border-t border-gray-50 flex items-center gap-2">
              <input
                type="text"
                placeholder="Escribe un mensaje..."
                className="flex-1 px-4 py-3 bg-gray-100 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-black/5 transition-all text-black"
                value={msg}
                onChange={e => setMsg(e.target.value)}
              />
              <button 
                type="submit"
                disabled={!msg.trim()}
                className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/10 disabled:opacity-50 disabled:scale-100"
              >
                <FiSend className="text-lg" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-16 h-16 bg-black text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl relative group overflow-hidden"
        onClick={() => setOpen(!open)}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        {open ? <FiX className="text-2xl" /> : <FiMessageCircle className="text-2xl" />}
        {hasNew && (
          <span className="absolute top-3 right-3 w-4 h-4 bg-emerald-500 border-2 border-black rounded-full animate-bounce"></span>
        )}
      </motion.button>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
      `}</style>
    </div>
  );
}