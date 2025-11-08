"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { CheckCircle, Package, Truck, Mail, Home, Eye, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useToast } from "~/components/ui/use-toast";

interface EstadoPago {
  estado: string;
  payment_id?: string;
  mensaje: string;
}

export default function PagoExitosoPage() {
  const searchParams = useSearchParams();
  const [pedidoId, setPedidoId] = useState<string | null>(null);
  const [estadoPago, setEstadoPago] = useState<EstadoPago | null>(null);
  const [cargando, setCargando] = useState(true);
  const { toast } = useToast();

  const verificarEstadoPago = async (pedido: string, transactionId: string | null): Promise<void> => {
    try {
      console.log("🔍 Verificando estado del pago para pedido:", pedido);
      console.log("💳 Transaction ID de Wompi:", transactionId);
      
      // Esperar un momento para que el webhook procese
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Consultar el estado del pedido
      const response = await fetch(`/api/pedidos?id=${pedido}`);
      if (!response.ok) {
        throw new Error("Error al verificar el pago");
      }
      
      const data = await response.json() as { pedido?: { estado: string; payment_id?: string } };
      const pedidoData = data.pedido;
      
      if (!pedidoData) {
        throw new Error("Pedido no encontrado");
      }
      
      console.log("📦 Estado del pedido:", pedidoData);
      
      let mensaje = "";
      switch (pedidoData.estado) {
        case "pagado":
          mensaje = "Tu pago ha sido confirmado exitosamente";
          break;
        case "pendiente_pago":
          mensaje = "Tu pedido está pendiente de confirmación de pago";
          break;
        case "pago_rechazado":
          mensaje = "Tu pago fue rechazado. Intenta con otro método de pago";
          break;
        case "pago_cancelado":
          mensaje = "El pago fue cancelado";
          break;
        default:
          mensaje = "Verificando el estado de tu pago...";
      }
      
      setEstadoPago({
        estado: pedidoData.estado,
        payment_id: pedidoData.payment_id,
        mensaje
      });
      
      if (pedidoData.estado === "pago_rechazado" || pedidoData.estado === "pago_cancelado") {
        toast({
          title: "Pago no completado",
          description: mensaje,
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error("Error verificando estado del pago:", error);
      setEstadoPago({
        estado: "error",
        mensaje: "No pudimos verificar el estado del pago. Revisa tu email o contacta con soporte."
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    const pedido = searchParams.get("pedido");
    const transactionId = searchParams.get("id"); // Wompi devuelve el transaction ID
    
    if (pedido) {
      setPedidoId(pedido);
      void verificarEstadoPago(pedido, transactionId);
      
      // Limpiar carrito si el pago fue exitoso
      if (typeof window !== "undefined") {
        localStorage.removeItem("carrito");
        localStorage.removeItem("pedido_pendiente");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Determinar el color y mensaje según el estado
  const getEstadoUI = () => {
    if (cargando) {
      return {
        icon: <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />,
        bgColor: "bg-blue-100",
        title: "Verificando pago...",
        description: "Por favor espera mientras verificamos tu pago"
      };
    }

    if (!estadoPago || estadoPago.estado === "pendiente_pago") {
      return {
        icon: <Loader2 className="w-12 h-12 text-yellow-600 animate-spin" />,
        bgColor: "bg-yellow-100",
        title: "Pago pendiente",
        description: estadoPago?.mensaje ?? "Verificando el estado de tu pago..."
      };
    }

    if (estadoPago.estado === "pagado") {
      return {
        icon: <CheckCircle className="w-12 h-12 text-green-600" />,
        bgColor: "bg-green-100",
        title: "¡Pago exitoso!",
        description: estadoPago.mensaje
      };
    }

    if (estadoPago.estado === "pago_rechazado" || estadoPago.estado === "pago_cancelado") {
      return {
        icon: <XCircle className="w-12 h-12 text-red-600" />,
        bgColor: "bg-red-100",
        title: "Pago no completado",
        description: estadoPago.mensaje
      };
    }

    return {
      icon: <XCircle className="w-12 h-12 text-gray-600" />,
      bgColor: "bg-gray-100",
      title: "Error",
      description: estadoPago.mensaje
    };
  };

  const estadoUI = getEstadoUI();

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8 md:py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header de éxito */}
        <div className="text-center mb-6 sm:mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 ${estadoUI.bgColor} rounded-full mb-4 sm:mb-6`}>
            {estadoUI.icon}
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
            {estadoUI.title}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 px-2">
            {estadoUI.description}
          </p>
        </div>

        {/* Información del pedido */}
        <Card className="p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 overflow-hidden">
          <div className="text-center mb-4 sm:mb-6">
            {pedidoId && (
              <div>
                <h2 className="text-sm sm:text-base md:text-lg font-semibold mb-2">Número de pedido</h2>
                <div className="inline-block">
                  <span className="text-lg sm:text-xl md:text-2xl font-mono bg-gray-100 py-2 px-4 sm:py-3 sm:px-6 rounded-lg border">
                    #{pedidoId}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Pasos del proceso */}
          <div className="grid grid-cols-1 xs:grid-cols-3 gap-4 sm:gap-6 text-center mb-6 sm:mb-8">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2 sm:mb-3">
                <Mail className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-blue-600" />
              </div>
              <h3 className="text-sm sm:text-base font-semibold mb-1 sm:mb-2">Confirmación enviada</h3>
              <p className="text-xs sm:text-sm text-gray-600 px-2">
                Revisa tu email para los detalles del pedido
              </p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-2 sm:mb-3">
                <Package className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-yellow-600" />
              </div>
              <h3 className="text-sm sm:text-base font-semibold mb-1 sm:mb-2">Preparando pedido</h3>
              <p className="text-xs sm:text-sm text-gray-600 px-2">
                Comenzaremos a preparar tu pedido pronto
              </p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center mb-2 sm:mb-3">
                <Truck className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-green-600" />
              </div>
              <h3 className="text-sm sm:text-base font-semibold mb-1 sm:mb-2">Envío pronto</h3>
              <p className="text-xs sm:text-sm text-gray-600 px-2">
                Te notificaremos cuando esté en camino
              </p>
            </div>
          </div>

          {/* Información adicional */}
          <div className="border-t pt-4 sm:pt-6">
            <h3 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4 text-center">¿Qué sigue?</h3>
            <div className="space-y-2 sm:space-y-3 max-w-md mx-auto">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-2 h-2 bg-[#00a19a] rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                <span className="text-xs sm:text-sm">Recibirás un email de confirmación con los detalles</span>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-2 h-2 bg-[#00a19a] rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                <span className="text-xs sm:text-sm">Prepararemos tu pedido en 1-2 días hábiles</span>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-2 h-2 bg-[#00a19a] rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                <span className="text-xs sm:text-sm">Te enviaremos el número de seguimiento</span>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-2 h-2 bg-[#00a19a] rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                <span className="text-xs sm:text-sm">El envío toma de 3-5 días hábiles</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Button size="lg" asChild className="bg-[#00a19a] hover:bg-[#007973] text-sm sm:text-base">
            <Link href="/tienda/productos">
              <Package className="w-4 h-4 mr-2" />
              <span className="hidden xs:inline">Seguir comprando</span>
              <span className="xs:hidden">Comprar más</span>
            </Link>
          </Button>
          
          <Button variant="outline" size="lg" asChild className="text-sm sm:text-base">
            <Link href="/envios">
              <Eye className="w-4 h-4 mr-2" />
              <span className="hidden xs:inline">Ver mis pedidos</span>
              <span className="xs:hidden">Pedidos</span>
            </Link>
          </Button>
          
          <Button variant="outline" size="lg" asChild className="text-sm sm:text-base">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              <span className="hidden xs:inline">Ir al inicio</span>
              <span className="xs:hidden">Inicio</span>
            </Link>
          </Button>
        </div>

        {/* Nota de agradecimiento */}
        <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-r from-[#00a19a] to-[#007973] rounded-lg text-white text-center">
          <h3 className="text-base sm:text-lg font-bold mb-2">¡Gracias por tu compra!</h3>
          <p className="text-xs sm:text-sm opacity-90">
            Si tienes alguna pregunta sobre tu pedido, no dudes en contactarnos. 
            Estamos aquí para ayudarte.
          </p>
        </div>
      </div>
    </div>
  );
}
