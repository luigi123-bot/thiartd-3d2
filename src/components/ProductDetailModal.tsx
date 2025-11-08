import Image from "next/image";
import { Star, BadgeDollarSign, Pencil, X, Info, Video } from "lucide-react";
import { useRef, useEffect } from "react";

interface ProductDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  producto: {
    nombre: string;
    descripcion: string;
    categoria: string;
    tamano: string;
    stock: number;
    precio: number;
    destacado?: boolean;
    video_url?: string;
  } | null;
  getStockColor: (stock: number) => string;
  onEditImage?: () => void;
  onEditProduct?: () => void;
  onToggleDestacado?: () => void;
  onDeleteProduct?: () => void;
}

export function ProductDetailModal({
  open,
  onOpenChange,
  producto,
  getStockColor,
  onEditImage,
  onEditProduct,
  onToggleDestacado,
  onDeleteProduct,
}: ProductDetailModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open && closeBtnRef.current) {
      closeBtnRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-detail-title"
      aria-describedby="product-detail-desc"
    >
      <div className="relative max-w-3xl w-full bg-white rounded-3xl shadow-2xl p-0 overflow-y-auto animate-fadeInModal border border-gray-100 max-h-[90vh]">
        {/* Botón cerrar */}
        <button
          ref={closeBtnRef}
          aria-label="Cerrar"
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-gray-200 transition focus:outline-none hover:rotate-90"
        >
          <X className="w-6 h-6 text-gray-500" />
        </button>
        <div className="flex flex-col md:flex-row gap-0 md:gap-8 p-0 md:p-0 min-h-[340px]">
          {/* Imagen grande, izquierda */}
          <div className="relative flex-shrink-0 flex items-center justify-center w-full md:w-[340px] bg-gradient-to-bl from-white to-cyan-100 rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none p-8 md:p-10">
            <Image
              src="/Logo%20Thiart%20Tiktok.png"
              alt="Logo producto"
              width={280}
              height={280}
              className="object-cover w-60 h-60 md:w-72 md:h-72 rounded-2xl shadow-xl ring-1 ring-white/10 border border-gray-200 bg-white"
            />
            {/* Botón editar imagen */}
            {onEditImage && (
              <button
                onClick={onEditImage}
                className="absolute bottom-6 right-6 bg-white/90 hover:bg-gray-200 border border-gray-200 shadow p-2 rounded-full transition"
                aria-label="Editar imagen"
                tabIndex={0}
              >
                <Pencil className="w-5 h-5 text-gray-600" />
              </button>
            )}
            {/* Favorito/Destacado */}
            <button
              onClick={onToggleDestacado}
              className={`absolute top-6 right-6 rounded-full p-2 shadow transition ${
                producto?.destacado
                  ? "bg-yellow-400/90"
                  : "bg-gray-200/80 hover:bg-yellow-300"
              }`}
              aria-label="Destacar producto"
              tabIndex={0}
            >
              <Star
                className={`w-5 h-5 drop-shadow transition ${
                  producto?.destacado ? "text-white" : "text-yellow-500"
                }`}
                fill={producto?.destacado ? "#facc15" : "none"}
              />
            </button>
            {/* Sin stock */}
            {producto?.stock === 0 && (
              <span className="absolute top-6 left-6 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-inner animate-fadeInStock">
                Agotado
              </span>
            )}
          </div>
          {/* Info derecha */}
          <div className="flex-1 flex flex-col justify-center px-6 py-8 md:py-10 space-y-6 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <span
                id="product-detail-title"
                className="text-2xl md:text-3xl font-extrabold text-gray-900"
              >
                {producto?.nombre}
              </span>
              {onEditProduct && (
                <button
                  onClick={onEditProduct}
                  className="ml-2 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-gray-700 shadow transition"
                >
                  Editar producto
                </button>
              )}
            </div>
            <div
              id="product-detail-desc"
              className="text-base text-gray-500 leading-relaxed break-words"
            >
              {producto?.descripcion}
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1 px-4 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 shadow-sm">
                <Info className="w-3 h-3" /> {producto?.categoria}
              </span>
              <span className="inline-flex items-center gap-1 px-4 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 shadow-sm">
                <Info className="w-3 h-3" /> {producto?.tamano}
              </span>
            </div>

            {/* Video del producto */}
            {producto?.video_url && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Video className="w-4 h-4 text-indigo-600" />
                  <span>Video del producto</span>
                </div>
                <div className="rounded-xl overflow-hidden border-2 border-gray-200 shadow-md">
                  <video
                    controls
                    className="w-full h-auto max-h-64 bg-black"
                    src={producto.video_url}
                  >
                    Tu navegador no soporta la reproducción de videos.
                  </video>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 mt-2">
              <span className="inline-block px-5 py-2 rounded-full text-base font-bold shadow-inner border border-yellow-300 bg-yellow-100 text-yellow-900 animate-fadeInStock">
                Stock:{" "}
                <span className={getStockColor(producto?.stock ?? 0)}>
                  {producto?.stock}
                </span>
              </span>
              <span className="flex items-center gap-2 font-bold text-xl text-emerald-600 drop-shadow">
                <BadgeDollarSign className="w-6 h-6 animate-bounce-slow" /> $
                {producto?.precio}
              </span>
            </div>
            {/* Botones Editar y Eliminar */}
            <div className="flex gap-4 mt-6 justify-end">
              {onEditProduct && (
                <button
                  onClick={onEditProduct}
                  className="rounded-full text-xs px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition"
                  aria-label="Editar producto"
                  tabIndex={0}
                >
                  Editar
                </button>
              )}
              {onDeleteProduct && (
                <button
                  onClick={onDeleteProduct}
                  className="rounded-full text-xs px-4 py-2 bg-red-600 text-white hover:bg-red-700 transition"
                  aria-label="Eliminar producto"
                  tabIndex={0}
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        .animate-fadeInModal {
          animation: fadeInModal 0.4s cubic-bezier(.4, 0, .2, 1);
        }
        @keyframes fadeInModal {
          from {
            opacity: 0;
            transform: translateY(32px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fadeInStock {
          animation: fadeInStock 0.5s cubic-bezier(.4, 0, .2, 1);
        }
        @keyframes fadeInStock {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-bounce-slow {
          animation: bounce 1.8s infinite;
        }
        @keyframes bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
      `}</style>
    </div>
  );
}
