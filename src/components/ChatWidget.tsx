"use client";
import { useState, useEffect, useRef } from "react";
import { FiMessageCircle, FiSend, FiX, FiClock } from "react-icons/fi";
import { createClient } from "@supabase/supabase-js";
import ReportarErrorModal from "./ReportarErrorModal";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "TU_SUPABASE_URL";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "TU_SUPABASE_ANON_KEY";
const supabase = createClient(supabaseUrl, supabaseKey);


export default function ChatWidget({
  clienteId,
  clienteNombre,
  clienteEmail,
}: {
  clienteId?: string;
  clienteNombre: string;
  clienteEmail: string;
}) {
  const [open, setOpen] = useState(false);
  type Mensaje = {
    id: number;
    conversacion_id: number;
    remitente: string;
    texto: string;
    hora: string;
    created_at?: string;
  };
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [msg, setMsg] = useState("");
  const [convId, setConvId] = useState<number | null>(null);
  const [hasNew, setHasNew] = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);
  type Conv = {
    id: number;
    cliente_id: string;
    cliente_nombre: string;
    cliente_email: string;
    created_at: string;
    // Add other fields as needed based on your "conversaciones" table
  };
  const [convs, setConvs] = useState<Conv[]>([]);
  const [ticketModal, setTicketModal] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // Buscar o crear conversación principal (actual)
  useEffect(() => {
    async function getOrCreateConv() {
      const { data: conv } = await supabase
        .from("conversaciones")
        .select("*")
        .eq("cliente_id", clienteId!)
        .single<Conv>();
      let conversation = conv;
      if (!conversation) {
        const { data: nueva } = await supabase
          .from("conversaciones")
          .insert([{ cliente_id: clienteId, cliente_nombre: clienteNombre, cliente_email: clienteEmail }])
          .select()
          .single<Conv>();
        conversation = nueva;
      }
      if (conversation) setConvId(conversation.id);
    }
    if (clienteId) void getOrCreateConv();
  }, [clienteId, clienteNombre, clienteEmail]);

  // Cargar historial de conversaciones del usuario
  useEffect(() => {
    if (!clienteId) return;
    supabase
      .from("conversaciones")
      .select("*")
      .eq("cliente_id", clienteId)
      .order("created_at", { ascending: false })
      .then(({ data }) => setConvs(Array.isArray(data) ? data : []));
  }, [clienteId, open, showHistorial]);

  // Cargar mensajes y suscripción en tiempo real
  useEffect(() => {
    if (!convId) return;
    let ignore = false;
    // Cargar mensajes iniciales
    supabase
      .from("mensajes")
      .select("*")
      .eq("conversacion_id", convId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (!ignore) setMensajes(Array.isArray(data) ? data : []);
      });

    // Suscripción realtime: usa .on('broadcast', ...) para canales Realtime nuevos de Supabase
    // y .on('postgres_changes', ...) para tablas
    const channel = supabase
      .channel(`mensajes-chatwidget-${convId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mensajes", filter: `conversacion_id=eq.${convId}` },
        (payload) => {
          // Recarga todos los mensajes para asegurar sincronía
          supabase
            .from("mensajes")
            .select("*")
            .eq("conversacion_id", convId)
            .order("created_at", { ascending: true })
            .then(({ data }) => {
              setMensajes(Array.isArray(data) ? data : []);
            });
          // Si el mensaje es del admin y el chat está cerrado, muestra notificación
          if ((payload.new as { remitente?: string })?.remitente === "admin" && !open) setHasNew(true);
        }
      )
      .subscribe();

    return () => {
      ignore = true;
      void supabase.removeChannel(channel);
    };
  }, [convId, open]);

  // Marcar como leído al abrir el chat
  useEffect(() => {
    if (open) setHasNew(false);
    setTimeout(() => {
      if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, 100);
  }, [open, mensajes.length]);

  // Enviar mensaje
  const enviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msg.trim() || !convId) return;
    // Insertar mensaje
    const { data: mensajeInsertado } = await supabase
      .from("mensajes")
      .insert([
        {
          conversacion_id: convId,
          remitente: "cliente",
          texto: msg,
          hora: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ])
      .select()
      .single<Mensaje>();
    setMsg("");
    // Crear notificación para el admin
    if (mensajeInsertado) {
      await supabase.from("notificaciones").insert([
        {
          usuario_id: "admin", // o el id del admin si tienes varios
          tipo: "mensaje",
          mensaje: `Nuevo mensaje de ${clienteNombre}`,
          conversacion_id: convId,
          mensaje_id: mensajeInsertado.id,
          leido: false,
        },
      ]);
    }
    setTimeout(() => {
      if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, 100);
  };

  // Subir ticket (imagen, descripción, categoría)

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">
      {/* Botón flotante para abrir el modal de reportar error */}
      {!ticketModal && (
        <button
          className="bg-red-600 text-white rounded-full p-4 shadow-lg hover:bg-red-700 relative mb-2"
          onClick={() => setTicketModal(true)}
          title="Reportar un problema"
        >
          🐞
        </button>
      )}
      {/* Modal de reportar error */}
      <ReportarErrorModal
        open={ticketModal}
        onOpenChangeAction={setTicketModal}
        clienteId={clienteId}
      />
      {/* Botón para abrir el chat */}
      {!open ? (
        <button
          className="bg-black text-white rounded-full p-4 shadow-lg hover:bg-gray-800 relative"
          onClick={() => setOpen(true)}
          title="Chatea con nosotros"
        >
          <FiMessageCircle className="text-2xl" />
          {hasNew && (
            <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full px-2 animate-bounce">
              1
            </span>
          )}
        </button>
      ) : (
        <div
          className="w-80 bg-white rounded-xl shadow-lg border flex flex-col"
          style={{ height: 420, maxHeight: 420, minHeight: 420 }}
        >
          <div className="flex items-center justify-between p-3 border-b flex-shrink-0">
            <div className="font-bold text-lg flex items-center gap-2">
              <FiMessageCircle /> Chat
            </div>
            <div className="flex gap-2">
              <button
                className="p-1 rounded hover:bg-gray-100"
                title="Reportar problema"
                onClick={() => setTicketModal(true)}
              >
                🐞
              </button>
              <button
                className="p-1 rounded hover:bg-gray-100"
                title="Historial de mensajes"
                onClick={() => setShowHistorial((v) => !v)}
              >
                <FiClock />
              </button>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-gray-100" title="Cerrar chat">
                <FiX />
              </button>
            </div>
          </div>
          {showHistorial ? (
            <div className="flex-1 overflow-y-auto p-3" style={{ minHeight: 0, maxHeight: 320 }}>
              <div className="font-semibold mb-2 text-sm">Historial de mensajes</div>
              {convs.length === 0 ? (
                <div className="text-gray-400 text-center mt-10 text-sm">Sin conversaciones previas</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {convs.map((conv) => (
                    <button
                      key={conv.id}
                      className={`w-full text-left px-3 py-2 rounded border ${convId === conv.id ? "bg-gray-100 border-black" : "bg-white border-gray-200"} hover:bg-gray-50`}
                      onClick={() => {
                        setConvId(conv.id);
                        setShowHistorial(false);
                      }}
                    >
                      <div className="font-medium text-xs">Conversación #{conv.id}</div>
                      <div className="text-xs text-gray-500">{new Date(conv.created_at).toLocaleString()}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <div
                className="flex-1 overflow-y-auto p-3 chat-messages-area"
                ref={chatRef}
              >
                <div className="flex flex-col gap-2">
                  {mensajes.map((m, idx) => (
                    <div
                      key={idx}
                      className={`flex ${m.remitente === "cliente" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`rounded-lg px-4 py-2 text-sm max-w-[70%] ${
                          m.remitente === "cliente"
                            ? "bg-black text-white rounded-br-none"
                            : "bg-gray-100 text-gray-900 rounded-bl-none"
                        }`}
                      >
                        {m.texto}
                        <div className="text-xs text-gray-400 text-right mt-1">{m.hora}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Input fijo abajo */}
              <form className="flex items-center gap-2 p-3 border-t flex-shrink-0" onSubmit={enviarMensaje}>
                <input
                  type="text"
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Escribe un mensaje..."
                  value={msg}
                  onChange={e => setMsg(e.target.value)}
                />
                <button
                  type="submit"
                  className="bg-black text-white rounded-full p-2 hover:bg-gray-800"
                  disabled={!msg.trim()}
                  title="Enviar mensaje"
                >
                  <FiSend />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}