"use client";
import { useState, useEffect } from "react";
import { FiSend } from "react-icons/fi";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { createClient } from "@supabase/supabase-js";
import { useUser } from "@clerk/nextjs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog";

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "TU_SUPABASE_URL";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "TU_SUPABASE_ANON_KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function PersonalizarPage() {
  const [tab, setTab] = useState<"nuevo" | "modificar">("nuevo");
  const [size, setSize] = useState("pequeno");
  const [material, setMaterial] = useState(MATERIALES[0]);
  const [color, setColor] = useState(COLORES[0]);
  const [acabado, setAcabado] = useState(ACABADOS[0]);
  const [presupuesto, setPresupuesto] = useState(PRESUPUESTOS[0]);
  const [plazo, setPlazo] = useState(PLAZOS[0]);
  const [img, setImg] = useState<File | null>(null);
  const { user } = useUser();
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

  // Crear o buscar conversación para el usuario
  useEffect(() => {
    if (!user) return;
    void (async () => {
      type Conversacion = { id: string; usuario_id: string; cliente_nombre: string };
      let conv: Conversacion | null = null;
      try {
        const convResult = await supabase
          .from("conversaciones")
          .select("*")
          .eq("usuario_id", user.id)
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
                usuario_id: user.id,
                cliente_nombre:
                  user.fullName ??
                  user.username ??
                  user.emailAddresses?.[0]?.emailAddress ??
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
      } catch{
        // handle unexpected errors
      }
    })();
  }, [user]);

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

  // Manejar envío de personalización
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let referenciaUrl = "";
    if (img) {
      const fileExt = img.name.split(".").pop();
      const fileName = `referencia-${user?.id ?? "anon"}-${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage
        .from("referencias")
        .upload(fileName, img);
      if (!error) {
        referenciaUrl = supabase.storage.from("referencias").getPublicUrl(fileName).data.publicUrl;
      }
    }
    // Guarda la solicitud de personalización (en tabla temporal)
    const persResult = await supabase.from("personalizaciones").insert([
      {
        usuario_id: user?.id ?? null,
        nombre: user?.fullName ?? "",
        email: user?.emailAddresses?.[0]?.emailAddress ?? "",
        tamano: size,
        material,
        color,
        acabado,
        presupuesto,
        plazo,
        descripcion: (document.querySelector("textarea"))?.value ?? "",
        referencia_url: referenciaUrl,
        estado: "pendiente_pago",
        created_at: new Date().toISOString(),
      },
    ]).select().single();
    setLoading(false);
    if (!persResult.error && persResult.data) {
      setShowPago(true); // Abre modal de pago
    } else {
      setMensaje("Error al enviar la solicitud.");
    }
  };

  // Simular pago y crear producto + pedido
  const handlePagar = async () => {
    setLoading(true);
    // Busca la última personalización pendiente de este usuario
    const persResult = await supabase
      .from("personalizaciones")
      .select("*")
      .eq("usuario_id", user?.id)
      .eq("estado", "pendiente_pago")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    type Personalizacion = {
      id: string;
      usuario_id: string;
      nombre: string;
      email: string;
      tamano: string;
      material: string;
      color: string;
      acabado: string;
      presupuesto: string;
      plazo: string;
      descripcion: string;
      referencia_url: string;
      estado: string;
      created_at: string;
      titulo?: string;
    };
    const pers = persResult.data as Personalizacion | null;

    if (!pers) {
      setMensaje("No se encontró la personalización.");
      setShowPago(false);
      setLoading(false);
      return;
    }

    // Crea el producto personalizado
    const prodResult = await supabase.from("productos").insert([
      {
        nombre: pers.titulo ?? "Producto Personalizado",
        descripcion: pers.descripcion,
        categoria: "Personalizado",
        precio: 0,
        stock: 1,
        imagen_url: pers.referencia_url,
        tamano: pers.tamano,
        created_at: new Date().toISOString(),
      },
    ]).select().single();

    const prod: { id: string } | null = prodResult.data as { id: string } | null;

    // Crea el pedido pendiente
    if (prod) {
      await supabase.from("pedidos").insert([
        {
          cliente_id: user?.id,
          productos: JSON.stringify([{ producto_id: prod.id, cantidad: 1, precio_unitario: 0 }]),
          total: 0,
          estado: "pendiente",
          direccion_envio: "",
          datos_contacto: JSON.stringify({ nombre: pers.nombre, email: pers.email }),
          created_at: new Date().toISOString(),
        },
      ]);
    }

    // Actualiza la personalización a "pagado"
    await supabase.from("personalizaciones").update({ estado: "pagado" }).eq("id", pers.id);

    setShowPago(false);
    setMensaje("¡Pago realizado! Tu producto personalizado está en proceso.");
    setLoading(false);
  };

  // Enviar mensaje
  const enviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !convId) return;
    await supabase.from("mensajes").insert([
      {
        conversacion_id: convId,
        usuario_id: user?.id,
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
      <header className="py-12 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-3">Crea tu Producto Personalizado</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Diseñamos y fabricamos productos 3D únicos según tus especificaciones. Cuéntanos tu idea y la haremos realidad.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-gray-100 rounded-full p-1">
          <button
            className={`px-6 py-2 rounded-full font-semibold transition ${tab === "nuevo" ? "bg-black text-white shadow" : "text-gray-700"}`}
            onClick={() => setTab("nuevo")}
          >
            Nuevo Diseño
          </button>
          <button
            className={`px-6 py-2 rounded-full font-semibold transition ${tab === "modificar" ? "bg-black text-white shadow" : "text-gray-700"}`}
            onClick={() => setTab("modificar")}
          >
            Modificar Existente
          </button>
        </div>
      </div>

      {/* Formulario */}
      <main className="flex-1 flex flex-col items-center px-4">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">
            {tab === "nuevo" ? "Solicitud de Nuevo Diseño" : "Modificar Producto Existente"}
          </h2>
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <div className="flex flex-col md:flex-row gap-4">
              <Input placeholder="Nombre" className="rounded-lg" required />
              <Input placeholder="Correo electrónico" type="email" className="rounded-lg" required />
            </div>
            <Input placeholder="Título del proyecto" className="rounded-lg" required />

            {/* Selector de tamaño */}
            <div>
              <div className="mb-2 font-medium">Tamaño</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {SIZES.map((s) => (
                  <button
                    type="button"
                    key={s.value}
                    className={`rounded-xl border-2 p-4 flex flex-col items-center transition font-semibold ${
                      size === s.value
                        ? "border-black bg-gray-100 shadow"
                        : "border-gray-200 bg-white hover:border-black"
                    }`}
                    onClick={() => setSize(s.value)}
                  >
                    <span>{s.label}</span>
                    <span className="text-xs text-gray-500">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Material, color, acabado */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="material-select" className="block mb-1 font-medium">Material</label>
                <select
                  id="material-select"
                  className="w-full border rounded-lg px-3 py-2"
                  value={material}
                  onChange={e => setMaterial(e.target.value)}
                >
                  {MATERIALES.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="color-select" className="block mb-1 font-medium">Color</label>
                <select
                  id="color-select"
                  className="w-full border rounded-lg px-3 py-2"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                >
                  {COLORES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="acabado-select" className="block mb-1 font-medium">Acabado</label>
                <select
                  id="acabado-select"
                  className="w-full border rounded-lg px-3 py-2"
                  value={acabado}
                  onChange={e => setAcabado(e.target.value)}
                >
                  {ACABADOS.map((a) => <option key={a}>{a}</option>)}
                </select>
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="block mb-1 font-medium">Descripción del Proyecto</label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 min-h-[100px]"
                placeholder="Describe tu idea, detalles, medidas, funcionalidades, etc."
                required
              />
            </div>

            {/* Imagen de referencia */}
            <div>
              <label className="block mb-1 font-medium">Imagen de referencia (opcional)</label>
              <Input
                type="file"
                accept="image/*"
                className="rounded-lg"
                onChange={e => setImg(e.target.files?.[0] ?? null)}
              />
            </div>

            {/* Presupuesto y plazo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="presupuesto-select" className="block mb-1 font-medium">Presupuesto aproximado</label>
                <select
                  id="presupuesto-select"
                  className="w-full border rounded-lg px-3 py-2"
                  value={presupuesto}
                  onChange={e => setPresupuesto(e.target.value)}
                >
                  {PRESUPUESTOS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="plazo-select" className="block mb-1 font-medium">Plazo de entrega deseado</label>
                <select
                  id="plazo-select"
                  className="w-full border rounded-lg px-3 py-2"
                  value={plazo}
                  onChange={e => setPlazo(e.target.value)}
                >
                  {PLAZOS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <Button type="submit" className="w-full mt-4 rounded-lg font-semibold" disabled={loading}>
              {loading ? "Enviando..." : "Enviar solicitud"}
            </Button>
            {mensaje && <div className="text-green-600 text-center mt-2">{mensaje}</div>}
          </form>
        </div>

        {/* FAQ */}
        <section className="w-full max-w-3xl mb-16">
          <h3 className="text-xl font-bold mb-4 text-center">Preguntas Frecuentes</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="bg-gray-100 rounded-xl p-5 shadow-sm">
                <div className="font-semibold mb-2">{faq.q}</div>
                <div className="text-gray-600">{faq.a}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
      {/* Modal de pago */}
      <Dialog open={showPago} onOpenChange={setShowPago}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pago de Personalización</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <div className="text-2xl font-bold mb-2">Total: $0</div>
            <div className="mb-4 text-gray-600">Por ahora, la personalización es gratuita para pruebas.</div>
            <Button className="w-full" onClick={handlePagar} disabled={loading}>
              {loading ? "Procesando..." : "Finalizar compra"}
            </Button>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowPago(false)} disabled={loading}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chat flotante */}
      <button
        className="fixed bottom-8 right-8 bg-black text-white rounded-full p-4 shadow-lg hover:bg-gray-800 z-[9999]"
        onClick={() => setChatOpen(true)}
        title="Chatea con nosotros"
      >
        <FiSend className="text-2xl" />
      </button>
      {chatOpen && (
        <div
          className="fixed bottom-24 right-8 w-80 h-[420px] bg-white rounded-xl shadow-lg border flex flex-col z-[9999]"
          style={{ maxHeight: 420, minHeight: 420 }}
        >
          <div className="flex items-center justify-between p-3 border-b flex-shrink-0">
            <div className="font-bold text-lg flex items-center gap-2">
              <FiSend /> Chat Personalización
            </div>
            <button onClick={() => setChatOpen(false)} className="p-1 rounded hover:bg-gray-100" title="Cerrar chat">
              ×
            </button>
          </div>
          {/* Área de mensajes con scroll */}
          <div
            className="flex-1 overflow-y-auto"
            style={{ minHeight: 0, maxHeight: 320, padding: "0.5rem" }}
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
              value={nuevoMensaje}
              onChange={e => setNuevoMensaje(e.target.value)}
            />
            <button
              type="submit"
              className="bg-black text-white rounded-full p-2 hover:bg-gray-800"
              disabled={!nuevoMensaje.trim()}
              title="Enviar mensaje"
            >
              <FiSend />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
