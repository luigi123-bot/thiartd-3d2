import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { NotificationService } from "~/lib/notificationService";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
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

    return NextResponse.json({ success: true });

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
