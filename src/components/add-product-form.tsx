"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import { uploadProductVideo } from "~/lib/supabase-storage";
import { db } from "~/db/client";
import { Upload, X } from "lucide-react";

export interface ProductFormValues {
  nombre: string;
  descripcion: string;
  precio: number;
  tamaño: string;
  stock: number;
  categoria: string;
  destacado: boolean;
  detalles?: string;
  video_url?: string;
  user_id?: string;
}

interface AddProductFormProps {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  onSuccess?: (values: ProductFormValues) => Promise<void>;
  onSubmit?: (values: ProductFormValues) => void;
  initialValues?: ProductFormValues;
  isEditing?: boolean;
}

export function AddProductForm({
  open,
  onOpenChangeAction,
  onSuccess,
  onSubmit,
  initialValues,
  isEditing,
}: AddProductFormProps) {
  const [form, setForm] = useState<ProductFormValues>({
    nombre: "",
    descripcion: "",
    precio: 0,
    tamaño: "",
    stock: 0,
    categoria: "",
    destacado: false,
    detalles: "",
    video_url: "",
    user_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  interface Creator {
    id: string;
    nombre?: string;
    email?: string;
    role?: string;
    rol?: string;
  }
  
    const [creators, setCreators] = useState<Creator[]>([]);

  useEffect(() => {
    if (initialValues) {
      setForm(initialValues);
      if (initialValues.video_url) {
        setVideoPreview(initialValues.video_url);
      }
    } else {
      setForm({
        nombre: "",
        descripcion: "",
        precio: 0,
        tamaño: "",
        stock: 0,
        categoria: "",
        destacado: false,
        detalles: "",
        video_url: "",
      });
      setVideoPreview(null);
      setVideoFile(null);
    }
  }, [initialValues, open]);

  useEffect(() => {
    const loadCreators = async () => {
      const tables = ['usuario', 'usuarios', 'users'];
      for (const table of tables) {
        try {
          const { data, error } = await db
            .from(table)
            .select('id,nombre,email,role,rol')
            .order('nombre', { ascending: true });

          if (error) {
            const msg = String(error.message || '').toLowerCase();
            if (msg.includes('does not exist') || msg.includes('relation') || msg.includes("doesn\'t exist")) {
              continue;
            }
            console.error('Error cargando creadores (tabla', table, '):', error.message);
            return;
          }

          const rows = data ?? [];
          const filtered = rows.filter((r: Creator) => (String(r.role ?? '').toLowerCase() === 'creador') || (String(r.rol ?? '').toLowerCase() === 'creador'));
          console.log(`Consulta tabla ${table}: filas=${rows.length} creadores_filtrados=${filtered.length}`);
          if (filtered.length > 0) {
            setCreators(filtered);
            return;
          }
        } catch (err) {
          console.warn('Ignorando error al consultar tabla', table, err);
          continue;
        }
      }

      console.warn('No se encontraron tablas de usuarios válidas (usuario|usuarios|users). No hay creadores cargados.');
      setCreators([]);
    };

    if (open) void loadCreators();
  }, [open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let videoUrl = form.video_url;

      // Si hay un nuevo video, subirlo primero
      if (videoFile) {
        setUploadingVideo(true);
        try {
          // Usar un ID temporal basado en el timestamp
          const tempId = `temp_${Date.now()}`;
          videoUrl = await uploadProductVideo(videoFile, tempId);
          console.log('✅ Video subido:', videoUrl);
        } catch (error) {
          console.error('Error subiendo video:', error);
          alert(`Error al subir el video: ${error instanceof Error ? error.message : 'Error desconocido'}`);
          setLoading(false);
          setUploadingVideo(false);
          return;
        }
        setUploadingVideo(false);
      }

      const formWithVideo = { ...form, video_url: videoUrl };

      if (onSuccess) {
        await onSuccess(formWithVideo);
      } else if (onSubmit) {
        onSubmit(formWithVideo);
      }

      onOpenChangeAction(false);
    } catch (error) {
      console.error('Error en submit:', error);
      alert('Error al procesar el formulario');
    } finally {
      setLoading(false);
    }
  };

  function handleRemoveVideo(event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void {
    event.preventDefault();
    setVideoPreview(null);
    setVideoFile(null);
    setForm((prev) => ({
      ...prev,
      video_url: "",
    }));
  }

  function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
      setForm((prev) => ({
        ...prev,
        video_url: "",
      }));
    }
  }

  function handleSwitch(checked: boolean): void {
    setForm((prev) => ({
      ...prev,
      destacado: checked,
    }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl text-[#0d9488]">{isEditing ? "Editar producto" : "Añadir nuevo producto"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6 mt-2">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h4 className="text-sm font-semibold text-[#0d9488] mb-2">Información básica</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input name="nombre" placeholder="Nombre del producto" value={form.nombre} onChange={handleChange} required className="w-full bg-gray-50 border-gray-200" />
                <div className="flex gap-4">
                  <Input name="precio" type="number" placeholder="Precio" value={form.precio} onChange={handleChange} min={0} step="0.01" required className="flex-1 bg-gray-50 border-gray-200" />
                  <Input name="stock" type="number" placeholder="Stock" value={form.stock} onChange={handleChange} min={0} required className="w-28 bg-gray-50 border-gray-200" />
                </div>
              </div>

              <div className="mt-4">
                <Textarea name="descripcion" placeholder="Descripción del producto" value={form.descripcion} onChange={handleChange} required className="h-28 bg-gray-50 border-gray-200" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h4 className="text-sm font-semibold text-[#0d9488] mb-2">Clasificación</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input name="tamaño" placeholder="Tamaño" value={form.tamaño} onChange={handleChange} className="bg-gray-50 border-gray-200" />
                <Input name="categoria" placeholder="Categoría" value={form.categoria} onChange={handleChange} className="bg-gray-50 border-gray-200" />
                <select name="user_id" value={form.user_id ?? ""} onChange={handleChange} className="border rounded px-3 py-2 bg-white" aria-label="Creador del producto" required>
                  <option value="">Selecciona creador</option>
                  {creators.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre ?? c.email}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h4 className="text-sm font-semibold text-[#0d9488] mb-2">Precio e inventario</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">Precio (USD)</label>
                  <Input name="precio" type="number" placeholder="0.00" value={form.precio} onChange={handleChange} min={0} step="0.01" className="bg-gray-50 border-gray-200 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Stock disponible</label>
                  <Input name="stock" type="number" placeholder="0" value={form.stock} onChange={handleChange} min={0} className="bg-gray-50 border-gray-200 mt-1" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h4 className="text-sm font-semibold text-[#0d9488] mb-2">Multimedia</h4>
              <p className="text-sm text-gray-500">URL de imagen principal</p>
              <Input name="detalles" placeholder="URL, imagen principal" value={form.detalles} onChange={handleChange} className="mt-2 bg-gray-50 border-gray-200" />
              <p className="text-sm text-gray-500 mt-2">Modelo 3D / Video (opcional)</p>
              {videoPreview ? (
                <div className="relative mt-3">
                  <video src={videoPreview} controls className="w-full h-48 object-cover rounded-lg border-2 border-gray-200" />
                  <Button type="button" variant="destructive" size="icon" onClick={handleRemoveVideo} className="absolute top-2 right-2 h-8 w-8">
                    <X className="w-4 h-4" />
                  </Button>
                  {videoFile && <p className="text-xs text-gray-500 mt-2">{videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)</p>}
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors mt-3">
                  <input type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime" onChange={handleVideoChange} className="hidden" id="video-upload" />
                  <label htmlFor="video-upload" className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="w-6 h-6 text-[#0d9488]" />
                    <span className="text-sm text-gray-600">Seleccionar archivo 3D/video (opcional)</span>
                    <span className="text-xs text-gray-400">GLB/GLTF/STL o MP4 (máx. 100MB)</span>
                  </label>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch checked={form.destacado} onCheckedChange={handleSwitch} id="destacado" />
                <label htmlFor="destacado" className="text-sm">Producto destacado</label>
              </div>
              <div className="text-sm text-gray-500">Campos obligatorios marcados arriba</div>
            </div>

            <Button type="submit" className="w-full bg-[#0d9488] hover:bg-[#0b7b72] text-white" disabled={loading || uploadingVideo}>
              {uploadingVideo ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-spin" />
                  Subiendo archivo...
                </>
              ) : loading ? (
                "Procesando..."
              ) : (
                isEditing ? "Guardar cambios" : "Crear producto"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    );
}
