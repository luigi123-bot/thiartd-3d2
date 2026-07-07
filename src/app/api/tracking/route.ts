import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { NotificationService } from "~/lib/notificationService";
import { crearEnvioParaPedido } from "../../../../utils/envia";
import { sendShippingEmail } from "~/lib/email-service";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface TrackingRequestBody {
  pedido_id: number;
  estado: string;
  descripcion?: string;
  ubicacion?: string;
  numero_tracking?: string;
  empresa_envio?: string;
  fecha_estimada_entrega?: string;
}

interface HistorialEnvio {
  id: number;
  pedido_id: number;
  estado: string;
  descripcion?: string;
  ubicacion?: string;
  fecha: string;
  created_at: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as TrackingRequestBody;
    const { 
      pedido_id, 
      estado, 
      descripcion, 
      ubicacion, 
      numero_tracking, 
      empresa_envio, 
      fecha_estimada_entrega 
    } = body;

    if (!pedido_id || !estado) {
      return NextResponse.json(
        { error: "pedido_id y estado son obligatorios" },
        { status: 400 }
      );
    }

    // 1. Actualizar el estado del pedido
    const updateData: Record<string, unknown> = { estado };
    
    if (numero_tracking) updateData.numero_tracking = numero_tracking;
    if (empresa_envio) updateData.empresa_envio = empresa_envio;
    if (fecha_estimada_entrega) updateData.fecha_estimada_entrega = fecha_estimada_entrega;

    const { error: updateError } = await supabase
      .from("pedidos")
      .update(updateData)
      .eq("id", pedido_id);

    if (updateError) {
      console.error("Error actualizando pedido:", updateError);
      return NextResponse.json(
        { error: "Error actualizando el pedido" },
        { status: 500 }
      );
    }

    // 2. Agregar entrada al historial de envíos
    const { error: historialError } = await supabase
      .from("historial_envios")
      .insert([{
        pedido_id,
        estado,
        descripcion,
        ubicacion,
        fecha: new Date().toISOString(),
      }]);

    if (historialError) {
      console.error("Error insertando historial:", historialError);
      return NextResponse.json(
        { error: "Error guardando historial" },
        { status: 500 }
      );
    }

    // 3. Enviar notificación al cliente
    try {
      await NotificationService.notificarCambioEstado(
        pedido_id,
        estado,
        {
          ubicacion,
          descripcion,
          numeroTracking: numero_tracking,
          empresaEnvio: empresa_envio,
        }
      );
    } catch (notifError) {
      console.error("Error enviando notificación:", notifError);
      // No devolvemos error porque el tracking se guardó correctamente
    }

    // 4. Si el estado es en_preparacion o en_envio y no hay tracking aún → generar guía con Envía
    const estadosQueDisparan = ["en_preparacion", "en_envio", "pagado"];
    let trackingGenerado: { numero_tracking?: string; empresa_envio?: string } | null = null;

    if (estadosQueDisparan.includes(estado)) {
      // Verificar si el pedido ya tiene número de tracking
      const { data: pedidoActual } = await supabase
        .from("pedidos")
        .select("numero_tracking, empresa_envio, datos_contacto, ciudad_envio, fecha_estimada_entrega")
        .eq("id", pedido_id)
        .single<{
          numero_tracking: string | null;
          empresa_envio: string | null;
          datos_contacto: string | null;
          ciudad_envio: string | null;
          fecha_estimada_entrega: string | null;
        }>();

      if (!pedidoActual?.numero_tracking) {
        console.log(`[TRACKING] Disparando generación de guía Envía para pedido #${pedido_id} (estado: ${estado})`);
        try {
          await crearEnvioParaPedido(pedido_id);
          console.log(`[TRACKING] ✅ Guía generada automáticamente para pedido #${pedido_id}`);

          // Leer el pedido actualizado para obtener el tracking recién asignado
          const { data: pedidoConGuia } = await supabase
            .from("pedidos")
            .select("numero_tracking, empresa_envio, datos_contacto, ciudad_envio, fecha_estimada_entrega")
            .eq("id", pedido_id)
            .single<{
              numero_tracking: string | null;
              empresa_envio: string | null;
              datos_contacto: string | null;
              ciudad_envio: string | null;
              fecha_estimada_entrega: string | null;
            }>();

          if (pedidoConGuia?.numero_tracking) {
            trackingGenerado = {
              numero_tracking: pedidoConGuia.numero_tracking,
              empresa_envio: pedidoConGuia.empresa_envio ?? undefined,
            };

            // Enviar email al cliente con la información de envío
            try {
              let contacto: { nombre?: string; email?: string } = {};
              try {
                if (pedidoConGuia.datos_contacto) {
                  contacto = JSON.parse(pedidoConGuia.datos_contacto) as { nombre?: string; email?: string };
                }
              } catch { /* ignorar error de parsing */ }

              if (contacto.email) {
                await sendShippingEmail({
                  to: contacto.email,
                  nombreCliente: contacto.nombre ?? "Cliente",
                  pedidoId: pedido_id,
                  numeroTracking: pedidoConGuia.numero_tracking,
                  empresaEnvio: pedidoConGuia.empresa_envio ?? "Transportista",
                  ciudadDestino: pedidoConGuia.ciudad_envio ?? undefined,
                  fechaEstimada: pedidoConGuia.fecha_estimada_entrega ?? undefined,
                });
                console.log(`[TRACKING] ✉️ Email de envío enviado a ${contacto.email} para pedido #${pedido_id}`);
              } else {
                console.warn(`[TRACKING] No se encontró email del cliente para pedido #${pedido_id}`);
              }
            } catch (emailErr) {
              console.error(`[TRACKING] Error enviando email de envío:`, emailErr);
            }
          }
        } catch (enviaErr) {
          console.error(`[TRACKING] ❌ Error generando guía Envía para pedido #${pedido_id}:`, enviaErr);
          // No interrumpimos el flujo — el tracking ya se guardó
        }
      } else {
        console.log(`[TRACKING] Pedido #${pedido_id} ya tiene guía: ${pedidoActual.numero_tracking}. Omitiendo.`);
        trackingGenerado = {
          numero_tracking: pedidoActual.numero_tracking,
          empresa_envio: pedidoActual.empresa_envio ?? undefined,
        };
      }
    }

    return NextResponse.json({ success: true, tracking_generado: trackingGenerado });

  } catch (error) {
    console.error("Error en POST /api/tracking:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const pedidoId = url.searchParams.get("pedido_id");

    if (!pedidoId) {
      return NextResponse.json(
        { error: "pedido_id es obligatorio" },
        { status: 400 }
      );
    }

    // Obtener historial de envíos
    const { data, error } = await supabase
      .from("historial_envios")
      .select("*")
      .eq("pedido_id", parseInt(pedidoId))
      .order("fecha", { ascending: false });

    if (error) {
      console.error("Error obteniendo historial:", error);
      return NextResponse.json(
        { error: "Error obteniendo historial de envío" },
        { status: 500 }
      );
    }

    const historial = (data as HistorialEnvio[]) ?? [];

    return NextResponse.json({ historial });

  } catch (error) {
    console.error("Error en GET /api/tracking:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
