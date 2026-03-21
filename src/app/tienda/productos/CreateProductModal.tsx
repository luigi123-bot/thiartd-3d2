"use client";
import { useState, useEffect, Suspense } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { ProductImageUpload, ProductModel3DUpload, ProductVideoUpload } from "~/components/FileUploadWidget";
import { Model3DViewer, Model3DViewerLoading } from "~/components/Model3DViewer";
import Image from "next/image";
import { FiX } from "react-icons/fi";
import { Package, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const categorias = [
  "Abstracto", 
  "Clásico",
  "Moderno",
  "Arquitectura",
  "Naturaleza",
  "Decoración",
  "Personalizado",
];

const tamanos = ["Pequeño", "Mediano", "Grande", "Personalizado"];

interface Product {
  id?: string | number;
  nombre: string;
  precio: number;
  descripcion: string;
  tamano: string;
  categoria: string;
  stock: number;
  detalles: string;
  destacado: boolean;
  image_url?: string;
  imagenes?: string[];
  model_url?: string;
  video_url?: string;
  user_id?: string;
  usuario_id?: string; 
}

export default function CreateProductModal({ open, onOpenChangeAction, onProductCreatedAction, product }: {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  onProductCreatedAction?: () => void;
  product?: Product;
}) {
  const [form, setForm] = useState({
    nombre: "",
    precio: 0,
    descripcion: "",
    tamano: tamanos[0],
    categoria: categorias[0],
    stock: 0,
    detalles: "",
    destacado: false,
    image_url: "",
    imagenes: [] as string[],
    model_url: "",
    video_url: "",
    user_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [modelUrl, setModelUrl] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [showModelDialog, setShowModelDialog] = useState(false);
  interface Creator {
    id: string;
    nombre?: string;
    email?: string;
    role?: string;
    rol?: string;
  }
  const [creators, setCreators] = useState<Creator[]>([]);
  const [step, setStep] = useState<number>(0);
  const totalSteps = 4;
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sincronizar form con product si existe
  useEffect(() => {
    if (product) {
      setForm({
        nombre: product.nombre ?? "",
        precio: product.precio ?? 0,
        descripcion: product.descripcion ?? "",
        tamano: product.tamano ?? tamanos[0],
        categoria: product.categoria ?? categorias[0],
        stock: product.stock ?? 0,
        detalles: product.detalles ?? "",
        destacado: product.destacado ?? false,
        image_url: product.image_url ?? "",
        imagenes: product.imagenes ?? [],
        model_url: product.model_url ?? "",
        video_url: product.video_url ?? "",
        user_id: product.user_id ?? product.usuario_id ?? "",
      });
      setImageUrl(product.image_url ?? "");
      setModelUrl(product.model_url ?? "");
      setVideoUrl(product.video_url ?? "");
      if (product.video_url) {
        setVideoPreview(product.video_url);
      }
    } else {
      setForm({
        nombre: "",
        precio: 0,
        descripcion: "",
        tamano: tamanos[0],
        categoria: categorias[0],
        stock: 0,
        detalles: "",
        destacado: false,
        image_url: "",
        imagenes: [],
        model_url: "",
        video_url: "",
        user_id: "",
      });
      setImageUrl("");
      setModelUrl("");
      setVideoUrl("");
      setVideoPreview(null);
    }
  }, [product, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRemoveVideo = () => {
    setVideoPreview(null);
    setVideoUrl("");
    setForm({ ...form, video_url: "" });
  };

  const validateStep = (s: number) => {
    const newErrors: Record<string, string> = {};
    if (s === 0) {
      if (!form.nombre || String(form.nombre).trim() === "") newErrors.nombre = "Campo requerido";
      if (!form.descripcion || String(form.descripcion).trim() === "") newErrors.descripcion = "Campo requerido";
    }
    if (s === 1) {
      if (!form.user_id || String(form.user_id).trim() === "") newErrors.user_id = "Selecciona un creador";
    }
    if (s === 2) {
      if (form.precio === null || form.precio === undefined || Number(form.precio) <= 0) newErrors.precio = "Precio debe ser mayor a 0";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAll = () => {
    const ok0 = validateStep(0);
    const ok1 = validateStep(1);
    const ok2 = validateStep(2);
    return ok0 && ok1 && ok2;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    if (!validateAll()) return;
    setLoading(true);

    try {
      const finalVideoUrl = videoUrl || form.video_url;

      const formData = {
        ...form,
        image_url: imageUrl || form.image_url,
        model_url: modelUrl || form.model_url,
        video_url: finalVideoUrl,
      };

      console.log("[CreateProductModal] Enviando formData:", formData);

      let res: Response;
      if (product?.id) {
        res = await fetch(`/api/productos/${product.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } else {
        res = await fetch("/api/productos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }

      const responseText = await res.clone().text();
      console.log("[CreateProductModal] Respuesta API:", res.status, responseText.slice(0, 300));

      if (res.ok) {
        onOpenChangeAction(false);
        onProductCreatedAction?.();
      } else {
        let errorMessage = `Error ${res.status}`;
        try {
          const data = JSON.parse(responseText) as { error?: string };
          errorMessage = data.error ?? errorMessage;
        } catch {
          errorMessage = responseText.slice(0, 200) || errorMessage;
        }
        console.error("[CreateProductModal] Error del servidor:", errorMessage);
        alert("Error al guardar producto: " + errorMessage);
      }
    } catch (error) {
      console.error("[CreateProductModal] Error de red o excepción:", error);
      alert("Error al procesar el formulario: " + String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(Math.min(totalSteps - 1, step + 1));
      setErrors({});
    }
  };



  const handleRemoveModel = () => {
    setModelUrl("");
    setForm({ ...form, model_url: "" });
  };

  // Cargar creadores desde endpoint server-side para evitar problemas de RLS/permissions
  useEffect(() => {
    const loadCreators = async () => {
      try {
        const res = await fetch("/api/admin/usuarios");
        const text = await res.clone().text();
        console.log("/api/admin/usuarios -> status", res.status, "bodyPreview:", text.slice(0, 300));
        if (!res.ok) {
          console.error("Error al obtener usuarios desde server (status not ok):", res.status, text);
          setCreators([]);
          return;
        }
        type UserRow = { id: string; nombre?: string; name?: string; email?: string; role?: string; rol?: string };
        let json: { usuarios?: UserRow[] } | null = null;
        try {
          json = (await res.json()) as { usuarios?: UserRow[] };
        } catch (parseErr) {
          console.error("Error parseando JSON de /api/admin/usuarios:", parseErr, text);
          setCreators([]);
          return;
        }

        console.log("/api/admin/usuarios -> json:", json && Array.isArray(json.usuarios) ? `usuarios:${json.usuarios.length}` : json);
        const rows: UserRow[] = json?.usuarios ?? [];
        const filtered: Creator[] = rows
          .filter((r) => {
            const role = String(r.role ?? r.rol ?? "").toLowerCase();
            return role === "creador" || role === "creator";
          })
          .map((r) => ({ id: String(r.id), nombre: r.nombre ?? r.name ?? r.email, email: r.email, role: r.role ?? r.rol }));

        setCreators(filtered);
      } catch (err) {
        console.error("Error fetching usuarios:", err);
        setCreators([]);
      }
    };

    if (open) void loadCreators();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="p-0 bg-transparent border-none shadow-none sm:max-w-xl max-w-[95vw] w-full gap-0 overflow-visible">
        <div className="w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative border border-slate-200 animate-in fade-in zoom-in duration-300">
          {/* Header Section Compact */}
          <div className="px-6 py-5 border-b border-slate-100 bg-white sticky top-0 z-50 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00a19a] to-teal-500 text-white flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-all">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                <DialogTitle>
                  <h2 className="text-2xl font-black text-slate-900 leading-none uppercase tracking-tighter">
                    {product ? "Editar Obra" : "Publicar Obra"}
                  </h2>
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Formulario para {product ? "editar los detalles de una obra existente" : "publicar una nueva obra artística en la tienda"}.
                </DialogDescription>
                  <div className="flex items-center gap-2 mt-1.5 opacity-60">
                    <span className="text-[10px] bg-[#00a19a] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                      Paso {step + 1} de {totalSteps}
                    </span>
                    <span className="text-slate-300">/</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      {step === 0 ? "Información Básica" : 
                       step === 1 ? "Clasificación" : 
                       step === 2 ? "Valores" : 
                       "Multimedia"
                      }
                    </span>
                  </div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-10 h-10 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all border border-slate-100"
                onClick={() => onOpenChangeAction(false)}
              >
                <FiX className="w-5 h-5" />
              </Button>
            </div>

            {/* Premium Progress Bar */}
            <div className="flex gap-3 px-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className="flex-1 relative h-1.5 group">
                  <div className={`absolute inset-0 rounded-full transition-all duration-700 ${
                      i <= step ? "bg-[#00a19a] shadow-[0_0_15px_rgba(0,161,154,0.4)]" : "bg-slate-100"
                    }`} 
                  />
                  {i === step && (
                    <motion.div 
                      layoutId="step-indicator"
                      className="absolute -top-1 -bottom-1 left-0 right-0 bg-teal-400/20 rounded-full border border-[#00a19a]/20"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-8 bg-slate-50/50 custom-scrollbar">
            <div className="w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: "circOut" }}
                >
                  {/* Step 1: Información Básica */}
                  {step === 0 && (
                    <div className="space-y-6 animate-in slide-in-from-right-2 duration-300">
                       <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                          <div className="space-y-2.5">
                            <div className="flex justify-between items-end">
                              <label className="text-xs font-black text-slate-700 uppercase tracking-[0.2em] ml-1">Título de la Obra</label>
                              {errors.nombre && <span className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-bold">{errors.nombre}</span>}
                            </div>
                            <Input 
                              name="nombre" 
                              placeholder="Ej: Elegancia en Resina - Edición 2025" 
                              value={form.nombre} 
                              onChange={handleChange} 
                              className="h-11 px-5 rounded-2xl border-slate-200 bg-white text-base font-bold placeholder:text-slate-500 focus:border-[#00a19a] focus:ring-[#00a19a]/10 transition-all shadow-sm" 
                            />
                          </div>

                          <div className="space-y-2.5">
                            <div className="flex justify-between items-end">
                              <label className="text-xs font-black text-slate-700 uppercase tracking-[0.2em] ml-1">Descripción Artística</label>
                              {errors.descripcion && <span className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-bold">{errors.descripcion}</span>}
                            </div>
                            <Textarea 
                              name="descripcion" 
                              placeholder="Describe la esencia y el propósito de esta creación..." 
                              value={form.descripcion} 
                              onChange={handleChange} 
                              className="min-h-[160px] px-6 py-4 rounded-xl border-slate-200 bg-white text-sm font-medium leading-relaxed placeholder:text-slate-300 focus:border-[#00a19a] focus:ring-[#00a19a]/10 transition-all" 
                            />
                          </div>
                       </div>
                    </div>
                  )}

                  {/* Step 2: Clasificación */}
                  {step === 1 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2.5 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                          <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Escala Disponible</label>
                          <div className="relative">
                            <select 
                              name="tamano" 
                              value={form.tamano} 
                              onChange={handleChange}
                              className="w-full h-11 rounded-2xl border border-slate-200 px-5 bg-white font-bold text-slate-900 appearance-none focus:border-[#00a19a] focus:ring-4 focus:ring-[#00a19a]/5 transition-all outline-none"
                            >
                              {tamanos.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                               <Package className="w-4 h-4" />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2.5 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                          <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Estilo de la Obra</label>
                          <div className="relative">
                            <select 
                              name="categoria" 
                              value={form.categoria} 
                              onChange={handleChange}
                              className="w-full h-11 rounded-2xl border border-slate-200 px-5 bg-white font-bold text-slate-900 appearance-none focus:border-[#00a19a] focus:ring-4 focus:ring-[#00a19a]/5 transition-all outline-none"
                            >
                              {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                               <Sparkles className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2.5 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-end mb-1">
                          <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Asignar a Artista</label>
                          {errors.user_id && <span className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-bold">{errors.user_id}</span>}
                        </div>
                        <select 
                          name="user_id" 
                          value={form.user_id} 
                          onChange={handleChange}
                          className="w-full h-11 rounded-2xl border border-slate-200 px-5 bg-white font-bold text-slate-900 appearance-none focus:border-[#00a19a] focus:ring-4 focus:ring-[#00a19a]/5 transition-all outline-none"
                        >
                          <option value="">Selecciona al creador responsable</option>
                          {creators.map(c => <option key={c.id} value={c.id}>{c.nombre ?? c.email}</option>)}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Precios y Stock */}
                  {step === 2 && (
                    <div className="space-y-6">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2.5 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                            <div className="flex justify-between items-end mb-1">
                              <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Valor de Venta (COP)</label>
                              {errors.precio && <span className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-bold">{errors.precio}</span>}
                            </div>
                            <div className="relative">
                              <div className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-[#00a19a] text-lg">$</div>
                              <Input 
                                name="precio" 
                                type="number" 
                                value={form.precio} 
                                onChange={handleChange} 
                                className="h-11 pl-12 pr-5 rounded-2xl border-slate-200 bg-white font-black text-xl text-slate-900 focus:border-[#00a19a] focus:ring-[#00a19a]/10 shadow-sm transition-all" 
                              />
                            </div>
                          </div>

                          <div className="space-y-2.5 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Reserva</label>
                            <Input 
                              name="stock" 
                              type="number" 
                              value={form.stock} 
                              onChange={handleChange} 
                              className="h-11 px-5 rounded-2xl border-slate-200 bg-white font-black text-xl text-slate-900 focus:border-[#00a19a] focus:ring-[#00a19a]/10 shadow-sm transition-all text-center" 
                            />
                          </div>
                       </div>

                       <div className="bg-slate-900 p-6 rounded-2xl shadow-xl flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-teal-500/20 text-[#00a19a] flex items-center justify-center border border-teal-500/30">
                              <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-bold text-white text-base tracking-tight leading-none">Ocultar de Portada</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">Destacar este producto</p>
                            </div>
                          </div>
                          <button 
                             type="button"
                             onClick={() => setForm({...form, destacado: !form.destacado})}
                             className={`w-14 h-8 rounded-full transition-all duration-500 relative flex items-center px-1 ${form.destacado ? "bg-[#00a19a]" : "bg-slate-700"}`}
                          >
                             <div className={`w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-500 ${form.destacado ? "translate-x-6" : "translate-x-0"}`} />
                          </button>
                       </div>
                    </div>
                  )}

                  {/* Step 4: Multimedia */}
                  {step === 3 && (
                    <div className="space-y-10 pb-4">
                       <div className="space-y-4">
                          <label className="text-xs font-black text-slate-700 uppercase tracking-[0.2em] ml-2">Galería de Imágenes (Sube hasta 4)</label>
                          <div className="grid grid-cols-2 gap-4">
                             {[0, 1, 2, 3].map((idx) => {
                               const currentUrl = idx === 0 ? imageUrl : (form.imagenes?.[idx - 1] ?? "");
                               return (
                                 <div key={idx} className="relative aspect-square">
                                   {currentUrl ? (
                                     <div className="relative group rounded-2xl overflow-hidden h-full border-4 border-white shadow-lg">
                                        <Image src={currentUrl} alt={`Preview ${idx}`} fill className="object-cover" />
                                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center p-2">
                                          <Button 
                                            variant="destructive" 
                                            size="sm"
                                            className="rounded-xl h-8 text-[10px] font-bold"
                                            onClick={() => {
                                              if (idx === 0) {
                                                setImageUrl("");
                                                setForm({ ...form, image_url: "" });
                                              } else {
                                                const newImgs = [...(form.imagenes ?? [])];
                                                newImgs[idx - 1] = "";
                                                setForm({...form, imagenes: newImgs});
                                              }
                                            }}
                                          >
                                            Quitar
                                          </Button>
                                        </div>
                                     </div>
                                   ) : (
                                     <div className="h-full transform transition-all hover:scale-[1.02]">
                                       <ProductImageUpload 
                                         productId={product?.id?.toString() ?? "new"} 
                                         onUploadComplete={(url) => {
                                           if (idx === 0) {
                                             console.log("[MULTI-IMAGE] Cargando imagen PRINCIPAL:", url);
                                             setImageUrl(url);
                                             setForm({ ...form, image_url: url });
                                           } else {
                                             const newImgs = [...(form.imagenes ?? [])];
                                             newImgs[idx - 1] = url;
                                             console.log(`[MULTI-IMAGE] Cargando imagen SECUNDARIA ${idx}:`, url);
                                             console.log("[MULTI-IMAGE] Total imágenes en galería:", newImgs.filter(u => u).length + (imageUrl ? 1 : 0));
                                             setForm({ ...form, imagenes: newImgs });
                                           }
                                         }} 
                                       />
                                     </div>
                                   )}
                                 </div>
                               );
                             })}
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Experiencia 3D (GLB)</label>
                            {modelUrl ? (
                              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl flex items-center justify-between">
                                 <div className="flex items-center gap-4">
                                   <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-[#00a19a]">
                                     <Sparkles className="w-5 h-5 animate-pulse" />
                                   </div>
                                   <div>
                                     <p className="font-black text-slate-900 text-sm tracking-tight">Modelo Listo</p>
                                     <button type="button" onClick={() => setShowModelDialog(true)} className="text-[10px] text-[#00a19a] font-bold uppercase tracking-widest hover:underline">Ver Interactivos</button>
                                   </div>
                                 </div>
                                 <Button variant="ghost" size="icon" onClick={handleRemoveModel} className="text-red-400 hover:text-red-500 hover:bg-red-50 rounded-full"><FiX /></Button>
                              </div>
                            ) : (
                              <ProductModel3DUpload productId={product?.id?.toString() ?? "new"} onUploadComplete={(url) => {setModelUrl(url); setForm({...form, model_url: url})}} />
                            )}
                          </div>

                          <div className="space-y-4">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Video Presentación (MP4)</label>
                            {(videoPreview ?? videoUrl) ? (
                              <div className="relative group rounded-2xl overflow-hidden h-28 border-2 border-slate-100 shadow-lg">
                                 <video src={videoPreview ?? videoUrl} className="w-full h-full object-cover" />
                                 <button 
                                   type="button" 
                                   onClick={handleRemoveVideo} 
                                   className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white w-10 h-10 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:scale-110"
                                 >
                                   <FiX className="w-5 h-5" />
                                 </button>
                              </div>
                            ) : (
                              <ProductVideoUpload productId={product?.id?.toString() ?? "new"} onUploadComplete={(url) => {setVideoUrl(url); setVideoPreview(url); setForm({...form, video_url: url})}} />
                            )}
                          </div>
                       </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Sticky Controls Panel Compact */}
          <div className="px-6 py-4 border-t border-slate-200 bg-white sticky bottom-0 z-50 shrink-0">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
              <Button 
                variant="ghost" 
                onClick={() => setStep(Math.max(0, step - 1))} 
                disabled={step === 0}
                className="h-13 px-6 rounded-xl font-bold text-slate-600 hover:text-slate-900 transition-all border border-transparent hover:border-slate-100"
              >
                Regresar
              </Button>
              
              <div className="flex items-center gap-3">
                <p className="hidden md:block text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
                  {step + 1} / {totalSteps}
                </p>
                {step < totalSteps - 1 ? (
                  <Button 
                    onClick={handleNext} 
                    className="h-13 px-10 rounded-xl bg-[#00a19a] hover:bg-[#007973] text-white font-black shadow-xl transition-all active:scale-95"
                  >
                    Siguiente
                  </Button>
                ) : (
                  <Button 
                    onClick={() => void handleSubmit()} 
                    disabled={loading}
                    className="h-13 px-10 rounded-xl bg-black hover:bg-slate-900 text-white font-black shadow-xl transition-all active:scale-95 flex items-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Publicar
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dialog para Modelo 3D */}
        {showModelDialog && (
          <Dialog open={showModelDialog} onOpenChange={setShowModelDialog}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-[2.5rem] bg-white border-none shadow-2xl">
              <div className="p-8 pb-4 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900">Vista Previa 3D</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowModelDialog(false)}><FiX /></Button>
              </div>
              <div className="aspect-square sm:aspect-video w-full bg-slate-50">
                <Suspense fallback={<Model3DViewerLoading />}>
                  <Model3DViewer modelUrl={modelUrl || ""} height="100%" />
                </Suspense>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}