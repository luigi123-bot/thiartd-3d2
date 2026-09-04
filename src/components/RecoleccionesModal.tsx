"use client";

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { X, Check, ChevronDown, Info, Truck, CheckCircle2, Box, Layers } from "lucide-react";
import { toast } from "sonner";
import { ORIGEN_DEFECTO } from "../../utils/envia";

interface GuiaItem {
  id: number;
  numero_tracking?: string;
  empresa_envio?: string;
  total: number;
  created_at: string;
  ciudad_envio?: string;
  datos_contacto?: string;
}

interface RecoleccionesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedidosList?: GuiaItem[];
  onRecogidaExitosa?: () => void;
}

export default function RecoleccionesModal({
  open,
  onOpenChange,
  pedidosList = [],
  onRecogidaExitosa,
}: RecoleccionesModalProps) {
  const [tipoEnvio, setTipoEnvio] = useState<"cajas" | "tarimas">("cajas");
  const [carrierSeleccionado, setCarrierSeleccionado] = useState<string>("coordinadora");
  const [origenSeleccionado, setOrigenSeleccionado] = useState<string>("todos");
  const [carrierChecked, setCarrierChecked] = useState<boolean>(true);

  // Fecha y Horarios
  const hoyStr = new Date().toISOString().split("T")[0]!;
  const [fechaRecoleccion, setFechaRecoleccion] = useState<string>(hoyStr);
  const [horaInicial, setHoraInicial] = useState<string>("08:00");
  const [horaFinal, setHoraFinal] = useState<string>("19:00");

  // Filtro de guías
  const [guiasSeleccionadas, setGuiasSeleccionadas] = useState<string>("todos");
  const [customCantidad, setCustomCantidad] = useState<number>(1);
  const [customPeso, setCustomPeso] = useState<string>("1.5");

  const [loading, setLoading] = useState<boolean>(false);
  const [confirmacionExitosa, setConfirmacionExitosa] = useState<{
    codigo: string;
    carrier: string;
    fecha: string;
    horario: string;
  } | null>(null);

  // Guías disponibles que tienen tracking
  const guiasConTracking = useMemo(() => {
    return pedidosList.filter((p) => p.numero_tracking);
  }, [pedidosList]);

  const cantidadCalculada = guiasConTracking.length > 0 ? guiasConTracking.length : customCantidad;
  const pesoCalculado = guiasConTracking.length > 0 ? (guiasConTracking.length * 0.8).toFixed(1) : customPeso;

  const handleConfirmarRecoleccion = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/envios/recogidas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carrier: carrierSeleccionado,
          pickupDate: fechaRecoleccion,
          pickupTimeFrom: horaInicial,
          pickupTimeTo: horaFinal,
          totalPackages: cantidadCalculada,
          totalWeight: parseFloat(pesoCalculado) || 1.5,
          instructions: `Recolección en ${ORIGEN_DEFECTO.street}, ${ORIGEN_DEFECTO.number}, ${ORIGEN_DEFECTO.city}. Taller Thiart 3D.`,
          pedidosIds: guiasConTracking.map((p) => p.id),
        }),
      });

      const data = (await res.json()) as {
        success?: boolean;
        recogida?: { confirmation_number: string };
        mensaje?: string;
        error?: string;
      };

      if (data.success && data.recogida) {
        setConfirmacionExitosa({
          codigo: data.recogida.confirmation_number,
          carrier: carrierSeleccionado,
          fecha: fechaRecoleccion,
          horario: `${horaInicial} - ${horaFinal}`,
        });
        toast.success("¡Recolección programada exitosamente con la transportadora!");
        if (onRecogidaExitosa) onRecogidaExitosa();
      } else {
        toast.error(data.error ?? "No se pudo programar la recolección");
      }
    } catch {
      toast.error("Error al conectar con la API de recolecciones");
    } finally {
      setLoading(false);
    }
  };

  const handleCerrar = () => {
    setConfirmacionExitosa(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleCerrar}>
      <DialogContent className="max-w-md w-full bg-[#f4f7fb] p-0 rounded-2xl border border-slate-200/80 shadow-2xl overflow-hidden font-sans">
        
        {/* Header Principal */}
        <div className="bg-white px-5 py-4 flex items-center justify-between border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Recolecciones</h2>
          <button
            onClick={handleCerrar}
            className="w-7 h-7 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {confirmacionExitosa ? (
          /* Pantalla de Éxito */
          <div className="p-6 bg-white m-4 rounded-2xl border border-emerald-100 shadow-sm text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Solicitud Confirmada
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">
                #{confirmacionExitosa.codigo}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                La transportadora <strong>{confirmacionExitosa.carrier.toUpperCase()}</strong> ha recibido tu orden de recolección.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl text-left text-xs space-y-2 border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Punto de Recogida:</span>
                <span className="font-bold text-slate-800">Calle 5 #24A-152, Cali</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Fecha Programada:</span>
                <span className="font-bold text-slate-800">{confirmacionExitosa.fecha}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Ventana de Horario:</span>
                <span className="font-bold text-slate-800">{confirmacionExitosa.horario}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Paquetes declarados:</span>
                <span className="font-bold text-slate-800">{cantidadCalculada} ({pesoCalculado} KG)</span>
              </div>
            </div>

            <Button
              onClick={handleCerrar}
              className="w-full bg-[#1877f2] hover:bg-[#1565c0] text-white font-bold text-xs h-11 rounded-xl shadow-md"
            >
              Entendido / Cerrar
            </Button>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            
            {/* Pestañas Cajas - Sobres / Tarimas */}
            <div className="bg-white rounded-xl p-1 grid grid-cols-2 border border-slate-200/70 shadow-sm text-center">
              <button
                type="button"
                onClick={() => setTipoEnvio("cajas")}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  tipoEnvio === "cajas"
                    ? "text-[#1877f2] border-b-2 border-[#1877f2] bg-blue-50/30"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Cajas - Sobres
              </button>
              <button
                type="button"
                onClick={() => setTipoEnvio("tarimas")}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  tipoEnvio === "tarimas"
                    ? "text-[#1877f2] border-b-2 border-[#1877f2] bg-blue-50/30"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Tarimas
              </button>
            </div>

            {/* Selector de Orígenes */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-sm space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600">Selecciona los orígenes</label>
              <div className="relative">
                <select
                  value={origenSeleccionado}
                  onChange={(e) => setOrigenSeleccionado(e.target.value)}
                  className="w-full h-10 px-3 pr-8 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 appearance-none outline-none focus:border-[#1877f2]"
                >
                  <option value="todos">Todos</option>
                  <option value="principal">Taller Principal - Cali</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1 text-slate-500">
                  <span className="text-[10px] font-bold">×</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Tarjeta de Origen y Transportadora */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/70 shadow-sm space-y-3">
              {/* Info Remitente */}
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-xs">{ORIGEN_DEFECTO.name}</h4>
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black flex items-center justify-center">
                    {cantidadCalculada}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {ORIGEN_DEFECTO.street}, {ORIGEN_DEFECTO.number}, {ORIGEN_DEFECTO.city}, {ORIGEN_DEFECTO.state}, {ORIGEN_DEFECTO.country}
                </p>
              </div>

              {/* Caja Interna de Transportadora */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-3">
                {/* Header Checkbox Transportadora */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={carrierChecked}
                      onChange={(e) => setCarrierChecked(e.target.checked)}
                      className="w-4 h-4 rounded text-[#1877f2] focus:ring-0 cursor-pointer"
                    />
                    <div className="w-5 h-5 rounded bg-black flex items-center justify-center text-white text-[8px] font-black uppercase">
                      {carrierSeleccionado.substring(0, 3)}
                    </div>
                    <span className="font-bold text-xs text-slate-900 lowercase">{carrierSeleccionado}</span>
                  </label>

                  <select
                    value={carrierSeleccionado}
                    onChange={(e) => setCarrierSeleccionado(e.target.value)}
                    className="text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 outline-none"
                  >
                    <option value="coordinadora">coordinadora</option>
                    <option value="servientrega">servientrega</option>
                    <option value="envia">envía</option>
                    <option value="tcc">tcc</option>
                    <option value="interrapidisimo">interrapidísimo</option>
                  </select>
                </div>

                {/* Seleccionar Guías */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-600">Seleccionar guías</label>
                  <div className="relative">
                    <select
                      value={guiasSeleccionadas}
                      onChange={(e) => setGuiasSeleccionadas(e.target.value)}
                      className="w-full h-9 px-3 pr-8 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 appearance-none outline-none focus:border-[#1877f2]"
                    >
                      <option value="todos">Todos ({guiasConTracking.length > 0 ? `${guiasConTracking.length} guías listas` : "1 paquete"})</option>
                      {guiasConTracking.map((g) => (
                        <option key={g.id} value={g.id}>
                          Guía #{g.numero_tracking} (Pedido #{g.id} - {g.ciudad_envio})
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1 text-slate-500">
                      <span className="text-[10px] font-bold">×</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                {/* Fecha y Horas (3 Columnas) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  {/* Fecha */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 flex items-center gap-1 mb-1">
                      <span>Fecha de Recolección</span>
                      <Info className="w-3 h-3 text-blue-500" />
                      <span className="text-red-500 font-black">*</span>
                    </label>
                    <input
                      type="date"
                      value={fechaRecoleccion}
                      onChange={(e) => setFechaRecoleccion(e.target.value)}
                      className="w-full h-9 px-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-[#1877f2]"
                      required
                    />
                  </div>

                  {/* Hora Inicial */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 flex items-center gap-0.5 mb-1">
                      <span>Hora inicial</span>
                      <span className="text-red-500 font-black">*</span>
                    </label>
                    <select
                      value={horaInicial}
                      onChange={(e) => setHoraInicial(e.target.value)}
                      className="w-full h-9 px-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-none"
                    >
                      <option value="08:00">8:00 am</option>
                      <option value="09:00">9:00 am</option>
                      <option value="10:00">10:00 am</option>
                      <option value="11:00">11:00 am</option>
                      <option value="14:00">2:00 pm</option>
                    </select>
                  </div>

                  {/* Hora Final */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 flex items-center gap-0.5 mb-1">
                      <span>Hora final</span>
                      <span className="text-red-500 font-black">*</span>
                    </label>
                    <select
                      value={horaFinal}
                      onChange={(e) => setHoraFinal(e.target.value)}
                      className="w-full h-9 px-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-none"
                    >
                      <option value="17:00">5:00 pm</option>
                      <option value="18:00">6:00 pm</option>
                      <option value="19:00">7:00 pm</option>
                      <option value="20:00">8:00 pm</option>
                    </select>
                  </div>
                </div>

                {/* Cantidad y Peso */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 flex items-center gap-0.5 mb-1">
                      <span>Cantidad de paquetes</span>
                      <span className="text-red-500 font-black">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={cantidadCalculada}
                      onChange={(e) => setCustomCantidad(parseInt(e.target.value) || 1)}
                      className="w-full h-9 px-3 border border-emerald-500 bg-white rounded-lg text-xs font-bold text-slate-900 outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 flex items-center gap-0.5 mb-1">
                      <span>Peso total del paquete</span>
                      <span className="text-red-500 font-black">*</span>
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={pesoCalculado}
                        onChange={(e) => setCustomPeso(e.target.value)}
                        className="w-full h-9 px-3 border border-emerald-500 bg-white rounded-l-lg text-xs font-bold text-slate-900 outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <span className="h-9 px-2.5 bg-slate-100 border-y border-r border-slate-300 rounded-r-lg text-[10px] font-bold text-slate-600 flex items-center justify-center">
                        KG
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Botón Principal de Continuar con la recolección */}
            <Button
              disabled={loading || !carrierChecked}
              onClick={handleConfirmarRecoleccion}
              className="w-full h-12 bg-[#1877f2] hover:bg-[#1565c0] text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? "Solicitando con la transportadora..." : `Continuar con la recolección (${cantidadCalculada})`}
            </Button>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}
