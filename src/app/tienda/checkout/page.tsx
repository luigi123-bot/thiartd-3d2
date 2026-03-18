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
        
        // Pre-llenar formulario con datos básicos
        setDatosCheckout(prev => ({
          ...prev,
          nombre: user.nombre ?? "",
          email: user.email ?? ""
        }));

        interface UsuarioContactoDB {
          telefono: string | null;
          direccion: string | null;
          ciudad: string | null;
          departamento: string | null;
          codigo_postal: string | null;
        }

        // Buscar datos adicionales en la tabla usuarios para pre-llenar
        const { data: usuarioDb } = await supabase
          .from("usuarios")
          .select("telefono, direccion, ciudad, departamento, codigo_postal")
          .eq("auth_id", data.user.id)
          .single<UsuarioContactoDB>();

        if (usuarioDb) {
          setDatosCheckout(prev => ({
            ...prev,
            telefono: usuarioDb.telefono ?? "",
            direccion: usuarioDb.direccion ?? "",
            ciudad: usuarioDb.ciudad ?? "",
            departamento: usuarioDb.departamento ?? "",
            codigoPostal: usuarioDb.codigo_postal ?? ""
          }));
        }
      }
    })();
  }, []);

  // Calcular totales
  const subtotal = carrito.reduce((acc, producto) => acc + (producto.precio * producto.cantidad), 0);
  const envio = 0; // Envío gratis para testing en producción
  const total = subtotal + envio;

  // Detectar entorno de desarrollo
  const isDevelopment = typeof window !== 'undefined' && 
    (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost');

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

    const hasWompiKeys = !!process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;
    const isDevelopment = (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') && !hasWompiKeys;

    setLoading(true);

    try {
      // 1. Crear el pedido en la base de datos PRIMERO (siempre)
      const pedidoData = {
        cliente_id: usuario?.id ?? "guest",
        productos: carrito.map(prod => ({
          nombre: prod.nombre,
          cantidad: prod.cantidad,
          precio_unitario: prod.precio,
          precio: prod.precio,
          categoria: prod.categoria,
          imagen: prod.imagen,
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
        const pedidoError = await pedidoResponse.json() as { error: string; hint?: string };
        throw new Error(`Error al crear el pedido: ${pedidoError.error}${pedidoError.hint ? ` (${pedidoError.hint})` : ""}`);
      }

      const pedidoResult = await pedidoResponse.json() as { pedido: { id: number } };
      const pedidoId = pedidoResult.pedido.id;
      console.log("✅ Pedido creado con ID:", pedidoId);

      // Limpiar carrito una vez que el pedido está guardado
      localStorage.removeItem("carrito");

      // 2a. MODO DESARROLLO: aprobar automáticamente sin Wompi
      if (isDevelopment) {
        console.log("🔧 MODO DESARROLLO: Aprobando pedido automáticamente");
        await fetch("/api/pedidos", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pedidoId,
            estado: "pagado",
            payment_id: `DEV-AUTO-${Date.now()}`,
            payment_method: "DEVELOPMENT_MODE",
          }),
        });
        toast({ title: "✅ Pedido aprobado (Desarrollo)", description: "Tu pedido fue aprobado automáticamente" });
        setTimeout(() => { window.location.href = `/tienda/pago-exitoso?pedido=${pedidoId}&dev=true`; }, 1000);
        return;
      }

      // 2b. PRODUCCIÓN: procesar pago con Wompi
      const reference = `PEDIDO-${pedidoId}-${Date.now()}`;
      const pagoData = {
        amount: total,
        customer_email: datosCheckout.email,
        customer_name: datosCheckout.nombre,
        customer_phone: datosCheckout.telefono,
        reference,
        redirect_url: `${window.location.origin}/tienda/pago-exitoso?pedido=${pedidoId}`
      };

      // Guardar la referencia en el pedido para poder matchearla en el webhook
      await fetch("/api/pedidos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoId, payment_id: reference }),
      });

      const pagoResponse = await fetch("/api/pago-wompi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pagoData)
      });

      const pagoResult = await pagoResponse.json() as { permalink?: string; error?: string; wompi_error?: unknown };

      if (!pagoResponse.ok || !pagoResult.permalink) {
        // El pedido ya está guardado, solo falla el pago → aviso al usuario
        console.error("Error Wompi:", pagoResult);
        toast({
          title: "Pedido guardado, error en pago",
          description: `Tu pedido #${pedidoId} fue guardado pero hubo un problema al redirigir a Wompi: ${pagoResult.error ?? "Error desconocido"}. Contáctanos para completar tu pago.`,
          variant: "destructive"
        });
        // Redirigir a la página de pago exitoso indicando que está pendiente
        setTimeout(() => { window.location.href = `/tienda/pago-exitoso?pedido=${pedidoId}&pendiente=true`; }, 2000);
        return;
      }

      // 3. Redirigir a Wompi
      window.location.href = pagoResult.permalink;

    } catch (error) {
      console.error("Error en procesarPago:", error);
      toast({
        title: "Error al procesar",
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
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-4 sm:mb-6 text-sm">
          <Link href="/tienda/carrito" className="flex items-center gap-2 text-[#00a19a] hover:underline">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden xs:inline">Volver al carrito</span>
            <span className="xs:hidden">Volver</span>
          </Link>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 md:mb-8">Finalizar compra</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {/* Formulario de checkout */}
          <div className="lg:col-span-2">
            <Card className="p-4 sm:p-6 overflow-hidden">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Información de envío</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">Nombre completo *</label>
                  <Input
                    name="nombre"
                    value={datosCheckout.nombre}
                    onChange={handleInputChange}
                    placeholder="Tu nombre completo"
                    className="text-sm sm:text-base"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">Email *</label>
                  <Input
                    name="email"
                    type="email"
                    value={datosCheckout.email}
                    onChange={handleInputChange}
                    placeholder="tu@email.com"
                    className="text-sm sm:text-base"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">Teléfono *</label>
                  <Input
                    name="telefono"
                    value={datosCheckout.telefono}
                    onChange={handleInputChange}
                    placeholder="+57 300 123 4567"
                    className="text-sm sm:text-base"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium mb-1">Dirección *</label>
                  <Input
                    name="direccion"
                    value={datosCheckout.direccion}
                    onChange={handleInputChange}
                    placeholder="Calle 123 #45-67, Apto 101"
                    className="text-sm sm:text-base"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">Ciudad *</label>
                  <Input
                    name="ciudad"
                    value={datosCheckout.ciudad}
                    onChange={handleInputChange}
                    placeholder="Bogotá"
                    className="text-sm sm:text-base"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">Departamento *</label>
                  <Input
                    name="departamento"
                    value={datosCheckout.departamento}
                    onChange={handleInputChange}
                    placeholder="Cundinamarca"
                    className="text-sm sm:text-base"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">Código postal</label>
                  <Input
                    name="codigoPostal"
                    value={datosCheckout.codigoPostal}
                    onChange={handleInputChange}
                    placeholder="110111"
                    className="text-sm sm:text-base"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium mb-1">Notas adicionales</label>
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
            <Card className="p-6 mt-6 overflow-hidden">
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
            <Card className="p-4 sm:p-6 lg:sticky lg:top-8 overflow-hidden">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Resumen del pedido</h2>
              
              {/* Productos */}
              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                {carrito.map((producto) => (
                  <div key={producto.id} className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xs">📦</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs sm:text-sm truncate">{producto.nombre}</div>
                      <div className="text-xs text-gray-500">Cantidad: {producto.cantidad}</div>
                    </div>
                    <div className="font-medium text-sm sm:text-base">${(producto.precio * producto.cantidad).toFixed(0)}</div>
                  </div>
                ))}
              </div>

              {/* Totales */}
              <div className="border-t pt-3 sm:pt-4 space-y-1.5 sm:space-y-2">
                <div className="flex justify-between text-sm sm:text-base">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3 h-3 sm:w-4 sm:h-4" />
                    Envío:
                  </span>
                  <span className="text-gray-600 text-sm">A convenir</span>
                </div>
                <hr />
                <div className="flex justify-between font-bold text-base sm:text-lg">
                  <span>Total:</span>
                  <span className="text-[#00a19a]">${total.toFixed(0)}</span>
                </div>
              </div>

              {/* Se eliminó la alerta de envío gratis */}

              {!isDevelopment && total < 1500 && (
                <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs sm:text-sm text-yellow-700 font-semibold">⚠️ Monto mínimo: $1,500</p>
                  <p className="text-xs text-yellow-600 mt-1">
                    Faltan ${(1500 - total).toFixed(0)} para alcanzar el monto mínimo de pago
                  </p>
                </div>
              )}

              {isDevelopment && (
                <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs sm:text-sm text-blue-700 font-semibold">🔧 Modo Desarrollo</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Los pedidos se aprobarán automáticamente sin pasar por Wompi
                  </p>
                </div>
              )}

              <Button 
                onClick={procesarPago}
                disabled={loading || !validarFormulario() || (!isDevelopment && total < 1500)}
                className="w-full mt-4 sm:mt-6 bg-[#00a19a] hover:bg-[#007973] text-sm sm:text-base"
                size="lg"
              >
                {loading ? (
                  "Procesando..."
                ) : (!isDevelopment && total < 1500) ? (
                  `Monto mínimo: $1,500`
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    <span className="hidden xs:inline">{isDevelopment ? `✓ Aprobar pedido $${total.toFixed(0)}` : `Pagar $${total.toFixed(0)}`}</span>
                    <span className="xs:hidden">{isDevelopment ? `✓ Aprobar` : `Pagar`} ${total.toFixed(0)}</span>
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center mt-2 sm:mt-3">
                Al hacer clic en &ldquo;Pagar&rdquo;, aceptas nuestros términos y condiciones
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
