"use client";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Trash2, Plus, Minus, ShoppingCart, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface CarritoProducto {
  id: string;
  nombre: string;
  precio: number;
  imagen?: string;
  cantidad: number;
  stock: number;
  categoria?: string;
  destacado?: boolean;
}

export default function CarritoPage() {
  const [carrito, setCarrito] = useState<CarritoProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Cargar carrito desde localStorage al cargar el componente
  useEffect(() => {
    if (typeof window !== "undefined") {
      const carritoLocal = localStorage.getItem("carrito");
      if (carritoLocal) {
        try {
          const parsedCarrito = JSON.parse(carritoLocal) as unknown;
          if (Array.isArray(parsedCarrito)) {
            setCarrito(parsedCarrito as CarritoProducto[]);
          }
        } catch {
          setCarrito([]);
        }
      }
    }
    setLoading(false);
  }, []);

  // Sincronizar localStorage cuando cambie el carrito
  useEffect(() => {
    if (typeof window !== "undefined" && !loading) {
      localStorage.setItem("carrito", JSON.stringify(carrito));
    }
  }, [carrito, loading]);

  // Eliminar producto del carrito
  const eliminarProducto = (id: string) => {
    const nuevoCarrito = carrito.filter((p) => p.id !== id);
    setCarrito(nuevoCarrito);
  };

  // Calcular total
  const total = carrito.reduce((acc, producto) => acc + (producto.precio * producto.cantidad), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando carrito...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/" className="text-[#00a19a] hover:underline">Inicio</Link>
          <span>/</span>
          <Link href="/tienda/productos" className="text-[#00a19a] hover:underline">Productos</Link>
          <span>/</span>
          <span className="font-medium">Carrito</span>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <ShoppingCart className="w-8 h-8 text-[#00a19a]" />
          <h1 className="text-3xl font-bold">Tu Carrito</h1>
          <span className="bg-[#00a19a] text-white px-3 py-1 rounded-full text-sm font-semibold">
            {carrito.length} {carrito.length === 1 ? "producto" : "productos"}
          </span>
        </div>

        {carrito.length === 0 ? (
          <Card className="p-12 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Tu carrito está vacío</h2>
            <p className="text-gray-500 mb-6">Añade algunos productos para empezar tu compra</p>
            <Button onClick={() => router.push("/tienda/productos")} className="bg-[#00a19a] hover:bg-[#007973]">
              Ver productos
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lista de productos */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Productos en tu carrito</h2>
                <div className="space-y-4">
                  {carrito.map((producto) => (
                    <div key={producto.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">📦</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg">{producto.nombre}</h3>
                        <p className="text-gray-500">Precio: ${producto.precio.toFixed(2)}</p>
                        {producto.categoria && (
                          <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs mt-1">
                            {producto.categoria}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Controles de cantidad */}
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => actualizarCantidad(producto.id, Math.max(1, producto.cantidad - 1))}
                            disabled={producto.cantidad <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center font-semibold">{producto.cantidad}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => actualizarCantidad(producto.id, producto.cantidad + 1)}
                            disabled={producto.cantidad >= producto.stock}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">${(producto.precio * producto.cantidad).toFixed(2)}</div>
                          <div className="text-sm text-gray-500">Stock: {producto.stock}</div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => eliminarProducto(producto.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Resumen de compra */}
            <div>
              <Card className="p-6 sticky top-8">
                <h2 className="text-xl font-semibold mb-4">Resumen de compra</h2>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Envío:</span>
                    <span className="text-green-600">Gratis</span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-[#00a19a]">${total.toFixed(2)}</span>
                  </div>
                </div>
                <Button 
                  className="w-full bg-[#00a19a] hover:bg-[#007973] mb-3" 
                  size="lg"
                  onClick={() => router.push("/tienda/checkout")}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Proceder al pago
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push("/tienda/productos")}
                >
                  Continuar comprando
                </Button>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Función para actualizar cantidad (implementación faltante)
  function actualizarCantidad(id: string, nuevaCantidad: number) {
    setCarrito(prev => prev.map(producto => 
      producto.id === id 
        ? { ...producto, cantidad: nuevaCantidad }
        : producto
    ));
  }
}
