"use client";
import React, { useState, useEffect, useMemo } from "react";
import { createClient } from '@supabase/supabase-js';
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog";
import { Card } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Badge } from "~/components/ui/badge";
import {
  FiTruck,
  FiCheckCircle,
  FiClock,
  FiPackage,
  FiPlus,
  FiSearch,
  FiChevronRight,
  FiCalendar,
  FiEdit2,
  FiX,
} from "react-icons/fi";
import clsx from "clsx";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "TU_SUPABASE_URL";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "TU_SUPABASE_ANON_KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

const ESTADOS = [
  { value: "En proceso", label: "En proceso", icon: <FiClock />, color: "bg-blue-100 text-blue-700", neumor: "shadow-blue-100" },
  { value: "Orden en proceso", label: "Orden en proceso", icon: <FiPackage />, color: "bg-indigo-100 text-indigo-700", neumor: "shadow-indigo-100" },
  { value: "Enviado", label: "Enviado", icon: <FiTruck />, color: "bg-purple-100 text-purple-700", neumor: "shadow-purple-100" },
  { value: "Finalizado", label: "Entregado", icon: <FiCheckCircle />, color: "bg-green-100 text-green-700", neumor: "shadow-green-100" },
];

function getEstadoColor(estado: string) {
  const found = ESTADOS.find(e => e.value === estado);
  return found ? found.color : "bg-gray-100 text-gray-700";
}

function getEstadoNeumor(estado: string) {
  const found = ESTADOS.find(e => e.value === estado);
  return found ? found.neumor : "shadow-gray-100";
}

export default function AdminEnviosPage() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    nombre_cliente: "",
    direccion: "",
    fecha_envio: "",
    estado: "En proceso",
    dia_entrega: ""
  });
  const [envios, setEnvios] = useState<any[]>([]);
  const [selectedEnvio, setSelectedEnvio] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [tab, setTab] = useState("todos");
  const [filtro, setFiltro] = useState("");
  const [searchFocus, setSearchFocus] = useState(false);

  // Estadísticas generales animadas
  const stats = useMemo(() => {
    const hoy = new Date().toISOString().slice(0, 10);
    return {
      total: envios.length,
      enviadosHoy: envios.filter(e => e.fecha_envio === hoy).length,
      pendientes: envios.filter(e => e.estado === "En proceso" || e.estado === "Orden en proceso").length,
      entregados: envios.filter(e => e.estado === "Finalizado").length,
    };
  }, [envios]);

  // Autocompletado de búsqueda
  const autocomplete = useMemo(() => {
    if (!filtro) return [];
    const lower = filtro.toLowerCase();
    return envios
      .filter(e =>
        e.nombre_cliente?.toLowerCase().includes(lower) ||
        e.direccion?.toLowerCase().includes(lower)
      )
      .slice(0, 5);
  }, [filtro, envios]);

  const fetchEnvios = async () => {
    const { data, error } = await supabase.from('envios').select('*').order('id', { ascending: false });
    if (!error) setEnvios(data || []);
  };

  useEffect(() => {
    fetchEnvios();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('envios').insert([
      {
        nombre_cliente: form.nombre_cliente,
        direccion: form.direccion,
        fecha_envio: form.fecha_envio,
        estado: form.estado,
        dia_entrega: form.dia_entrega
      }
    ]);
    if (error) {
      alert('Error al guardar el envío: ' + error.message);
    } else {
      setShowModal(false);
      setForm({ nombre_cliente: '', direccion: '', fecha_envio: '', estado: 'En proceso', dia_entrega: '' });
      fetchEnvios();
    }
  };

  const handleRowClick = (envio: any) => {
    setSelectedEnvio(envio);
    setShowDetailModal(true);
  };

  // Filtrar envíos por estado para cada tab y búsqueda
  const enviosPorEstado = (estado: string) =>
    estado === "todos"
      ? envios.filter(e =>
          filtro
            ? e.nombre_cliente?.toLowerCase().includes(filtro.toLowerCase()) ||
              e.direccion?.toLowerCase().includes(filtro.toLowerCase())
            : true
        )
      : envios.filter(
          e =>
            e.estado === estado &&
            (filtro
              ? e.nombre_cliente?.toLowerCase().includes(filtro.toLowerCase()) ||
                e.direccion?.toLowerCase().includes(filtro.toLowerCase())
              : true)
        );

  // Animación suave para tarjetas
  const cardAnim = "transition-all duration-300 hover:scale-[1.025] hover:shadow-xl";

  return (
    <div className="min-h-screen p-0 md:p-8 bg-gradient-to-br from-[#f6f8fc] via-[#f3f4fa] to-[#e9eaf7] font-[Inter,sans-serif]">
      {/* Título y descripción */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-[#007973] mb-2 tracking-tight">Gestión de Envíos</h1>
        <p className="text-gray-500 text-lg mb-4">
          Administra, filtra y visualiza todos los pedidos y entregas de tus clientes en tiempo real.
        </p>
      </div>
      {/* Barra superior de estadísticas */}
      <div className="w-full flex flex-wrap justify-center gap-6 mb-10">
        <StatCard
          icon={<FiTruck className="text-blue-500" />}
          label="Total pedidos"
          value={stats.total}
          bg="bg-white/70"
          iconBg="bg-blue-100"
        />
        <StatCard
          icon={<FiClock className="text-blue-600" />}
          label="Enviados hoy"
          value={stats.enviadosHoy}
          bg="bg-white/70"
          iconBg="bg-blue-100"
        />
        <StatCard
          icon={<FiPackage className="text-orange-500" />}
          label="Pendientes"
          value={stats.pendientes}
          bg="bg-white/70"
          iconBg="bg-orange-100"
        />
        <StatCard
          icon={<FiCheckCircle className="text-green-600" />}
          label="Entregados"
          value={stats.entregados}
          bg="bg-white/70"
          iconBg="bg-green-100"
        />
      </div>
      {/* Barra de filtros interactivos tipo pill */}
      <section className="max-w-5xl mx-auto mb-10">
        <div className="flex flex-wrap justify-center items-center gap-4">
          <PillFilter
            active={tab === "todos"}
            onClick={() => setTab("todos")}
            icon={<FiTruck className="text-blue-400" />}
            label="Todos"
            count={envios.length}
            gradient="from-[#7fd7c4] to-[#b2e0f7]"
          />
          {ESTADOS.map(e => (
            <PillFilter
              key={e.value}
              active={tab === e.value}
              onClick={() => setTab(e.value)}
              icon={e.icon}
              label={e.label}
              count={envios.filter(envio => envio.estado === e.value).length}
              gradient={
                e.value === "En proceso"
                  ? "from-[#b2e0f7] to-[#7fd7c4]"
                  : e.value === "Orden en proceso"
                  ? "from-[#e0c3fc] to-[#8ec5fc]"
                  : e.value === "Enviado"
                  ? "from-[#d1c4e9] to-[#b2e0f7]"
                  : "from-[#b7f8db] to-[#50a7c2]"
              }
            />
          ))}
        </div>
      </section>
      {/* Barra de búsqueda y tarjetas de envíos */}
      <div className="max-w-5xl mx-auto items-center gap-6 mb-10 neumorph-container p-6 bg-white rounded-xl shadow-lg">
        {/* Filtro de búsqueda con autocompletado */}
        <div className="my-6 flex flex-col md:flex-row gap-2 items-center">
          <div className="relative w-full md:w-96 neumorph-input">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Buscar por cliente o dirección..."
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
              onFocus={() => setSearchFocus(true)}
              onBlur={() => setTimeout(() => setSearchFocus(false), 150)}
              className="pl-10 pr-3 py-2 rounded-xl neumorph-input"
            />
            {filtro && (
              <button
                type="button"
                className="absolute right-3 top-3 text-gray-400 hover:text-red-400 transition"
                onClick={() => setFiltro("")}
                tabIndex={-1}
                aria-label="Limpiar búsqueda"
              >
                <FiX />
              </button>
            )}
            {searchFocus && filtro && autocomplete.length > 0 && (
              <div className="absolute left-0 right-0 top-12 bg-white rounded-xl shadow-lg z-10 neumorph-autocomplete animate-fade-in">
                {autocomplete.map((e, idx) => (
                  <div
                    key={e.id}
                    className="px-4 py-2 hover:bg-[#f0f4f8] cursor-pointer flex items-center gap-2"
                    onMouseDown={() => {
                      setFiltro(e.nombre_cliente);
                      setSearchFocus(false);
                    }}
                  >
                    <FiChevronRight className="text-gray-400" />
                    <span className="font-medium">{e.nombre_cliente}</span>
                    <span className="text-xs text-gray-500 ml-2">{e.direccion}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <Tabs value={tab} onValueChange={setTab} className="mb-8">
          {/* Contenido de tabs */}
          <TabsContent value="todos">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-6">
              {enviosPorEstado("todos").length === 0 ? (
                <Card className="p-8 text-center text-gray-400 neumorph-card">No hay envíos registrados.</Card>
              ) : (
                enviosPorEstado("todos").map((envio) => (
                  <EnvioCard key={envio.id} envio={envio} onClick={() => handleRowClick(envio)} />
                ))
              )}
            </div>
          </TabsContent>
          {ESTADOS.map(e => (
            <TabsContent key={e.value} value={e.value}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-6">
                {enviosPorEstado(e.value).length === 0 ? (
                  <Card className="p-8 text-center text-gray-400 neumorph-card">No hay envíos en esta etapa.</Card>
                ) : (
                  enviosPorEstado(e.value).map((envio) => (
                    <EnvioCard key={envio.id} envio={envio} onClick={() => handleRowClick(envio)} />
                  ))
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
      {/* Modal para agregar envío */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl neumorph-modal py-10 px-8 text-black">
          <DialogHeader>
            <p className="text-gray-500 mb-4 text-base">
              Agrega un nuevo envío completando la información del cliente y la entrega.
            </p>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                type="text"
                name="nombre_cliente"
                placeholder="Nombre del cliente"
                value={form.nombre_cliente}
                onChange={handleChange}
                required
                className="rounded-xl neumorph-input"
              />
              <Input
                type="text"
                name="direccion"
                placeholder="Dirección"
                value={form.direccion}
                onChange={handleChange}
                required
                className="rounded-xl neumorph-input"
              />
              <Input
                type="date"
                name="fecha_envio"
                value={form.fecha_envio}
                onChange={handleChange}
                required
                placeholder="Fecha de envío"
                className="rounded-xl neumorph-input"
              />
              <Input
                type="text"
                name="dia_entrega"
                placeholder="Día de entrega (opcional)"
                value={form.dia_entrega}
                onChange={handleChange}
                className="rounded-xl neumorph-input"
              />
              <div className="md:col-span-2">
                <label htmlFor="estado" className="block font-medium mb-1">
                  Estado
                </label>
                <select
                  name="estado"
                  id="estado"
                  className="border rounded-xl px-3 py-2 w-full neumorph-input"
                  value={form.estado}
                  onChange={handleChange}
                >
                  {ESTADOS.map(e => (
                    <option key={e.value} value={e.value}>{e.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter className="mt-6 flex gap-4">
              <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#007973] text-white neumorph-btn"
                style={{ background: "linear-gradient(90deg, #7fd7c4 0%, #007973 100%)" }}
              >
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Modal de detalles */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl neumorph-modal py-10 px-8">
          <DialogHeader>
            <p className="text-gray-500 mb-4 text-base">
              Consulta la información detallada del envío seleccionado.
            </p>
          </DialogHeader>
          {selectedEnvio && (
            <div className="space-y-6">
              <div className="flex items-center gap-6 mb-2">
                <div className="flex flex-col">
                  <span className="font-bold text-xl text-[#007973]">{selectedEnvio.nombre_cliente}</span>
                  <span className="text-xs text-gray-500">Cliente</span>
                </div>
                <Badge variant="secondary" className={clsx("ml-auto text-base px-4 py-1", getEstadoColor(selectedEnvio.estado))}>
                  {selectedEnvio.estado}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <span className="font-semibold">Dirección:</span>
                  <div className="text-base text-gray-700">{selectedEnvio.direccion}</div>
                </div>
                <div>
                  <span className="font-semibold">Fecha de envío:</span>
                  <span className="ml-2 text-base text-gray-700">{selectedEnvio.fecha_envio}</span>
                </div>
                {selectedEnvio.dia_entrega && (
                  <div className="flex items-center gap-2 md:col-span-2">
                    <FiCalendar className="text-green-500" />
                    <span className="font-semibold">Día de entrega:</span>
                    <span className="ml-2 text-base text-green-700">{selectedEnvio.dia_entrega}</span>
                  </div>
                )}
              </div>
              {/* Indicador visual de progreso */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-500">Progreso:</span>
                <div className="flex-1 h-3 rounded-full bg-gray-200 overflow-hidden neumorph-progress">
                  <div
                    className={clsx(
                      "h-3 rounded-full transition-all",
                      selectedEnvio.estado === "Finalizado"
                        ? "bg-green-500 w-full"
                        : selectedEnvio.estado === "Enviado"
                        ? "bg-purple-500 w-3/4"
                        : selectedEnvio.estado === "Orden en proceso"
                        ? "bg-indigo-500 w-1/2"
                        : "bg-blue-500 w-1/4"
                    )}
                  />
                </div>
              </div>
              <div>
                <span className="font-semibold block mb-1">Ubicación de entrega:</span>
                <div className="rounded-lg overflow-hidden border neumorph-map">
                  <iframe
                    title="mapa"
                    width="100%"
                    height="260"
                    className="map-iframe"
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(selectedEnvio.direccion)}&output=embed`}
                  ></iframe>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="mt-6 flex gap-4">
            <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Estilos neumorfismo y animaciones */}
      <style jsx global>{`
        .neumorph-card, .neumorph-modal, .neumorph-tabs, .neumorph-tab, .neumorph-btn, .neumorph-input, .neumorph-autocomplete, .neumorph-map, .neumorph-progress {
          box-shadow: 0 4px 24px 0 #e0e7ef, 0 1.5px 4px 0 #cfd8dc;
          background: #f8fafc;
        }
        .neumorph-btn:active, .neumorph-tab:active {
          box-shadow: 0 2px 8px 0 #cfd8dc;
        }
        .neumorph-tabs {
          border-radius: 2rem;
          padding: 0.5rem 1rem;
        }
        .neumorph-tab {
          border-radius: 1.5rem;
          padding: 0.5rem 1.2rem;
          font-weight: 500;
          background: #f8fafc;
          margin-right: 0.5rem;
          transition: background 0.2s, box-shadow 0.2s;
        }
        .neumorph-tab[data-state="active"] {
          background: #e0f7fa;
          color: #007973;
          box-shadow: 0 2px 8px 0 #b2dfdb;
        }
        .neumorph-input {
          box-shadow: 0 2px 8px 0 #e0e7ef;
          background: #f8fafc;
        }
        .neumorph-autocomplete {
          box-shadow: 0 4px 24px 0 #e0e7ef;
        }
        .neumorph-progress {
          box-shadow: 0 1px 4px 0 #e0e7ef;
        }
        .neumorph-map {
          box-shadow: 0 2px 8px 0 #e0e7ef;
        }
        .neumorph-soft {
          box-shadow: 0 2px 16px 0 #e0e7ef;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(30px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .animate-fade-in {
          animation: fade-in 0.5s;
        }
      `}</style>
    </div>
  );
}

// Tarjeta de envío con neumorfismo y animación
function EnvioCard({ envio, onClick }: { envio: any; onClick: () => void }) {
  return (
    <Card
      className={clsx(
        "relative p-6 neumorph-card cursor-pointer group",
        getEstadoNeumor(envio.estado),
        "hover:scale-[1.025] hover:shadow-xl transition-all duration-300"
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="font-bold text-lg">{envio.nombre_cliente}</span>
        <Badge className={clsx(getEstadoColor(envio.estado), "ml-auto")}>{envio.estado}</Badge>
      </div>
      <div className="text-sm text-gray-600 mb-1">
        <b>Dirección:</b> {envio.direccion}
      </div>
      <div className="text-xs text-gray-500 mb-1">
        <b>Fecha envío:</b> {envio.fecha_envio}
      </div>
      {envio.dia_entrega && (
        <div className="flex items-center gap-1 text-xs text-green-600 mb-1">
          <FiCalendar className="mr-1" />
          <b>Día entrega:</b> {envio.dia_entrega}
        </div>
      )}
      {/* Indicador visual de progreso */}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs text-gray-400">Progreso</span>
        <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden neumorph-progress">
          <div
            className={clsx(
              "h-2 rounded-full transition-all",
              envio.estado === "Finalizado"
                ? "bg-green-500 w-full"
                : envio.estado === "Enviado"
                ? "bg-purple-500 w-3/4"
                : envio.estado === "Orden en proceso"
                ? "bg-indigo-500 w-1/2"
                : "bg-blue-500 w-1/4"
            )}
          />
        </div>
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all"
        onClick={e => {
          e.stopPropagation();
          // Aquí podrías abrir un modal de edición en el futuro
        }}
        aria-label="Editar"
      >
        <FiEdit2 className="text-gray-400 hover:text-[#007973] transition" />
      </Button>
      <FiChevronRight className="absolute top-6 right-4 text-gray-300 group-hover:text-[#007973] transition" />
    </Card>
  );
}

// Tarjeta de resumen estadístico moderna y responsive
function StatCard({
  icon,
  label,
  value,
  bg,
  iconBg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  bg?: string;
  iconBg?: string;
}) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center rounded-2xl",
        "px-6 py-4 min-w-[170px] max-w-xs w-full",
        "shadow-md backdrop-blur-md",
        bg || "bg-white/80",
        "transition-all duration-200 hover:scale-105 hover:shadow-lg",
        "cursor-pointer"
      )}
      style={{
        border: "1.5px solid #e0e7ef",
      }}
    >
      <div
        className={clsx(
          "flex items-center justify-center rounded-full mb-2",
          iconBg || "bg-gray-100",
          "w-12 h-12 shadow-sm"
        )}
      >
        {icon}
      </div>
      <div className="font-extrabold text-3xl text-gray-800 mb-1">{value}</div>
      <div className="text-md text-gray-500 font-medium text-center">{label}</div>
    </div>
  );
}

// PillFilter component
function PillFilter({
  active,
  onClick,
  icon,
  label,
  count,
  gradient,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
  gradient: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "flex items-center gap-2 px-4 py-2 rounded-full font-medium shadow-md transition-all duration-200 border",
        "focus:outline-none focus:ring-2 focus:ring-[#7fd7c4]",
        active
          ? `bg-gradient-to-r ${gradient} text-white border-transparent scale-105`
          : "bg-white/80 text-gray-700 border-gray-200 hover:bg-gray-100"
      )}
      style={{ fontFamily: "Inter, Poppins, sans-serif" }}
      aria-pressed={active ? "true" : "false"}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-base">{label}</span>
      <span
        className={clsx(
          "ml-2 px-2 py-0.5 rounded-full text-xs font-semibold shadow",
          active
            ? "bg-white/80 text-[#007973]"
            : "bg-gray-100 text-gray-500"
        )}
      >
        {count}
      </span>
    </button>
  );
}
