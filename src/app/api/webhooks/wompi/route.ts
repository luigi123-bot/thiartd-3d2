import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface WompiWebhookData {
  event: string;
  data: {
    transaction: {
      id: string;
      amount_in_cents: number;
      reference: string;
      customer_email: string;
      currency: string;
      payment_method_type: string;
      redirect_url: string;
      status: string;
      shipping_address?: string;
      payment_link_id?: string;
      payment_source_id?: string;
    };
  };
  sent_at: string;
  timestamp: number;
  signature?: {
    properties: string[];
    checksum: string;
  };
}

interface PedidoData {
  id: number;
  cliente_id: string;
  productos: string;
  total: number;
  estado: string;
  direccion?: string;
  datos_contacto?: string;
  payment_id?: string;
  payment_method?: string;
  created_at: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const webhookData = JSON.parse(body) as WompiWebhookData;
    
    console.log("Webhook de Wompi recibido (PRODUCCIÓN):", webhookData);

    // Verificar la firma del webhook (obligatorio en producción)
    if (webhookData.signature && process.env.WOMPI_EVENTS_SECRET) {
      const eventsSecret = process.env.WOMPI_EVENTS_SECRET;
      const expectedSignature = crypto
        .createHash("sha256")
        .update(`${body}${eventsSecret}`)
        .digest("hex");
      
      if (expectedSignature !== webhookData.signature.checksum) {
        console.error("Firma del webhook inválida");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } else {
      console.warn("Webhook recibido sin firma - esto puede ser inseguro en producción");
    }

    const { event, data } = webhookData;
    const transaction = data.transaction;

    // Extraer el ID del pedido de la referencia usando RegExp.exec
    const regex = /PEDIDO-(\d+)-/;
    const referenceMatch = regex.exec(transaction.reference);
    if (!referenceMatch?.[1]) {
      console.error("No se pudo extraer el ID del pedido de la referencia:", transaction.reference);
      return NextResponse.json({ error: "Invalid reference format" }, { status: 400 });
    }

    const pedidoId = parseInt(referenceMatch[1]);

    // Procesar diferentes eventos
    switch (event) {
      case "transaction.updated":
        await procesarTransaccionActualizada(transaction, pedidoId);
        break;
      
      default:
        console.log(`Evento no manejado: ${event}`);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error procesando webhook de Wompi:", error);
    return NextResponse.json(
      { error: "Error processing webhook" },
      { status: 500 }
    );
  }
}

async function procesarTransaccionActualizada(
  transaction: WompiWebhookData["data"]["transaction"],
  pedidoId: number
) {
  let nuevoEstado = "pendiente_pago";

  switch (transaction.status) {
    case "APPROVED":
      nuevoEstado = "pagado";
      break;
    case "DECLINED":
      nuevoEstado = "pago_rechazado";
      break;
    case "VOIDED":
      nuevoEstado = "pago_cancelado";
      break;
    case "ERROR":
      nuevoEstado = "error_pago";
      break;
    default:
      nuevoEstado = "pendiente_pago";
  }

  // Actualizar el estado del pedido en la base de datos
  const { error } = await supabase
    .from("pedidos")
    .update({ 
      estado: nuevoEstado,
      payment_id: transaction.id,
      payment_method: transaction.payment_method_type,
    })
    .eq("id", pedidoId);

  if (error) {
    console.error("Error actualizando pedido:", error);
    throw error;
  }

  console.log(`Pedido ${pedidoId} actualizado a estado: ${nuevoEstado}`);

  // Si el pago fue aprobado, enviar email de confirmación (opcional)
  if (transaction.status === "APPROVED") {
    await enviarEmailConfirmacion(pedidoId, transaction);
  }
}

async function enviarEmailConfirmacion(
  pedidoId: number,
  transaction: WompiWebhookData["data"]["transaction"]
) {
  // Aquí puedes implementar el envío de email
  // Por ejemplo, usando un servicio como SendGrid, Resend, etc.
  console.log(`Enviando email de confirmación para pedido ${pedidoId}`);
  
  // Obtener datos del pedido
  const { data: pedido } = await supabase
    .from("pedidos")
    .select("*")
    .eq("id", pedidoId)
    .single<PedidoData>();

  if (pedido) {
    // Aquí implementarías el envío del email
    console.log("Datos del pedido para email:", {
      pedidoId,
      email: transaction.customer_email,
      amount: transaction.amount_in_cents / 100,
      paymentId: transaction.id
    });
  }
}
