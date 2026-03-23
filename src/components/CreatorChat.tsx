"use client";

import { useEffect, useState, useRef } from "react";
import { FiSend, FiMessageCircle, FiArrowLeft } from "react-icons/fi";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { supabase } from "~/lib/supabaseClient";

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
  unreadCount: number;
}

export default function CreatorChat({ onBack }: { creatorEmail?: string, onBack: () => void }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const chatRef = useRef<HTMLDivElement>(null);

  const fetchThreads = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const { data, error } = await supabase
        .from("mensajes")
        .select("*")
        .order("creado_en", { ascending: false });

      if (error) {
        // console.error("Error fetching messages:", error);
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
            unreadCount: 0,
          });
        }

        if (isFromClient && !m.leido) {
          const thread = grouped.get(m.email)!;
          thread.unreadCount += 1;
        }
      });

      setThreads(Array.from(grouped.values()));
    } catch {
      // silently ignore chat fetch errors
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    void fetchThreads();
    
    // Subscribe to all messages
    const channel = supabase
      .channel('creator-chat-updates')
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensajes" }, (payload) => {
        void fetchThreads(false);
        const newMessage = payload.new as Mensaje;
        if (newMessage.email === selectedEmail) {
           setMensajes(prev => [...prev, newMessage]);
        }
      })
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [selectedEmail]);

  useEffect(() => {
    if (!selectedEmail) return;
    const loadMensajes = async () => {
      const { data } = await supabase.from("mensajes").select("*").eq("email", selectedEmail).order("creado_en", { ascending: true });
      if (data) {
        setMensajes(data as Mensaje[]);
        // Mark as read
        const unreadIds = (data as Mensaje[]).filter(m => !m.leido && m.nombre !== "Admin").map(m => m.id);
        if (unreadIds.length > 0) {
          await supabase.from("mensajes").update({ leido: true }).in("id", unreadIds);
        }
      }
    };
    void loadMensajes();
  }, [selectedEmail]);

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [mensajes]);

  const enviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msg.trim() || !selectedEmail) return;
    const txt = msg;
    setMsg("");
    
    const { data, error } = await supabase.from("mensajes").insert([{
      nombre: "Admin", 
      email: selectedEmail,
      mensaje: txt,
      respondido: true
    }]).select().single<Mensaje>();
    
    if (!error && data) {
       setMensajes(prev => [...prev, data]);
    }
  };

  if (selectedEmail) {
    return (
      <div className="flex flex-col h-[500px]">
        <div className="flex items-center gap-3 p-3 border-b bg-gray-50/50">
          <Button variant="ghost" size="icon" onClick={() => setSelectedEmail(null)}>
            <FiArrowLeft className="w-5 h-5 text-gray-500" />
          </Button>
          <div>
            <h4 className="font-bold text-sm text-gray-900 leading-none">{threads.find(t => t.email === selectedEmail)?.nombre}</h4>
            <span className="text-[10px] text-[#009688] font-bold">{selectedEmail}</span>
          </div>
        </div>
        
        <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
          {mensajes.map((m) => (
            <div key={m.id} className={`flex ${m.nombre === "Admin" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm shadow-sm ${
                m.nombre === "Admin" ? "bg-black text-white rounded-br-none" : "bg-white text-gray-800 rounded-bl-none border border-gray-100"
              }`}>
                <p className="leading-relaxed">{m.mensaje}</p>
                <div className="mt-1 flex items-center justify-end">
                   <span className="text-[9px] text-gray-400 font-bold">{new Date(m.creado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={enviarMensaje} className="p-3 bg-white border-t flex items-center gap-2">
          <Input 
             placeholder="Responder..." 
             className="h-10 bg-gray-50 rounded-xl" 
             value={msg} 
             onChange={(e) => setMsg(e.target.value)}
          />
          <Button type="submit" size="icon" className="h-10 w-10 bg-black text-white hover:bg-gray-800 rounded-xl" disabled={!msg.trim()}>
             <FiSend className="w-4 h-4" />
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex items-center justify-between p-3 border-b">
         <Button variant="ghost" size="icon" onClick={onBack}>
            <FiArrowLeft className="w-5 h-5" />
         </Button>
         <h4 className="font-bold text-gray-900 text-sm">Mensajes de Clientes</h4>
         <div className="w-10"></div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-gray-50/50">
        {loading ? (
          <div className="py-20 flex justify-center text-gray-400 text-xs">Cargando conversaciones...</div>
        ) : threads.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-300 space-y-2">
             <FiMessageCircle className="w-10 h-10" />
             <p className="text-xs font-bold uppercase tracking-widest">Sin mensajes aún</p>
          </div>
        ) : (
          threads.map((t) => (
            <div 
              key={t.email} 
              onClick={() => setSelectedEmail(t.email)}
              className="flex items-center gap-3 p-3 bg-white hover:bg-gray-50 rounded-xl border border-gray-100 cursor-pointer transition-all shadow-sm group"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold group-hover:bg-[#009688] group-hover:text-white transition-colors">
                {t.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                  <p className="text-sm font-bold text-gray-800 truncate leading-none">{t.nombre}</p>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">{new Date(t.fecha).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{t.ultimoMensaje}</p>
              </div>
              {t.unreadCount > 0 && (
                <div className="h-4 min-w-[16px] bg-[#009688] rounded-full flex items-center justify-center px-1">
                   <span className="text-[10px] text-white font-black">{t.unreadCount}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
