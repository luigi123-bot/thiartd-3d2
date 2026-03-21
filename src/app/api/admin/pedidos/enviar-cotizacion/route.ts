import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendQuotationEmail } from "~/lib/email-service";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Bypass RLS
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { pedidoId, total, pagoUrl, items, to, nombreCliente } = await req.json() as {
      pedidoId: number;
      total: number;
      pagoUrl: string;
      items: string;
      to: string;
      nombreCliente: string;
    };

    if (!pedidoId || !total || !pagoUrl || !to) {
      return NextResponse.json({ error: "Faltan datos obligatorios." }, { status: 400 });
    }

    // 1. Actualizar el pedido en la base de datos
    const { error: updateError } = await supabase
      .from("pedidos")
      .update({
        total,
        estado: "pendiente_pago",
        payment_id: pagoUrl, // Usamos payment_id temporalmente para guardar el link de pago
        updated_at: new Date().toISOString()
      })
      .eq("id", pedidoId);

    if (updateError) {
      console.error("Error actualizando pedido:", updateError);
      return NextResponse.json({ error: "No se pudo actualizar el pedido." }, { status: 500 });
    }

    // 2. Enviar el correo de notificación
    const emailRes = await sendQuotationEmail({
      to,
      pedidoId,
      nombreCliente,
      items,
      total,
      pagoUrl
    });

    if (!emailRes.success) {
      console.error("Error enviando email:", emailRes.error);
      return NextResponse.json({ error: "No se pudo enviar el correo." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Cotización enviada con éxito." });
  } catch (error) {
    console.error("Error en enviar-cotizacion:", error);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
