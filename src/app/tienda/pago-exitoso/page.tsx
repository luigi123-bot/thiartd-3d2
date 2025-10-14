"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { CheckCircle, Package, Truck, Mail, Home, Eye } from "lucide-react";
import Link from "next/link";

export default function PagoExitosoPage() {
  const searchParams = useSearchParams();
  const [pedidoId, setPedidoId] = useState<string | null>(null);

  useEffect(() => {
    const pedido = searchParams.get("pedido");
    if (pedido) {
      setPedidoId(pedido);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header de éxito */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ¡Pedido creado exitosamente!
          </h1>
          <p className="text-xl text-gray-600">
            Tu pedido ha sido registrado y está siendo procesado
          </p>
        </div>

        {/* Información del pedido */}
        <Card className="p-8 mb-8">
          <div className="text-center mb-6">
            {pedidoId && (
              <div>
                <h2 className="text-lg font-semibold mb-2">Número de pedido</h2>
                <div className="inline-block">
                  <span className="text-2xl font-mono bg-gray-100 py-3 px-6 rounded-lg border">
                    #{pedidoId}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Pasos del proceso */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center mb-8">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Confirmación enviada</h3>
              <p className="text-sm text-gray-600">
                Revisa tu email para los detalles del pedido
              </p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-3">
                <Package className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="font-semibold mb-2">Preparando pedido</h3>
              <p className="text-sm text-gray-600">
                Comenzaremos a preparar tu pedido pronto
              </p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <Truck className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Envío pronto</h3>
              <p className="text-sm text-gray-600">
                Te notificaremos cuando esté en camino
              </p>
            </div>
          </div>

          {/* Información adicional */}
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4 text-center">¿Qué sigue?</h3>
            <div className="space-y-3 max-w-md mx-auto">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#00a19a] rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm">Recibirás un email de confirmación con los detalles</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#00a19a] rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm">Prepararemos tu pedido en 1-2 días hábiles</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#00a19a] rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm">Te enviaremos el número de seguimiento</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#00a19a] rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm">El envío toma de 3-5 días hábiles</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild className="bg-[#00a19a] hover:bg-[#007973]">
            <Link href="/tienda/productos">
              <Package className="w-4 h-4 mr-2" />
              Seguir comprando
            </Link>
          </Button>
          
          <Button variant="outline" size="lg" asChild>
            <Link href="/envios">
              <Eye className="w-4 h-4 mr-2" />
              Ver mis pedidos
            </Link>
          </Button>
          
          <Button variant="outline" size="lg" asChild>
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Ir al inicio
            </Link>
          </Button>
        </div>

        {/* Nota de agradecimiento */}
        <div className="mt-8 p-6 bg-gradient-to-r from-[#00a19a] to-[#007973] rounded-lg text-white text-center">
          <h3 className="font-bold mb-2">¡Gracias por tu compra!</h3>
          <p className="text-sm opacity-90">
            Si tienes alguna pregunta sobre tu pedido, no dudes en contactarnos. 
            Estamos aquí para ayudarte.
          </p>
        </div>
      </div>
    </div>
  );
}
