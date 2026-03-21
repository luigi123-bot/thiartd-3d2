import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { enviarEmailConfirmacion } from "./emailConfirmacion";
import type { SentMessageInfo } from "nodemailer";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
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
  direccion_envio?: string;
  ciudad_envio?: string;
  departamento_envio?: string;
  datos_contacto?: string;
  payment_id?: string;
  payment_method?: string;
  created_at: string;
}

interface DatosContacto {
  nombre?: string;
  email?: string;
  telefono?: string;
}

interface ProductoParsed {
  nombre?: string;
  name?: string;
  cantidad?: number;
  quantity?: number;
  precio?: number;
  precio_unitario?: number;
  price?: number;
  imagen?: string;
  image?: string;
}

export async function POST(req: Request) {
  const startTime = Date.now();
  console.log("\n");
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║        🔔 WEBHOOK WOMPI RECIBIDO                 ║");
  console.log("╚══════════════════════════════════════════════════╝");

  try {
    const body = await req.text();
    const webhookData = JSON.parse(body) as WompiWebhookData;
    const { event, data, timestamp, signature } = webhookData;
    const transaction = data.transaction;

    console.log("📋 DATOS DEL EVENTO:");
    console.log("   Evento      :", event);
    console.log("   Timestamp   :", new Date(timestamp * 1000).toLocaleString("es-CO"));
    console.log("   TX ID       :", transaction.id);
    console.log("   Status      :", transaction.status);
    console.log("   Referencia  :", transaction.reference);
    console.log("   Email       :", transaction.customer_email);
    console.log("   Monto       :", `$${(transaction.amount_in_cents / 100).toLocaleString("es-CO")} ${transaction.currency}`);
    console.log("   Método pago :", transaction.payment_method_type);

    // ── VERIFICAR FIRMA ──────────────────────────────────────────
    if (signature && process.env.WOMPI_EVENTS_SECRET) {
      console.log("\n🔐 VERIFICANDO FIRMA DEL WEBHOOK...");
      const eventsSecret = process.env.WOMPI_EVENTS_SECRET;
      const { properties } = signature;

      let signatureString = "";
      for (const prop of properties) {
        const keys = prop.split(".");
        let value: unknown = transaction;
        for (const key of keys) {
          value = (value as Record<string, unknown>)?.[key];
        }
        let stringValue = "";
        if (value === null || value === undefined) stringValue = "";
        else if (typeof value === "string") stringValue = value;
        else if (typeof value === "number" || typeof value === "boolean") stringValue = String(value);
        else if (typeof value === "object") stringValue = JSON.stringify(value);
        signatureString += stringValue;
      }

      const concatenated = `${signatureString}${timestamp}${eventsSecret}`;
      const expectedSignature = crypto.createHash("sha256").update(concatenated).digest("hex");

      if (expectedSignature !== signature.checksum) {
        console.error("   ❌ FIRMA INVÁLIDA - Rechazando webhook");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
      console.log("   ✅ Firma verificada correctamente");
    } else {
      console.warn("   ⚠️  Sin firma - Modo TEST/desarrollo");
    }

    // ── EXTRAER ID DEL PEDIDO ────────────────────────────────────
    console.log("\n🔍 EXTRAYENDO ID DEL PEDIDO...");
    const regex = /PEDIDO-(\d+)-/;
    const referenceMatch = regex.exec(transaction.reference);

    if (!referenceMatch?.[1]) {
      console.error("   ❌ No se pudo extraer ID de referencia:", transaction.reference);
      return NextResponse.json({ error: "Invalid reference format" }, { status: 400 });
    }

    const pedidoId = parseInt(referenceMatch[1]);
    console.log("   Pedido ID:", pedidoId);

    // ── PROCESAR EVENTO ──────────────────────────────────────────
    switch (event) {
      case "transaction.updated":
        console.log("\n⚙️  PROCESANDO transaction.updated...");
        await procesarTransaccionActualizada(transaction, pedidoId);
        break;
      default:
        console.log(`\n⏭️  Evento ignorado: ${event}`);
    }

    const elapsed = Date.now() - startTime;
    console.log(`\n✅ Webhook procesado en ${elapsed}ms`);
    console.log("══════════════════════════════════════════════════\n");

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("\n❌ ERROR CRÍTICO en webhook:", error);
    console.log("══════════════════════════════════════════════════\n");
    return NextResponse.json({ error: "Error processing webhook" }, { status: 500 });
  }
}

// ── ACTUALIZAR TRANSACCIÓN ───────────────────────────────────────
async function procesarTransaccionActualizada(
  transaction: WompiWebhookData["data"]["transaction"],
  pedidoId: number
): Promise<void> {
  // Mapear status de Wompi a estado de la BD
  const estadoMap: Record<string, string> = {
    APPROVED: "pagado",
    DECLINED: "pago_rechazado",
    VOIDED: "pago_cancelado",
    ERROR: "error_pago",
  };

  const nuevoEstado = estadoMap[transaction.status] ?? "pendiente_pago";

  const estadoEmojis: Record<string, string> = {
    pagado: "✅",
    pago_rechazado: "❌",
    pago_cancelado: "🚫",
    error_pago: "⚠️",
    pendiente_pago: "⏳",
  };

  console.log(`\n${estadoEmojis[nuevoEstado] ?? "📌"} Estado del pago: ${transaction.status} → ${nuevoEstado}`);

  // Actualizar pedido en Supabase
  console.log("\n💾 ACTUALIZANDO PEDIDO EN SUPABASE...");
  const { data: pedidoActualizado, error } = await supabase
    .from("pedidos")
    .update({
      estado: nuevoEstado,
      payment_id: transaction.id,
      payment_method: transaction.payment_method_type,
      payment_status: transaction.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", pedidoId)
    .select()
    .single<PedidoData>();

  if (error) {
    console.error("   ❌ Error actualizando pedido en Supabase:", error.message);
    throw error;
  }

  console.log("   ✅ Pedido actualizado correctamente:");
  console.log("      ID      :", pedidoId);
  console.log("      Estado  :", nuevoEstado);
  console.log("      Pay ID  :", transaction.id);
  console.log("      Método  :", transaction.payment_method_type);

  // Solo enviar email si el pago fue APROBADO
  if (transaction.status === "APPROVED" && pedidoActualizado) {
    await enviarEmailConfirmacionCompleto(pedidoActualizado, transaction);
    
    // Limpiar el carrito en la base de datos ya que la compra fue exitosa
    if (pedidoActualizado.cliente_id) {
      console.log(`\n🛒 LIMPIANDO CARRITO PARA USUARIO: ${pedidoActualizado.cliente_id}`);
      const { error: clearError } = await supabase
        .from("carrito")
        .delete()
        .eq("usuario_id", pedidoActualizado.cliente_id);
      
      if (clearError) {
        console.warn("   ⚠️ No se pudo limpiar el carrito en BD:", clearError.message);
      } else {
        console.log("   ✅ Carrito eliminado de la base de datos.");
      }
    }
  } else {
    console.log(`\n📭 Sin email - Estado "${transaction.status}" no requiere confirmación`);
  }
}

// ── ENVIAR EMAIL ─────────────────────────────────────────────────
async function enviarEmailConfirmacionCompleto(
  pedido: PedidoData,
  transaction: WompiWebhookData["data"]["transaction"]
): Promise<void> {
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║        📧 ENVIANDO EMAIL DE CONFIRMACIÓN         ║");
  console.log("╚══════════════════════════════════════════════════╝");

  // Parsear datos de contacto
  let datosContacto: DatosContacto = {};
  console.log("\n👤 PARSEANDO DATOS DE CONTACTO...");
  console.log("   Raw datos_contacto:", pedido.datos_contacto);

  try {
    if (pedido.datos_contacto) {
      datosContacto = JSON.parse(pedido.datos_contacto) as DatosContacto;
    }
  } catch {
    console.warn("   ⚠️  No se pudo parsear datos_contacto");
  }

  console.log("   Nombre  :", datosContacto.nombre ?? "(no encontrado)");
  console.log("   Email   :", datosContacto.email ?? "(no encontrado)");
  console.log("   Teléfono:", datosContacto.telefono ?? "(no encontrado)");

  // Parsear productos
  let productosParsed: ProductoParsed[] = [];
  console.log("\n🛒 PARSEANDO PRODUCTOS...");
  console.log("   Raw productos:", pedido.productos?.substring(0, 120) + "...");

  try {
    if (pedido.productos) {
      productosParsed = JSON.parse(pedido.productos) as ProductoParsed[];
    }
  } catch {
    console.warn("   ⚠️  No se pudieron parsear productos");
  }

  const productosFormateados = productosParsed.map((p) => ({
    nombre: p.nombre ?? p.name ?? "Producto",
    cantidad: p.cantidad ?? p.quantity ?? 1,
    precio: p.precio ?? p.precio_unitario ?? p.price ?? 0,
    imagen: p.imagen ?? p.image,
  }));

  console.log("   Productos formateados:", JSON.stringify(productosFormateados, null, 4));

  const emailDestino = datosContacto.email ?? transaction.customer_email;
  const nombreCliente = datosContacto.nombre ?? "Cliente";

  if (!emailDestino) {
    console.warn("   ❌ Sin email de destino - abortando envío");
    return;
  }

  console.log("\n📨 CONFIGURACIÓN DEL EMAIL:");
  console.log("   Para       :", emailDestino);
  console.log("   Nombre     :", nombreCliente);
  console.log("   Pedido #   :", pedido.id);
  console.log("   Total      :", `$${pedido.total.toLocaleString("es-CO")} COP`);
  console.log("   Dirección  :", pedido.direccion_envio ?? "(no disponible)");
  console.log("   Ciudad     :", pedido.ciudad_envio ?? "(no disponible)");
  console.log("   TX Wompi   :", transaction.id);

  console.log("\n🚀 LLAMANDO A RESEND API...");
  const t0 = Date.now();

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const result: SentMessageInfo = await enviarEmailConfirmacion({
      to: emailDestino,
      pedidoId: pedido.id,
      nombreCliente,
      productos: productosFormateados,
      total: pedido.total,
      metodoPago: transaction.payment_method_type,
      transaccionId: transaction.id,
      referencia: transaction.reference,
      direccionEnvio: pedido.direccion_envio,
      ciudadEnvio: pedido.ciudad_envio,
      fechaPago: new Date().toISOString(),
      currency: transaction.currency,
    });

    const elapsed = Date.now() - t0;
    console.log(`\n✅ EMAIL ENVIADO EXITOSAMENTE en ${elapsed}ms`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    console.log("   Nodemailer ID:", result?.messageId ?? "no-id");
    console.log("   Destinatario:", emailDestino);
    console.log("   Asunto     :", `✅ Pedido #${pedido.id} confirmado – Thiart3D`);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("\n❌ ERROR AL ENVIAR EMAIL:");
    console.error("   Mensaje:", errorMsg);
    console.error("   (El pedido SÍ fue actualizado en BD, solo falló el correo)");
  }

  console.log("══════════════════════════════════════════════════\n");
}
