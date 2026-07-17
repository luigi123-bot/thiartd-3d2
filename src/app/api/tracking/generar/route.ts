import { NextResponse } from "next/server";
import { crearEnvioParaPedido } from "../../../../../utils/envia";
import { sendShippingEmail } from "~/lib/email-service";

interface PedidoConGuia {
  numero_tracking?: string | null;
  empresa_envio?: string | null;
  pdf_guia_url?: string | null;
  datos_contacto?: string | null;
  ciudad_envio?: string | null;
  fecha_estimada_entrega?: string | null;
}

export async function POST(req: Request) {
  try {
    const { pedido_id } = (await req.json()) as { pedido_id: number };

    if (!pedido_id) {
      return NextResponse.json({ error: "pedido_id es obligatorio" }, { status: 400 });
    }

    console.log(`[GENERAR-GUIA] Iniciando generación automática para pedido #${pedido_id}`);
    
    const pedidoConGuia = (await crearEnvioParaPedido(pedido_id)) as PedidoConGuia | null;

    if (pedidoConGuia?.numero_tracking) {
      // Enviar el correo al cliente con la información de envío de inmediato
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
            numeroTracking: pedidoConGuia.numero_tracking ?? "",
            empresaEnvio: pedidoConGuia.empresa_envio ?? "Transportista",
            ciudadDestino: pedidoConGuia.ciudad_envio ?? undefined,
            fechaEstimada: pedidoConGuia.fecha_estimada_entrega ?? undefined,
            pdfGuiaUrl: pedidoConGuia.pdf_guia_url ?? undefined,
          });
          console.log(`[GENERAR-GUIA] ✉️ Email de envío enviado a ${contacto.email}`);
        }
      } catch (emailErr) {
        console.error(`[GENERAR-GUIA] Error al enviar email de envío:`, emailErr);
      }

      return NextResponse.json({
        success: true,
        numero_tracking: pedidoConGuia.numero_tracking,
        empresa_envio: pedidoConGuia.empresa_envio,
        pdf_guia_url: pedidoConGuia.pdf_guia_url,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: "No se pudo generar el envío automáticamente (verifica API Key y datos de dirección de entrega)"
      }, { status: 500 });
    }

  } catch (error: unknown) {
    console.error("Error en POST /api/tracking/generar:", error);
    const msg = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
