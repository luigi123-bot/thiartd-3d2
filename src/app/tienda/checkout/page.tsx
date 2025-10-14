"use client";
import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card } from "~/components/ui/card";
import { createClient } from "@supabase/supabase-js";
import { useToast } from "~/components/ui/use-toast";
import Link from "next/link";
import { ArrowLeft, CreditCard, Truck, Shield } from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

interface CarritoProducto {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  stock: number;
  categoria?: string;
  imagen?: string;
}

interface DatosCheckout {
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  codigoPostal: string;
  notas?: string;
}

export default function CheckoutPage() {
  const [carrito, setCarrito] = useState<CarritoProducto[]>([]);
  const [loading, setLoading] = useState(false);
  const [usuario, setUsuario] = useState<{ id?: string; email?: string; nombre?: string } | null>(null);
  const [datosCheckout, setDatosCheckout] = useState<DatosCheckout>({
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
    ciudad: "",
    departamento: "",
    codigoPostal: "",
    notas: ""
  });
  const { toast } = useToast();

  // Cargar carrito y usuario
  useEffect(() => {
    if (typeof window !== "undefined") {
      const carritoLocal = localStorage.getItem("carrito");
      if (carritoLocal) {
        setCarrito(JSON.parse(carritoLocal) as CarritoProducto[]);
      }
    }

    // Obtener usuario actual
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        const user = {
          id: data.user.id,
          nombre: typeof data.user.user_metadata === "object" && data.user.user_metadata !== null
            ? (data.user.user_metadata as { nombre?: string }).nombre ?? data.user.email
            : data.user.email,
          email: data.user.email,
        };
        setUsuario(user);
        
        // Pre-llenar formulario con datos del usuario
        setDatosCheckout(prev => ({
          ...prev,
          nombre: user.nombre ?? "",
          email: user.email ?? ""
        }));
      }
    })();
  }, []);

  // Calcular totales
  const subtotal = carrito.reduce((acc, producto) => acc + (producto.precio * producto.cantidad), 0);
  const envio = subtotal > 50000 ? 0 : 8000; // Envío gratis por compras mayores a $50,000
  const total = subtotal + envio;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDatosCheckout({
      ...datosCheckout,
      [e.target.name]: e.target.value
    });
  };

  const validarFormulario = () => {
    const camposRequeridos = ['nombre', 'email', 'telefono', 'direccion', 'ciudad', 'departamento'];
    return camposRequeridos.every(campo => datosCheckout[campo as keyof DatosCheckout]);
  };

  const procesarPago = async () => {
    if (!validarFormulario()) {
      toast({
        title: "Campos incompletos",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    if (carrito.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "No hay productos para procesar",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Crear el pedido en la base de datos con información de envío estructurada
      const pedidoData = {
        cliente_id: usuario?.id ?? "guest",
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
          nombre: datosCheckout.nombre,
          email: datosCheckout.email,
          telefono: datosCheckout.telefono,
        },
        datos_envio: {
          direccion: datosCheckout.direccion,
          ciudad: datosCheckout.ciudad,
          departamento: datosCheckout.departamento,
          codigoPostal: datosCheckout.codigoPostal,
          telefono: datosCheckout.telefono,
          notas: datosCheckout.notas,
        }
      };

      const pedidoResponse = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pedidoData)
      });

      if (!pedidoResponse.ok) {
        throw new Error("Error al crear el pedido");
      }

      const pedidoResult = await pedidoResponse.json() as { pedido: { id: number } };
      
      // 2. Procesar pago con Wompi
      const pagoData = {
        amount: total,
        customer_email: datosCheckout.email,
        customer_name: datosCheckout.nombre,
        customer_phone: datosCheckout.telefono,
        reference: `PEDIDO-${pedidoResult.pedido.id}-${Date.now()}`,
        redirect_url: `${window.location.origin}/tienda/pago-exitoso?pedido=${pedidoResult.pedido.id}`
      };

      const pagoResponse = await fetch("/api/pago-wompi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pagoData)
      });

      if (!pagoResponse.ok) {
        throw new Error("Error al procesar el pago");
      }

      const pagoResult = await pagoResponse.json() as { permalink?: string };

      if (pagoResult.permalink) {
        // Limpiar carrito antes de redirigir
        localStorage.removeItem("carrito");
        // Redirigir a Wompi
        window.location.href = pagoResult.permalink;
      } else {
        throw new Error("No se recibió URL de pago");
      }

    } catch (error) {
      console.error("Error en procesarPago:", error);
      toast({
        title: "Error al procesar pago",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (carrito.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Tu carrito está vacío</h1>
          <p className="text-gray-600 mb-6">Agrega algunos productos para continuar con la compra</p>
          <Link href="/tienda/productos">
            <Button>Ver productos</Button>
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
          <Link href="/tienda/carrito" className="flex items-center gap-2 text-[#00a19a] hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Volver al carrito
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8">Finalizar compra</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario de checkout */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Información de envío</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre completo *</label>
                  <Input
                    name="nombre"
                    value={datosCheckout.nombre}
                    onChange={handleInputChange}
                    placeholder="Tu nombre completo"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <Input
                    name="email"
                    type="email"
                    value={datosCheckout.email}
                    onChange={handleInputChange}
                    placeholder="tu@email.com"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Teléfono *</label>
                  <Input
                    name="telefono"
                    value={datosCheckout.telefono}
                    onChange={handleInputChange}
                    placeholder="+57 300 123 4567"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Dirección *</label>
                  <Input
                    name="direccion"
                    value={datosCheckout.direccion}
                    onChange={handleInputChange}
                    placeholder="Calle 123 #45-67, Apto 101"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Ciudad *</label>
                  <Input
                    name="ciudad"
                    value={datosCheckout.ciudad}
                    onChange={handleInputChange}
                    placeholder="Bogotá"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Departamento *</label>
                  <Input
                    name="departamento"
                    value={datosCheckout.departamento}
                    onChange={handleInputChange}
                    placeholder="Cundinamarca"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Código postal</label>
                  <Input
                    name="codigoPostal"
                    value={datosCheckout.codigoPostal}
                    onChange={handleInputChange}
                    placeholder="110111"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Notas adicionales</label>
                  <textarea
                    name="notas"
                    value={datosCheckout.notas}
                    onChange={handleInputChange}
                    placeholder="Instrucciones especiales para la entrega..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00a19a]"
                    rows={3}
                  />
                </div>
              </div>
            </Card>

            {/* Información de seguridad */}
            <Card className="p-6 mt-6">
              <div className="flex items-center gap-4">
                <Shield className="w-8 h-8 text-green-500" />
                <div>
                  <h3 className="font-semibold">Pago seguro</h3>
                  <p className="text-sm text-gray-600">Protegido por Wompi. Tus datos están seguros.</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Resumen del pedido */}
          <div>
            <Card className="p-6 sticky top-8">
              <h2 className="text-xl font-semibold mb-4">Resumen del pedido</h2>
              
              {/* Productos */}
              <div className="space-y-3 mb-6">
                {carrito.map((producto) => (
                  <div key={producto.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-xs">📦</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{producto.nombre}</div>
                      <div className="text-xs text-gray-500">Cantidad: {producto.cantidad}</div>
                    </div>
                    <div className="font-medium">${(producto.precio * producto.cantidad).toFixed(0)}</div>
                  </div>
                ))}
              </div>

              {/* Totales */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    <Truck className="w-4 h-4" />
                    Envío:
                  </span>
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
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">¡Felicidades! Tu pedido califica para envío gratis</p>
                </div>
              )}

              <Button 
                onClick={procesarPago}
                disabled={loading || !validarFormulario()}
                className="w-full mt-6 bg-[#00a19a] hover:bg-[#007973]"
                size="lg"
              >
                {loading ? (
                  "Procesando..."
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pagar ${total.toFixed(0)}
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center mt-3">
                Al hacer clic en &ldquo;Pagar&rdquo;, aceptas nuestros términos y condiciones
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
