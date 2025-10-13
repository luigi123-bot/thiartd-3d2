import { NextResponse } from "next/server";
import crypto from "crypto";

interface WompiPaymentRequest {
  amount_in_cents: number;
  currency: string;
  customer_email: string;
  reference: string;
  redirect_url?: string;
}

interface WompiPaymentResponse {
  data?: {
    id: string;
    permalink: string;
    status: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

interface PaymentRequestBody {
  amount: number;
  customer_email: string;
  reference: string;
  redirect_url?: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as PaymentRequestBody;
    const {
      amount,
      customer_email,
      reference,
      redirect_url = `${req.headers.get("origin")}/payment/success`,
    } = body;

    const wompiPayload: WompiPaymentRequest = {
      amount_in_cents: Math.round(amount * 100),
      currency: "COP",
      customer_email,
      reference,
      redirect_url,
    };

    // Crear hash de integridad
    const integrityString = `${reference}${wompiPayload.amount_in_cents}${wompiPayload.currency}${process.env.WOMPI_INTEGRITY_SECRET!}`;
    const integrity = crypto.createHash("sha256").update(integrityString).digest("hex");

    const response = await fetch("https://production.wompi.co/v1/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.WOMPI_PUBLIC_KEY!}`,
        "X-Integrity-Signature": integrity,
      },
      body: JSON.stringify(wompiPayload),
    });

    const data = (await response.json()) as WompiPaymentResponse;

    if (!response.ok || data.error) {
      return NextResponse.json(
        { error: data.error?.message ?? "Error al procesar el pago" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      payment_id: data.data?.id,
      permalink: data.data?.permalink,
      status: data.data?.status,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error inesperado";
    return NextResponse.json(
      { error: `Error al procesar pago: ${errorMessage}` },
      { status: 500 }
    );
  }
}
