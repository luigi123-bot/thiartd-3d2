import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendPasswordResetEmailParams {
  to: string;
  code: string;
  userName?: string;
}

export async function sendPasswordResetEmail({
  to,
  code,
  userName = "Usuario",
}: SendPasswordResetEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Thiart 3D <onboarding@resend.dev>',
      to: [to],
      subject: 'Código de recuperación de contraseña - Thiart 3D',
      html: `
        <!DOCTYPE html>
        <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
                    
                    <!-- Header con gradiente -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); padding: 40px 20px; text-align: center;">
                        <div style="width: 80px; height: 80px; border-radius: 50%; background-color: rgba(255, 255, 255, 0.2); margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                          <span style="color: white; font-size: 36px; font-weight: bold;">T3D</span>
                        </div>
                        <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                          Thiart 3D
                        </h1>
                        <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                          Recuperación de Contraseña
                        </p>
                      </td>
                    </tr>

                    <!-- Contenido -->
                    <tr>
                      <td style="padding: 40px;">
                        <p style="color: #374151; font-size: 18px; line-height: 1.6; margin: 0 0 10px 0;">
                          Hola <strong>${userName}</strong>,
                        </p>
                        <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                          Recibimos una solicitud para restablecer la contraseña de tu cuenta en Thiart 3D.
                        </p>
                        <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                          Tu código de verificación es:
                        </p>
                      </td>
                    </tr>

                    <!-- Código de Verificación -->
                    <tr>
                      <td align="center" style="padding: 0 40px 30px 40px;">
                        <table cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); border-radius: 12px; box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);">
                          <tr>
                            <td style="padding: 30px 50px;">
                              <span style="color: white; font-size: 56px; font-weight: bold; letter-spacing: 12px; font-family: 'Courier New', Monaco, monospace; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                ${code}
                              </span>
                            </td>
                          </tr>
                        </table>
                        <p style="color: #9ca3af; font-size: 14px; margin: 20px 0 0 0; font-weight: 500;">
                          ⏰ Este código expira en <strong style="color: #ef4444;">15 minutos</strong>
                        </p>
                      </td>
                    </tr>

                    <!-- Instrucciones -->
                    <tr>
                      <td style="padding: 0 40px;">
                        <div style="background-color: #f3f4f6; border-left: 4px solid #14b8a6; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                          <p style="color: #374151; font-size: 15px; margin: 0 0 12px 0; font-weight: 600;">
                            📋 Pasos a seguir:
                          </p>
                          <ol style="color: #6b7280; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                            <li>Vuelve a la página de recuperación de contraseña</li>
                            <li>Ingresa el código de 6 dígitos mostrado arriba</li>
                            <li>Establece tu nueva contraseña segura</li>
                          </ol>
                        </div>
                      </td>
                    </tr>

                    <!-- Advertencia de Seguridad -->
                    <tr>
                      <td style="padding: 0 40px 30px 40px;">
                        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px;">
                          <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
                            <strong>⚠️ Importante:</strong> Si no solicitaste este cambio de contraseña, ignora este correo y tu cuenta permanecerá segura. Considera cambiar tu contraseña si crees que alguien más tiene acceso a tu cuenta.
                          </p>
                        </div>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px; background: linear-gradient(to bottom, #ffffff 0%, #f9fafb 100%); border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 8px 0; text-align: center;">
                          <strong>Gracias por confiar en Thiart 3D</strong>
                        </p>
                        <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
                          Este es un correo automático, por favor no respondas a este mensaje.
                        </p>
                        <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 12px 0 0 0; text-align: center;">
                          © ${new Date().getFullYear()} Thiart 3D. Todos los derechos reservados.
                        </p>
                        <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                          <a href="https://www.thiart3d.com" style="color: #14b8a6; text-decoration: none; font-size: 13px; font-weight: 500;">
                            Visita nuestro sitio web
                          </a>
                        </div>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error al enviar correo con Resend:', error);
      return { success: false, error };
    }

    console.log('✅ Correo enviado exitosamente:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error en sendPasswordResetEmail:', error);
    return { success: false, error };
  }
}
