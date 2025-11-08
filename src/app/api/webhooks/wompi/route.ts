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
    
    console.log("\n🔔 Webhook de Wompi recibido:");
    console.log("- Evento:", webhookData.event);
    console.log("- Transaction ID:", webhookData.data.transaction.id);
    console.log("- Status:", webhookData.data.transaction.status);
    console.log("- Reference:", webhookData.data.transaction.reference);
    console.log("- Amount:", webhookData.data.transaction.amount_in_cents / 100);

    // Verificar la firma del webhook (obligatorio en producción)
    if (webhookData.signature && process.env.WOMPI_EVENTS_SECRET) {
      const eventsSecret = process.env.WOMPI_EVENTS_SECRET;
      
      // Construir la cadena de verificación según Wompi
      const { properties } = webhookData.signature;
      const transaction = webhookData.data.transaction;
      
      let signatureString = "";
      for (const prop of properties) {
        const keys = prop.split(".");
        let value: unknown = transaction;
        for (const key of keys) {
          value = (value as Record<string, unknown>)?.[key];
        }
        // Convertir el valor a string de manera segura
        let stringValue = "";
        if (value === null || value === undefined) {
          stringValue = "";
        } else if (typeof value === 'string') {
          stringValue = value;
        } else if (typeof value === 'number' || typeof value === 'boolean') {
          stringValue = String(value);
        } else if (typeof value === 'object') {
          stringValue = JSON.stringify(value);
        } else {
          stringValue = "";
        }
        signatureString += stringValue;
      }
      
      const concatenated = `${signatureString}${webhookData.timestamp}${eventsSecret}`;
      const expectedSignature = crypto
        .createHash("sha256")
        .update(concatenated)
        .digest("hex");
      
      console.log("🔐 Verificando firma:");
      console.log("- Checksum recibido:", webhookData.signature.checksum);
      console.log("- Checksum calculado:", expectedSignature);
      
      if (expectedSignature !== webhookData.signature.checksum) {
        console.error("❌ Firma del webhook inválida");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
      
      console.log("✅ Firma verificada correctamente");
    } else {
      console.warn("⚠️ Webhook recibido sin firma - modo TEST/desarrollo");
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
): Promise<PedidoData | null> {
  console.log(`\n📦 Procesando actualización para pedido #${pedidoId}`);
  console.log(`💳 Transaction ID: ${transaction.id}`);
  console.log(`📊 Status: ${transaction.status}`);
  console.log(`💰 Amount: $${transaction.amount_in_cents / 100}`);

  let nuevoEstado = "pendiente_pago";
  const payment_status = transaction.status;

  switch (transaction.status) {
    case "APPROVED":
      nuevoEstado = "pagado";
      console.log("✅ Pago APROBADO");
      break;
    case "DECLINED":
      nuevoEstado = "pago_rechazado";
      console.log("❌ Pago RECHAZADO");
      break;
    case "VOIDED":
      nuevoEstado = "pago_cancelado";
      console.log("🚫 Pago CANCELADO");
      break;
    case "ERROR":
      nuevoEstado = "error_pago";
      console.log("⚠️ ERROR en el pago");
      break;
    default:
      nuevoEstado = "pendiente_pago";
      console.log("⏳ Pago PENDIENTE");
  }

  // Actualizar el estado del pedido en la base de datos con toda la información
  const updateData = {
    estado: nuevoEstado,
    payment_id: transaction.id,
    payment_method: transaction.payment_method_type,
    payment_status: payment_status,
    updated_at: new Date().toISOString()
  };

  console.log("📝 Actualizando pedido con:", updateData);

  const { data: pedidoActualizado, error } = await supabase
    .from("pedidos")
    .update(updateData)
    .eq("id", pedidoId)
    .select()
    .single<PedidoData>();

  if (error) {
    console.error("❌ Error actualizando pedido:", error);
    throw error;
  }

  console.log("✅ Pedido actualizado exitosamente:");
  console.log(`   - ID: ${pedidoId}`);
  console.log(`   - Estado: ${nuevoEstado}`);
  console.log(`   - Payment ID: ${transaction.id}`);
  console.log(`   - Método: ${transaction.payment_method_type}`);
  console.log(`   - Cliente: ${transaction.customer_email}`);

  // Si el pago fue aprobado, enviar email de confirmación (opcional)
  if (transaction.status === "APPROVED") {
    await enviarEmailConfirmacion(pedidoId, transaction);
  }

  return pedidoActualizado;
}

async function enviarEmailConfirmacion(
  pedidoId: number,
  transaction: WompiWebhookData["data"]["transaction"]
) {
  // Aquí puedes implementar el envío de email
  // Por ejemplo, usando un servicio como SendGrid, Resend, etc.
  console.log(`📧 Enviando email de confirmación para pedido ${pedidoId}`);
  
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
