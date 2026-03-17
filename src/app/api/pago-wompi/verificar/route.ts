import { NextResponse } from "next/server";

const WOMPI_PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY;
const isTestMode = WOMPI_PRIVATE_KEY?.startsWith('prv_test_');
const WOMPI_API_URL = isTestMode 
  ? "https://sandbox.wompi.co/v1/transactions" 
  : "https://production.wompi.co/v1/transactions";

interface WompiErrorData {
  error?: {
    type?: string;
    messages?: Record<string, string[]>;
  };
  [key: string]: unknown;
}

interface WompiTransactionResponse {
  data: {
    id: string;
    status: string;
    payment_method_type: string;
    reference: string;
    amount_in_cents: number;
    [key: string]: unknown;
  };
  meta?: Record<string, unknown>;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get("id");

    if (!transactionId) {
      return NextResponse.json({ error: "Falta el ID de transacción" }, { status: 400 });
    }

    if (!WOMPI_PRIVATE_KEY) {
      return NextResponse.json({ error: "WOMPI_PRIVATE_KEY no configurada" }, { status: 500 });
    }

    console.log(`🔍 Consultando transacción ${transactionId} en Wompi (${isTestMode ? 'TEST' : 'PROD'})...`);

    const response = await fetch(`${WOMPI_API_URL}/${transactionId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${WOMPI_PRIVATE_KEY}`,
      },
    });

    if (!response.ok) {
      const errorData = (await response.json()) as WompiErrorData;
      console.error("❌ Error de la API de Wompi:", errorData);
      return NextResponse.json({ error: "Error al consultar Wompi", details: errorData }, { status: response.status });
    }

    const data = (await response.json()) as WompiTransactionResponse;
    const transaction = data.data;

    return NextResponse.json({
      status: transaction.status, // APPROVED, DECLINED, VOIDED, ERROR, PENDING
      payment_method_type: transaction.payment_method_type,
      reference: transaction.reference,
      amount_in_cents: transaction.amount_in_cents,
      id: transaction.id
    });

  } catch (error) {
    console.error("Error en /api/pago-wompi/verificar:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
