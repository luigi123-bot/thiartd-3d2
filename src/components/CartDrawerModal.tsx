"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight, Truck, ShieldCheck, X, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { useCarrito } from "~/components/providers/CarritoProvider";
import { toast } from "sonner";

interface CartDrawerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CartDrawerModal({ open, onOpenChange }: CartDrawerModalProps) {
  const { carrito, updateCantidad, removeFromCarrito, clearCarrito } = useCarrito();
  const router = useRouter();

  const subtotal = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);

  const handleCheckout = () => {
    onOpenChange(false);
    router.push("/tienda/checkout");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-6 bg-slate-900 text-white flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00a19a] flex items-center justify-center text-white shadow-lg">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black tracking-tight text-white">
                Bolsa de Compras
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-300 font-medium">
                {totalItems} {totalItems === 1 ? "artículo seleccionado" : "artículos seleccionados"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Contenido del modal */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4 divide-y divide-slate-100">
          {carrito.length === 0 ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-300">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-800">Tu bolsa está vacía</h4>
                <p className="text-xs text-slate-400 mt-1">Explora nuestras piezas exclusivas e impresiones 3D.</p>
              </div>
              <Button
                onClick={() => {
                  onOpenChange(false);
                  router.push("/tienda/productos");
                }}
                className="bg-[#00a19a] hover:bg-[#007973] text-white rounded-xl text-xs font-black uppercase tracking-wider"
              >
                Explorar Tienda
              </Button>
            </div>
          ) : (
            carrito.map((item) => (
              <div key={item.id} className="pt-4 first:pt-0 flex items-center gap-4 group">
                {/* Imagen del producto */}
                <div className="relative w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0 p-2">
                  <Image
                    src={item.imagen || "/logo.png"}
                    alt={item.nombre}
                    fill
                    className="object-contain"
                    sizes="80px"
                  />
                </div>

                {/* Info & Controles */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-black text-slate-900 leading-tight">
                      {item.nombre}
                    </h4>
                    <button
                      type="button"
                      onClick={() => removeFromCarrito(item.id)}
                      className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                      title="Eliminar de la bolsa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-sm font-black text-[#00a19a]">
                    ${(item.precio * item.cantidad).toLocaleString("es-CO")}{" "}
                    <span className="text-[10px] font-bold text-slate-400">COP</span>
                  </p>

                  <div className="flex items-center gap-3 pt-1">
                    {/* Selector de cantidad */}
                    <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50">
                      <button
                        type="button"
                        onClick={() => {
                          if (item.cantidad > 1) {
                            updateCantidad(item.id, item.cantidad - 1);
                          } else {
                            removeFromCarrito(item.id);
                          }
                        }}
                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded-l-xl transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-black text-slate-900">
                        {item.cantidad}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCantidad(item.id, item.cantidad + 1)}
                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded-r-xl transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="text-[10px] text-slate-400 font-semibold">
                      ${item.precio.toLocaleString("es-CO")} c/u
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer del Modal */}
        {carrito.length > 0 && (
          <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Estimado</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  ${subtotal.toLocaleString("es-CO")} <span className="text-xs text-slate-400">COP</span>
                </p>
              </div>

              <button
                type="button"
                onClick={clearCarrito}
                className="text-xs font-bold text-slate-400 hover:text-rose-500 underline"
              >
                Vaciar bolsa
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-13 rounded-2xl text-xs font-black uppercase tracking-wider border-slate-200"
              >
                Seguir Comprando
              </Button>
              <Button
                onClick={handleCheckout}
                className="h-13 bg-[#00a19a] hover:bg-[#007973] text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-xl shadow-[#00a19a]/25 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <span>Proceder al Pago</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-[#00a19a]" /> Envío nacional o recogida
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00a19a]" /> Pago 100% protegido Wompi
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
