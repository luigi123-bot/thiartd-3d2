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
} from "lucide-react";
import { parseJSON } from "../app/admin/pedidos/utils";
import { motion } from "framer-motion";

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
}

interface Pedido {
  id: number;
  cliente_id: string;
  estado: string;
  created_at: string;
  total: number;
  subtotal?: number;
  costo_envio?: number;
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
}

interface DetallePedidoModalProps {
  pedido: Pedido | null;
  onClose: () => void;
  onAprobarPago: (pedidoId: number) => void;
  procesandoPago: number | null;
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
}: DetallePedidoModalProps) {
  const [nuevoPrecio, setNuevoPrecio] = useState<string>(pedido?.total?.toString() ?? "0");
  const [pagoUrl, setPagoUrl] = useState<string>(pedido?.payment_id?.startsWith("http") ? pedido.payment_id : "");
  const [enviandoCotizacion, setEnviandoCotizacion] = useState(false);
  const [generandoLink, setGenerandoLink] = useState(false);

  if (!pedido) return null;

  const datos = parseJSON<DatosContacto>(pedido.datos_contacto) ?? {};
  const productos = parseJSON<Producto[]>(pedido.productos) ?? [];

  const getStatusConfig = (estado: string): { label: string; color: string; icon: React.ComponentType<IconProps> } => {
    switch (estado) {
      case 'pagado':
        return { label: 'CONFIRMADO', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 as React.ComponentType<IconProps> };
      case 'pendiente_pago':
        return { label: 'PENDIENTE', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: CreditCard as React.ComponentType<IconProps> };
      case 'pago_cancelado':
        return { label: 'CANCELADO', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', icon: X as React.ComponentType<IconProps> };
      case 'pendiente_cotizacion':
        return { label: 'COTIZACIÓN', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', icon: Clock as React.ComponentType<IconProps> };
      default:
        return { label: (estado ?? '---').replace(/_/g, ' ').toUpperCase(), color: 'text-slate-400 bg-slate-500/10 border-slate-500/20', icon: Layout as React.ComponentType<IconProps> };
    }
  };

  const status = getStatusConfig(pedido.estado);

  const handleGenerarLink = async () => {
    setGenerandoLink(true);
    try {
      const resp = await fetch("/api/pago-wompi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(nuevoPrecio),
          customer_email: datos.email ?? "",
          reference: `PEDIDO-${pedido.id}-COT-${Date.now()}`,
          customer_name: datos.nombre ?? "Cliente",
          redirect_url: `${window.location.origin}/tienda/pago-exitoso?pedido=${pedido.id}`,
        })
      });
      const data = await resp.json() as { permalink?: string; error?: string };
      if (data.permalink) {
        setPagoUrl(data.permalink);
      } else {
        alert("Error: " + (data.error ?? "No se pudo generar el link"));
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión");
    } finally {
      setGenerandoLink(false);
    }
  };

  const handleEnviarCotizacion = async () => {
    if (!pagoUrl || !nuevoPrecio) {
      alert("Debes ingresar precio y link de pago");
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
        alert("Cotización enviada correctamente");
        onClose();
        window.location.reload();
      } else {
        const d = await resp.json() as { error?: string };
        alert("Error: " + (d.error ?? "No se pudo enviar"));
      }
    } catch (e) {
      console.error(e);
      alert("Error enviando cotización");
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
            Interfaz de gestión de pedidos con información detallada del cliente, productos e inversión final.
          </DialogDescription>
        </div>
        <div className="flex flex-col h-auto max-h-[95vh] overflow-hidden">

          <header className="flex-shrink-0 bg-[#020617] p-10 sm:p-12 md:p-14 text-white relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#7b00ff]/10 blur-[120px] rounded-full pointer-events-none" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all z-50"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 sm:gap-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-[20px] bg-gradient-to-tr from-[#7b00ff] to-[#a855f7] flex items-center justify-center shadow-lg shadow-[#7b00ff]/20">
                  <Receipt className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter uppercase leading-none mb-2">
                    PEDIDO <span className="text-[#a855f7]">#{pedido.id}</span>
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className={`px-3 py-1 text-[9px] font-black rounded-full border ${status.color} tracking-widest`}>
                      {status.label}
                    </span>
                    <p className="text-slate-500 text-[11px] font-bold flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-[#a855f7]" />
                      {new Date(pedido.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 w-full lg:w-auto">
                <StatBox label="Total" value={`$${Number(pedido.total).toLocaleString("es-CO")}`} icon={TrendingUp as React.ComponentType<IconProps>} colorClass="bg-emerald-500" />
                <StatBox label="Items" value={productos.length} icon={Package as React.ComponentType<IconProps>} colorClass="bg-blue-500" />
                <StatBox label="Seguro" value="SSL" icon={ShieldCheck as React.ComponentType<IconProps>} colorClass="bg-purple-500" className="hidden sm:flex" />
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto bg-slate-50/30 p-4 sm:p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">

              <div className="lg:col-span-8 space-y-6 md:space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <GlassCard label="Cliente" value={datos.nombre} icon={User as React.ComponentType<IconProps>} theme="blue" />
                  <GlassCard label="Email" value={datos.email} icon={Mail as React.ComponentType<IconProps>} theme="purple" />
                  <GlassCard label="Entrega" value={pedido.direccion_envio} icon={MapPin as React.ComponentType<IconProps>} theme="emerald" />
                  <GlassCard label="Teléfono" value={pedido.telefono_envio} icon={Phone as React.ComponentType<IconProps>} theme="amber" />
                </div>

                <div className="p-6 sm:p-8 rounded-[24px] bg-white border border-slate-200/60 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:scale-110 transition-transform">
                    <AlertCircle className="w-24 h-24 text-[#7b00ff]" />
                  </div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
                    {pedido.notas_envio?.includes("[Cotización]") ? "DATOS DE LA COTIZACIÓN" : "Observaciones"}
                  </h3>
                  <div className="text-slate-600 font-medium whitespace-pre-wrap leading-relaxed">
                    {pedido.notas_envio?.includes("[Cotización]") ? (
                      <div className="space-y-4">
                        {pedido.notas_envio.split("\n").map((line, i) => {
                          if (line.trim() === "[Cotización]") return null;
                          const parts = line.split(":");
                          if (parts.length < 2) return <p key={i} className="text-slate-800">{line}</p>;
                          const lineLabel = parts[0]!;
                          const lineValue = parts.slice(1).join(":").trim();
                          return (
                            <div key={i} className="flex flex-col sm:flex-row sm:gap-4 border-b border-slate-50 pb-2">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 sm:w-32">{lineLabel.trim()}</span>
                              <span className="text-sm font-bold text-slate-900">{lineValue}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      pedido.notas_envio ?? "Sin especificaciones especiales."
                    )}
                  </div>
                </div>

                <div className="p-6 sm:p-8 rounded-[24px] bg-white border border-slate-200/60 shadow-sm">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Detalle de Compra</h3>
                  <div className="space-y-4">
                    {productos.map((p, i) => (
                      <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4 border-b border-slate-50 last:border-0 last:pb-0">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                            <Package className="w-6 h-6" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-base font-bold text-slate-900 block truncate">{p.titulo ?? p.nombre ?? p.producto_id}</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-[#7b00ff]">SKU-{i + 1}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between w-full sm:w-auto gap-8">
                          <div className="text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Cant.</p>
                            <p className="text-sm font-black text-slate-900">×{p.cantidad}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Precio</p>
                            <p className="text-base font-black text-slate-900">
                              ${(p.cantidad * p.precio_unitario).toLocaleString("es-CO")}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <aside className="lg:col-span-4 space-y-6 h-fit lg:sticky lg:top-8">
                <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-xl border border-slate-100 flex flex-col relative overflow-hidden group">
                  {pedido.estado === "pendiente_cotizacion" ? (
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 mx-auto mb-4">
                          <TrendingUp className="w-8 h-8" />
                        </div>
                        <h4 className="text-xl font-black text-slate-900 uppercase">Cotizar Proyecto</h4>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Monto Total (COP)</label>
                          <input type="number" className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 text-xl font-black focus:border-[#7b00ff] outline-none" value={nuevoPrecio} onChange={(e) => setNuevoPrecio(e.target.value)} />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Link de Pago Wompi</label>
                          <input type="text" className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 text-xs font-bold mb-2 focus:border-[#7b00ff] outline-none" value={pagoUrl} onChange={(e) => setPagoUrl(e.target.value)} />
                          <Button variant="outline" className="w-full h-10 rounded-xl text-[10px] font-black uppercase border-dashed" onClick={handleGenerarLink} disabled={generandoLink}>
                            {generandoLink ? "GENERANDO..." : "✨ GENERAR LINK WOMPI"}
                          </Button>
                        </div>
                        <Button className="w-full h-14 bg-[#7b00ff] hover:bg-[#6200cc] text-white font-black rounded-2xl shadow-lg" onClick={handleEnviarCotizacion} disabled={enviandoCotizacion}>
                          {enviandoCotizacion ? "ENVIANDO..." : "🚀 ENVIAR AL CLIENTE"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 flex flex-col items-center justify-center py-6">
                        <div className="w-20 h-20 bg-slate-50 rounded-[28px] flex items-center justify-center text-slate-300 mb-6 shadow-inner">
                          <CreditCard className="w-10 h-10" />
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] font-black text-[#7b00ff] uppercase tracking-[0.3em] mb-2">Transacción</p>
                          <h4 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{status.label}</h4>
                        </div>
                      </div>
                      <div className="space-y-3 mt-4">
                        <div className="flex justify-between items-center text-slate-500">
                          <span className="text-[10px] font-black uppercase tracking-widest">Subtotal</span>
                          <span className="text-slate-900 font-extrabold text-sm">$ {Number(pedido.subtotal ?? (pedido.total - (pedido.costo_envio ?? 0))).toLocaleString("es-CO")}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-500">
                          <span className="text-[10px] font-black uppercase tracking-widest">Envío</span>
                          <span className="text-slate-900 font-extrabold text-sm">$ {Number(pedido.costo_envio ?? 0).toLocaleString("es-CO")}</span>
                        </div>
                        <div className="pt-6 mt-4 border-t-2 border-slate-50 flex justify-between items-end">
                          <div className="flex flex-col">
                            <span className="text-slate-900 font-black text-xs uppercase tracking-[0.2em] leading-none mb-1">TOTAL</span>
                            <span className="text-[8px] font-bold text-[#7b00ff] uppercase tracking-widest">IVA Incluido</span>
                          </div>
                          <span className="text-[#7b00ff] text-3xl font-black tracking-tighter leading-none">${Number(pedido.total).toLocaleString("es-CO")}</span>
                        </div>
                      </div>
                      {pedido.estado === "pendiente_pago" && (
                        <Button onClick={() => onAprobarPago(pedido.id)} disabled={procesandoPago === pedido.id} className="mt-8 w-full h-14 bg-[#7b00ff] hover:bg-[#6200cc] text-white font-black rounded-2xl shadow-lg">
                          {procesandoPago === pedido.id ? "SINCRONIZANDO..." : "VALIDAR PAGO"}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </aside>
            </div>
          </div>

          <footer className="flex-shrink-0 bg-white border-t border-slate-100 p-6 sm:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-mono font-bold text-slate-500">REF: LX-{pedido.id}</span>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
              <button onClick={() => window.print()} className="flex-1 h-12 md:h-14 px-6 rounded-2xl font-black text-[12px] uppercase text-slate-600 bg-white border-2 border-slate-100 flex items-center justify-center gap-2">
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Imprimir</span>
              </button>
              <button className="flex-1 h-12 md:h-14 px-8 rounded-2xl font-black text-[12px] uppercase text-white bg-slate-900 flex items-center justify-center gap-2 shadow-xl">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">PDF</span>
                <span className="sm:hidden">Exportar</span>
              </button>
            </div>
          </footer>
        </div>
      </DialogContent>
    </Dialog>
  );
}
