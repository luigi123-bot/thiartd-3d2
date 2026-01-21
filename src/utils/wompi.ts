import axios from "axios";

export const WOMPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY!;
export const WOMPI_PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY!;
export const WOMPI_EVENTS_SECRET = process.env.WOMPI_EVENTS_SECRET!;
export const WOMPI_INTEGRITY_SECRET = process.env.WOMPI_INTEGRITY_SECRET!;

export interface WompiPagoResponse {
  data?: {
    payment_link?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// Crear un pago en Wompi
export async function crearPagoWompi({ amount_in_cents, currency, customer_email, reference }: {
  amount_in_cents: number;
  currency: string;
  customer_email: string;
  reference: string;
}): Promise<WompiPagoResponse> {
  const url = "https://sandbox.wompi.co/v1/transactions";
  const body = {
    amount_in_cents,
    currency,
    customer_email,
    reference,
    payment_method_type: "CARD",
    redirect_url: "https://tuapp.com/pago-exitoso" // Cambia por tu URL
  };
  const headers = {
    Authorization: `Bearer ${WOMPI_PRIVATE_KEY}`,
    "Content-Type": "application/json"
  };
  try {
    const res = await axios.post(url, body, { headers });
    return res.data as WompiPagoResponse;
  } catch (error) {
    console.error("Error creando pago en Wompi:", error);
    throw error;
  }
}

