import { sendOrderConfirmationEmail } from "~/lib/email-service";

import type { SentMessageInfo } from "nodemailer";

interface ProductoPedido {
  nombre: string;
  cantidad: number;
  precio: number;
  imagen?: string;
}

interface EmailConfirmacionParams {
  to: string;
  pedidoId: number;
  nombreCliente: string;
  productos: ProductoPedido[];
  total: number;
  metodoPago: string;
  transaccionId: string;
  referencia: string;
  direccionEnvio?: string;
  ciudadEnvio?: string;
  fechaPago?: string;
  currency?: string;
}

export async function enviarEmailConfirmacion(params: EmailConfirmacionParams): Promise<SentMessageInfo> {
  console.log("📤 Iniciando envío de correo de confirmación (usando email-service)...");
  
  const result = await sendOrderConfirmationEmail({
    ...params,
    to: params.to
  });

  if (!result.success) {
    console.error("❌ Falló el envío del correo:", result.error);
    throw new Error(result.error);
  }

   
  return result.data;
}

// Mantener compatibilidad con el nombre antiguo
export const enviarEmailConfirmacionNodemailer = enviarEmailConfirmacion;
