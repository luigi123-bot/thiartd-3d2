"use client";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { useState } from "react";
import {
  CheckCircle2,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Package,
  Printer,
  Download,
  Calendar,
  AlertCircle,
  ShieldCheck,
  TrendingUp,
  Layout,
  Receipt,
  Clock,
  Truck,
  ExternalLink,
  Copy,
  Check
} from "lucide-react";
import { parseJSON } from "../app/admin/pedidos/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface Producto {
  id: string;
  titulo?: string;
  nombre?: string;
  producto_id?: string;
  cantidad: number;
  precio_unitario: number;
  descripcion?: string;
}

interface DatosContacto {
  nombre?: string;
  email?: string;
  telefono?: string;
  cedula?: string;
}

interface GuiaDetalles {
  origen?: {
    nombre?: string;
    empresa?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    ciudad?: string;
    departamento?: string;
    codigoPostal?: string;
    taxId?: string;
  };
  destino?: {
    nombre?: string;
    email?: string;
    telefono?: string;
    direccion?: string;
    ciudad?: string;
    departamento?: string;
    codigoPostal?: string;
    taxId?: string;
  };
  paquetes?: {
    contenido?: string;
    cantidad?: number;
    pesoKg?: number;
    dimensionesCm?: { largo: number; ancho: number; alto: number };
    valorDeclarado?: number;
  }[];
  logistica?: {
    carrier?: string;
    service?: string;
    trackingNumber?: string;
    labelUrl?: string;
    fechaGeneracion?: string;
    fechaEstimada?: string;
  };
}

interface Pedido {
  id: number;
  cliente_id: string;
  estado: string;
  created_at: string;
  total: number;
  subtotal?: number;
  costo_envio?: number;
  tipo_entrega?: "envio" | "recoleccion";
  es_pod?: boolean;
  productos: string | Producto[];
  datos_contacto?: string | DatosContacto;
  direccion_envio?: string;
  ciudad_envio?: string;
  departamento_envio?: string;
  codigo_postal_envio?: string;
  telefono_envio?: string;
  notas_envio?: string;
  payment_id?: string;
  payment_method?: string;
  numero_tracking?: string;
  empresa_envio?: string;
  pdf_guia_url?: string;
  guia_detalles?: string | GuiaDetalles;
  fecha_estimada_entrega?: string;
}

interface DetallePedidoModalProps {
  pedido: Pedido | null;
  onClose: () => void;
  onAprobarPago: (pedidoId: number) => void;
  procesandoPago: number | null;
  onGuiaGenerada?: () => void;
}

interface IconProps {
  className?: string;
  size?: number | string;
  stroke?: string | number;
}

interface StatBoxProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<IconProps>;
  colorClass: string;
  delay?: number;
  className?: string;
}

function StatBox({ label, value, icon: Icon, colorClass, delay = 0, className = "" }: StatBoxProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className={`bg-white/5 backdrop-blur-md border border-white/10 p-3 sm:p-4 rounded-2xl flex items-center gap-3 sm:gap-4 group hover:bg-white/10 transition-all min-w-0 ${className}`}
    >
      <div className={`p-2 rounded-xl flex-shrink-0 ${colorClass} bg-opacity-20`}>
        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${colorClass.replace('bg-', 'text-')}`} />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 truncate">{label}</span>
        <span className="text-sm sm:text-base font-black text-white tracking-tighter tabular-nums truncate">{value}</span>
      </div>
    </motion.div>
  );
}

interface GlassCardProps {
  label: string;
  value: string | undefined;
  icon: React.ComponentType<IconProps>;
  theme: "blue" | "purple" | "emerald" | "amber";
  delay?: number;
}

function GlassCard({ label, value, icon: Icon, theme, delay = 0 }: GlassCardProps) {
  const themes = {
    blue: "from-blue-500/10 to-transparent text-blue-600",
    purple: "from-purple-500/10 to-transparent text-purple-600",
    emerald: "from-emerald-500/10 to-transparent text-emerald-600",
    amber: "from-amber-500/10 to-transparent text-amber-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative group bg-white border border-slate-200/60 p-5 rounded-[20px] shadow-sm hover:shadow-md transition-all h-full"
    >
      <div className="flex items-start gap-4 relative z-10">
        <div className={`w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center ${themes[theme].split(' ')[1]} flex-shrink-0 shadow-inner group-hover:bg-slate-100 transition-colors`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{label}</p>
          <p className="text-slate-900 font-bold text-[15px] leading-tight break-words">{value ?? "---"}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function DetallePedidoModal({
  pedido,
  onClose,
  onAprobarPago,
  procesandoPago,
  onGuiaGenerada,
}: DetallePedidoModalProps) {
  const [nuevoPrecio, setNuevoPrecio] = useState<string>(pedido?.total?.toString() ?? "0");
  const [pagoUrl, setPagoUrl] = useState<string>(pedido?.payment_id?.startsWith("http") ? pedido.payment_id : "");
  const [enviandoCotizacion, setEnviandoCotizacion] = useState(false);
  const [generandoLink, setGenerandoLink] = useState(false);
  const [generandoGuiaManual, setGenerandoGuiaManual] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);

  if (!pedido) return null;

  const productos: Producto[] = parseJSON<Producto[]>(pedido.productos) ?? [];
  const datos: DatosContacto = parseJSON<DatosContacto>(pedido.datos_contacto) ?? {};
  
  let guiaInfo: GuiaDetalles | null = null;
  try {
    if (typeof pedido.guia_detalles === "string") {
      guiaInfo = JSON.parse(pedido.guia_detalles) as GuiaDetalles;
    } else if (pedido.guia_detalles) {
      guiaInfo = pedido.guia_detalles;
    }
  } catch {
    guiaInfo = null;
  }

  const getStatusDetails = (estado: string) => {
    switch (estado) {
      case "pagado":
      case "completado":
      case "entregado":
        return { label: "PAGADO / LISTO", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" };
      case "en_produccion":
      case "en_envio":
      case "en_transito":
        return { label: "EN PROCESO", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" };
      case "pendiente_cotizacion":
        return { label: "COTIZACIÓN PENDIENTE", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" };
      default:
        return { label: "PENDIENTE", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" };
    }
  };

  const status = getStatusDetails(pedido.estado);

  const handleGenerarGuia = async () => {
    setGenerandoGuiaManual(true);
    try {
      const res = await fetch("/api/tracking/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedido_id: pedido.id }),
      });
      const data = (await res.json()) as { success?: boolean; numero_tracking?: string; error?: string };
      if (data.success) {
        toast.success(`Guía creada: ${data.numero_tracking ?? ""}`);
        if (onGuiaGenerada) onGuiaGenerada();
        onClose();
      } else {
        toast.error(data.error ?? "No se pudo generar la guía");
      }
    } catch {
      toast.error("Error de conexión al generar guía");
    } finally {
      setGenerandoGuiaManual(false);
    }
  };

  const handleCopyTracking = (num: string) => {
    void navigator.clipboard.writeText(num);
    setCopiedTracking(true);
    toast.success("Número de guía copiado");
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const handleGenerarLink = async () => {
    if (!nuevoPrecio || Number(nuevoPrecio) <= 0) {
      toast.error("Ingresa un precio válido");
      return;
    }
    setGenerandoLink(true);
    try {
      const res = await fetch("/api/pago-wompi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedido_id: pedido.id,
          total: Number(nuevoPrecio),
          descripcion: `Proyecto Personalizado #${pedido.id}`,
          cliente_email: datos.email ?? "cliente@ejemplo.com",
          cliente_nombre: datos.nombre ?? "Cliente",
        })
      });
      const data = await res.json() as { success?: boolean; url?: string; error?: string };
      if (data.success && data.url) {
        setPagoUrl(data.url);
        toast.success("Enlace de pago generado");
      } else {
        toast.error("Error: " + (data.error ?? "No se pudo generar"));
      }
    } catch {
      toast.error("Error al conectar con Wompi");
    } finally {
      setGenerandoLink(false);
    }
  };

  const handleEnviarCotizacion = async () => {
    if (!pagoUrl || !nuevoPrecio) {
      toast.error("Debes ingresar precio y link de pago");
      return;
    }
    setEnviandoCotizacion(true);
    try {
      const resp = await fetch("/api/admin/pedidos/enviar-cotizacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedidoId: pedido.id,
          total: Number(nuevoPrecio),
          pagoUrl,
          items: typeof pedido.notas_envio === 'string' ? pedido.notas_envio : "Proyecto Personalizado",
          to: datos.email,
          nombreCliente: datos.nombre ?? "Cliente"
        })
      });
      if (resp.ok) {
        toast.success("Cotización enviada correctamente");
        onClose();
      } else {
        const d = await resp.json() as { error?: string };
        toast.error("Error: " + (d.error ?? "No se pudo enviar"));
      }
    } catch (e) {
      console.error(e);
      toast.error("Error enviando cotización");
    } finally {
      setEnviandoCotizacion(false);
    }
  };

  return (
    <Dialog open={!!pedido} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="w-[98vw] sm:max-w-[95vw] lg:max-w-[1450px] p-0 border-0 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] rounded-[40px] bg-white overflow-hidden focus:outline-none"
        style={{ width: '98vw', maxWidth: '1450px' }}
      >
        <div className="sr-only">
          <DialogTitle>Detalle del Pedido #{pedido.id}</DialogTitle>
          <DialogDescription>
            Interfaz de gestión de pedidos con información detallada del cliente, productos y guía logística completa.
          </DialogDescription>
        </div>
        <div className="flex flex-col h-auto max-h-[95vh] overflow-hidden">

          <header className="flex-shrink-0 bg-[#020617] p-8 sm:p-10 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all z-50"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#00a19a] to-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
                  <Receipt className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight uppercase leading-none mb-2">
                    PEDIDO <span className="text-[#00a19a]">#{pedido.id}</span>
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className={`px-3 py-1 text-[9px] font-black rounded-full border ${status.color} tracking-widest uppercase`}>
                      {status.label}
                    </span>
                    {pedido.tipo_entrega === "recoleccion" ? (
                      <span className="px-3 py-1 text-[9px] font-black rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 tracking-widest uppercase">
                        📍 Recogida en Taller
                      </span>
                    ) : (
                      <span className="px-3 py-1 text-[9px] font-black rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 tracking-widest uppercase">
                        🚚 Envío a Domicilio
                      </span>
                    )}
                    {pedido.es_pod && (
                      <span className="px-3 py-1 text-[9px] font-black rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 tracking-widest uppercase">
                        🔧 Print On Demand
                      </span>
                    )}
                    <p className="text-slate-400 text-[11px] font-bold flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#00a19a]" />
                      {new Date(pedido.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto">
                <StatBox label="Total" value={`$${Number(pedido.total).toLocaleString("es-CO")}`} icon={TrendingUp as React.ComponentType<IconProps>} colorClass="bg-emerald-500" />
                <StatBox label="Items" value={productos.length} icon={Package as React.ComponentType<IconProps>} colorClass="bg-blue-500" />
                <StatBox label="Seguro" value="SSL / Wompi" icon={ShieldCheck as React.ComponentType<IconProps>} colorClass="bg-purple-500" className="hidden sm:flex" />
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Columna Principal */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* 1. INFORMACIÓN COMPLETA DE GUÍA DE ENVÍO (ORIGEN, DESTINO Y DETALLES) */}
                {pedido.tipo_entrega !== "recoleccion" && (
                  <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#00a19a] flex items-center justify-center">
                          <Truck className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Ficha Técnica de Guía de Envío</h3>
                          <p className="text-[11px] text-slate-400 font-semibold">Trazabilidad oficial de logística y despacho</p>
                        </div>
                      </div>

                      {pedido.numero_tracking ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyTracking(pedido.numero_tracking!)}
                            className="h-8 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            {copiedTracking ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>#{pedido.numero_tracking}</span>
                          </button>
                          {pedido.pdf_guia_url && (
                            <Button asChild size="sm" className="bg-[#00a19a] hover:bg-[#007973] text-white font-black text-xs h-8 px-3 rounded-lg shadow-sm">
                              <a href={pedido.pdf_guia_url} target="_blank" rel="noopener noreferrer">
                                <Printer className="w-3.5 h-3.5 mr-1" /> Imprimir Guía PDF
                              </a>
                            </Button>
                          )}
                        </div>
                      ) : (
                        <Button
                          onClick={handleGenerarGuia}
                          disabled={generandoGuiaManual}
                          size="sm"
                          className="bg-slate-900 hover:bg-[#00a19a] text-white font-black text-xs h-9 px-4 rounded-xl shadow-md transition-all"
                        >
                          {generandoGuiaManual ? "Generando con Envía..." : "🚀 Generar Guía Ahora"}
                        </Button>
                      )}
                    </div>

                    {/* Origen vs Destino Split */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                      {/* Origen */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-black text-[#00a19a] uppercase tracking-widest block">1. Origen / Remitente</span>
                        <p className="text-xs font-black text-slate-900">{guiaInfo?.origen?.empresa || "Thiart 3D"}</p>
                        <p className="text-xs text-slate-600">{guiaInfo?.origen?.direccion || "Calle 5 #24A-152"}</p>
                        <p className="text-[11px] text-slate-500 font-semibold">{guiaInfo?.origen?.ciudad || "Cali, Valle del Cauca (CO)"}</p>
                        <p className="text-[11px] text-slate-400">NIT: {guiaInfo?.origen?.taxId || "9018453128"} • Tel: {guiaInfo?.origen?.telefono || "3012906861"}</p>
                      </div>

                      {/* Destino */}
                      <div className="space-y-1.5 md:border-l md:border-slate-200 md:pl-4">
                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest block">2. Destino / Destinatario</span>
                        <p className="text-xs font-black text-slate-900">{guiaInfo?.destino?.nombre || datos.nombre || "Cliente Destinatario"}</p>
                        <p className="text-xs text-slate-600">{guiaInfo?.destino?.direccion || pedido.direccion_envio || "Dirección registrada"}</p>
                        <p className="text-[11px] text-slate-500 font-semibold">
                          {guiaInfo?.destino?.ciudad || pedido.ciudad_envio || "Ciudad"}, {guiaInfo?.destino?.departamento || pedido.departamento_envio || "Depto"} ({pedido.codigo_postal_envio || "CO"})
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Cédula: {guiaInfo?.destino?.taxId || datos.cedula || "N/D"} • Tel: {guiaInfo?.destino?.telefono || pedido.telefono_envio || datos.telefono || "N/D"}
                        </p>
                      </div>
                    </div>

                    {/* Detalles del Paquete y Logística */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-white p-3 rounded-xl border border-slate-100">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Transportadora</span>
                        <span className="font-black text-slate-900 uppercase mt-0.5 block">{pedido.empresa_envio || guiaInfo?.logistica?.carrier || "Coordinadora"}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-100">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Peso Estimado</span>
                        <span className="font-black text-slate-900 mt-0.5 block">{guiaInfo?.paquetes?.[0]?.pesoKg || "0.5"} Kg</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-100">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Dimensiones</span>
                        <span className="font-black text-slate-900 mt-0.5 block">15 × 15 × 15 cm</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-100">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Valor Asegurado</span>
                        <span className="font-black text-slate-900 mt-0.5 block">${Number(pedido.total).toLocaleString("es-CO")} COP</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Tarjetas de Contacto y Entrega */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <GlassCard label="Cliente" value={datos.nombre} icon={User as React.ComponentType<IconProps>} theme="blue" />
                  <GlassCard label="Email" value={datos.email} icon={Mail as React.ComponentType<IconProps>} theme="purple" />
                  <GlassCard label="Entrega" value={pedido.direccion_envio || "Retiro en Taller Cali"} icon={MapPin as React.ComponentType<IconProps>} theme="emerald" />
                  <GlassCard label="Teléfono" value={pedido.telefono_envio || datos.telefono} icon={Phone as React.ComponentType<IconProps>} theme="amber" />
                </div>

                {/* 3. Observaciones del Cliente */}
                {pedido.notas_envio && (
                  <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Observaciones del Pedido</h4>
                    <p className="text-xs text-slate-700 font-medium whitespace-pre-wrap">{pedido.notas_envio}</p>
                  </div>
                )}

                {/* 4. Lista de Productos Comprados */}
                <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Productos del Pedido</h3>
                  <div className="divide-y divide-slate-100">
                    {productos.map((p, i) => (
                      <div key={i} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                            <Package className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900 leading-tight">{p.titulo ?? p.nombre ?? p.producto_id}</p>
                            <p className="text-[10px] text-slate-400 font-semibold">{p.cantidad} unidad(es)</p>
                          </div>
                        </div>
                        <p className="text-xs font-black text-slate-900">
                          ${(p.cantidad * (p.precio_unitario || 0)).toLocaleString("es-CO")} COP
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Columna Lateral: Acciones y Totales */}
              <aside className="lg:col-span-4 space-y-6">
                <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80 space-y-6">
                  {pedido.estado === "pendiente_cotizacion" ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mx-auto mb-3">
                          <TrendingUp className="w-7 h-7" />
                        </div>
                        <h4 className="text-base font-black text-slate-900 uppercase">Cotizar Proyecto</h4>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Monto Total (COP)</label>
                          <input type="number" className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-base font-black focus:border-[#00a19a] outline-none" value={nuevoPrecio} onChange={(e) => setNuevoPrecio(e.target.value)} />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Link de Pago Wompi</label>
                          <input type="text" className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-bold mb-2 focus:border-[#00a19a] outline-none" value={pagoUrl} onChange={(e) => setPagoUrl(e.target.value)} />
                          <Button variant="outline" className="w-full h-9 rounded-xl text-[10px] font-black uppercase" onClick={handleGenerarLink} disabled={generandoLink}>
                            {generandoLink ? "Generando..." : "✨ Generar Link Wompi"}
                          </Button>
                        </div>
                        <Button className="w-full h-12 bg-[#00a19a] hover:bg-[#007973] text-white font-black rounded-xl shadow-md" onClick={handleEnviarCotizacion} disabled={enviandoCotizacion}>
                          {enviandoCotizacion ? "Enviando..." : "🚀 Enviar al Cliente"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <span className="text-xs font-black text-slate-900 uppercase">Estado de Pago</span>
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black ${status.color}`}>
                          {status.label}
                        </span>
                      </div>

                      <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between text-slate-500">
                          <span>Subtotal</span>
                          <span className="font-bold text-slate-900">${Number(pedido.subtotal ?? (pedido.total - (pedido.costo_envio ?? 0))).toLocaleString("es-CO")} COP</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>Costo Envío</span>
                          <span className="font-bold text-slate-900">${Number(pedido.costo_envio ?? 0).toLocaleString("es-CO")} COP</span>
                        </div>
                        <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                          <span className="font-black text-slate-900 text-sm">TOTAL</span>
                          <span className="text-xl font-black text-slate-900 tracking-tight">${Number(pedido.total).toLocaleString("es-CO")} <span className="text-[10px] text-slate-400">COP</span></span>
                        </div>
                      </div>

                      {pedido.estado === "pendiente_pago" && (
                        <Button
                          onClick={() => onAprobarPago(pedido.id)}
                          disabled={procesandoPago === pedido.id}
                          className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md"
                        >
                          {procesandoPago === pedido.id ? "Aprobando..." : "✓ Validar Pago Manual"}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
