import { NextResponse } from "next/server";
import { programarRecogidaEnvia, obtenerRecogidas } from "../../../../../utils/envia";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/envios/recogidas
 * Obtiene la lista de recogidas programadas con transportadoras
 */
export async function GET() {
  try {
    const recogidas = await obtenerRecogidas();
    return NextResponse.json({ success: true, recogidas });
  } catch (error: unknown) {
    console.error("Error en GET /api/envios/recogidas:", error);
    const msg = error instanceof Error ? error.message : "Error al obtener recogidas";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/**
 * POST /api/envios/recogidas
 * - tipo: "notificacion_pod_listo" → notifica al cliente que su pedido POD está listo
 * - (sin tipo) → programa una nueva recogida con la transportadora
 */
export async function POST(req: Request) {
  try {
    interface RecogidaBody {
      tipo?: string;
      pedidoId?: number;
      mensaje?: string;
      carrier?: string;
      pickupDate?: string;
      pickupTimeFrom?: string;
      pickupTimeTo?: string;
      totalPackages?: number;
      totalWeight?: number;
      instructions?: string;
      pedidosIds?: number[];
    }

    const body = (await req.json()) as RecogidaBody;

    // ── Notificación POD listo para recoger ──────────────────────────────────
    if (body.tipo === "notificacion_pod_listo" && body.pedidoId) {
      const { data: pedido } = await supabase
        .from("pedidos")
        .select("id, datos_contacto, total")
        .eq("id", body.pedidoId)
        .single();

      if (!pedido) {
        return NextResponse.json({ success: false, error: "Pedido no encontrado" }, { status: 404 });
      }

      interface DatosContacto { nombre?: string; email?: string; telefono?: string; }
      let contacto: DatosContacto = {};
      try {
        contacto = typeof pedido.datos_contacto === "string"
          ? JSON.parse(pedido.datos_contacto) as DatosContacto
          : (pedido.datos_contacto as DatosContacto) ?? {};
      } catch { /* ignore */ }

      // Registrar notificación en la base de datos
      await supabase.from("notificaciones").insert({
        usuario_id: null,
        pedido_id: body.pedidoId,
        tipo: "email",
        titulo: `Pedido #${body.pedidoId} listo para recoger`,
        mensaje: body.mensaje ?? "Tu pedido Print on Demand está listo para recoger en nuestro taller.",
        enviado: true,
        fecha_envio: new Date().toISOString(),
      });

      // Enviar correo via Resend si está configurado
      if (contacto.email) {
        const resendKey = process.env.RESEND_API_KEY;
        if (resendKey) {
          try {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${resendKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "THIART 3D <noreply@thiart3d.com>",
                to: [contacto.email],
                subject: `Tu pedido #${body.pedidoId} está listo para recoger — THIART 3D`,
                html: `
                  <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px; border-radius: 16px;">
                    <div style="text-align: center; margin-bottom: 32px;">
                      <h1 style="color: #00a19a; font-size: 28px; font-weight: 900; margin: 0;">¡Tu obra está lista!</h1>
                    </div>
                    <div style="background: white; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                      <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                        Hola <strong>${contacto.nombre ?? "Cliente"}</strong>, 
                        tu pedido <strong>#${body.pedidoId}</strong> (Print on Demand) 
                        ha sido fabricado y está listo para que lo recojas en nuestro taller.
                      </p>
                      <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px; margin-top: 16px;">
                        <p style="color: #166534; font-weight: 700; margin: 0 0 8px 0;">Horario de Recogida:</p>
                        <p style="color: #166534; margin: 0;">Lunes a Viernes · 9:00 AM – 6:00 PM</p>
                        <p style="color: #166534; margin: 4px 0 0 0;">Taller THIART 3D</p>
                      </div>
                    </div>
                    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                      Tienes preguntas? Escribenos por WhatsApp o responde este correo.
                    </p>
                  </div>
                `,
              }),
            });
          } catch (emailErr) {
            console.warn("No se pudo enviar email de notificación POD:", emailErr);
          }
        }
      }

      return NextResponse.json({
        success: true,
        mensaje: `Notificación enviada al cliente del pedido #${body.pedidoId}`,
        cliente: contacto.nombre ?? "Cliente",
        email: contacto.email ?? "Sin email registrado",
      });
    }

    // ── Programar recogida con transportadora ────────────────────────────────
    if (!body.pickupDate || !body.pickupTimeFrom || !body.pickupTimeTo) {
      return NextResponse.json(
        { success: false, error: "Fecha y horario de recogida requeridos (pickupDate, pickupTimeFrom, pickupTimeTo)" },
        { status: 400 }
      );
    }

    const carrier = body.carrier || "coordinadora";

    const resultado = await programarRecogidaEnvia({
      carrier,
      pickupDate: body.pickupDate,
      pickupTimeFrom: body.pickupTimeFrom,
      pickupTimeTo: body.pickupTimeTo,
      totalPackages: Number(body.totalPackages) || 1,
      totalWeight: Number(body.totalWeight) || 1.0,
      instructions: body.instructions || "Taller Thiart 3D",
      pedidosIds: body.pedidosIds || []
    });

    return NextResponse.json({
      success: true,
      mensaje: `Recogida programada exitosamente con ${carrier}`,
      recogida: resultado
    });
  } catch (error: unknown) {
    console.error("Error en POST /api/envios/recogidas:", error);
    const msg = error instanceof Error ? error.message : "Error al programar recogida";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
