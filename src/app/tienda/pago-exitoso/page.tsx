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
      
      let finalStatus = "pendiente_pago";
      let paymentId = transactionId ?? "";
      let paymentMethod = "";

      // 1. Si tenemos transactionId, consultar directamente a Wompi (vía nuestro proxy)
      if (transactionId) {
        console.log("💳 Consultando Wompi directamente para transacción:", transactionId);
        try {
          const wompiRes = await fetch(`/api/pago-wompi/verificar?id=${transactionId}`);
          if (wompiRes.ok) {
            interface WompiVerificationData {
              status?: string;
              id?: string;
              payment_method_type?: string;
            }
            const wompiData = (await wompiRes.json()) as WompiVerificationData;
            console.log("📡 Respuesta de Wompi API:", wompiData);
            
            if (wompiData.status === "APPROVED") {
              finalStatus = "pagado";
              paymentId = wompiData.id ?? paymentId;
              paymentMethod = wompiData.payment_method_type ?? "";
              
              // 2. FORZAR actualización en nuestra BD por si el webhook se retrasa
              console.log("🚀 Pago aprobado en Wompi. Asegurando actualización en BD...");
              await fetch("/api/pedidos", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  pedidoId: pedido,
                  estado: "pagado",
                  payment_id: paymentId,
                  payment_method: paymentMethod
                })
              });
            } else if (wompiData.status === "DECLINED") {
              finalStatus = "pago_rechazado";
            } else if (wompiData.status === "VOIDED") {
              finalStatus = "pago_cancelado";
            }
          }
        } catch (wompiErr) {
          console.warn("⚠️ Error consultando Wompi API directo:", wompiErr);
        }
      }

      // 3. Consultar el estado final del pedido en nuestra base de datos
      const response = await fetch(`/api/pedidos?id=${pedido}`);
      if (!response.ok) throw new Error("Error al consultar pedido");
      
      const data = await response.json() as { pedido?: { estado: string; payment_id?: string } };
      const pedidoData = data.pedido;
      
      if (!pedidoData) throw new Error("Pedido no encontrado");
      
      const displayStatus = (pedidoData.estado === "pendiente_pago" && finalStatus === "pagado") 
        ? "pagado" 
        : pedidoData.estado;

      let mensaje = "";
      switch (displayStatus) {
        case "pagado":
          mensaje = "Tu pago ha sido confirmado exitosamente";
          break;
        case "pendiente_pago":
          mensaje = "Estamos procesando tu pago. Por favor espera un momento...";
          break;
        case "pago_rechazado":
          mensaje = "Tu pago fue rechazado. Revisa con tu entidad bancaria.";
          break;
        case "pago_cancelado":
          mensaje = "El pago fue cancelado";
          break;
        default:
          mensaje = "Verificando el estado de tu pago...";
      }
      
      setEstadoPago({
        estado: displayStatus,
        payment_id: pedidoData.payment_id ?? paymentId,
        mensaje
      });
      
      // Polling si sigue pendiente
      if (displayStatus === "pendiente_pago") {
        setTimeout(() => { void verificarEstadoPago(pedido, transactionId); }, 5000);
      } else {
         setCargando(false);
      }

      if (displayStatus === "pago_rechazado" || displayStatus === "pago_cancelado") {
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
        mensaje: "Error de conexión. Tu pedido se actualizará en unos minutos."
      });
      setCargando(false);
    }
  };

  useEffect(() => {
    const pedido = searchParams.get("pedido");
    const transactionId = searchParams.get("id");
    
    if (pedido) {
      setPedidoId(pedido);
      void verificarEstadoPago(pedido, transactionId);
      
      if (typeof window !== "undefined") {
        localStorage.removeItem("carrito");
        localStorage.removeItem("pedido_pendiente");
      }
    } else {
      setCargando(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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
        icon: <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />,
        bgColor: "bg-green-50 border border-green-200",
        title: "¡Pago exitoso!",
        description: (
          <div className="text-center">
            <p className="text-lg text-green-700 mb-4">
              Tu pedido ha sido recibido y está en proceso.
            </p>
            <ul className="text-sm text-green-700 mb-4 space-y-1 text-left max-w-md mx-auto">
              <li>• Recibirás un correo con los detalles y número de seguimiento.</li>
              <li>• Nuestro equipo comenzará a preparar tu pedido en breve.</li>
              <li>• Puedes consultar el estado en <span className="font-semibold">Mis pedidos</span>.</li>
            </ul>
            <Button asChild className="bg-[#00a19a] hover:bg-[#007973] text-white mt-2">
              <Link href="/envios">Ver mis pedidos</Link>
            </Button>
          </div>
        )
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
        <div className="text-center mb-6 sm:mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 ${estadoUI.bgColor} rounded-full mb-4 sm:mb-6`}>
            {estadoUI.icon}
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
            {estadoUI.title}
          </h1>
          {typeof estadoUI.description === "string" ? (
            <p className="text-base sm:text-lg md:text-xl text-gray-600 px-2">
              {estadoUI.description}
            </p>
          ) : (
            estadoUI.description
          )}
        </div>

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
