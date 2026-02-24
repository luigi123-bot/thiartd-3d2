"use client";
import { useState, useEffect, Suspense } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { ProductImageUpload, ProductModel3DUpload, ProductVideoUpload } from "~/components/FileUploadWidget";
import { Model3DViewer, Model3DViewerLoading } from "~/components/Model3DViewer";
import Image from "next/image";
import { FiX } from "react-icons/fi";
import { Video, Package, Tag, DollarSign, Image as ImageIcon } from "lucide-react";

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
  model_url?: string;
  video_url?: string;
  user_id?: string;
  usuario_id?: string; // Add this if some products use 'usuario_id'
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
        nombre: product.nombre || "",
        precio: product.precio || 0,
        descripcion: product.descripcion || "",
        tamano: product.tamano || tamanos[0],
        categoria: product.categoria || categorias[0],
        stock: product.stock || 0,
        detalles: product.detalles || "",
        destacado: product.destacado || false,
        image_url: product.image_url ?? "",
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

  const handleSubmit = async (e?: React.FormEvent, draft = false) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    setLoading(true);

    try {
      const finalVideoUrl = videoUrl || form.video_url;

      // Incluir las URLs de imagen, modelo 3D y video en el formulario
      const formData = {
        ...form,
        image_url: imageUrl || form.image_url,
        model_url: modelUrl || form.model_url,
        video_url: finalVideoUrl,
        draft,
      };

      let res;
      if (product?.id) {
        // Editar producto
        res = await fetch(`/api/productos/${product.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } else {
        // Crear producto
        res = await fetch("/api/productos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }

      if (res.ok) {
        onOpenChangeAction(false);
        onProductCreatedAction?.();
      } else {
        const data = (await res.json()) as { error?: string };
        console.error("Error al guardar producto:", data.error);
        alert("Error al guardar producto: " + (data.error ?? "Error desconocido"));
      }
    } catch (error) {
      console.error('Error en submit:', error);
      alert('Error al procesar el formulario');
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

  const handleSaveDraft = async () => {
    // validate all required fields before saving
    if (!validateAll()) {
      // focus first error could be implemented here
      return;
    }
    await handleSubmit(undefined, true);
  };

  const handleRemoveImage = () => {
    setImageUrl("");
    setForm({ ...form, image_url: "" });
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
      <DialogContent className="p-0 bg-transparent overflow-hidden">
        <div className="max-w-[1400px] w-[95vw] xl:w-[70vw] 2xl:w-full mx-auto bg-white rounded-lg shadow-lg p-6 border border-gray-100 h-auto max-h-[90vh] overflow-hidden flex flex-col pb-24 relative">
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col flex-1">
            <DialogHeader className="pb-2">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-[#e6fffb] text-[#0d9488]"><Package className="w-5 h-5" /></div>
                <div>
                  <DialogTitle className="text-lg font-semibold text-[#0d9488]">{product ? 'Editar producto' : 'Añadir nuevo producto'}</DialogTitle>
                  <p className="text-sm text-gray-500 mt-1">Paso {step + 1} de {totalSteps}</p>
                </div>
              </div>

              <div className="mt-4">
                {(() => {
                   
                  const steps: Array<{ label: string; icon: React.ComponentType<{ className?: string }> }> = [
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    { label: 'Información', icon: Package },
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    { label: 'Clasificación', icon: Tag },
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    { label: 'Precio', icon: DollarSign },
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    { label: 'Multimedia', icon: ImageIcon },
                  ];
                  return (
                    <div className="flex items-center justify-between gap-4">
                      {steps.map(({ label, icon: Icon }, i) => (
                        <div key={label} className="flex-1 flex flex-col items-center text-center">
                          <div className={`p-3 rounded-full ${step === i ? 'bg-[#0d9488] text-white' : 'bg-gray-100 text-gray-500'}`}><Icon className="w-4 h-4" /></div>
                          <div className="text-xs mt-2 text-gray-600">{label}</div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </DialogHeader>

            <div className="flex justify-center gap-3 mt-3">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${step === i ? 'bg-[#0d9488] text-white' : 'bg-gray-100 text-gray-600'}`}>{i + 1}</div>
              ))}
            </div>

            <div className="w-full overflow-hidden">
              <div className="relative">
                <div className="flex transition-transform duration-300 ease-in-out" style={{ width: `${totalSteps * 100}%`, transform: `translateX(-${(step * 100) / totalSteps}%)` }}>
                  {/* Step panels */}
                  {/* Panel 1 - Información */}
                  <section style={{ width: `${100 / totalSteps}%` }} className="flex-shrink-0 pr-4">
                    <div className="max-w-2xl mx-auto">
                      <label className="input-label">Nombre</label>
                      <Input name="nombre" placeholder="Nombre del producto" value={form.nombre} onChange={handleChange} required className="mt-1" />
                      {errors.nombre && <p className="text-xs text-red-600 mt-1">{errors.nombre}</p>}
                      <div className="form-section mt-4">
                        <label className="input-label">Descripción</label>
                        <Textarea name="descripcion" placeholder="Descripción del producto" value={form.descripcion} onChange={handleChange} required className="mt-2 h-24" />
                        {errors.descripcion && <p className="text-xs text-red-600 mt-1">{errors.descripcion}</p>}
                      </div>
                    </div>
                  </section>

                  {/* Panel 2 - Clasificación */}
                  <section style={{ width: `${100 / totalSteps}%` }} className="flex-shrink-0 px-4">
                    <div className="max-w-2xl mx-auto">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="input-label">Tamaño</label>
                          <select name="tamano" value={form.tamano} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2 focus:border-[#0d9488] focus:ring-1 focus:ring-[#0d9488]">
                            {tamanos.map((t) => (<option key={t} value={t}>{t}</option>))}
                          </select>
                        </div>
                        <div>
                          <label className="input-label">Creador</label>
                          <select name="user_id" value={form.user_id || ''} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2 focus:border-[#0d9488] focus:ring-1 focus:ring-[#0d9488]" required>
                            <option value="">Selecciona creador</option>
                            {creators.map((c) => (<option key={c.id} value={c.id}>{c.nombre ?? c.email}</option>))}
                          </select>
                          {errors.user_id && <p className="text-xs text-red-600 mt-1">{errors.user_id}</p>}
                        </div>
                        <div>
                          <label className="input-label">Categoría</label>
                          <select name="categoria" value={form.categoria} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2 focus:border-[#0d9488] focus:ring-1 focus:ring-[#0d9488]">
                            {categorias.map((c) => (<option key={c} value={c}>{c}</option>))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="input-label">Stock</label>
                          <Input name="stock" type="number" placeholder="0" value={form.stock} onChange={handleChange} min={0} required className="mt-1" />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="input-label">Producto destacado</label>
                            <div className="input-hint">Marcar como destacado en la tienda</div>
                          </div>
                          <input id="destacado" type="checkbox" checked={form.destacado} onChange={(e) => setForm({ ...form, destacado: e.target.checked })} className="h-5 w-10 rounded-full bg-gray-200 accent-[#0d9488]" />
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Panel 3 - Precio */}
                  <section style={{ width: `${100 / totalSteps}%` }} className="flex-shrink-0 px-4">
                    <div className="max-w-2xl mx-auto">
                      <label className="input-label">Precio (€)</label>
                      <Input name="precio" type="number" placeholder="0.00" value={form.precio} onChange={handleChange} min={0} required className="mt-1" />
                      {errors.precio && <p className="text-xs text-red-600 mt-1">{errors.precio}</p>}
                      <div className="text-sm text-gray-500 mt-3">Configura el precio y monedas si aplica.</div>
                    </div>
                  </section>

                  {/* Panel 4 - Multimedia */}
                  <section style={{ width: `${100 / totalSteps}%` }} className="flex-shrink-0 pl-4">
                    <div className="max-w-2xl mx-auto">
                      <div className="bg-white border rounded-lg p-4 shadow-sm">
                        <h4 className="text-sm font-semibold text-gray-800">Imagen del producto</h4>
                        <p className="text-xs text-gray-500">Tamaño máximo: 5MB. Tipos permitidos: jpeg, png, webp</p>
                        {imageUrl ? (
                          <div className="relative mt-3 flex items-start gap-4">
                            <div className="w-36 h-24 rounded-md overflow-hidden border">
                              <Image src={imageUrl} alt="Imagen" width={240} height={160} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 flex flex-col justify-center gap-2">
                              <div className="text-sm font-medium text-gray-800">Imagen subida</div>
                              <div className="text-xs text-gray-500">Tamaño máximo: 5MB. Tipos: jpeg, png, webp</div>
                              <div className="flex items-center gap-3">
                                <a href={imageUrl} target="_blank" rel="noreferrer" className="text-sm text-[#0d9488] hover:underline">Ver tamaño completo</a>
                                <button type="button" onClick={handleRemoveImage} className="text-sm text-red-600">Eliminar</button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3"><ProductImageUpload productId={product?.id?.toString() ?? 'new'} onUploadComplete={(url) => { setImageUrl(url); setForm({ ...form, image_url: url }); }} /></div>
                        )}
                      </div>

                      <div className="bg-white border rounded-lg p-4 shadow-sm mt-4">
                        <h4 className="text-sm font-semibold text-gray-800">Modelo 3D (opcional)</h4>
                        <p className="text-xs text-gray-500">Sube GLB/GLTF/STL para visor 3D</p>
                        {modelUrl ? (
                          <div className="mt-3 flex items-start gap-4">
                            <div className="w-36 h-24 rounded-md overflow-hidden border bg-gray-50 flex items-center justify-center">
                              <Suspense fallback={<div className="p-4">Cargando...</div>}>
                                <div style={{ width: '100%', height: '100%' }}>
                                  <Model3DViewer modelUrl={modelUrl} height="140px" />
                                </div>
                              </Suspense>
                            </div>
                            <div className="flex-1 flex flex-col justify-center gap-2">
                              <div className="text-sm font-medium text-gray-800">Modelo 3D subido</div>
                              <div className="text-xs text-gray-500">GLB / GLTF / STL</div>
                              <div className="flex items-center gap-3 mt-2">
                                <Button type="button" variant="ghost" onClick={() => setShowModelDialog(true)}>Ver modelo</Button>
                                <Button type="button" variant="outline" onClick={handleRemoveModel} className="text-red-600">Eliminar modelo 3D</Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3"><ProductModel3DUpload productId={product?.id?.toString() ?? 'new'} onUploadComplete={(url) => { setModelUrl(url); setForm({ ...form, model_url: url }); }} /></div>
                        )}
                      </div>

                      <div className="bg-white border rounded-lg p-4 shadow-sm mt-4">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2"><Video className="w-4 h-4 text-[#0d9488]" />Video (opcional)</h4>
                        <p className="text-xs text-gray-500">MP4, WebM, OGG, MOV (máx. 100MB)</p>
                        {(videoPreview ?? videoUrl) ? (
                          <div className="mt-3 relative rounded-md overflow-hidden border">
                            <video src={videoPreview ?? videoUrl} controls className="w-full h-28 object-cover" />
                            <button type="button" onClick={handleRemoveVideo} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"><FiX className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <div className="mt-3">
                            <ProductVideoUpload
                              productId={product?.id?.toString() ?? 'new'}
                              onUploadComplete={(url) => {
                                setVideoUrl(url);
                                setVideoPreview(url);
                                setForm({ ...form, video_url: url });
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Dialog para ver el modelo 3D en grande */}
                  {showModelDialog && (
                    <Dialog open={showModelDialog} onOpenChange={setShowModelDialog}>
                      <DialogContent className="max-w-3xl w-[90vw]">
                        <DialogHeader>
                          <DialogTitle>Vista previa Modelo 3D</DialogTitle>
                        </DialogHeader>
                        <div className="mt-2">
                          <Suspense fallback={<Model3DViewerLoading />}><Model3DViewer modelUrl={modelUrl ?? ''} height="520px" /></Suspense>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                {/* Footer inside scrollable area so sticky works within the card */}
                <div className="mt-6">
                  <div className="absolute bottom-0 left-0 right-0 z-10 bg-white border-t pt-3 pb-4 px-6">
                    <div className="max-w-3xl mx-auto flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button type="button" variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} className="text-gray-600" disabled={step === 0}>Atrás</Button>
                        <div role="button" onClick={handleSaveDraft} className="text-gray-600 px-4 py-2 hover:bg-gray-100 rounded-md cursor-pointer text-sm font-medium">Guardar</div>
                      </div>

                      <div className="flex items-center gap-3">
                        {step !== totalSteps - 1 ? (
                          <Button type="button" onClick={handleNext} className="bg-[#0d9488] hover:bg-[#0b7f78] text-white py-3 px-6 rounded-lg">Siguiente</Button>
                        ) : (
                          <Button type="submit" className="bg-[#0d9488] hover:bg-[#0b7f78] text-white py-3 px-6 rounded-lg" disabled={loading}>
                            {loading ? ('Procesando...') : (product ? 'Actualizar producto' : 'Guardar producto')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}