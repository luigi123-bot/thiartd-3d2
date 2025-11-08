"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import { uploadProductVideo } from "~/lib/supabase-storage";
import { Video, Upload, X } from "lucide-react";

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
  });
  const [loading, setLoading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSwitch = (checked: boolean) => {
    setForm((prev) => ({ ...prev, destacado: checked }));
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
      if (!validTypes.includes(file.type)) {
        alert('Por favor selecciona un archivo de video válido (MP4, WebM, OGG, MOV)');
        return;
      }
      
      // Validar tamaño (100MB)
      if (file.size > 100 * 1024 * 1024) {
        alert('El video es demasiado grande. Máximo 100MB');
        return;
      }

      setVideoFile(file);
      
      // Crear preview
      const objectUrl = URL.createObjectURL(file);
      setVideoPreview(objectUrl);
    }
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
    setForm((prev) => ({ ...prev, video_url: "" }));
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

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar producto" : "Agregar producto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <Input
            name="nombre"
            placeholder="Nombre del producto"
            value={form.nombre}
            onChange={handleChange}
            required
          />
          <Textarea
            name="descripcion"
            placeholder="Descripción"
            value={form.descripcion}
            onChange={handleChange}
            required
          />
          <div className="flex gap-4">
            <Input
              name="precio"
              type="number"
              placeholder="Precio"
              value={form.precio}
              onChange={handleChange}
              min={0}
              step="0.01"
              required
            />
            <Input
              name="stock"
              type="number"
              placeholder="Stock"
              value={form.stock}
              onChange={handleChange}
              min={0}
              required
            />
          </div>
          <div className="flex gap-4">
            <Input
              name="tamaño"
              placeholder="Tamaño"
              value={form.tamaño}
              onChange={handleChange}
              required
            />
            <Input
              name="categoria"
              placeholder="Categoría"
              value={form.categoria}
              onChange={handleChange}
              required
            />
          </div>
          <Textarea
            name="detalles"
            placeholder="Detalles adicionales"
            value={form.detalles}
            onChange={handleChange}
          />

          {/* Campo de video */}
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <Video className="w-4 h-4" />
              Video del producto (opcional)
            </label>
            
            {videoPreview ? (
              <div className="relative">
                <video
                  src={videoPreview}
                  controls
                  className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                >
                  Tu navegador no soporta el elemento de video.
                </video>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={handleRemoveVideo}
                  className="absolute top-2 right-2 h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
                {videoFile && (
                  <p className="text-xs text-gray-500 mt-2">
                    {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,video/quicktime"
                  onChange={handleVideoChange}
                  className="hidden"
                  id="video-upload"
                />
                <label
                  htmlFor="video-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Click para subir video
                  </span>
                  <span className="text-xs text-gray-400">
                    MP4, WebM, OGG, MOV (máx. 100MB)
                  </span>
                </label>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={form.destacado}
              onCheckedChange={handleSwitch}
              id="destacado"
            />
            <label htmlFor="destacado" className="text-sm">Destacado</label>
          </div>
          <Button type="submit" className="w-full" disabled={loading || uploadingVideo}>
            {uploadingVideo ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-spin" />
                Subiendo video...
              </>
            ) : loading ? (
              "Procesando..."
            ) : (
              isEditing ? "Guardar cambios" : "Agregar producto"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
