"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Play, Sparkles, ZoomIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface MediaItem {
  type: "image" | "video" | "model";
  url: string;
  label?: string;
  thumbnailUrl?: string;
}

interface ProductMediaGalleryProps {
  items: MediaItem[];
  productName: string;
  onModelSelect?: () => void;
}

export default function ProductMediaGallery({
  items,
  productName,
  onModelSelect,
}: ProductMediaGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const activeItem = items[selectedIndex] ?? items[0];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  if (!items || items.length === 0) {
    return (
      <div className="w-full aspect-square bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400">
        Sin imágenes disponibles
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4 lg:gap-6 w-full select-none">
      {/* ── Miniaturas Laterales (Estilo Mercado Libre) ── */}
      <div className="flex md:flex-col gap-2.5 overflow-x-auto md:overflow-y-auto max-h-[550px] scrollbar-thin py-1">
        {items.map((item, idx) => {
          const isSelected = selectedIndex === idx;
          return (
            <button
              key={`${item.url}-${idx}`}
              type="button"
              onMouseEnter={() => setSelectedIndex(idx)}
              onClick={() => {
                setSelectedIndex(idx);
                if (item.type === "model" && onModelSelect) onModelSelect();
              }}
              className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 bg-white group ${
                isSelected
                  ? "border-[#00a19a] ring-2 ring-[#00a19a]/20 shadow-md scale-105"
                  : "border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100"
              }`}
            >
              {item.type === "image" && (
                <Image
                  src={item.url}
                  alt={`${productName} thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              )}

              {item.type === "video" && (
                <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-white relative">
                  {item.thumbnailUrl ? (
                    <Image
                      src={item.thumbnailUrl}
                      alt="Video thumbnail"
                      fill
                      className="object-cover opacity-60"
                    />
                  ) : null}
                  <Play className="w-6 h-6 text-white drop-shadow-md z-10 fill-white" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-teal-300 z-10 mt-1">
                    Video
                  </span>
                </div>
              )}

              {item.type === "model" && (
                <div className="w-full h-full bg-gradient-to-br from-[#00a19a] to-slate-900 flex flex-col items-center justify-center text-white p-1">
                  <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
                  <span className="text-[8px] font-black uppercase tracking-tight text-white mt-1">
                    3D Vista
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Vista Principal con Zoom (Estilo Mercado Libre) ── */}
      <div className="flex-1">
        <div
          className="relative w-full aspect-square bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden cursor-crosshair group flex items-center justify-center"
          onMouseEnter={() => setIsZoomed(true)}
          onMouseLeave={() => setIsZoomed(false)}
          onMouseMove={handleMouseMove}
        >
          <AnimatePresence mode="wait">
            {activeItem?.type === "image" && (
              <motion.div
                key={activeItem.url}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full relative"
              >
                <Image
                  src={activeItem.url}
                  alt={productName}
                  fill
                  priority
                  className={`object-contain p-4 transition-transform duration-100 ${
                    isZoomed ? "scale-150" : "scale-100"
                  }`}
                  style={
                    isZoomed
                      ? {
                          transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                        }
                      : undefined
                  }
                  sizes="(max-width: 768px) 100vw, 600px"
                />
              </motion.div>
            )}

            {activeItem?.type === "video" && (
              <motion.div
                key={activeItem.url}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full bg-black flex items-center justify-center p-2"
              >
                {activeItem.url.includes("youtube.com") || activeItem.url.includes("youtu.be") ? (
                  <iframe
                    src={activeItem.url.replace("watch?v=", "embed/")}
                    title="Video del producto"
                    className="w-full h-full rounded-2xl"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={activeItem.url}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-contain rounded-2xl"
                  />
                )}
              </motion.div>
            )}

            {activeItem?.type === "model" && (
              <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-white p-8 text-center">
                <Sparkles className="w-12 h-12 text-[#00a19a] mb-3 animate-spin" />
                <h4 className="font-black text-lg text-white">Visualizador 3D Interactivo</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Interactúa con el modelo 3D directamente en la sección inferior.
                </p>
              </div>
            )}
          </AnimatePresence>

          {/* Badge indicador de zoom */}
          {activeItem?.type === "image" && (
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 text-[10px] font-bold text-slate-600 flex items-center gap-1.5 shadow-sm opacity-80 group-hover:opacity-100 transition-opacity">
              <ZoomIn className="w-3.5 h-3.5 text-[#00a19a]" />
              <span>Pasa el cursor para hacer zoom</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
