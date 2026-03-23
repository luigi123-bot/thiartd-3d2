"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { ProductImageUpload, ProductModel3DUpload, ProductVideoUpload } from "~/components/FileUploadWidget";
import Image from "next/image";
import { FiX } from "react-icons/fi";
import { Package } from "lucide-react";
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

export default function CreateProductModal({ 
  open, 
  onOpenChangeAction, 
  onProductCreatedAction, 
  product,
  isCreatorMode = false
}: {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  onProductCreatedAction?: () => void;
  product?: Product;
  isCreatorMode?: boolean;
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
    setStep(0); // Reset a paso 1 al abrir
  }, [product, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
      if (product?.id && !isNaN(Number(product.id))) {
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



  // Cargar creadores desde endpoint server-side
  useEffect(() => {
    const loadCreators = async () => {
      if (isCreatorMode) return; // No necesitamos cargar la lista si estamos en modo creador
      
      try {
        const res = await fetch("/api/admin/usuarios");
        if (!res.ok) {
          setCreators([]);
          return;
        }
        type UserRow = { id: string; nombre?: string; name?: string; email?: string; role?: string; rol?: string };
        const json = (await res.json()) as { usuarios?: UserRow[] };
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

    if (open && !isCreatorMode) void loadCreators();
  }, [open, isCreatorMode]);

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="p-0 bg-transparent border-none shadow-none sm:max-w-xl max-w-[95vw] w-full gap-0 overflow-visible">
        <div className="w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative border border-slate-200 animate-in fade-in zoom-in duration-300">
          {/* Header Section */}
          <div className="px-6 py-5 border-b border-slate-100 bg-white sticky top-0 z-50 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00a19a] to-teal-500 text-white flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-all">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black text-slate-900 leading-none uppercase tracking-tighter">
                    {product?.id ? "Editar Obra" : "Publicar Obra"}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    Formulario para {product?.id ? "editar los detalles de una obra existente" : "publicar una nueva obra artística en la tienda"}.
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

            {/* Progress Bar */}
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

          <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-8 bg-slate-50/50">
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
                    <div className="space-y-6">
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
                              className="h-11 px-5 rounded-2xl border-slate-200 bg-white text-base font-bold placeholder:text-slate-500 focus:border-[#00a19a] outline-none" 
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
                              className="min-h-[160px] px-6 py-4 rounded-xl border-slate-200 bg-white text-sm font-medium leading-relaxed outline-none focus:border-[#00a19a]" 
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
                          <select 
                            name="tamano" 
                            value={form.tamano} 
                            onChange={handleChange}
                            className="w-full h-11 rounded-2xl border border-slate-200 px-5 bg-white font-bold text-slate-900 outline-none focus:border-[#00a19a]"
                          >
                            {tamanos.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>

                        <div className="space-y-2.5 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                          <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Estilo de la Obra</label>
                          <select 
                            name="categoria" 
                            value={form.categoria} 
                            onChange={handleChange}
                            className="w-full h-11 rounded-2xl border border-slate-200 px-5 bg-white font-bold text-slate-900 outline-none focus:border-[#00a19a]"
                          >
                            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>

                      {/* Solo mostrar asignación si NO es modo creador */}
                      {!isCreatorMode && (
                        <div className="space-y-2.5 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                          <div className="flex justify-between items-end mb-1">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Asignar a Artista</label>
                            {errors.user_id && <span className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-bold">{errors.user_id}</span>}
                          </div>
                          <select 
                            name="user_id" 
                            value={form.user_id} 
                            onChange={handleChange}
                            className="w-full h-11 rounded-2xl border border-slate-200 px-5 bg-white font-bold text-slate-900 outline-none focus:border-[#00a19a]"
                          >
                            <option value="">Selecciona al creador responsable</option>
                            {creators.map(c => <option key={c.id} value={c.id}>{c.nombre ?? c.email}</option>)}
                          </select>
                        </div>
                      )}
                      
                      {isCreatorMode && (
                        <div className="p-4 bg-teal-50 rounded-xl border border-teal-100">
                           <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest leading-none mb-2">Artista Asignado</p>
                           <p className="text-sm font-bold text-teal-800">Se publicará automáticamente bajo tu perfil verificado.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 3: Valores */}
                  {step === 2 && (
                    <div className="space-y-6">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2.5 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                            <div className="flex justify-between items-end mb-1">
                              <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Valor de Venta (COP)</label>
                              {errors.precio && <span className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-bold">{errors.precio}</span>}
                            </div>
                            <Input 
                              name="precio" 
                              type="number" 
                              value={form.precio} 
                              onChange={handleChange} 
                              className="h-11 px-5 rounded-2xl border-slate-200 bg-white font-black text-xl outline-none focus:border-[#00a19a]" 
                            />
                          </div>

                          <div className="space-y-2.5 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Reserva / Stock</label>
                            <Input 
                              name="stock" 
                              type="number" 
                              value={form.stock} 
                              onChange={handleChange} 
                              className="h-11 px-5 rounded-2xl border-slate-200 bg-white font-black text-xl text-center outline-none focus:border-[#00a19a]" 
                            />
                          </div>
                       </div>
                    </div>
                  )}

                  {/* Step 4: Multimedia */}
                  {step === 3 && (
                    <div className="space-y-10 pb-4">
                       <div className="space-y-4">
                          <label className="text-xs font-black text-slate-700 uppercase tracking-[0.2em] ml-2">Galería (Hasta 4 imágenes)</label>
                          <div className="grid grid-cols-2 gap-4">
                             {[0, 1, 2, 3].map((idx) => {
                               const currentUrl = idx === 0 ? imageUrl : (form.imagenes?.[idx - 1] ?? "");
                               return (
                                 <div key={idx} className="relative aspect-square">
                                   {currentUrl ? (
                                     <div className="relative group rounded-2xl overflow-hidden h-full border-2 border-slate-200 shadow-sm">
                                        <Image src={currentUrl} alt={`Preview ${idx}`} fill className="object-cover" />
                                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center p-2">
                                          <Button variant="destructive" size="sm" onClick={() => {
                                            if (idx === 0) {
                                              setImageUrl("");
                                              setForm({ ...form, image_url: "" });
                                            } else {
                                              const newImgs = [...(form.imagenes ?? [])];
                                              newImgs[idx - 1] = "";
                                              setForm({...form, imagenes: newImgs});
                                            }
                                          }}>Quitar</Button>
                                        </div>
                                     </div>
                                   ) : (
                                     <ProductImageUpload 
                                       productId={product?.id?.toString() ?? "new"} 
                                       onUploadComplete={(url) => {
                                         if (idx === 0) {
                                           setImageUrl(url);
                                           setForm({ ...form, image_url: url });
                                         } else {
                                           const newImgs = [...(form.imagenes ?? [])];
                                           newImgs[idx - 1] = url;
                                           setForm({ ...form, imagenes: newImgs });
                                         }
                                       }} 
                                     />
                                   )}
                                 </div>
                               );
                             })}
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Modelo 3D (GLB)</label>
                            {modelUrl ? (
                              <div className="p-4 bg-teal-50 rounded-xl border border-teal-100 flex items-center justify-between">
                                 <span className="text-[10px] font-black text-teal-600 uppercase">Modelo Listo</span>
                                 <Button variant="ghost" size="icon" onClick={() => {setModelUrl(""); setForm({...form, model_url: ""})}} className="text-red-400 hover:text-red-500"><FiX /></Button>
                              </div>
                            ) : (
                              <ProductModel3DUpload productId={product?.id?.toString() ?? "new"} onUploadComplete={(url) => {setModelUrl(url); setForm({...form, model_url: url})}} />
                            )}
                          </div>

                          <div className="space-y-4">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Video Presentación</label>
                            {videoPreview ? (
                              <div className="relative group rounded-xl overflow-hidden h-24 border border-slate-200">
                                 <video src={videoPreview} className="w-full h-full object-cover" />
                                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <Button variant="destructive" size="icon" onClick={() => {setVideoPreview(null); setVideoUrl(""); setForm({...form, video_url: ""})}}><FiX /></Button>
                                 </div>
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

          {/* Controls */}
          <div className="px-6 py-4 border-t border-slate-100 bg-white sticky bottom-0 shrink-0 flex items-center justify-between gap-4">
              <Button 
                variant="ghost" 
                onClick={() => setStep(Math.max(0, step - 1))} 
                disabled={step === 0}
                className="h-12 rounded-xl font-bold"
              >
                Regresar
              </Button>
              
              <div className="flex items-center gap-3">
                {step < totalSteps - 1 ? (
                  <Button onClick={handleNext} className="h-12 px-8 rounded-xl bg-[#00a19a] hover:bg-[#008f89] text-white font-black shadow-lg">Siguiente</Button>
                ) : (
                  <Button onClick={() => void handleSubmit()} disabled={loading} className="h-12 px-8 rounded-xl bg-black hover:bg-slate-900 text-white font-black shadow-lg flex items-center gap-2">
                    {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "Publicar Obra"}
                  </Button>
                )}
              </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}