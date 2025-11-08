"use client";
import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import Link from "next/link";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "~/components/ui/use-toast";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

interface CarritoItem {
  id: string;
  nombre: string;
  precio: number;
  imagen: string;
  cantidad: number;
  stock: number;
  categoria: string;
  destacado: boolean;
}

export default function CarritoPage() {
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [cuponCodigo, setCuponCodigo] = useState("");
  const [descuento, setDescuento] = useState(0);
  const [usuario, setUsuario] = useState<{ id?: string; email?: string; nombre?: string } | null>(null);
  const [cargaInicial, setCargaInicial] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  // Cargar carrito y usuario
  useEffect(() => {
    console.log("🛒 Página de carrito montada");
    if (typeof window !== "undefined") {
      const carritoLocal = localStorage.getItem("carrito");
      console.log("📦 Carrito en localStorage:", carritoLocal);
      if (carritoLocal) {
        const carritoParseado = JSON.parse(carritoLocal) as CarritoItem[];
        console.log("✅ Carrito parseado:", carritoParseado);
        setCarrito(carritoParseado);
      } else {
        console.log("⚠️ No hay carrito en localStorage");
      }
      setCargaInicial(false);
    }

    // Obtener usuario actual
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        console.log("👤 Usuario encontrado:", data.user.email);
        setUsuario({
          id: data.user.id,
          nombre: typeof data.user.user_metadata === "object" && data.user.user_metadata !== null
            ? (data.user.user_metadata as { nombre?: string }).nombre ?? data.user.email
            : data.user.email,
          email: data.user.email,
        });
      } else {
        console.log("⚠️ No hay usuario autenticado");
      }
    })();
  }, []);

  // Sincronizar localStorage cuando cambia el carrito (SOLO después de la carga inicial)
  useEffect(() => {
    if (!cargaInicial && typeof window !== "undefined") {
      console.log("💾 Sincronizando carrito con localStorage:", carrito);
      localStorage.setItem("carrito", JSON.stringify(carrito));
    }
  }, [carrito, cargaInicial]);

  // Actualizar cantidad
  const actualizarCantidad = (id: string, nuevaCantidad: number) => {
    if (nuevaCantidad === 0) {
      eliminarProducto(id);
      return;
    }

    setCarrito(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, cantidad: Math.min(nuevaCantidad, item.stock) }
          : item
      )
    );
  };

  // Eliminar producto
  const eliminarProducto = (id: string) => {
    setCarrito(prev => prev.filter(item => item.id !== id));
  };

  // Aplicar cupón
  const aplicarCupon = () => {
    const cupones = {
      "DESCUENTO10": 0.1,
      "BIENVENIDO": 0.15,
      "NAVIDAD": 0.2
    };
    
    const descuentoCupon = cupones[cuponCodigo as keyof typeof cupones] ?? 0;
    setDescuento(descuentoCupon);
    
    if (descuentoCupon > 0) {
      toast({
        title: "¡Cupón aplicado!",
        description: `Descuento del ${(descuentoCupon * 100).toFixed(0)}%`,
      });
    } else {
      toast({
        title: "Cupón no válido",
        description: "El código ingresado no es válido",
        variant: "destructive"
      });
    }
  };

  // Cálculos
  const subtotal = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  const montoDescuento = subtotal * descuento;
  const subtotalConDescuento = subtotal - montoDescuento;
  const envio = 0; // Envío gratis para testing en producción
  const total = subtotalConDescuento + envio;

  // Detectar entorno de desarrollo
  const isDevelopment = typeof window !== 'undefined' && 
    (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost');

  if (carrito.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 sm:py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <ShoppingBag className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-gray-300 mx-auto mb-4 sm:mb-6" />
          <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Tu carrito está vacío</h1>
          <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">¡Agrega algunos productos increíbles a tu carrito!</p>
          <Link href="/tienda/productos">
            <Button size="lg" className="bg-[#00a19a] hover:bg-[#007973] text-sm sm:text-base">
              Ver productos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-4 sm:mb-6 text-sm">
          <Link href="/tienda/productos" className="text-[#00a19a] hover:underline">
            Productos
          </Link>
          <span>/</span>
          <span className="font-medium">Carrito de compras</span>
        </div>

        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 md:mb-8">
          Tu carrito ({carrito.length} {carrito.length === 1 ? 'producto' : 'productos'})
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {/* Lista de productos */}
          <div className="lg:col-span-2">
            <Card className="p-3 sm:p-4 md:p-6 overflow-hidden">
              <div className="space-y-4 sm:space-y-6">
                {carrito.map((item) => (
                  <div key={item.id} className="flex flex-col xs:flex-row items-start xs:items-center gap-3 sm:gap-4 border-b pb-4 sm:pb-6 last:border-b-0 last:pb-0">
                    {/* Imagen del producto */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xl sm:text-2xl">📦</span>
                    </div>

                    {/* Información del producto */}
                    <div className="flex-1 min-w-0 w-full xs:w-auto">
                      <h3 className="font-semibold text-base sm:text-lg truncate">{item.nombre}</h3>
                      <p className="text-xs sm:text-sm text-gray-600">{item.categoria}</p>
                      <p className="text-base sm:text-lg font-bold text-[#00a19a]">${item.precio.toFixed(0)}</p>
                      {item.destacado && (
                        <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full mt-1">
                          Destacado
                        </span>
                      )}
                    </div>

                    {/* Controles de cantidad y acciones - Responsive */}
                    <div className="flex items-center justify-between xs:justify-end w-full xs:w-auto gap-3">
                      {/* Controles de cantidad */}
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                          className="w-7 h-7 sm:w-8 sm:h-8 p-0"
                        >
                          <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        
                        <span className="w-6 sm:w-8 text-center font-medium text-sm sm:text-base">{item.cantidad}</span>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                          disabled={item.cantidad >= item.stock}
                          className="w-7 h-7 sm:w-8 sm:h-8 p-0"
                        >
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </div>

                      {/* Subtotal y eliminar */}
                      <div className="text-right">
                        <p className="font-bold text-base sm:text-lg">${(item.precio * item.cantidad).toFixed(0)}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => eliminarProducto(item.id)}
                          className="text-red-600 hover:text-red-800 mt-1 p-1"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cupón de descuento */}
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
                <h3 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Código de descuento</h3>
                <div className="flex flex-col xs:flex-row gap-2">
                  <Input
                    placeholder="Ingresa tu cupón"
                    value={cuponCodigo}
                    onChange={(e) => setCuponCodigo(e.target.value.toUpperCase())}
                    className="flex-1 text-sm sm:text-base"
                  />
                  <Button 
                    onClick={aplicarCupon}
                    variant="outline"
                    disabled={!cuponCodigo.trim()}
                    className="text-sm sm:text-base w-full xs:w-auto"
                  >
                    Aplicar
                  </Button>
                </div>
                {descuento > 0 && (
                  <p className="text-green-600 text-xs sm:text-sm mt-2">
                    ✅ Cupón &ldquo;{cuponCodigo}&rdquo; aplicado ({(descuento * 100).toFixed(0)}% de descuento)
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Resumen del pedido */}
          <div className="lg:sticky lg:top-8">
            <Card className="p-4 sm:p-6 overflow-hidden">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Resumen del pedido</h2>
              
              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 text-sm sm:text-base">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(0)}</span>
                </div>
                
                {descuento > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento ({cuponCodigo}):</span>
                    <span>-${montoDescuento.toFixed(0)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>Envío:</span>
                  <span className="text-green-600">Gratis</span>
                </div>
                
                <hr />
                
                <div className="flex justify-between font-bold text-base sm:text-lg">
                  <span>Total:</span>
                  <span className="text-[#00a19a]">${total.toFixed(0)}</span>
                </div>
              </div>

              <div className="mb-4 sm:mb-6 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs sm:text-sm text-green-700">🎉 ¡Envío gratis en todos los pedidos!</p>
              </div>

              {/* Alerta de monto mínimo solo en producción */}
              {!isDevelopment && total < 1500 && (
                <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs sm:text-sm text-yellow-700 font-semibold">⚠️ Monto mínimo: $1,500</p>
                  <p className="text-xs text-yellow-600 mt-1">
                    Agrega ${(1500 - total).toFixed(0)} más para alcanzar el monto mínimo de pago
                  </p>
                </div>
              )}

              {/* Alerta de modo desarrollo */}
              {isDevelopment && (
                <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs sm:text-sm text-blue-700 font-semibold">🔧 Modo Desarrollo</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Los pedidos se aprobarán automáticamente
                  </p>
                </div>
              )}

              {/* Estado del usuario */}
              {!usuario && (
                <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs sm:text-sm text-yellow-700">
                    <strong>Inicia sesión</strong> para continuar con tu compra
                  </p>
                </div>
              )}

              {/* Botones de acción */}
              <div className="space-y-2 sm:space-y-3">
                <Button 
                  onClick={() => router.push('/tienda/checkout')}
                  disabled={!usuario || (!isDevelopment && total < 1500)}
                  className="w-full bg-[#00a19a] hover:bg-[#007973] text-sm sm:text-base"
                  size="lg"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {(!isDevelopment && total < 1500) ? 'Monto mínimo: $1,500' : 'Continuar al pago'}
                  {(isDevelopment || total >= 1500) && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </div>

              <div className="mt-4 text-center">
                <Link href="/tienda/productos" className="text-[#00a19a] hover:underline text-sm">
                  ← Seguir comprando
                </Link>
              </div>

              {/* Información de seguridad */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-sm mb-2">Compra segura</h3>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>✅ Pagos seguros</li>
                  <li>🚚 Envío rápido y confiable</li>
                  <li>🔒 Información protegida</li>
                  <li>📞 Soporte 24/7</li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
