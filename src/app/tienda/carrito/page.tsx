"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import {  Plus, Minus, Trash2 } from "lucide-react";
import { crearPagoWompi } from "~/utils/wompi";

interface CarritoProducto {
  id: number;
  nombre: string;
  descripcion: string;
  imagen: string;
  precio: number;
  cantidad: number;
  tamano?: string;
  stock?: number;
}

const getCarritoFromStorage = (): CarritoProducto[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("carrito") ?? "[]") as CarritoProducto[];
  } catch {
    return [];
  }
};

const saveCarritoToStorage = (carrito: CarritoProducto[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("carrito", JSON.stringify(carrito));
  }
};

export default function CarritoPage() {
  const [carrito, setCarrito] = useState<CarritoProducto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCarrito(getCarritoFromStorage());
  }, []);

  useEffect(() => {
    saveCarritoToStorage(carrito);
  }, [carrito]);

  const handleCantidad = (id: number, delta: number, stock?: number) => {
    setCarrito((prev) =>
      prev
        .map((p) =>
          p.id === id
            ? {
                ...p,
                cantidad: Math.max(1, stock ? Math.min(p.cantidad + delta, stock) : p.cantidad + delta),
              }
            : p
        )
        .filter((p) => p.cantidad > 0) // Elimina si cantidad llega a 0
    );
  };

  const handleEliminar = (id: number) => {
    setCarrito((prev) => prev.filter((p) => p.id !== id));
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // Puedes obtener el email del usuario autenticado si lo tienes
      const email = "cliente@correo.com";
      const referencia = `carrito_${Date.now()}`;
      const pago = await crearPagoWompi({
        amount_in_cents: Math.round(total * 100), // Wompi espera centavos
        currency: "COP",
        customer_email: email,
        reference: referencia,
      });
      if (pago?.data?.payment_link) {
        window.location.href = pago.data.payment_link;
      } else {
        alert("No se pudo generar el pago. Intenta de nuevo.");
      }
    } catch {
      alert("Error al procesar el pago");
    }
    setLoading(false);
  };

  // Cálculos de totales
  const subtotal = carrito.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
  const impuestos = subtotal * 0.19; // 19% IVA
  const envio = carrito.length > 0 ? 80 : 0; // Ejemplo: envío fijo $80 si hay productos
  const total = subtotal + impuestos + envio;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-2 py-8">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8 flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Tu carrito</h2>
        </div>
        {/* Lista de productos */}
        <div className="flex-1 overflow-y-auto space-y-6 mb-8">
          {carrito.length === 0 ? (
            <div className="text-center text-gray-400 mt-16">Tu carrito está vacío.</div>
          ) : (
            carrito.map((p) => (
              <div key={p.id} className="flex gap-4 items-center bg-gray-50 rounded-xl p-4 shadow-sm">
                <Image
                  src={p.imagen ?? "/Logo%20Thiart%20Tiktok.png"}
                  alt={p.nombre}
                  width={64}
                  height={64}
                  className="rounded-lg object-contain bg-white border"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-base truncate">{p.nombre}</span>
                    <button
                      onClick={() => handleEliminar(p.id)}
                      className="p-1 rounded hover:bg-red-50"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 truncate">{p.descripcion}</div>
                  {p.tamano && (
                    <div className="text-xs text-gray-600 mt-1">
                      Tamaño: <span className="font-medium">{p.tamano}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-semibold">${p.precio.toFixed(2)}</span>
                    <div className="flex items-center border rounded-md bg-white">
                      <button
                        className="px-2 py-1 text-gray-600 hover:text-black"
                        onClick={() => handleCantidad(p.id, -1)}
                        disabled={p.cantidad <= 1}
                        title="Disminuir cantidad"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-2 font-medium">{p.cantidad}</span>
                      <button
                        className="px-2 py-1 text-gray-600 hover:text-black"
                        onClick={() => handleCantidad(p.id, 1, p.stock)}
                        disabled={p.stock !== undefined && p.cantidad >= p.stock}
                        title="Aumentar cantidad"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="ml-auto text-sm text-gray-700 font-bold">
                      ${(p.precio * p.cantidad).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {/* Totales y checkout */}
        <div className="border-t pt-6 bg-white">
          <div className="flex justify-between text-base mb-2">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Impuestos estimados (IVA 19%)</span>
            <span>${impuestos.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Envío estimado</span>
            <span>${envio.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold mb-6">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button
            className="w-full py-3 rounded-xl bg-black text-white font-semibold text-lg hover:bg-gray-900 transition"
            disabled={carrito.length === 0 || loading}
            onClick={handleCheckout}
          >
            {loading ? "Procesando..." : "Finalizar compra"}
          </button>
        </div>
      </div>
    </div>
  );
}
