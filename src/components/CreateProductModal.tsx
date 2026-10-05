"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { ProductImageUpload, ProductModel3DUpload, ProductVideoUpload } from "~/components/FileUploadWidget";
import Image from "next/image";
import { FiX } from "react-icons/fi";
import { Package, Star, ArrowLeft, ArrowRight, Trash2, Box, Video, Image as ImageIcon, Plus, Link as LinkIcon, Check, Printer, Clock } from "lucide-react";
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
  producto_imagenes?: { image_url: string; orden?: number; es_portada?: boolean }[];
  model_url?: string;
  video_url?: string;
  user_id?: string;
  usuario_id?: string; 
  precios_variantes?: { escalas?: string[]; estilos?: string[]; es_pod?: boolean; dias_fabricacion?: number } | string | Record<string, unknown>;
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
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [modelUrl, setModelUrl] = useState<string>("");
  const [customModelInput, setCustomModelInput] = useState<string>("");
  const [showModelUrlInput, setShowModelUrlInput] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [customVideoInput, setCustomVideoInput] = useState<string>("");
  const [showVideoUrlInput, setShowVideoUrlInput] = useState(false);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState<string>("");
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);

  // Opciones de múltiples escalas, estilos y Print on Demand
  const ESCALAS_SUGERIDAS = ["15 cm (Mini)", "25 cm (Estándar)", "35 cm (Coleccionista)", "Escala Real 1:1"];
  const ESTILOS_SUGERIDOS = [
    "Sin Pintar (Resina Gris)",
    "Pintado a Mano Full Color",
    "Acabado Bronce Envejecido",
    "Efecto Mármol Blanco",
    "Fibra de Carbono / Mate"
  ];

  const [escalasSeleccionadas, setEscalasSeleccionadas] = useState<string[]>(["25 cm (Estándar)"]);
  const [nuevaEscalaInput, setNuevaEscalaInput] = useState<string>("");
  const [estilosSeleccionados, setEstilosSeleccionados] = useState<string[]>(["Sin Pintar (Resina Gris)"]);
  const [nuevoEstiloInput, setNuevoEstiloInput] = useState<string>("");
  const [esPOD, setEsPOD] = useState<boolean>(true); // Print on Demand activado por defecto
  const [diasFabricacion, setDiasFabricacion] = useState<number>(4);

  const toggleEscala = (esc: string) => {
    setEscalasSeleccionadas((prev) =>
      prev.includes(esc)
        ? prev.length > 1
          ? prev.filter((e) => e !== esc)
          : prev
        : [...prev, esc]
    );
  };

  const agregarEscalaPersonalizada = () => {
    const val = nuevaEscalaInput.trim();
    if (!val) return;
    if (!escalasSeleccionadas.includes(val)) {
      setEscalasSeleccionadas((prev) => [...prev, val]);
    }
    setNuevaEscalaInput("");
  };

  const toggleEstilo = (est: string) => {
    setEstilosSeleccionados((prev) =>
      prev.includes(est)
        ? prev.length > 1
          ? prev.filter((e) => e !== est)
          : prev
        : [...prev, est]
    );
  };

  const agregarEstiloPersonalizado = () => {
    const val = nuevoEstiloInput.trim();
    if (!val) return;
    if (!estilosSeleccionados.includes(val)) {
      setEstilosSeleccionados((prev) => [...prev, val]);
    }
    setNuevoEstiloInput("");
  };
  
  interface Creator {
    id: string;
    nombre?: string;
    email?: string;
    role?: string;
    rol?: string;
  }
  const [creators, setCreators] = useState<Creator[]>([]);
  const [step, setStep] = useState<number>(0);
  const totalSteps = 5;
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Gestión y reordenamiento de imágenes de la galería
  const updateImagesState = (newImages: string[]) => {
    const cleanList = newImages.filter((img) => Boolean(img && img.trim() !== ""));
    setGalleryImages(cleanList);
    const cover = cleanList[0] ?? "";
    const secondaries = cleanList.slice(1);
    setForm((prev) => ({
      ...prev,
      image_url: cover,
      imagenes: secondaries,
    }));
  };

  const addImageToGallery = (url: string) => {
    if (!url || url.trim() === "") return;
    const current = [...galleryImages];
    if (current.includes(url.trim())) return;
    if (current.length >= 6) {
      alert("Puedes agregar un máximo de 6 imágenes.");
      return;
    }
    updateImagesState([...current, url.trim()]);
    setCustomImageUrl("");
    setShowImageUrlInput(false);
  };

  const removeImage = (idx: number) => {
    const nextList = galleryImages.filter((_, i) => i !== idx);
    updateImagesState(nextList);
  };

  const moveImage = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= galleryImages.length || fromIdx === toIdx) return;
    const nextList = [...galleryImages];
    const item = nextList[fromIdx];
    if (!item) return;
    nextList.splice(fromIdx, 1);
    nextList.splice(toIdx, 0, item);
    updateImagesState(nextList);
  };

  const makeCover = (idx: number) => {
    if (idx === 0 || idx >= galleryImages.length) return;
    moveImage(idx, 0);
  };

  // Sincronizar form con product si existe
  useEffect(() => {
    if (product) {
      // Parsear preguntas adicionales desde columna detalles
      let parsedQuestions: string[] = [];
      try {
        if (product.detalles && (product.detalles.startsWith("[") || product.detalles.startsWith("{"))) {
          parsedQuestions = JSON.parse(product.detalles) as string[];
        } else if (product.detalles) {
          parsedQuestions = [product.detalles];
        }
      } catch {
        parsedQuestions = product.detalles ? [product.detalles] : [];
      }
      setQuestions(parsedQuestions);

      // Reconstruir lista completa de imágenes ordenadas
      const initialGallery: string[] = [];
      if (product.image_url) initialGallery.push(product.image_url);
      if (Array.isArray(product.imagenes)) {
        for (const img of product.imagenes) {
          if (img && !initialGallery.includes(img)) initialGallery.push(img);
        }
      }
      if (Array.isArray(product.producto_imagenes)) {
        const sortedSec = [...product.producto_imagenes]
          .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
          .map((p) => p.image_url);
        for (const img of sortedSec) {
          if (img && !initialGallery.includes(img)) initialGallery.push(img);
        }
      }

      setGalleryImages(initialGallery);

      setForm({
        nombre: product.nombre ?? "",
        precio: product.precio ?? 0,
        descripcion: product.descripcion ?? "",
        tamano: product.tamano ?? tamanos[0],
        categoria: product.categoria ?? categorias[0],
        stock: product.stock ?? 0,
        detalles: product.detalles ?? "",
        destacado: product.destacado ?? false,
        image_url: initialGallery[0] ?? "",
        imagenes: initialGallery.slice(1),
        model_url: product.model_url ?? "",
        video_url: product.video_url ?? "",
        user_id: product.user_id ?? product.usuario_id ?? "",
      });
      setModelUrl(product.model_url ?? "");
      setCustomModelInput(product.model_url ?? "");
      setVideoUrl(product.video_url ?? "");
      setCustomVideoInput(product.video_url ?? "");
      if (product.video_url) {
        setVideoPreview(product.video_url);
      }

      // Reconstruir múltiples escalas, estilos y POD
      let loadedEscalas: string[] = [];
      let loadedEstilos: string[] = [];
      let loadedEsPod = true;
      let loadedDias = 4;

      if (product.precios_variantes) {
        try {
          const pv = typeof product.precios_variantes === "string" 
            ? JSON.parse(product.precios_variantes) as Record<string, unknown>
            : (product.precios_variantes as Record<string, unknown>);
          if (Array.isArray(pv.escalas) && pv.escalas.length > 0) loadedEscalas = pv.escalas as string[];
          if (Array.isArray(pv.estilos) && pv.estilos.length > 0) loadedEstilos = pv.estilos as string[];
          if (typeof pv.es_pod === "boolean") loadedEsPod = pv.es_pod;
          if (typeof pv.dias_fabricacion === "number") loadedDias = pv.dias_fabricacion;
        } catch (e) {
          console.warn("Error parseando precios_variantes:", e);
        }
      }

      if (loadedEscalas.length === 0) {
        if (product.tamano) {
          loadedEscalas = product.tamano.includes(",") 
            ? product.tamano.split(",").map((s) => s.trim()) 
            : [product.tamano];
        } else {
          loadedEscalas = ["25 cm (Estándar)"];
        }
      }

      if (loadedEstilos.length === 0) {
        if (product.categoria) {
          loadedEstilos = [product.categoria];
        } else {
          loadedEstilos = ["Sin Pintar (Resina Gris)"];
        }
      }

      setEscalasSeleccionadas(loadedEscalas);
      setEstilosSeleccionados(loadedEstilos);
      setEsPOD(loadedEsPod);
      setDiasFabricacion(loadedDias);
    } else {
      setQuestions([]);
      setGalleryImages([]);
      setEscalasSeleccionadas(["25 cm (Estándar)"]);
      setEstilosSeleccionados(["Sin Pintar (Resina Gris)"]);
      setEsPOD(true);
      setDiasFabricacion(4);
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
      setModelUrl("");
      setCustomModelInput("");
      setShowModelUrlInput(false);
      setVideoUrl("");
      setCustomVideoInput("");
      setShowVideoUrlInput(false);
      setVideoPreview(null);
      setCustomImageUrl("");
      setShowImageUrlInput(false);
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
      const finalVideoUrl = videoUrl || customVideoInput || form.video_url;
      const finalModelUrl = modelUrl || customModelInput || form.model_url;
      const finalCoverImage = galleryImages[0] ?? form.image_url ?? "";
      const finalSecondaryImages = galleryImages.slice(1);

      const formData = {
        ...form,
        tamano: escalasSeleccionadas.join(", ") || tamanos[0],
        categoria: estilosSeleccionados[0] || form.categoria || categorias[0],
        image_url: finalCoverImage,
        imagenes: finalSecondaryImages,
        model_url: finalModelUrl,
        video_url: finalVideoUrl,
        detalles: JSON.stringify(questions),
        precios_variantes: {
          escalas: escalasSeleccionadas,
          estilos: estilosSeleccionados,
          es_pod: esPOD,
          dias_fabricacion: Number(diasFabricacion) || 4,
        },
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
      <DialogContent className="p-0 bg-transparent border-none shadow-none sm:max-w-2xl max-w-[95vw] w-full gap-0 overflow-visible">
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
                       step === 3 ? "Multimedia y 3D" :
                       "Preguntas Adicionales"
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

                  {/* Step 2: Clasificación y Especificaciones (Múltiples Escalas y Estilos) */}
                  {step === 1 && (
                    <div className="space-y-6">
                      {/* Escalas Disponibles: selección de una o varias */}
                      <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div>
                            <label className="text-xs font-black text-slate-800 uppercase tracking-[0.2em]">
                              Escalas Disponibles (Selecciona una o varias)
                            </label>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              El cliente podrá elegir cualquiera de estas escalas para la obra.
                            </p>
                          </div>
                          <span className="text-xs font-bold text-[#00a19a] bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100 w-fit">
                            {escalasSeleccionadas.length} seleccionada(s)
                          </span>
                        </div>

                        {/* Chips de escalas */}
                        <div className="flex flex-wrap gap-2">
                          {Array.from(new Set([...ESCALAS_SUGERIDAS, ...escalasSeleccionadas])).map((esc) => {
                            const isSelected = escalasSeleccionadas.includes(esc);
                            return (
                              <button
                                key={esc}
                                type="button"
                                onClick={() => toggleEscala(esc)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                                  isSelected
                                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                                }`}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 text-teal-400" />}
                                <span>{esc}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Añadir escala personalizada */}
                        <div className="flex gap-2 pt-2 border-t border-slate-200/60">
                          <Input
                            placeholder="Añadir otra escala personalizada (Ej: 45 cm, 1:4)..."
                            value={nuevaEscalaInput}
                            onChange={(e) => setNuevaEscalaInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                agregarEscalaPersonalizada();
                              }
                            }}
                            className="h-10 text-xs rounded-xl bg-white"
                          />
                          <Button
                            type="button"
                            onClick={agregarEscalaPersonalizada}
                            className="h-10 px-4 rounded-xl bg-[#00a19a] hover:bg-[#007973] text-white text-xs font-bold"
                          >
                            Agregar
                          </Button>
                        </div>
                      </div>

                      {/* Estilos y Acabados de la Obra: selección de uno o varios */}
                      <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div>
                            <label className="text-xs font-black text-slate-800 uppercase tracking-[0.2em]">
                              Estilo de la Obra (Selecciona uno o varios)
                            </label>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Selecciona los estilos, pinturas o acabados en los que se ofrecerá esta obra.
                            </p>
                          </div>
                          <span className="text-xs font-bold text-[#00a19a] bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100 w-fit">
                            {estilosSeleccionados.length} seleccionado(s)
                          </span>
                        </div>

                        {/* Chips de estilos */}
                        <div className="flex flex-wrap gap-2">
                          {Array.from(new Set([...ESTILOS_SUGERIDOS, ...estilosSeleccionados])).map((est) => {
                            const isSelected = estilosSeleccionados.includes(est);
                            return (
                              <button
                                key={est}
                                type="button"
                                onClick={() => toggleEstilo(est)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                                  isSelected
                                    ? "bg-[#00a19a] text-white border-[#00a19a] shadow-sm"
                                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                                }`}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                <span>{est}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Añadir estilo personalizado */}
                        <div className="flex gap-2 pt-2 border-t border-slate-200/60">
                          <Input
                            placeholder="Añadir otro acabado o estilo artístico..."
                            value={nuevoEstiloInput}
                            onChange={(e) => setNuevoEstiloInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                agregarEstiloPersonalizado();
                              }
                            }}
                            className="h-10 text-xs rounded-xl bg-white"
                          />
                          <Button
                            type="button"
                            onClick={agregarEstiloPersonalizado}
                            className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold"
                          >
                            Agregar
                          </Button>
                        </div>
                      </div>

                      {/* Categoría Global de Tienda */}
                      <div className="space-y-2.5 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Categoría en Tienda</label>
                        <select 
                          name="categoria" 
                          value={form.categoria} 
                          onChange={handleChange}
                          className="w-full h-11 rounded-2xl border border-slate-200 px-5 bg-white font-bold text-slate-900 outline-none focus:border-[#00a19a]"
                        >
                          {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
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

                  {/* Step 3: Valores & Modalidad Print on Demand vs Stock */}
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
                            <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Reserva / Stock Físico</label>
                            <Input 
                              name="stock" 
                              type="number" 
                              value={form.stock} 
                              onChange={handleChange} 
                              className="h-11 px-5 rounded-2xl border-slate-200 bg-white font-black text-xl text-center outline-none focus:border-[#00a19a]" 
                            />
                          </div>
                       </div>

                       {/* CONFIGURACIÓN PRINT ON DEMAND (Se imprime cuando se compra) */}
                       <div className={`p-6 rounded-3xl border-2 transition-all space-y-4 ${
                         esPOD ? "bg-teal-50/40 border-[#00a19a]/40 shadow-sm" : "bg-slate-50/50 border-slate-200"
                       }`}>
                         <div className="flex items-start justify-between gap-4">
                           <div className="space-y-1">
                             <div className="flex items-center gap-2">
                               <Printer className="w-5 h-5 text-[#00a19a]" />
                               <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                                 Se Imprime Cuando Se Compra — Print on Demand (POD)
                               </h4>
                             </div>
                             <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                               {esPOD ? (
                                 <span className="text-teal-900 font-medium">
                                   <strong>Modo Activo:</strong> La pieza se imprime en 3D bajo pedido cuando el cliente compre. No requiere stock previo y nunca se bloquea por falta de inventario inicial.
                                 </span>
                               ) : (
                                 <span className="text-slate-600 font-medium">
                                   <strong>Modo Stock Físico:</strong> Se vende únicamente de la reserva disponible ({form.stock} unid). Cuando el stock llegue a 0, aparecerá automáticamente como <strong>&quot;Producto no disponible&quot;</strong> en la tienda y la compra se bloqueará.
                                 </span>
                               )}
                             </p>
                           </div>

                           <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                             <input
                               type="checkbox"
                               checked={esPOD}
                               onChange={(e) => setEsPOD(e.target.checked)}
                               className="sr-only peer"
                             />
                             <div className="w-12 h-6.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00a19a]"></div>
                           </label>
                         </div>

                         {esPOD && (
                           <div className="pt-3 border-t border-teal-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-teal-100">
                             <div>
                               <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                                 Días Estimados de Fabricación 3D
                               </span>
                               <span className="text-[11px] text-slate-500">
                                 Tiempo necesario para modelar, imprimir, curar y pintar la pieza antes de coordinar la recolección con Envía.
                               </span>
                             </div>
                             <div className="flex items-center gap-2 shrink-0">
                               <Input
                                 type="number"
                                 min={1}
                                 max={30}
                                 value={diasFabricacion}
                                 onChange={(e) => setDiasFabricacion(Number(e.target.value) || 4)}
                                 className="w-20 h-10 text-center font-black text-base bg-slate-50 rounded-xl border-slate-200"
                               />
                               <span className="text-xs font-bold text-slate-700">días hábiles</span>
                             </div>
                           </div>
                         )}
                       </div>

                       <div className="flex items-center gap-3 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                         <input 
                           type="checkbox" 
                           name="destacado"
                           id="destacadoForm" 
                           checked={form.destacado} 
                           onChange={(e) => setForm({ ...form, destacado: e.target.checked })}
                           className="w-5 h-5 rounded text-[#00a19a] focus:ring-[#00a19a]"
                         />
                         <div className="flex flex-col">
                           <label htmlFor="destacadoForm" className="text-sm font-bold text-slate-800 cursor-pointer select-none">
                             Destacar esta obra
                           </label>
                           <span className="text-xs text-slate-500">Marcar este producto como recomendado en la tienda.</span>
                         </div>
                       </div>
                    </div>
                  )}

                  {/* Step 4: Multimedia y 3D (Requerimiento 11) */}
                  {step === 3 && (
                    <div className="space-y-8 pb-4">
                      {/* --- GALERÍA DE IMÁGENES Y ORDEN DE PRESENTACIÓN --- */}
                      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <ImageIcon className="w-4 h-4 text-[#00a19a]" />
                              <label className="text-sm font-black text-slate-900 uppercase tracking-wider">
                                Galería y Orden de Presentación
                              </label>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              La <span className="font-bold text-teal-700">primera imagen (Posición #1)</span> es la portada principal de la obra en la tienda.
                            </p>
                          </div>
                          <span className="text-xs font-bold text-[#00a19a] bg-teal-50 px-3 py-1 rounded-full border border-teal-100 w-fit">
                            {galleryImages.length} de 6 imágenes
                          </span>
                        </div>

                        {/* Cuadrícula de fotos cargadas con controles de orden */}
                        {galleryImages.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {galleryImages.map((url, idx) => {
                              const isCover = idx === 0;
                              return (
                                <div 
                                  key={`${url}-${idx}`} 
                                  className={`relative rounded-2xl overflow-hidden border-2 transition-all group bg-slate-900 ${
                                    isCover 
                                      ? "border-[#00a19a] shadow-lg shadow-teal-500/10 ring-2 ring-teal-500/30" 
                                      : "border-slate-200 hover:border-slate-300"
                                  }`}
                                >
                                  {/* Preview de la imagen */}
                                  <div className="relative aspect-[4/3] w-full bg-slate-100">
                                    <Image 
                                      src={url} 
                                      alt={`Imagen ${idx + 1}`} 
                                      fill 
                                      className="object-cover" 
                                    />
                                    {/* Badge Superior */}
                                    <div className="absolute top-2 left-2 z-10">
                                      {isCover ? (
                                        <span className="inline-flex items-center gap-1 bg-gradient-to-r from-emerald-600 to-[#00a19a] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md">
                                          <Star className="w-3 h-3 fill-current" /> Portada Principal
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20">
                                          Posición #{idx + 1}
                                        </span>
                                      )}
                                    </div>

                                    {/* Botón eliminar directo */}
                                    <button
                                      type="button"
                                      onClick={() => removeImage(idx)}
                                      className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-md"
                                      title="Quitar imagen"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {/* Barra de control de orden */}
                                  <div className="p-2.5 bg-slate-900 flex items-center justify-between gap-1 text-white">
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        disabled={idx === 0}
                                        onClick={() => moveImage(idx, idx - 1)}
                                        className="h-7 px-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                                        title="Mover hacia la izquierda"
                                      >
                                        <ArrowLeft className="w-3 h-3" /> Mover
                                      </button>
                                      <button
                                        type="button"
                                        disabled={idx === galleryImages.length - 1}
                                        onClick={() => moveImage(idx, idx + 1)}
                                        className="h-7 px-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                                        title="Mover hacia la derecha"
                                      >
                                        <ArrowRight className="w-3 h-3" />
                                      </button>
                                    </div>

                                    {!isCover && (
                                      <button
                                        type="button"
                                        onClick={() => makeCover(idx)}
                                        className="h-7 px-2.5 bg-teal-500/20 hover:bg-teal-500 text-teal-300 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 border border-teal-500/30"
                                        title="Fijar como portada principal"
                                      >
                                        <Star className="w-2.5 h-2.5" /> Hacer Portada
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Zona de subida o inserción de nueva imagen */}
                        {galleryImages.length < 6 && (
                          <div className="space-y-3 pt-2">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
                              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                <div>
                                  <p className="text-xs font-bold text-slate-700">Subir nueva foto a la galería</p>
                                  <p className="text-[11px] text-slate-400">Archivos JPG, PNG o WEBP (máx. 5MB).</p>
                                </div>
                                <div className="w-full sm:w-auto">
                                  <ProductImageUpload 
                                    productId={product?.id?.toString() ?? "new"} 
                                    onUploadComplete={(url) => addImageToGallery(url)} 
                                  />
                                </div>
                              </div>

                              {/* Opción de agregar vía URL */}
                              <div className="border-t border-slate-200/60 pt-3 flex items-center justify-between">
                                {!showImageUrlInput ? (
                                  <button
                                    type="button"
                                    onClick={() => setShowImageUrlInput(true)}
                                    className="text-xs font-bold text-[#00a19a] hover:text-[#007973] flex items-center gap-1.5 transition-colors"
                                  >
                                    <LinkIcon className="w-3.5 h-3.5" /> O pegar enlace de imagen directo
                                  </button>
                                ) : (
                                  <div className="flex gap-2 w-full">
                                    <Input
                                      placeholder="https://ejemplo.com/mi-obra.jpg"
                                      value={customImageUrl}
                                      onChange={(e) => setCustomImageUrl(e.target.value)}
                                      className="h-9 text-xs bg-white"
                                    />
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() => addImageToGallery(customImageUrl)}
                                      disabled={!customImageUrl.trim()}
                                      className="bg-[#00a19a] hover:bg-[#007973] text-white h-9 px-3 text-xs font-bold shrink-0"
                                    >
                                      <Plus className="w-3.5 h-3.5 mr-1" /> Añadir
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => { setShowImageUrlInput(false); setCustomImageUrl(""); }}
                                      className="h-9 px-2 text-slate-400 hover:text-slate-600"
                                    >
                                      <FiX className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* --- MODELO 3D Y VIDEO DE PRESENTACIÓN --- */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 1. Modelo 3D */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Box className="w-4 h-4 text-indigo-600" />
                              <label className="text-xs font-black text-slate-900 uppercase tracking-wider">
                                Modelo 3D Interactivo
                              </label>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              Sube un archivo <span className="font-semibold text-slate-700">.GLB, .GLTF o .STL</span> para que los compradores puedan rotar y visualizar la pieza en 3D.
                            </p>
                          </div>

                          {modelUrl ? (
                            <div className="p-4 bg-teal-50 rounded-2xl border border-teal-100 flex items-center justify-between">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-9 h-9 rounded-xl bg-[#00a19a] text-white flex items-center justify-center shrink-0">
                                  <Box className="w-5 h-5" />
                                </div>
                                <div className="truncate">
                                  <p className="text-xs font-black text-teal-900 uppercase tracking-wider">Modelo 3D Cargado</p>
                                  <a 
                                    href={modelUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="text-[11px] text-teal-700 font-medium hover:underline truncate block"
                                  >
                                    Ver archivo 3D
                                  </a>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => {
                                  setModelUrl("");
                                  setCustomModelInput("");
                                  setForm({ ...form, model_url: "" });
                                }} 
                                className="text-red-400 hover:text-red-600 rounded-full hover:bg-red-50 shrink-0"
                                title="Eliminar modelo 3D"
                              >
                                <FiX className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <ProductModel3DUpload 
                                productId={product?.id?.toString() ?? "new"} 
                                onUploadComplete={(url) => {
                                  setModelUrl(url);
                                  setForm({ ...form, model_url: url });
                                }} 
                              />
                              {!showModelUrlInput ? (
                                <button
                                  type="button"
                                  onClick={() => setShowModelUrlInput(true)}
                                  className="text-xs font-bold text-slate-500 hover:text-[#00a19a] flex items-center gap-1.5 transition-colors"
                                >
                                  <LinkIcon className="w-3.5 h-3.5" /> O ingresar URL directa (.glb / .gltf)
                                </button>
                              ) : (
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="https://ejemplo.com/modelo.glb"
                                    value={customModelInput}
                                    onChange={(e) => setCustomModelInput(e.target.value)}
                                    className="h-9 text-xs bg-white"
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => {
                                      if (customModelInput.trim()) {
                                        setModelUrl(customModelInput.trim());
                                        setForm({ ...form, model_url: customModelInput.trim() });
                                        setShowModelUrlInput(false);
                                      }
                                    }}
                                    disabled={!customModelInput.trim()}
                                    className="bg-[#00a19a] hover:bg-[#007973] text-white h-9 px-3 text-xs font-bold shrink-0"
                                  >
                                    <Check className="w-3.5 h-3.5 mr-1" /> Usar
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* 2. Video de Presentación */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Video className="w-4 h-4 text-rose-600" />
                              <label className="text-xs font-black text-slate-900 uppercase tracking-wider">
                                Video de Presentación
                              </label>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              Sube un archivo de video MP4/WebM o ingresa un enlace (YouTube, Vimeo o video directo).
                            </p>
                          </div>

                          {videoUrl || videoPreview ? (
                            <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-black aspect-video flex items-center justify-center">
                              {videoPreview && !videoPreview.includes("youtube") && !videoPreview.includes("youtu.be") ? (
                                <video src={videoPreview} controls className="w-full h-full object-contain" />
                              ) : (
                                <div className="p-4 text-center text-white space-y-2">
                                  <Video className="w-8 h-8 text-rose-500 mx-auto" />
                                  <p className="text-xs font-bold truncate max-w-[200px]">{videoUrl || videoPreview}</p>
                                </div>
                              )}
                              <Button 
                                variant="destructive" 
                                size="icon" 
                                onClick={() => {
                                  setVideoPreview(null);
                                  setVideoUrl("");
                                  setCustomVideoInput("");
                                  setForm({ ...form, video_url: "" });
                                }}
                                className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full shadow-lg"
                                title="Eliminar video"
                              >
                                <FiX className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <ProductVideoUpload 
                                productId={product?.id?.toString() ?? "new"} 
                                onUploadComplete={(url) => {
                                  setVideoUrl(url);
                                  setVideoPreview(url);
                                  setForm({ ...form, video_url: url });
                                }} 
                              />
                              {!showVideoUrlInput ? (
                                <button
                                  type="button"
                                  onClick={() => setShowVideoUrlInput(true)}
                                  className="text-xs font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1.5 transition-colors"
                                >
                                  <LinkIcon className="w-3.5 h-3.5" /> O ingresar enlace de YouTube / MP4
                                </button>
                              ) : (
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="https://youtube.com/watch?v=..."
                                    value={customVideoInput}
                                    onChange={(e) => setCustomVideoInput(e.target.value)}
                                    className="h-9 text-xs bg-white"
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => {
                                      if (customVideoInput.trim()) {
                                        setVideoUrl(customVideoInput.trim());
                                        setVideoPreview(customVideoInput.trim());
                                        setForm({ ...form, video_url: customVideoInput.trim() });
                                        setShowVideoUrlInput(false);
                                      }
                                    }}
                                    disabled={!customVideoInput.trim()}
                                    className="bg-rose-600 hover:bg-rose-700 text-white h-9 px-3 text-xs font-bold shrink-0"
                                  >
                                    <Check className="w-3.5 h-3.5 mr-1" /> Usar
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 5: Preguntas Adicionales */}
                  {step === 4 && (
                    <div className="space-y-6">
                       <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                          <div className="space-y-3">
                            <label className="text-xs font-black text-slate-700 uppercase tracking-[0.2em] ml-1">Preguntas de Personalización</label>
                            <p className="text-xs text-slate-500">

                              Agrega preguntas que el comprador deberá responder al realizar el pedido de este producto (ej. grabado de nombre, especificaciones de color, etc.).
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <Input 
                              type="text"
                              id="new-question-input"
                              placeholder="Ej: ¿Qué texto deseas grabar en la base?"
                              className="h-11 px-4 rounded-xl border-slate-200 flex-1 bg-white text-sm" 
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const input = document.getElementById('new-question-input') as HTMLInputElement | null;
                                  if (input?.value.trim()) {
                                    setQuestions([...questions, input.value.trim()]);
                                    input.value = "";
                                  }
                                }
                              }}
                            />
                            <Button 
                              type="button"
                              onClick={() => {
                                const input = document.getElementById('new-question-input') as HTMLInputElement | null;
                                if (input?.value.trim()) {
                                  setQuestions([...questions, input.value.trim()]);
                                  input.value = "";
                                }
                              }}
                              className="bg-[#00a19a] hover:bg-[#007973] text-white px-5 font-bold rounded-xl"
                            >
                              Agregar
                            </Button>
                          </div>

                          {questions.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-xs font-semibold bg-slate-50 rounded-xl border border-dashed border-slate-200">
                              Sin preguntas adicionales de personalización.
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                              {questions.map((q, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                                  <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <span className="text-xs text-[#00a19a] bg-teal-50 border border-teal-100 w-5 h-5 rounded-full flex items-center justify-center font-black">{idx + 1}</span>
                                    {q}
                                  </span>
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => setQuestions(questions.filter((_, i) => i !== idx))}
                                    className="text-red-400 hover:text-red-500 rounded-full w-8 h-8 flex items-center justify-center"
                                  >
                                    <FiX className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
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