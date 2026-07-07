"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { FiTrash2, FiPlus, FiCpu, FiTag, FiMaximize2, FiActivity, FiCheck } from "react-icons/fi";
import { Settings } from "lucide-react";
import clsx from "clsx";

interface ConfiguracionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TabType = "materiales" | "tamanos" | "filamentos" | "eco";

export default function ConfiguracionModal({ open, onOpenChange }: ConfiguracionModalProps) {
  // Tab activa
  const [activeTab, setActiveTab] = useState<TabType>("materiales");

  // Estados para cada configuración
  const [materiales, setMateriales] = useState<string[]>([]);
  const [tamanos, setTamanos] = useState<string[]>([]);
  const [filamentos, setFilamentos] = useState<string[]>([]);
  
  // Eco-botellas state
  const [ecoMode, setEcoMode] = useState<boolean>(true);
  const [botellasRecicladas, setBotellasRecicladas] = useState<number>(1420);
  const [botellasPorProducto, setBotellasPorProducto] = useState<number>(3);

  // Inputs temporales
  const [nuevoMaterial, setNuevoMaterial] = useState("");
  const [nuevoTamano, setNuevoTamano] = useState("");
  const [nuevoFilamento, setNuevoFilamento] = useState("");
  const [loading, setLoading] = useState(false);

  // Cargar configuraciones del backend
  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/configuraciones");
      if (res.ok) {
        const data = (await res.json()) as { configuraciones?: Record<string, unknown> };
        const configs = data.configuraciones ?? {};
        
        setMateriales((configs.materiales as string[]) ?? ["PLA", "ABS", "PETG", "TPU (Flexible)", "Wood (Madera)"]);
        setTamanos((configs.tamanos as string[]) ?? ["Pequeño", "Mediano", "Grande", "Escala Real"]);
        setFilamentos((configs.filamentos as string[]) ?? ["Translúcido", "Mate", "Brillante", "Fluorescente", "Reciclado"]);
        setEcoMode((configs.eco_mode as boolean) ?? true);
        setBotellasRecicladas(Number(configs.botellas_recicladas ?? 1420));
        setBotellasPorProducto(Number(configs.botellas_por_producto ?? 3));
      }
    } catch (err) {
      console.error("Error loading configs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      void fetchConfigs();
    }
  }, [open]);

  // Helper para guardar en la base de datos
  const guardarClave = async (clave: string, valor: unknown) => {
    try {
      await fetch("/api/admin/configuraciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clave, valor }),
      });
    } catch (err) {
      console.error(`Error saving ${clave}:`, err);
    }
  };

  // Acciones Materiales
  const addMaterial = async () => {
    if (!nuevoMaterial.trim()) return;
    const updated = [...materiales, nuevoMaterial.trim()];
    setMateriales(updated);
    setNuevoMaterial("");
    await guardarClave("materiales", updated);
  };

  const removeMaterial = async (index: number) => {
    const updated = materiales.filter((_, i) => i !== index);
    setMateriales(updated);
    await guardarClave("materiales", updated);
  };

  // Acciones Tamaños
  const addTamano = async () => {
    if (!nuevoTamano.trim()) return;
    const updated = [...tamanos, nuevoTamano.trim()];
    setTamanos(updated);
    setNuevoTamano("");
    await guardarClave("tamanos", updated);
  };

  const removeTamano = async (index: number) => {
    const updated = tamanos.filter((_, i) => i !== index);
    setTamanos(updated);
    await guardarClave("tamanos", updated);
  };

  // Acciones Filamento
  const addFilamento = async () => {
    if (!nuevoFilamento.trim()) return;
    const updated = [...filamentos, nuevoFilamento.trim()];
    setFilamentos(updated);
    setNuevoFilamento("");
    await guardarClave("filamentos", updated);
  };

  const removeFilamento = async (index: number) => {
    const updated = filamentos.filter((_, i) => i !== index);
    setFilamentos(updated);
    await guardarClave("filamentos", updated);
  };

  // Acciones Eco Botellas
  const toggleEco = async () => {
    const next = !ecoMode;
    setEcoMode(next);
    await guardarClave("eco_mode", next);
  };

  const saveEcoSettings = async () => {
    await guardarClave("botellas_recicladas", botellasRecicladas);
    await guardarClave("botellas_por_producto", botellasPorProducto);
    alert("Configuración ecológica actualizada correctamente.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden rounded-[2.5rem] p-0 bg-white border border-slate-100 shadow-2xl flex flex-col">
        {/* Header con gradiente sutil */}
        <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg shadow-black/10">
              <Settings className="w-6 h-6 text-[#00a19a]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-1.5">Configuración Global</h2>
              <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Parámetros del Sistema y Catálogos</p>
            </div>
          </div>
        </div>

        {/* Contenido con Tabs */}
        {loading ? (
          <div className="flex-1 py-32 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-[#00a19a] rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Cargando base de datos...</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Navegación lateral de pestañas */}
            <div className="w-full md:w-[220px] bg-slate-50/50 border-r border-slate-100 p-4 flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible">
              {[
                { id: "materiales", label: "Materiales", icon: FiCpu, desc: "PLA, ABS, PETG" },
                { id: "tamanos", label: "Tamaños", icon: FiMaximize2, desc: "Medidas estándar" },
                { id: "filamentos", label: "Filamentos", icon: FiTag, desc: "Tipos y acabados" },
                { id: "eco", label: "Campañas Eco", icon: FiActivity, desc: "Hecho con botellas" }
              ].map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={clsx(
                      "flex-1 md:flex-none flex items-center gap-3 p-3 rounded-2xl transition-all text-left group",
                      isSelected
                        ? "bg-black text-white shadow-xl shadow-black/15 scale-[1.02]"
                        : "hover:bg-slate-100/80 text-slate-500 hover:text-slate-800"
                    )}
                  >
                    <div className={clsx(
                      "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
                      isSelected ? "bg-slate-800 text-[#00a19a]" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                    )}>
                      <Icon className="text-base" />
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-xs font-black uppercase tracking-wider leading-none mb-1">{tab.label}</div>
                      <div className="text-[9px] font-semibold text-slate-400 group-hover:text-slate-300 leading-none truncate max-w-[120px]">{tab.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Panel de contenido activo */}
            <div className="flex-1 p-8 overflow-y-auto bg-white custom-scrollbar flex flex-col justify-between">
              
              {activeTab === "materiales" && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h3 className="font-black text-sm text-slate-800 uppercase tracking-widest mb-1">Materiales de Impresión</h3>
                    <p className="text-xs text-slate-400">Listado general de los materiales para las especificaciones de producto.</p>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ej: PETG, ABS, TPU..."
                      value={nuevoMaterial}
                      onChange={(e) => setNuevoMaterial(e.target.value)}
                      className="flex-1 h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-black outline-none text-xs font-bold text-slate-800 transition-all"
                    />
                    <Button onClick={addMaterial} className="h-12 w-12 bg-black hover:bg-slate-900 rounded-xl text-white flex items-center justify-center shrink-0 shadow-lg">
                      <FiPlus className="text-lg" />
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    {materiales.map((mat, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-slate-50/70 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                        <span className="text-xs font-bold text-slate-700">{mat}</span>
                        <button onClick={() => removeMaterial(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <FiTrash2 className="text-sm" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "tamanos" && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h3 className="font-black text-sm text-slate-800 uppercase tracking-widest mb-1">Tamaños Estándar</h3>
                    <p className="text-xs text-slate-400">Configura escalas de tamaños globales para los clientes.</p>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ej: Mediano (15cm), Escala Real..."
                      value={nuevoTamano}
                      onChange={(e) => setNuevoTamano(e.target.value)}
                      className="flex-1 h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-black outline-none text-xs font-bold text-slate-800 transition-all"
                    />
                    <Button onClick={addTamano} className="h-12 w-12 bg-black hover:bg-slate-900 rounded-xl text-white flex items-center justify-center shrink-0 shadow-lg">
                      <FiPlus className="text-lg" />
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    {tamanos.map((tam, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-slate-50/70 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                        <span className="text-xs font-bold text-slate-700">{tam}</span>
                        <button onClick={() => removeTamano(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <FiTrash2 className="text-sm" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "filamentos" && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h3 className="font-black text-sm text-slate-800 uppercase tracking-widest mb-1">Tipos y Acabados de Filamento</h3>
                    <p className="text-xs text-slate-400">Define los acabados estéticos de los productos en catálogo.</p>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ej: Mate, Seda, Metálico..."
                      value={nuevoFilamento}
                      onChange={(e) => setNuevoFilamento(e.target.value)}
                      className="flex-1 h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-black outline-none text-xs font-bold text-slate-800 transition-all"
                    />
                    <Button onClick={addFilamento} className="h-12 w-12 bg-black hover:bg-slate-900 rounded-xl text-white flex items-center justify-center shrink-0 shadow-lg">
                      <FiPlus className="text-lg" />
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    {filamentos.map((fil, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-slate-50/70 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                        <span className="text-xs font-bold text-slate-700">{fil}</span>
                        <button onClick={() => removeFilamento(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <FiTrash2 className="text-sm" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "eco" && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h3 className="font-black text-sm text-slate-800 uppercase tracking-widest mb-1">Campaña Hecho con Botellas ♻️</h3>
                    <p className="text-xs text-slate-400">Atributos del sello de PET reciclado y contadores globales.</p>
                  </div>

                  {/* Switch Toggle */}
                  <div className="flex items-center justify-between p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                    <div>
                      <div className="text-xs font-black text-emerald-800 uppercase tracking-wide">Activar Campaña</div>
                      <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Habilitar sello eco en la tienda pública</div>
                    </div>
                    <button
                      onClick={toggleEco}
                      className={`w-12 h-7 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                        ecoMode ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform duration-200 ${
                          ecoMode ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Inputs numéricos */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Historial Total Reciclado</label>
                      <input
                        type="number"
                        value={botellasRecicladas}
                        onChange={(e) => setBotellasRecicladas(parseInt(e.target.value) || 0)}
                        className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-bold text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Botellas / Producto</label>
                      <input
                        type="number"
                        value={botellasPorProducto}
                        onChange={(e) => setBotellasPorProducto(parseInt(e.target.value) || 0)}
                        className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  <Button onClick={saveEcoSettings} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2">
                    <FiCheck className="text-base" /> Guardar Campaña
                  </Button>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Footer simple */}
        <DialogFooter className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <Button variant="secondary" className="rounded-xl px-6 h-10 font-bold text-xs uppercase tracking-wider" onClick={() => onOpenChange(false)}>
            Cerrar Configuración
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
