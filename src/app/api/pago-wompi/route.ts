import { NextResponse } from "next/server";


interface WompiPaymentLinkRequest {
  name: string;
  description: string;
  single_use: boolean;
  collect_shipping: boolean;
  currency: string;
  amount_in_cents: number;
  redirect_url?: string;
  customer_data?: {
    phone_number?: string;
    full_name?: string;
  };
}

interface WompiPaymentLinkResponse {
  data?: {
    id: string;
    permalink: string;
    name: string;
    description: string;
    amount_in_cents: number;
    currency: string;
  };
  error?: {
    type: string;
    reason: string;
    code?: string;
    message?: string;
    messages?: Record<string, string[]>;
  };
}

interface PaymentRequestBody {
  amount: number;
  customer_email: string;
  reference: string;
  redirect_url?: string;
  customer_name?: string;
  customer_phone?: string;
}

export async function POST(req: Request) {
  try {
    // Verificar que las variables de entorno estén configuradas
    const wompiPublicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;

    if (!wompiPublicKey) {
      console.error("NEXT_PUBLIC_WOMPI_PUBLIC_KEY no está configurada");
      return NextResponse.json(
        { error: "Configuración de Wompi incompleta - clave pública" },
        { status: 500 }
      );
    }

    const body = await req.json() as PaymentRequestBody;
    const { 
      amount, 
      customer_email, 
      reference, 
      redirect_url,
      customer_name,
      customer_phone
    } = body;

    // Validaciones
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "El monto debe ser mayor a 0" },
        { status: 400 }
      );
    }

    if (!customer_email || !reference) {
      return NextResponse.json(
        { error: "Email del cliente y referencia son obligatorios" },
        { status: 400 }
      );
    }

    // Convertir a centavos (Wompi maneja centavos)
    const amountInCents = Math.round(amount * 100);

    // Crear link de pago en lugar de transacción directa
    const wompiPayload: WompiPaymentLinkRequest = {
      name: `Pedido Thiart3D - ${reference}`,
      description: `Compra en Thiart3D - Ref: ${reference}`,
      single_use: true,
      collect_shipping: false,
      currency: "COP",
      amount_in_cents: amountInCents,
      redirect_url: redirect_url ?? `${req.headers.get('origin')}/tienda/pago-exitoso`,
    };

    // Agregar datos adicionales del cliente si están disponibles
    if (customer_name || customer_phone) {
      wompiPayload.customer_data = {
        full_name: customer_name,
        phone_number: customer_phone,
      };
    }

    console.log("Enviando a Wompi (Payment Link):", {
      payload: wompiPayload,
      publicKey: wompiPublicKey,
    });

    // Usar el endpoint de payment links de Wompi - PRODUCCIÓN
    const response = await fetch("https://production.wompi.co/v1/payment_links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${wompiPublicKey}`,
      },
      body: JSON.stringify(wompiPayload),
    });

    const data = await response.json() as WompiPaymentLinkResponse;

    console.log("Respuesta de Wompi:", {
      status: response.status,
      data
    });

    if (!response.ok || data.error) {
      const errorMessage = data.error?.reason ?? data.error?.message ?? "Error desconocido al procesar el pago";
      
      return NextResponse.json(
        { 
          error: errorMessage,
          wompi_error: data.error,
          type: data.error?.type
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ 
      payment_id: data.data?.id,
      permalink: data.data?.permalink,
      name: data.data?.name,
      description: data.data?.description,
      amount: data.data?.amount_in_cents ? data.data.amount_in_cents / 100 : amount,
    });

  } catch (error: unknown) {
    console.error("Error en pago-wompi:", error);
    const errorMessage = error instanceof Error ? error.message : "Error inesperado";
    return NextResponse.json(
      { error: `Error al procesar pago: ${errorMessage}` },
      { status: 500 }
    );
  }
}
