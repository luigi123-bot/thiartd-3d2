/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import nodemailer from 'nodemailer';
import type { Transporter, SendMailOptions, SentMessageInfo } from 'nodemailer';

interface SendPasswordResetEmailParams {
  to: string;
  code: string;
  userName?: string;
}

interface SendWelcomeEmailParams {
  to: string;
  nombre: string;
  password?: string;
  role?: string;
  roleLabel?: string;
}

// Crear transporter de Gmail
const createTransporter = (): Transporter => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER!,
      pass: process.env.GMAIL_APP_PASSWORD!,
    },
  }) as Transporter;
};

export async function sendPasswordResetEmail({
  to,
  code,
  userName = "Usuario",
}: SendPasswordResetEmailParams): Promise<{ success: true; data: SentMessageInfo } | { success: false; error: string }> {
  try {
    const transporter: Transporter = createTransporter();

    const mailOptions: SendMailOptions = {
      from: `"Thiart 3D" <${process.env.GMAIL_USER}>`,
      to: to,
      subject: 'Código de recuperación de contraseña - Thiart 3D',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <tr>
                      <td align="center" style="padding: 40px 20px 20px 20px;">
                        <h1 style="margin: 20px 0 10px 0; color: #1f2937; font-size: 28px; font-weight: bold;">Thiart 3D</h1>
                        <p style="margin: 0; color: #6b7280; font-size: 16px;">Recuperación de Contraseña</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 0 40px;">
                        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 20px 0;">Hola ${userName},</p>
                        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                          Recibimos una solicitud para restablecer tu contraseña. Tu código de verificación es:
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding: 30px 40px;">
                        <div style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); border-radius: 12px; padding: 30px; display: inline-block;">
                          <span style="color: white; font-size: 48px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                            ${code}
                          </span>
                        </div>
                        <p style="color: #6b7280; font-size: 14px; margin: 15px 0 0 0;">
                          Este código expira en <strong>15 minutos</strong>
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 0 40px 20px 40px;">
                        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px;">
                          <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
                            <strong>⚠️ Importante:</strong> Si no solicitaste este cambio, ignora este correo.
                          </p>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;">
                        <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 0;">
                          © 2025 Thiart 3D - Todos los derechos reservados
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const info: SentMessageInfo = await transporter.sendMail(mailOptions);
    console.log('✅ Correo enviado exitosamente:', info.messageId);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return { success: true, data: info };
  } catch (err: unknown) {
    console.error('❌ Error en sendPasswordResetEmail:', err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function sendWelcomeEmail({
  to,
  nombre,
  password,
  role: _role = "cliente",
  roleLabel: _roleLabel,
}: SendWelcomeEmailParams): Promise<{ success: true; data: SentMessageInfo } | { success: false; error: string }> {
  try {
    const transporter: Transporter = createTransporter();

    const mailOptions: SendMailOptions = {
      from: `"Thiart 3D" <${process.env.GMAIL_USER}>`,
      to,
      subject: password ? '¡Bienvenido a Thiart 3D! Tus credenciales' : '¡Bienvenido a Thiart 3D! Registro confirmado',
      html: `
        <!DOCTYPE html>
        <html>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc;">
            <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" style="background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
                    <tr>
                      <td align="center" style="padding: 50px 40px; background: linear-gradient(135deg, #009688 0%, #00796b 100%);">
                        <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 800; letter-spacing: -1px;">Thiart 3D</h1>
                        <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.8); font-size: 16px;">Pasión por el detalle en cada impresión</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 48px 40px;">
                        <p style="font-size: 20px; font-weight: 700; color: #1e293b; margin-top: 0;">¡Hola, ${nombre}! 👋</p>
                        <p style="color: #475569; font-size: 16px; line-height: 1.7;">
                          Es un placer darte la bienvenida a nuestra comunidad. Tu registro ha sido exitoso y ya tienes acceso a todas nuestras herramientas de arte 3D.
                        </p>
                        
                        ${password ? `
                        <div style="margin: 32px 0; padding: 24px; background-color: #f1f5f9; border-radius: 12px; border: 1px solid #e2e8f0;">
                          <p style="margin: 0 0 12px 0; font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Credenciales de acceso</p>
                          <div style="margin-bottom: 12px;">
                            <span style="display: block; font-size: 13px; color: #64748b;">Email</span>
                            <span style="font-size: 16px; font-weight: 700; color: #1e293b;">${to}</span>
                          </div>
                          <div>
                            <span style="display: block; font-size: 13px; color: #64748b;">Contraseña Temporal</span>
                            <span style="font-size: 20px; font-weight: 800; color: #009688; font-family: monospace;">${password}</span>
                          </div>
                        </div>
                        ` : `
                        <div style="margin: 32px 0; padding: 24px; background-color: #f0fdf4; border-radius: 12px; border: 1px solid #dcfce7; text-align: center;">
                          <p style="margin: 0; color: #166534; font-weight: 700;">¡Tu cuenta ya está activa y lista para usar!</p>
                        </div>
                        `}

                        <p style="color: #475569; font-size: 16px; line-height: 1.7;">
                          Ya puedes explorar nuestro catálogo, cotizar tus proyectos personalizados y gestionar tus pedidos desde tu perfil.
                        </p>

                        <div style="margin-top: 40px; text-align: center;">
                          <a href="https://thiart3d.com" style="background-color: #000000; color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; display: inline-block; transition: all 0.2s;">Visitar la Tienda</a>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 32px 40px; background-color: #f8fafc; text-align: center; border-top: 1px solid #f1f5f9;">
                        <p style="margin: 0; color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">© 2025 Thiart 3D · Impresión 3D Premium</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const info: SentMessageInfo = await transporter.sendMail(mailOptions);
     
    console.log('✅ Correo de bienvenida enviado:', info.messageId);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return { success: true, data: info };
  } catch (err: unknown) {
    console.error('❌ Error en sendWelcomeEmail:', err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

interface ProductoPedido {
  nombre: string;
  cantidad: number;
  precio: number;
  imagen?: string;
}

interface SendOrderConfirmationEmailParams {
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

export async function sendOrderConfirmationEmail(params: SendOrderConfirmationEmailParams): Promise<{ success: true; data: SentMessageInfo } | { success: false; error: string }> {
  const {
    to,
    pedidoId,
    nombreCliente,
    productos,
    total,
    metodoPago,
    transaccionId,
    referencia,
    direccionEnvio,
    ciudadEnvio,
    fechaPago,
    currency = "COP",
  } = params;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER!,
        pass: process.env.GMAIL_APP_PASSWORD!,
      },
    });

    const fechaFormateada = fechaPago
      ? new Date(fechaPago).toLocaleDateString("es-CO", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : new Date().toLocaleDateString("es-CO", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });

    const metodoPagoLabel: Record<string, string> = {
      CARD: "Tarjeta de crédito/débito",
      NEQUI: "Nequi",
      PSE: "PSE",
      BANCOLOMBIA_TRANSFER: "Bancolombia Transfer",
      BANCOLOMBIA_COLLECT: "Bancolombia Collect",
      CASH: "Efectivo (Efecty / Baloto)",
    };

    const filaProductos = productos
      .map(
        (p) => `
      <tr>
        <td style="padding: 14px 16px; border-bottom: 1px solid #f1f5f9;">
          <div style="font-weight: 700; color: #0f172a; font-size: 14px;">${p.nombre}</div>
          <div style="color: #64748b; font-size: 12px; margin-top: 2px;">Cant: ${p.cantidad}</div>
        </td>
        <td style="padding: 14px 16px; border-bottom: 1px solid #f1f5f9; text-align: right;">
          <span style="font-weight: 800; color: #0f172a; font-size: 14px;">
            $${(p.precio * p.cantidad).toLocaleString("es-CO")}
          </span>
        </td>
      </tr>`
      )
      .join("");

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirmación de Pedido #${pedidoId}</title>
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">

          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 20px 20px 0 0; padding: 40px 48px; text-align: center;">
              <div style="font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: -1px; margin-bottom: 4px;">
                Thiart<span style="color: #14b8a6;">3D</span>
              </div>
              <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 3px; font-weight: 700;">
                Impresión 3D Premium
              </div>
              <div style="margin-top: 28px; background: rgba(20, 184, 166, 0.1); border: 1px solid rgba(20, 184, 166, 0.3); border-radius: 50px; display: inline-block; padding: 10px 24px;">
                <span style="color: #14b8a6; font-size: 13px; font-weight: 800; letter-spacing: 1px;">✅ PAGO APROBADO</span>
              </div>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background: #ffffff; padding: 40px 48px;">

              <p style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0 0 8px 0; letter-spacing: -0.5px;">
                ¡Gracias, ${nombreCliente}! 🎉
              </p>
              <p style="font-size: 15px; color: #475569; margin: 0 0 32px 0; line-height: 1.6;">
                Tu pedido ha sido confirmado y ya está siendo procesado. Te notificaremos cuando sea enviado.
              </p>

              <!-- ORDEN INFO -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; border-radius: 16px; margin-bottom: 32px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px 24px; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8;">Resumen del Pedido</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 6px 0;">
                          <span style="font-size: 13px; color: #64748b;">Número de pedido</span>
                        </td>
                        <td style="padding: 6px 0; text-align: right;">
                          <span style="font-size: 13px; font-weight: 800; color: #0f172a;">#${pedidoId}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0;">
                          <span style="font-size: 13px; color: #64748b;">ID Transacción Wompi</span>
                        </td>
                        <td style="padding: 6px 0; text-align: right;">
                          <span style="font-size: 12px; font-weight: 700; color: #0f172a; font-family: monospace;">${transaccionId}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0;">
                          <span style="font-size: 13px; color: #64748b;">Referencia</span>
                        </td>
                        <td style="padding: 6px 0; text-align: right;">
                          <span style="font-size: 12px; font-weight: 700; color: #0f172a; font-family: monospace;">${referencia}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0;">
                          <span style="font-size: 13px; color: #64748b;">Método de pago</span>
                        </td>
                        <td style="padding: 6px 0; text-align: right;">
                          <span style="font-size: 13px; font-weight: 700; color: #0f172a;">${metodoPagoLabel[metodoPago] ?? metodoPago}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0;">
                          <span style="font-size: 13px; color: #64748b;">Fecha</span>
                        </td>
                        <td style="padding: 6px 0; text-align: right;">
                          <span style="font-size: 13px; font-weight: 700; color: #0f172a;">${fechaFormateada}</span>
                        </td>
                      </tr>
                      ${
                        direccionEnvio
                          ? `<tr>
                        <td style="padding: 6px 0; vertical-align: top;">
                          <span style="font-size: 13px; color: #64748b;">Dirección de envío</span>
                        </td>
                        <td style="padding: 6px 0; text-align: right;">
                          <span style="font-size: 13px; font-weight: 700; color: #0f172a;">${direccionEnvio}${ciudadEnvio ? ", " + ciudadEnvio : ""}</span>
                        </td>
                      </tr>`
                          : ""
                      }
                    </table>
                  </td>
                </tr>
              </table>

              <!-- PRODUCTOS -->
              <p style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; margin: 0 0 12px 0;">Detalle de productos</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; margin-bottom: 32px;">
                ${filaProductos}
                <!-- TOTAL ROW -->
                <tr style="background: #0f172a;">
                  <td style="padding: 18px 16px;">
                    <span style="font-size: 13px; font-weight: 800; color: #14b8a6; text-transform: uppercase; letter-spacing: 1px;">Total pagado</span>
                  </td>
                  <td style="padding: 18px 16px; text-align: right;">
                    <span style="font-size: 20px; font-weight: 900; color: #ffffff;">
                      $${total.toLocaleString("es-CO")} <span style="font-size: 13px; color: #64748b; font-weight: 600;">${currency}</span>
                    </span>
                  </td>
                </tr>
              </table>

              <!-- NEXT STEPS -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f0fdfa 0%, #f0fdfa 100%); border: 1px solid #ccfbf1; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
                <tr>
                  <td>
                    <p style="font-size: 13px; font-weight: 800; color: #0f766e; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px;">¿Qué sigue?</p>
                    <p style="font-size: 13px; color: #0d9488; margin: 6px 0;">📦 Tu pedido entra en producción de inmediato.</p>
                    <p style="font-size: 13px; color: #0d9488; margin: 6px 0;">🖨️ Imprimiremos tus piezas con la mayor calidad.</p>
                    <p style="font-size: 13px; color: #0d9488; margin: 6px 0;">🚚 Te enviaremos el número de seguimiento cuando sea despachado.</p>
                    <p style="font-size: 13px; color: #0d9488; margin: 6px 0;">💬 Puedes escribirnos desde el chat en la tienda si tienes dudas.</p>
                  </td>
                </tr>
              </table>

              <p style="font-size: 13px; color: #94a3b8; text-align: center; margin: 0;">
                ¿Necesitas ayuda? Escríbenos a <a href="mailto:thiart3d@gmail.com" style="color: #14b8a6; text-decoration: none; font-weight: 700;">thiart3d@gmail.com</a>
              </p>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background: #f1f5f9; border-radius: 0 0 20px 20px; padding: 24px 48px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">
                Thiart3D · Impresión 3D Premium
              </p>
              <p style="margin: 8px 0 0 0; font-size: 11px; color: #cbd5e1;">
                © 2025 Thiart 3D - Todos los derechos reservados
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const info = await transporter.sendMail({
      from: `"Thiart 3D" <${process.env.GMAIL_USER}>`,
      to,
      subject: `✅ Pedido #${pedidoId} confirmado – Thiart 3D`,
      html,
    });
    console.log('✅ Correo de confirmación enviado:', info.messageId);
    return { success: true, data: info };
  } catch (err: unknown) {
    console.error('❌ Error en sendOrderConfirmationEmail:', err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

interface AbandonedCartItem {
  nombre: string;
  cantidad: number;
  precio: number;
  imagen: string;
}

interface SendAbandonedCartReminderParams {
  to: string;
  nombre: string;
  productos: AbandonedCartItem[];
}

export async function sendAbandonedCartReminder(params: SendAbandonedCartReminderParams): Promise<{ success: true; data: SentMessageInfo } | { success: false; error: string }> {
  const { to, nombre, productos } = params;

  try {
    const transporter = createTransporter();

    const filaProductos = productos
      .map(
        (p) => `
      <tr>
        <td style="padding: 14px 16px; border-bottom: 1px solid #f1f5f9;">
          <div style="font-weight: 700; color: #0f172a; font-size: 14px;">${p.nombre}</div>
          <div style="color: #64748b; font-size: 12px; margin-top: 2px;">Cant: ${p.cantidad}</div>
        </td>
        <td style="padding: 14px 16px; border-bottom: 1px solid #f1f5f9; text-align: right;">
          <span style="font-weight: 800; color: #0f172a; font-size: 14px;">
            $${(p.precio * p.cantidad).toLocaleString("es-CO")}
          </span>
        </td>
      </tr>`
      )
      .join("");

    const total = productos.reduce((acc, p) => acc + p.precio * p.cantidad, 0);

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>¡No dejes que se escapen!</title>
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">
          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 20px 20px 0 0; padding: 40px 48px; text-align: center;">
              <div style="font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: -1px; margin-bottom: 4px;">
                Thiart<span style="color: #14b8a6;">3D</span>
              </div>
              <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 3px; font-weight: 700;">
                Impresión 3D Premium
              </div>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background: #ffffff; padding: 40px 48px;">
              <p style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0 0 8px 0; letter-spacing: -0.5px;">
                ¡Ey, ${nombre}! 👋
              </p>
              <p style="font-size: 15px; color: #475569; margin: 0 0 32px 0; line-height: 1.6;">
                Vimos que dejaste algunos artículos en tu carrito. ¡No pierdas la oportunidad de tener tus piezas 3D favoritas!
              </p>

              <!-- PRODUCTOS -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; margin-bottom: 32px;">
                ${filaProductos}
                <tr style="background: #f8fafc;">
                  <td style="padding: 18px 16px;">
                    <span style="font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase;">Subtotal pendiente</span>
                  </td>
                  <td style="padding: 18px 16px; text-align: right;">
                    <span style="font-size: 18px; font-weight: 900; color: #14b8a6;">
                      $${total.toLocaleString("es-CO")}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <div style="text-align: center; margin-bottom: 32px;">
                <a href="https://thiart3d.com/tienda/carrito" style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); color: #ffffff; padding: 18px 36px; border-radius: 12px; text-decoration: none; font-weight: 800; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px rgba(20, 184, 166, 0.2);">
                  🚀 COMPLETAR MI COMPRA
                </a>
              </div>

              <p style="font-size: 13px; color: #94a3b8; text-align: center; margin: 0;">
                Las piezas en stock son limitadas. ¡Asegura las tuyas antes de que se agoten!
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background: #f1f5f9; border-radius: 0 0 20px 20px; padding: 24px 48px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">
                Thiart3D · Impresión 3D Premium
              </p>
              <p style="margin: 8px 0 0 0; font-size: 11px; color: #cbd5e1;">
                © 2025 Thiart 3D - Todos los derechos reservados
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const info = (await transporter.sendMail({
      from: `"Thiart 3D" <${process.env.GMAIL_USER ?? ""}>`,
      to,
      subject: `🛒 ¡Aún tienes artículos en tu carrito! – Thiart 3D`,
      html,
    })) as unknown;
    console.log('✅ Recordatorio de carrito enviado:', (info as { messageId?: string }).messageId);
    return { success: true, data: info };
  } catch (err: unknown) {
    console.error('❌ Error en sendAbandonedCartReminder:', err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

interface SendQuotationEmailParams {
  to: string;
  pedidoId: number;
  nombreCliente: string;
  items: string; // Resumen de lo que se cotiza
  total: number;
  pagoUrl: string;
}

export async function sendQuotationEmail(params: SendQuotationEmailParams): Promise<{ success: true; data: SentMessageInfo } | { success: false; error: string }> {
  const { to, pedidoId, nombreCliente, items, total, pagoUrl } = params;

  try {
    const transporter = createTransporter();

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tu Cotización Thiart 3D</title>
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">

          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 20px 20px 0 0; padding: 40px 48px; text-align: center;">
              <div style="font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: -1px; margin-bottom: 4px;">
                Thiart<span style="color: #14b8a6;">3D</span>
              </div>
              <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 3px; font-weight: 700;">
                Personalización Premium
              </div>
              <div style="margin-top: 28px; background: rgba(20, 184, 166, 0.1); border: 1px solid rgba(20, 184, 166, 0.3); border-radius: 50px; display: inline-block; padding: 10px 24px;">
                <span style="color: #14b8a6; font-size: 13px; font-weight: 800; letter-spacing: 1px;">📋 COTIZACIÓN LISTA</span>
              </div>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background: #ffffff; padding: 40px 48px;">
              <p style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0 0 8px 0; letter-spacing: -0.5px;">
                ¡Hola, ${nombreCliente}! 👋
              </p>
              <p style="font-size: 15px; color: #475569; margin: 0 0 32px 0; line-height: 1.6;">
                Hemos revisado tu solicitud de proyecto personalizado. A continuación encontrarás el detalle de la cotización y el enlace para proceder con el pago.
              </p>

              <!-- RESUMEN INFO -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; border-radius: 16px; margin-bottom: 32px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px 24px; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8;">Detalles del Proyecto</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 24px;">
                    <div style="font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 8px;">Proyecto #${pedidoId}</div>
                    <div style="font-size: 14px; color: #64748b; line-height: 1.6; white-space: pre-wrap;">${items}</div>
                  </td>
                </tr>
              </table>

              <!-- PRECIO TOTAL -->
              <div style="text-align: center; margin-bottom: 40px; padding: 32px; background: #0f172a; border-radius: 16px;">
                <p style="font-size: 12px; font-weight: 800; color: #14b8a6; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 2px;">Inversión Total</p>
                <p style="font-size: 36px; font-weight: 900; color: #ffffff; margin: 0;">
                  $${total.toLocaleString("es-CO")} <span style="font-size: 14px; color: #64748b; font-weight: 600;">COP</span>
                </p>
              </div>

              <!-- CTA -->
              <div style="text-align: center; margin-bottom: 32px;">
                <p style="font-size: 14px; color: #475569; margin-bottom: 24px;">Para asegurar tu cupo en nuestra agenda de producción, puedes realizar el pago seguro a través de Wompi:</p>
                <a href="${pagoUrl}" style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); color: #ffffff; padding: 20px 48px; border-radius: 12px; text-decoration: none; font-weight: 800; display: inline-block; font-size: 18px; box-shadow: 0 10px 15px -3px rgba(20, 184, 166, 0.3);">
                  💳 PAGAR MI PEDIDO
                </a>
              </div>

              <p style="font-size: 13px; color: #94a3b8; text-align: center; margin: 0;">
                Esta cotización tiene una validez de <strong>5 días hábiles</strong>.
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background: #f1f5f9; border-radius: 0 0 20px 20px; padding: 24px 48px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">
                Thiart3D · Innovación en cada detalle
              </p>
              <p style="margin: 8px 0 0 0; font-size: 11px; color: #cbd5e1;">
                © 2025 Thiart 3D - Todos los derechos reservados
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const info = (await transporter.sendMail({
      from: `"Thiart 3D" <${process.env.GMAIL_USER}>`,
      to,
      subject: `📋 Tu Cotización para el Pedido #${pedidoId} está lista – Thiart 3D`,
      html,
    })) as { messageId: string; response: string };
    console.log('✅ Correo de cotización enviado:', info.messageId);
    return { success: true, data: info };
  } catch (err: unknown) {
    console.error('❌ Error en sendQuotationEmail:', err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export interface ManagerReportParams {
  to: string;
  totalIncome: number;
  ordersCount: number;
  pendingCount: number;
  quotationsCount: number;
  paidCount: number;
  cancelledCount: number;
  recentOrders: { id: number; total: number; estado: string; cliente: string }[];
  allOrders?: Array<{ id: number; created_at: string; total: number; estado: string; datos_contacto: string }>;
  allUsers?: Array<{ id: string | number; nombre?: string; email: string; role: string; creado_en?: string }>;
  allProducts?: Array<{ id: string | number; nombre: string; categoria: string; stock: number; precio: number; descripcion?: string }>;
  allMessages?: Array<{ id: string | number; nombre_cliente?: string; asunto?: string; created_at: string; leido: boolean }>;
}
export async function sendManagerReportEmail(params: ManagerReportParams) {
  const { 
    to, 
    totalIncome, 
    ordersCount, 
    pendingCount, 
    quotationsCount, 
    paidCount, 
    cancelledCount,
    recentOrders,
    allOrders = [],
    allUsers = [],
    allProducts = [],
    allMessages = []
  } = params;

  try {
    const transporter: Transporter = createTransporter();
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { background-color: #0f172a; padding: 48px; text-align: center; color: #ffffff; }
    .content { padding: 48px; }
    .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
    .stat-card { background-color: #f1f5f9; padding: 24px; border-radius: 16px; text-align: center; }
    .stat-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 8px; }
    .stat-value { font-size: 24px; font-weight: 900; color: #0f172a; }
    .income-card { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff; padding: 32px; border-radius: 20px; text-align: center; margin-bottom: 32px; }
    .income-label { font-size: 12px; font-weight: 800; color: #14b8a6; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; }
    .income-value { font-size: 42px; font-weight: 900; }
    .table-container { margin-top: 32px; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; }
    th { background-color: #f8fafc; padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #94a3b8; border-bottom: 1px solid #e2e8f0; }
    td { padding: 14px 16px; font-size: 13px; border-bottom: 1px solid #f1f5f9; color: #334155; }
    .badge { padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; }
    .badge-pagado { background-color: #dcfce7; color: #166534; }
    .badge-pendiente { background-color: #fef9c3; color: #854d0e; }
    .footer { background-color: #f1f5f9; padding: 24px; text-align: center; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -1px;">REPORTE FULL PLATAFORMA</h1>
      <p style="margin: 8px 0 0 0; opacity: 0.7; font-size: 14px;">Thiart 3D Business Intelligence - Informe de Operaciones</p>
    </div>
    
    <div class="content">
      <div class="income-card">
        <div class="income-label">Ingresos Totales (Pagados)</div>
        <div class="income-value">$${totalIncome.toLocaleString("es-CO")} <span style="font-size: 16px; opacity: 0.6;">COP</span></div>
      </div>
      
      <div style="display: table; width: 100%; border-spacing: 12px; margin: -12px;">
        <div style="display: table-row;">
          <div style="display: table-cell; background: #f8fafc; padding: 20px; border-radius: 16px; text-align: center; width: 50%;">
            <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Total Pedidos</div>
            <div style="font-size: 24px; font-weight: 900; color: #0f172a;">${ordersCount}</div>
          </div>
          <div style="display: table-cell; background: #f8fafc; padding: 20px; border-radius: 16px; text-align: center; width: 50%;">
            <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Convertidos</div>
            <div style="font-size: 24px; font-weight: 900; color: #14b8a6;">${paidCount}</div>
          </div>
        </div>
      </div>
      
      <div style="display: table; width: 100%; border-spacing: 12px; margin: 4px -12px 32px -12px;">
        <div style="display: table-row;">
          <div style="display: table-cell; background: #f8fafc; padding: 20px; border-radius: 16px; text-align: center; width: 33%;">
            <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Pendientes</div>
            <div style="font-size: 20px; font-weight: 900; color: #854d0e;">${pendingCount}</div>
          </div>
          <div style="display: table-cell; background: #f8fafc; padding: 20px; border-radius: 16px; text-align: center; width: 33%;">
            <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Cotizaciones</div>
            <div style="font-size: 20px; font-weight: 900; color: #0f172a;">${quotationsCount}</div>
          </div>
          <div style="display: table-cell; background: #f8fafc; padding: 20px; border-radius: 16px; text-align: center; width: 33%;">
            <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Cancelados</div>
            <div style="font-size: 20px; font-weight: 900; color: #e11d48;">${cancelledCount}</div>
          </div>
        </div>
      </div>
      
      <div style="display: table; width: 100%; border-spacing: 12px; margin: 4px -12px 32px -12px;">
        <div style="display: table-row;">
          <div style="display: table-cell; background: #f8fafc; padding: 20px; border-radius: 16px; text-align: center; width: 33%;">
            <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Usuarios Reg.</div>
            <div style="font-size: 20px; font-weight: 900; color: #0f172a;">${allUsers.length}</div>
          </div>
          <div style="display: table-cell; background: #f8fafc; padding: 20px; border-radius: 16px; text-align: center; width: 33%;">
            <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Productos</div>
            <div style="font-size: 20px; font-weight: 900; color: #0f172a;">${allProducts.length}</div>
          </div>
          <div style="display: table-cell; background: #f8fafc; padding: 20px; border-radius: 16px; text-align: center; width: 33%;">
            <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Mensajes</div>
            <div style="font-size: 20px; font-weight: 900; color: #0f172a;">${allMessages.length}</div>
          </div>
        </div>
      </div>
      
      <h3 style="font-size: 14px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; border-left: 4px solid #14b8a6; padding-left: 12px;">Última Actividad</h3>
      
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${recentOrders.map(o => `
              <tr>
                <td style="font-weight: 700;">#${o.id}</td>
                <td>${o.cliente}</td>
                <td style="font-weight: 700;">$${o.total.toLocaleString("es-CO")}</td>
                <td>
                  <span class="badge ${o.estado === 'pagado' ? 'badge-pagado' : 'badge-pendiente'}">
                    ${o.estado.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div style="margin-top: 40px; text-align: center;">
          <p style="font-size: 13px; color: #64748b;">(Se adjunta archivo Excel con la información completa de la base de datos)</p>
      </div>

      <div class="footer">
        Este es un reporte automático de auditoría generado por Thiart 3D.<br>
        © 2026 Thiart 3D S.A.S. - Business Intelligence Unit
      </div>
    </div>
  </div>
</body>
</html>
    `;

    // Generar contenido del Excel (CSV profesional)
    const bom = "\uFEFF"; // UTF-8 BOM for Excel
    let csvContent = bom + "REPORTE INTEGRAL THIART 3D\n";
    csvContent += `Fecha de Generación; ${new Date().toLocaleString("es-CO")}\n\n`;
    
    // --- SECCIÓN PEDIDOS ---
    csvContent += "--- HISTORIAL DE PEDIDOS ---\n";
    csvContent += "ID; Fecha; Cliente; Total; Estado; Datos Contacto\n";
    allOrders.forEach((p) => {
      csvContent += `${p.id}; ${new Date(p.created_at).toLocaleString("es-CO")}; ${p.id}; ${p.total}; ${p.estado}; "${(p.datos_contacto ?? "").replace(/"/g, "'")}"\n`;
    });
    csvContent += "\n\n";

    // --- SECCIÓN USUARIOS ---
    csvContent += "--- BASE DE DATOS DE USUARIOS ---\n";
    csvContent += "ID; Nombre; Email; Rol; Creado En\n";
    allUsers.forEach((u) => {
      csvContent += `${u.id}; ${u.nombre ?? u.email}; ${u.email}; ${u.role}; ${u.creado_en ?? ''}\n`;
    });
    csvContent += "\n\n";

    // --- SECCIÓN PRODUCTOS ---
    csvContent += "--- CONTROL DE INVENTARIO ---\n";
    csvContent += "ID; Nombre; Categoria; Stock; Precio; Descripcion\n";
    allProducts.forEach((pr) => {
      csvContent += `${pr.id}; ${pr.nombre}; ${pr.categoria}; ${pr.stock}; ${pr.precio}; "${(pr.descripcion ?? "").replace(/"/g, "'")}"\n`;
    });
    csvContent += "\n\n";

    // --- SECCIÓN MENSAJES ---
    csvContent += "--- LOG DE MENSAJES ---\n";
    csvContent += "ID; Cliente; Asunto; Fecha; Leido\n";
    allMessages.forEach((m) => {
      csvContent += `${m.id}; ${m.nombre_cliente ?? 'Anónimo'}; ${m.asunto ?? 'Sin Asunto'}; ${new Date(m.created_at).toLocaleString("es-CO")}; ${m.leido ? 'Sí' : 'No'}\n`;
    });
  
    const info = (await transporter.sendMail({
      from: `"Thiart 3D BI" <${process.env.GMAIL_USER}>`,
      to,
      subject: `📊 Reporte Ejecutivo: ${new Date().toLocaleDateString("es-CO")} - Thiart 3D`,
      html,
      attachments: [
        {
          filename: `Reporte-Ejecutivo-${new Date().toISOString().split('T')[0]}.csv`,
          content: csvContent,
          contentType: 'text/csv'
        }
      ]
    })) as { messageId: string };

    console.log('✅ Reporte gerencial enviado:', info.messageId);
    return { success: true, data: info };
  } catch (err: unknown) {
    console.error('❌ Error en sendManagerReportEmail:', err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}