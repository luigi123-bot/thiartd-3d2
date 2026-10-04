import { NextResponse } from "next/server";
import { obtenerGuiaPdfBufferPorPedidoId } from "~/lib/generate-guia-pdf";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pedidoId = parseInt(id, 10);

    if (isNaN(pedidoId)) {
      return NextResponse.json({ error: "ID de pedido inválido" }, { status: 400 });
    }

    const pdfBuffer = await obtenerGuiaPdfBufferPorPedidoId(pedidoId);

    if (!pdfBuffer) {
      return NextResponse.json({ error: "Pedido no encontrado o error generando guía" }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="guia-thiart3d-${pedidoId}.pdf"`,
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err: unknown) {
    console.error("[GUIA-PDF] Error generando PDF:", err);
    return NextResponse.json(
      { error: "Error al generar la guía en PDF", detalles: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
