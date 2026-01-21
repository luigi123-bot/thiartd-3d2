"use client";
import { useState, useEffect, Suspense } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { ProductImageUpload, ProductModel3DUpload } from "~/components/FileUploadWidget";
import { Model3DViewer, Model3DViewerLoading } from "~/components/Model3DViewer";
import { uploadProductVideo } from "~/lib/supabase-storage";
import Image from "next/image";
import { FiX } from "react-icons/fi";
import { Video, Upload } from "lucide-react";

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
}

export default function CreateProductModal({ open, onOpenChangeAction, onProductCreated, product }: {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  onProductCreated?: () => void;
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
  });
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [modelUrl, setModelUrl] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

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
      });
      setImageUrl("");
      setModelUrl("");
      setVideoUrl("");
      setVideoPreview(null);
      setVideoFile(null);
    }
  }, [product, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
    setVideoUrl("");
    setForm({ ...form, video_url: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let finalVideoUrl = videoUrl || form.video_url;

      // Si hay un nuevo video, subirlo primero
      if (videoFile) {
        setUploadingVideo(true);
        try {
          const tempId = product?.id?.toString() ?? `temp_${Date.now()}`;
          finalVideoUrl = await uploadProductVideo(videoFile, tempId);
          console.log('✅ Video subido:', finalVideoUrl);
          setVideoUrl(finalVideoUrl);
        } catch (error) {
          console.error('Error subiendo video:', error);
          alert(`Error al subir el video: ${error instanceof Error ? error.message : 'Error desconocido'}`);
          setLoading(false);
          setUploadingVideo(false);
          return;
        }
        setUploadingVideo(false);
      }

      // Incluir las URLs de imagen, modelo 3D y video en el formulario
      const formData = {
        ...form,
        image_url: imageUrl || form.image_url,
        model_url: modelUrl || form.model_url,
        video_url: finalVideoUrl,
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
        onProductCreated?.();
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

  const handleRemoveImage = () => {
    setImageUrl("");
    setForm({ ...form, image_url: "" });
  };

  const handleRemoveModel = () => {
    setModelUrl("");
    setForm({ ...form, model_url: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Editar producto" : "Añadir nuevo producto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <Input
            name="nombre"
            placeholder="Nombre del producto"
            value={form.nombre}
            onChange={handleChange}
            required
          />
          <Input
            name="precio"
            type="number"
            placeholder="Precio (€)"
            value={form.precio}
            onChange={handleChange}
            min={0}
            required
          />
          <Textarea
            name="descripcion"
            placeholder="Descripción del producto"
            value={form.descripcion}
            onChange={handleChange}
            required
          />
          <select
            name="tamano"
            value={form.tamano}
            onChange={handleChange}
            className="border rounded px-3 py-2"
            aria-label="Tamaño"
          >
            {tamanos.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            name="categoria"
            value={form.categoria}
            onChange={handleChange}
            className="border rounded px-3 py-2"
            aria-label="Categoría"
          >
            {categorias.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <Input
            name="stock"
            type="number"
            placeholder="Stock"
            value={form.stock}
            onChange={handleChange}
            min={0}
            required
          />
          <Textarea
            name="detalles"
            placeholder="Detalles (opcional)"
            value={form.detalles}
            onChange={handleChange}
          />
          
          {/* Sección de imagen del producto */}
          <div className="border-t pt-4 mt-2">
            <h3 className="text-sm font-semibold mb-3">Imagen del producto</h3>
            
            {/* Mostrar imagen actual si existe */}
            {imageUrl && (
              <div className="relative mb-4 rounded-lg border border-gray-200 overflow-hidden">
                <Image
                  src={imageUrl}
                  alt="Imagen del producto"
                  width={400}
                  height={300}
                  className="w-full h-auto object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition"
                  title="Eliminar imagen"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {/* Widget de subida de imagen */}
            {!imageUrl && (
              <ProductImageUpload
                productId={product?.id?.toString() ?? "new"}
                onUploadComplete={(url) => {
                  setImageUrl(url);
                  setForm({ ...form, image_url: url });
                }}
              />
            )}
          </div>

          {/* Sección de modelo 3D */}
          <div className="border-t pt-4 mt-2">
            <h3 className="text-sm font-semibold mb-3">Modelo 3D (opcional)</h3>
            <p className="text-xs text-gray-500 mb-3">
              Sube un archivo GLB, GLTF o STL para mostrar un visor 3D interactivo del producto
            </p>
            
            {/* Mostrar modelo 3D actual si existe */}
            {modelUrl && (
              <div className="space-y-3">
                <Suspense fallback={<Model3DViewerLoading />}>
                  <Model3DViewer modelUrl={modelUrl} height="300px" />
                </Suspense>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRemoveModel}
                  className="w-full"
                >
                  <FiX className="mr-2" />
                  Eliminar modelo 3D
                </Button>
              </div>
            )}
            
            {/* Widget de subida de modelo 3D */}
            {!modelUrl && (
              <ProductModel3DUpload
                productId={product?.id?.toString() ?? "new"}
                onUploadComplete={(url) => {
                  setModelUrl(url);
                  setForm({ ...form, model_url: url });
                }}
              />
            )}
          </div>

          {/* Sección de video del producto */}
          <div className="border-t pt-4 mt-2">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Video className="w-4 h-4" />
              Video del producto (opcional)
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Sube un video en formato MP4, WebM, OGG o MOV (máx. 100MB)
            </p>
            
            {/* Mostrar video actual si existe */}
            {(videoPreview ?? videoUrl) && (
              <div className="space-y-3">
                <div className="relative rounded-lg border-2 border-gray-200 overflow-hidden">
                  <video
                    src={videoPreview ?? videoUrl}
                    controls
                    className="w-full h-64 object-cover"
                  >
                    Tu navegador no soporta el elemento de video.
                  </video>
                  <button
                    type="button"
                    onClick={handleRemoveVideo}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition"
                    title="Eliminar video"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
                {videoFile && (
                  <p className="text-xs text-gray-500">
                    {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            )}
            
            {/* Widget de subida de video */}
            {!videoPreview && !videoUrl && (
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
          
          <Button type="submit" className="w-full" disabled={loading || uploadingVideo}>
            {uploadingVideo ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-spin" />
                Subiendo video...
              </>
            ) : loading ? (
              "Procesando..."
            ) : (
              product ? "Actualizar producto" : "Guardar producto"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}