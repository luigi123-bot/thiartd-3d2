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
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [usuario, setUsuario] = useState<{ id?: string; email?: string; nombre?: string } | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Cargar carrito y usuario
  useEffect(() => {
    if (typeof window !== "undefined") {
      const carritoLocal = localStorage.getItem("carrito");
      if (carritoLocal) {
        setCarrito(JSON.parse(carritoLocal) as CarritoItem[]);
      }
    }

    // Obtener usuario actual
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUsuario({
          id: data.user.id,
          nombre: typeof data.user.user_metadata === "object" && data.user.user_metadata !== null
            ? (data.user.user_metadata as { nombre?: string }).nombre ?? data.user.email
            : data.user.email,
          email: data.user.email,
        });
      }
    })();
  }, []);

  // Sincronizar localStorage cuando cambia el carrito
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("carrito", JSON.stringify(carrito));
    }
  }, [carrito]);

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

  // Procesar pago directo
  const procesarPagoDirecto = async () => {
    if (carrito.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "Agrega productos para continuar",
        variant: "destructive"
      });
      return;
    }

    if (!usuario) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para continuar con la compra",
        variant: "destructive"
      });
      return;
    }

    setProcesandoPago(true);

    try {
      // Datos de ejemplo para el pedido
      const pedidoData = {
        cliente_id: usuario.id,
        productos: carrito.map(prod => ({
          nombre: prod.nombre,
          cantidad: prod.cantidad,
          precio_unitario: prod.precio,
          categoria: prod.categoria
        })),
        subtotal,
        costo_envio: envio,
        total,
        estado: "pendiente_pago",
        datos_contacto: {
          nombre: usuario.nombre ?? "Usuario",
          email: usuario.email ?? "email@ejemplo.com",
          telefono: "+57 300 123 4567",
        },
        datos_envio: {
          direccion: "Dirección de ejemplo",
          ciudad: "Bogotá",
          departamento: "Cundinamarca",
          codigoPostal: "110111",
          telefono: "+57 300 123 4567",
          notas: "",
        }
      };

      // Crear pedido
      const pedidoResponse = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pedidoData)
      });

      if (!pedidoResponse.ok) {
        throw new Error("Error al crear el pedido");
      }

      const pedidoResult = await pedidoResponse.json() as { pedido: { id: string } };
      
      // Por ahora, simular pago exitoso y redirigir
      localStorage.removeItem("carrito");
      setCarrito([]);
      
      toast({
        title: "¡Pedido creado!",
        description: `Tu pedido #${pedidoResult.pedido.id} ha sido creado exitosamente`,
      });

      // Redirigir a página de éxito con ID del pedido
      router.push(`/tienda/pago-exitoso?pedido=${pedidoResult.pedido.id}`);

    } catch (error) {
      console.error("Error procesando pedido:", error);
      toast({
        title: "Error al procesar pedido",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive"
      });
    } finally {
      setProcesandoPago(false);
    }
  };

  // Cálculos
  const subtotal = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  const montoDescuento = subtotal * descuento;
  const subtotalConDescuento = subtotal - montoDescuento;
  const envio = subtotalConDescuento > 50000 ? 0 : 8000;
  const total = subtotalConDescuento + envio;

  if (carrito.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Tu carrito está vacío</h1>
          <p className="text-gray-600 mb-8">¡Agrega algunos productos increíbles a tu carrito!</p>
          <Link href="/tienda/productos">
            <Button size="lg" className="bg-[#00a19a] hover:bg-[#007973]">
              Ver productos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link href="/tienda/productos" className="text-[#00a19a] hover:underline">
            Productos
          </Link>
          <span>/</span>
          <span className="font-medium">Carrito de compras</span>
        </div>

        <h1 className="text-3xl font-bold mb-8">Tu carrito ({carrito.length} {carrito.length === 1 ? 'producto' : 'productos'})</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de productos */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="space-y-6">
                {carrito.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 border-b pb-6 last:border-b-0 last:pb-0">
                    {/* Imagen del producto */}
                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">📦</span>
                    </div>

                    {/* Información del producto */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{item.nombre}</h3>
                      <p className="text-sm text-gray-600">{item.categoria}</p>
                      <p className="text-lg font-bold text-[#00a19a]">${item.precio.toFixed(0)}</p>
                      {item.destacado && (
                        <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full mt-1">
                          Destacado
                        </span>
                      )}
                    </div>

                    {/* Controles de cantidad */}
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                        className="w-8 h-8 p-0"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      
                      <span className="w-8 text-center font-medium">{item.cantidad}</span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                        disabled={item.cantidad >= item.stock}
                        className="w-8 h-8 p-0"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Subtotal y eliminar */}
                    <div className="text-right">
                      <p className="font-bold text-lg">${(item.precio * item.cantidad).toFixed(0)}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => eliminarProducto(item.id)}
                        className="text-red-600 hover:text-red-800 mt-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cupón de descuento */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-3">Código de descuento</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ingresa tu cupón"
                    value={cuponCodigo}
                    onChange={(e) => setCuponCodigo(e.target.value.toUpperCase())}
                    className="flex-1"
                  />
                  <Button 
                    onClick={aplicarCupon}
                    variant="outline"
                    disabled={!cuponCodigo.trim()}
                  >
                    Aplicar
                  </Button>
                </div>
                {descuento > 0 && (
                  <p className="text-green-600 text-sm mt-2">
                    ✅ Cupón &ldquo;{cuponCodigo}&rdquo; aplicado ({(descuento * 100).toFixed(0)}% de descuento)
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Resumen del pedido */}
          <div>
            <Card className="p-6 sticky top-8">
              <h2 className="text-xl font-semibold mb-4">Resumen del pedido</h2>
              
              <div className="space-y-3 mb-6">
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
                  <span className={envio === 0 ? "text-green-600" : ""}>
                    {envio === 0 ? "Gratis" : `$${envio.toFixed(0)}`}
                  </span>
                </div>
                
                <hr />
                
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span className="text-[#00a19a]">${total.toFixed(0)}</span>
                </div>
              </div>

              {envio === 0 && (
                <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">¡Felicidades! Tu pedido califica para envío gratis</p>
                </div>
              )}

              {/* Estado del usuario */}
              {!usuario && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    <strong>Inicia sesión</strong> para continuar con tu compra
                  </p>
                </div>
              )}

              {/* Botones de acción */}
              <div className="space-y-3">
                <Button 
                  onClick={procesarPagoDirecto}
                  disabled={procesandoPago || !usuario}
                  className="w-full bg-[#00a19a] hover:bg-[#007973]"
                  size="lg"
                >
                  {procesandoPago ? (
                    "Procesando..."
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Finalizar compra ${total.toFixed(0)}
                    </>
                  )}
                </Button>

                <Button 
                  onClick={() => router.push('/tienda/checkout')}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  Checkout detallado
                  <ArrowRight className="w-4 h-4 ml-2" />
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
