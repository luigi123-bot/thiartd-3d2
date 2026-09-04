"use client";

import React, { useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCarrito } from "~/components/providers/CarritoProvider";
import { Button } from "~/components/ui/button";

interface CartPreviewDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFullModal?: () => void;
}

export default function CartPreviewDropdown({
  isOpen,
  onClose,
  onOpenFullModal,
}: CartPreviewDropdownProps) {
  const { carrito, updateCantidad, removeFromCarrito } = useCarrito();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const subtotal = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)] border border-slate-100 z-[100] overflow-hidden flex flex-col font-sans"
        >
          {/* Header del Preview */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#00a19a] flex items-center justify-center text-white shadow-md">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-xs uppercase tracking-wider">Tu Carrito</h3>
                <p className="text-[10px] text-slate-300 font-medium">{totalItems} {totalItems === 1 ? "artículo" : "artículos"}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Lista de productos con scroll */}
          <div className="max-h-72 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100 scrollbar-thin">
            {carrito.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 text-slate-300 flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-500">Tu carrito está vacío</p>
                <Link
                  href="/tienda/productos"
                  onClick={onClose}
                  className="inline-block text-[11px] font-black text-[#00a19a] hover:underline uppercase tracking-wider"
                >
                  Explorar catálogo →
                </Link>
              </div>
            ) : (
              carrito.map((item) => (
                <div key={item.id} className="pt-3 first:pt-0 flex items-center gap-3 group">
                  {/* Thumbnail */}
                  <div className="relative w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0 p-1">
                    <Image
                      src={item.imagen || "/logo.png"}
                      alt={item.nombre}
                      fill
                      className="object-contain"
                      sizes="56px"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-black text-slate-900 truncate leading-tight">
                      {item.nombre}
                    </h4>
                    <p className="text-xs font-black text-slate-900 mt-0.5">
                      ${(item.precio * item.cantidad).toLocaleString("es-CO")}{" "}
                      <span className="text-[9px] font-bold text-slate-400">COP</span>
                    </p>

                    {/* Controles de Cantidad */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                        <button
                          type="button"
                          onClick={() => {
                            if (item.cantidad > 1) {
                              updateCantidad(item.id, item.cantidad - 1);
                            } else {
                              removeFromCarrito(item.id);
                            }
                          }}
                          className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded-l-md transition-colors"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="w-6 text-center text-[11px] font-black text-slate-900">
                          {item.cantidad}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCantidad(item.id, item.cantidad + 1)}
                          className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded-r-md transition-colors"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCarrito(item.id)}
                        className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Acciones */}
          {carrito.length > 0 && (
            <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
              {/* Subtotal */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subtotal</span>
                <span className="text-base font-black text-slate-900 tracking-tight">
                  ${subtotal.toLocaleString("es-CO")} <span className="text-[10px] text-slate-400">COP</span>
                </span>
              </div>

              {/* Botón Pagar / Checkout */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    onClose();
                    router.push("/tienda/carrito");
                  }}
                  className="h-11 rounded-xl text-xs font-bold border-slate-200 text-slate-700 hover:bg-white"
                >
                  Ver Carrito
                </Button>
                <Button
                  onClick={() => {
                    onClose();
                    if (onOpenFullModal) {
                      onOpenFullModal();
                    } else {
                      router.push("/tienda/checkout");
                    }
                  }}
                  className="h-11 bg-[#00a19a] hover:bg-[#007973] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-[#00a19a]/20 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <span>Pagar Ahora</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
