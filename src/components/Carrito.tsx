"use client";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { crearPagoWompi } from "~/utils/wompi";

interface WompiPagoResponse {
  data?: {
    payment_link?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export default function Carrito() {
  const [loading, setLoading] = useState(false);
  const total = 50000; // Monto en centavos
  const email = "cliente@correo.com";
  const referencia = "pedido123";

  const handleComprar = async () => {
    setLoading(true);
    try {
      const pago = await crearPagoWompi({
        amount_in_cents: total,
        currency: "COP",
        customer_email: email,
        reference: referencia,
      }) as WompiPagoResponse;
      // Redirigir a la URL de pago de Wompi
      if (pago.data && typeof pago.data.payment_link === "string") {
        window.location.href = pago.data.payment_link;
      } else {
        alert("No se pudo generar el pago. Intenta de nuevo.");
      }
    } catch {
      alert("Error al procesar el pago");
    }
    setLoading(false);
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Carrito de compra</h2>
      <div className="mb-4">Total a pagar: <span className="font-bold">$500.00</span></div>
      <Button onClick={handleComprar} disabled={loading} className="bg-green-600 text-white">
        {loading ? "Procesando..." : "Comprar"}
      </Button>
    </div>
  );
}
