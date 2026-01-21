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
    permalink?: string;
    name: string;
    description: string;
    amount_in_cents: number;
    currency: string;
  };
  // Wompi a veces devuelve los datos directamente sin wrapper
  id?: string;
  permalink?: string;
  name?: string;
  description?: string;
  amount_in_cents?: number;
  currency?: string;
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
    const wompiPrivateKey = process.env.WOMPI_PRIVATE_KEY;

    if (!wompiPublicKey || !wompiPrivateKey) {
      console.error("Variables de Wompi no configuradas");
      return NextResponse.json(
        { error: "Configuración de Wompi incompleta" },
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

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customer_email)) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      );
    }

    // Convertir a centavos (Wompi maneja centavos)
    const amountInCents = Math.round(amount * 100);

    // Wompi requiere un mínimo de $1,500 COP (150,000 centavos) en modo TEST
    const WOMPI_MIN_AMOUNT = 150000; // 150,000 centavos = $1,500 COP
    
    if (amountInCents < WOMPI_MIN_AMOUNT) {
      return NextResponse.json(
        { 
          error: `El monto mínimo para procesar pagos con Wompi es de $1,500 COP. Monto actual: $${amount.toFixed(0)} COP`,
          minimum_required: WOMPI_MIN_AMOUNT / 100,
          current_amount: amount
        },
        { status: 400 }
      );
    }

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
      usingPrivateKey: wompiPrivateKey.substring(0, 15) + "...",
    });

    // Determinar el ambiente (test o producción) basado en la clave privada
    const isTestMode = wompiPrivateKey.startsWith('prv_test_');
    const wompiApiUrl = isTestMode 
      ? "https://sandbox.wompi.co/v1/payment_links"  // SANDBOX para pruebas
      : "https://production.wompi.co/v1/payment_links"; // PRODUCCIÓN
    
    console.log(`🔧 Usando modo: ${isTestMode ? 'TEST (Sandbox)' : 'PRODUCCIÓN'}`);

    const response = await fetch(wompiApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${wompiPrivateKey}`, // USAR CLAVE PRIVADA, NO PÚBLICA
      },
      body: JSON.stringify(wompiPayload),
    });

    const data = await response.json() as WompiPaymentLinkResponse;

    console.log("Respuesta de Wompi:", {
      status: response.status,
      data,
      fullResponse: JSON.stringify(data, null, 2)
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

    // Wompi puede devolver los datos en data.data o directamente en data
    const paymentData = data.data ?? data;
    
    console.log("📋 Datos extraídos de Wompi:");
    console.log("  - ID:", paymentData.id);
    console.log("  - Permalink desde API:", paymentData.permalink);
    console.log("  - Name:", paymentData.name);

    if (!paymentData.id) {
      console.error("❌ Wompi no devolvió un ID de payment link!");
      console.error("Estructura recibida:", JSON.stringify(data, null, 2));
      return NextResponse.json(
        { error: "Wompi no devolvió un ID válido" },
        { status: 500 }
      );
    }

    // Usar el permalink de Wompi si existe, si no, construirlo manualmente
    let permalink: string;
    if (paymentData.permalink) {
      permalink = paymentData.permalink;
      console.log("✅ Usando permalink de Wompi:", permalink);
    } else {
      // Construir el permalink manualmente como fallback
      const baseUrl = isTestMode 
        ? "https://checkout.wompi.co/l"
        : "https://checkout.wompi.co/l";
      permalink = `${baseUrl}/${paymentData.id}`;
      console.log("� Permalink construido manualmente:", permalink);
    }

    const responsePayload = { 
      payment_id: paymentData.id,
      permalink: permalink,
      name: paymentData.name ?? "",
      description: paymentData.description ?? "",
      amount: paymentData.amount_in_cents ? paymentData.amount_in_cents / 100 : amount,
    };

    console.log("✅ Retornando al cliente:", responsePayload);

    return NextResponse.json(responsePayload);

  } catch (error: unknown) {
    console.error("Error en pago-wompi:", error);
    const errorMessage = error instanceof Error ? error.message : "Error inesperado";
    return NextResponse.json(
      { error: `Error al procesar pago: ${errorMessage}` },
      { status: 500 }
    );
  }
}
