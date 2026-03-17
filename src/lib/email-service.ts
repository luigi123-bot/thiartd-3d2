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
  password: string;
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
  role = "cliente",
  roleLabel,
}: SendWelcomeEmailParams): Promise<{ success: true; data: SentMessageInfo } | { success: false; error: string }> {
  try {
    const transporter: Transporter = createTransporter();

    // Use specific label if provided, else fallback to standard logic (case-insensitive)
    const normalizedRole = (role ?? "cliente").toLowerCase();
    const rolLabel = roleLabel ?? (
      normalizedRole === "admin" || normalizedRole === "administrador" ? "Administrador" : 
      normalizedRole === "creador" ? "Creador" : 
      "Cliente"
    );

    const mailOptions: SendMailOptions = {
      from: `"Thiart 3D" <${process.env.GMAIL_USER}>`,
      to,
      subject: '¡Bienvenido a Thiart 3D! Aquí están tus credenciales',
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
                      <td align="center" style="padding: 40px 20px 20px 20px; background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); border-radius: 12px 12px 0 0;">
                        <h1 style="margin: 0 0 8px 0; color: #ffffff; font-size: 32px; font-weight: bold;">Thiart 3D</h1>
                        <p style="margin: 0; color: rgba(255,255,255,0.85); font-size: 16px;">¡Bienvenido a la plataforma!</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px 40px 20px 40px;">
                        <p style="color: #374151; font-size: 18px; font-weight: bold; margin: 0 0 8px 0;">Hola, ${nombre} 👋</p>
                        <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0;">
                          Tu cuenta ha sido creada exitosamente en Thiart 3D. A continuación encontrarás tus credenciales de acceso:
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 0 40px 20px 40px;">
                        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                                <span style="color: #6b7280; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Correo electrónico</span><br>
                                <span style="color: #111827; font-size: 16px; font-weight: bold;">${to}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                <span style="color: #6b7280; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Contraseña temporal</span><br>
                                <span style="color: #111827; font-size: 20px; font-weight: bold; font-family: 'Courier New', monospace; letter-spacing: 2px;">${password}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 12px 0 0 0;">
                                <span style="color: #6b7280; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Rol asignado</span><br>
                                <span style="display: inline-block; margin-top: 6px; background-color: #d1fae5; color: #065f46; font-size: 12px; font-weight: bold; padding: 4px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.1em;">${rolLabel}</span>
                              </td>
                            </tr>
                          </table>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 0 40px 30px 40px;">
                        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px;">
                          <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
                            <strong>🔒 Seguridad:</strong> Por favor cambia tu contraseña la primera vez que ingreses.
                          </p>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;">
                        <p style="color: #6b7280; font-size: 13px; text-align: center; margin: 0;">
                          © 2025 Thiart 3D · Si tienes dudas, contáctanos respondiendo este correo.
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
    console.log('✅ Correo de bienvenida enviado:', info.messageId);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return { success: true, data: info };
  } catch (err: unknown) {
    console.error('❌ Error en sendWelcomeEmail:', err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}