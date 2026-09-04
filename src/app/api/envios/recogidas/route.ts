import { NextResponse } from "next/server";
import { programarRecogidaEnvia, obtenerRecogidas } from "../../../../../utils/envia";

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
 * Programa una nueva recogida de paquetes con la transportadora
 */
export async function POST(req: Request) {
  try {
    interface RecogidaBody {
      carrier?: string;
      pickupDate: string; // YYYY-MM-DD
      pickupTimeFrom: string; // HH:mm
      pickupTimeTo: string; // HH:mm
      totalPackages?: number;
      totalWeight?: number;
      instructions?: string;
      pedidosIds?: number[];
    }

    const body = (await req.json()) as RecogidaBody;

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
