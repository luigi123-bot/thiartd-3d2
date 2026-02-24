"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "~/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "~/components/ui/select";
import { createClient } from "@supabase/supabase-js";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Mail,
  Plus,
  Filter,
  MoreVertical,
  ArrowRight,
  LifeBuoy
} from "lucide-react";
import { useToast } from "~/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

interface IconProps {
  className?: string;
  size?: number | string;
  stroke?: string | number;
}

interface EstadoConfig {
  value: string;
  label: string;
  color: string;
  icon: React.ComponentType<IconProps>;
}

const ESTADOS: EstadoConfig[] = [
  { value: "abierto", label: "Abierto", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Clock as React.ComponentType<IconProps> },
  { value: "en_progreso", label: "En progreso", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: AlertTriangle as React.ComponentType<IconProps> },
  { value: "resuelto", label: "Resuelto", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: CheckCircle2 as React.ComponentType<IconProps> },
  { value: "cerrado", label: "Cerrado", color: "bg-slate-500/10 text-slate-500 border-slate-500/20", icon: XCircle as React.ComponentType<IconProps> },
];

const CATEGORIAS = [
  "Error",
  "Sugerencia",
  "Consulta",
  "Otro"
];

interface Ticket {
  id: number;
  titulo: string;
  descripcion: string;
  categoria: string;
  estado: string;
  created_at: string;
  imagen_url?: string;
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [estadoFiltro, setEstadoFiltro] = useState<string>("all");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("tickets")
      .select("id,titulo,descripcion,categoria,estado,created_at,imagen_url")
      .order("created_at", { ascending: false });

    if (estadoFiltro !== "all") query = query.eq("estado", estadoFiltro);
    if (categoriaFiltro !== "all") query = query.eq("categoria", categoriaFiltro);

    const { data, error } = await query;
    if (error) {
      console.error("Error al obtener tickets:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los tickets.",
        variant: "destructive",
      });
      setTickets([]);
    } else {
      setTickets(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  }, [estadoFiltro, categoriaFiltro, toast]);

  useEffect(() => {
    void fetchTickets();
  }, [fetchTickets]);

  const cambiarEstado = async (id: number, nuevoEstado: string) => {
    const { error } = await supabase.from("tickets").update({ estado: nuevoEstado }).eq("id", id);
    if (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Éxito",
        description: "Estado actualizado correctamente.",
      });
      void fetchTickets();
    }
  };

  const stats = {
    total: tickets.length,
    abiertos: tickets.filter(t => t.estado === "abierto").length,
    enProgreso: tickets.filter(t => t.estado === "en_progreso").length,
    resueltos: tickets.filter(t => t.estado === "resuelto").length,
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 space-y-8">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00a19a] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00a19a]/10 border border-[#00a19a]/20 text-[#00a19a] text-xs font-bold uppercase tracking-wider mb-2">
              <LifeBuoy className="w-3 h-3" /> Soporte Técnico
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
              Gestión de <span className="text-[#00a19a]">Tickets</span>
            </h1>
            <p className="text-slate-500 text-lg max-w-2xl">
              Monitorea, gestiona y responde a todas las solicitudes de soporte de tus clientes desde un panel centralizado.
            </p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/10 group h-12 px-6 rounded-xl transition-all hover:scale-[1.02]"
          >
            <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
            Nuevo Ticket
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Total Tickets", value: stats.total, icon: Mail as React.ComponentType<IconProps>, color: "slate" as const },
            { label: "Abiertos", value: stats.abiertos, icon: Clock as React.ComponentType<IconProps>, color: "blue" as const },
            { label: "En Progreso", value: stats.enProgreso, icon: AlertTriangle as React.ComponentType<IconProps>, color: "amber" as const },
            { label: "Resueltos", value: stats.resueltos, icon: CheckCircle2 as React.ComponentType<IconProps>, color: "emerald" as const },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="border-none shadow-sm shadow-slate-200/50 bg-white/80 backdrop-blur-sm hover:shadow-md transition-all group overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-4">
                      <div className={`p-2 w-fit rounded-lg bg-${stat.color}-50 text-${stat.color}-600 ring-1 ring-${stat.color}-500/10`}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
                        <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
                      </div>
                    </div>
                    <div className="opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
                      <stat.icon className="w-16 h-16 -mr-4 -mt-4 rotate-[-15deg]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filters and Table Card */}
        <Card className="border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden rounded-2xl">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-6 px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
                  <Filter className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Base de Datos</CardTitle>
                  <CardDescription>Mostrando {tickets.length} tickets actuales</CardDescription>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
                  <SelectTrigger className="w-[180px] h-10 bg-white rounded-xl shadow-sm border-slate-200">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    {ESTADOS.map(e => (
                      <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
                  <SelectTrigger className="w-[180px] h-10 bg-white rounded-xl shadow-sm border-slate-200">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {CATEGORIAS.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" size="icon" onClick={() => void fetchTickets()} className="h-10 w-10 shrink-0 rounded-xl">
                  <Clock className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="w-[80px] pl-8 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest">ID</TableHead>
                  <TableHead className="py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest">Ticket</TableHead>
                  <TableHead className="py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest">Categoría</TableHead>
                  <TableHead className="py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest">Estado</TableHead>
                  <TableHead className="py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest">Fecha</TableHead>
                  <TableHead className="w-[150px] pr-8 text-right py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-10 h-10 border-4 border-[#00a19a]/30 border-t-[#00a19a] rounded-full animate-spin" />
                        <p className="text-slate-400 font-medium">Sincronizando tickets...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="p-4 rounded-full bg-slate-50 ring-1 ring-slate-100">
                          <LifeBuoy className="w-8 h-8 text-slate-300" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-slate-900 font-bold">No se encontraron tickets</p>
                          <p className="text-slate-500 text-sm">Prueba ajustando los filtros de búsqueda.</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  tickets.map((t, idx) => (
                    <motion.tr
                      key={t.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group hover:bg-slate-50/50 transition-colors border-slate-100"
                    >
                      <TableCell className="pl-8 font-mono text-xs text-slate-400">#{t.id}</TableCell>
                      <TableCell className="max-w-md">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900 line-clamp-1 group-hover:text-[#00a19a] transition-colors">{t.titulo}</p>
                          <p className="text-xs text-slate-500 line-clamp-1">{t.descripcion}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 capitalize text-[10px] font-bold py-0 h-5 px-2 rounded-md">
                          {t.categoria}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const found = ESTADOS.find(e => e.value === t.estado);
                          const config = found ?? ESTADOS[0]!;
                          const Icon = config.icon;
                          return (
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-tight ${config.color}`}>
                              <Icon className="w-3 h-3" />
                              {config.label}
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs">
                        {t.created_at ? new Date(t.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : "---"}
                      </TableCell>
                      <TableCell className="pr-8 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Select
                            value={t.estado}
                            onValueChange={(val) => cambiarEstado(t.id, val)}
                          >
                            <SelectTrigger className="w-[130px] h-8 text-[10px] font-bold uppercase tracking-tight rounded-lg">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ESTADOS.map(e => (
                                <SelectItem key={e.value} value={e.value} className="text-[10px] font-bold uppercase">{e.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <MoreVertical className="w-4 h-4 text-slate-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          <div className="bg-slate-50/50 border-t border-slate-100 p-4 px-8 flex justify-between items-center">
            <p className="text-xs text-slate-500 font-medium">Mostrando {tickets.length} resultados globales</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs" disabled>Anterior</Button>
              <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs" disabled>Siguiente</Button>
            </div>
          </div>
        </Card>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <TicketModal
              onClose={() => setIsModalOpen(false)}
              onTicketCreated={() => {
                setIsModalOpen(false);
                void fetchTickets();
              }}
            />
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}

function TicketModal({ onClose, onTicketCreated }: { onClose: () => void, onTicketCreated: () => void }) {
  const [form, setForm] = useState({ titulo: "", descripcion: "", categoria: CATEGORIAS[0] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from("tickets")
        .insert([{
          titulo: form.titulo,
          descripcion: form.descripcion,
          categoria: form.categoria,
          estado: "abierto",
          created_at: new Date().toISOString(),
        }])
        .select()
        .single() as { data: Ticket | null; error: unknown };

      if (error) throw new Error(JSON.stringify(error));

      if (data) {
        toast({
          title: "¡Ticket creado!",
          description: "El ticket ha sido registrado correctamente.",
        });

        // Correo notificado via API (opcional)
        void fetch("/api/enviar-correo-admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: "admin@thiart3d.com",
            subject: "Nuevo Ticket de Soporte",
            text: `Nuevo ticket: ${form.titulo}`,
          }),
        }).catch((e: Error) => { console.error("Error sending email:", e); });

        onTicketCreated();
      }
    } catch (err) {
      const error = err as Error;
      toast({
        title: "Error al crear ticket",
        description: error.message ?? "Ha ocurrido un error inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-[500px] border-none shadow-2xl rounded-3xl p-0 overflow-hidden bg-white">
      <div className="bg-slate-900 p-8 text-white relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00a19a]/20 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl ring-1 ring-white/20">
            <Mail className="w-6 h-6 text-[#00a19a]" />
          </div>
          <div>
            <DialogTitle className="text-2xl font-black tracking-tight">Nuevo Ticket</DialogTitle>
            <DialogDescription className="text-slate-400">
              Completa la información técnica del incidente.
            </DialogDescription>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Título del Incidente</label>
            <Input
              placeholder="Ej: Error al cargar modelo 3D..."
              required
              className="h-12 bg-slate-50 border-slate-100 rounded-xl focus-visible:ring-[#00a19a]"
              value={form.titulo}
              onChange={e => setForm({ ...form, titulo: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Categoría</label>
            <Select
              value={form.categoria}
              onValueChange={val => setForm({ ...form, categoria: val })}
            >
              <SelectTrigger className="h-12 bg-slate-50 border-slate-100 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Descripción Detallada</label>
            <Textarea
              placeholder="Describe paso a paso cómo reproducir el error o los detalles de tu consulta..."
              required
              className="min-h-[120px] bg-slate-50 border-slate-100 rounded-xl focus-visible:ring-[#00a19a] resize-none"
              value={form.descripcion}
              onChange={e => setForm({ ...form, descripcion: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter className="pt-4 border-t border-slate-100 flex gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="rounded-xl flex-1 h-12 text-slate-500 font-bold"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl flex-[2] h-12 bg-[#00a19a] hover:bg-[#007973] text-white font-bold transition-all shadow-lg shadow-[#00a19a]/20"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Registrando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                Crear Ticket <ArrowRight className="w-4 h-4" />
              </div>
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}


