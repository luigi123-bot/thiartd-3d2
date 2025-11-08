# Integración con Resend para Correos

## 📧 ¿Por qué usar Resend?

- ✅ Fácil de configurar
- ✅ API moderna y simple
- ✅ Plan gratuito generoso (3,000 emails/mes)
- ✅ Excelente deliverability
- ✅ Plantillas React Email
- ✅ Dashboard con analytics

## 🚀 Instalación

```bash
npm install resend
```

## 🔑 Configuración

### 1. Obtener API Key de Resend

1. Ve a [https://resend.com](https://resend.com)
2. Crea una cuenta
3. Ve a **API Keys**
4. Crea una nueva API key
5. Copia la key

### 2. Agregar a .env.local

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
```

## 💻 Implementación

### Crear servicio de correo

Crea el archivo: `src/lib/email-service.ts`

```typescript
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
      from: 'Thiart 3D <noreply@tudominio.com>', // Cambia esto
      to: [to],
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
                    
                    <!-- Header -->
                    <tr>
                      <td align="center" style="padding: 40px 20px 20px 20px;">
                        <h1 style="margin: 20px 0 10px 0; color: #1f2937; font-size: 28px; font-weight: bold;">
                          Thiart 3D
                        </h1>
                        <p style="margin: 0; color: #6b7280; font-size: 16px;">
                          Recuperación de Contraseña
                        </p>
                      </td>
                    </tr>

                    <!-- Contenido -->
                    <tr>
                      <td style="padding: 0 40px;">
                        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                          Hola ${userName},
                        </p>
                        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                          Recibimos una solicitud para restablecer tu contraseña. Tu código de verificación es:
                        </p>
                      </td>
                    </tr>

                    <!-- Código -->
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

                    <!-- Instrucciones -->
                    <tr>
                      <td style="padding: 0 40px 20px 40px;">
                        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px;">
                          <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
                            <strong>⚠️ Importante:</strong> Si no solicitaste este cambio, ignora este correo.
                          </p>
                        </div>
                      </td>
                    </tr>

                    <!-- Footer -->
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
    });

    if (error) {
      console.error('Error al enviar correo con Resend:', error);
      return { success: false, error };
    }

    console.log('Correo enviado exitosamente:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error en sendPasswordResetEmail:', error);
    return { success: false, error };
  }
}
```

### Actualizar el API route

Modifica: `src/app/api/auth/reset-password/route.ts`

Reemplaza la sección de envío de correo:

```typescript
// En lugar de usar Supabase Auth
// const { error: emailError } = await supabase.auth.resetPasswordForEmail(...)

// Usar Resend
import { sendPasswordResetEmail } from "~/lib/email-service";

const emailResult = await sendPasswordResetEmail({
  to: email,
  code: codigo,
  userName: usuario.nombre,
});

if (!emailResult.success) {
  console.error("Error al enviar correo:", emailResult.error);
  // Opcional: aún así continuar, ya que el código está guardado en DB
}
```

## 🎨 Plantillas con React Email (Opcional)

Para plantillas más sofisticadas, usa React Email:

```bash
npm install @react-email/components
```

Crea: `emails/password-reset.tsx`

```tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface PasswordResetEmailProps {
  code: string;
  userName?: string;
}

export default function PasswordResetEmail({
  code,
  userName = "Usuario",
}: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Tu código de recuperación de contraseña</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Thiart 3D</Heading>
          <Text style={text}>Hola {userName},</Text>
          <Text style={text}>
            Tu código de recuperación de contraseña es:
          </Text>
          <Section style={codeContainer}>
            <Text style={code}>{code}</Text>
          </Section>
          <Text style={text}>
            Este código expira en 15 minutos.
          </Text>
          <Text style={footer}>
            © 2025 Thiart 3D - Todos los derechos reservados
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f5f5f5',
  fontFamily: 'Arial, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '40px',
  maxWidth: '600px',
  margin: '40px auto',
};

const h1 = {
  color: '#1f2937',
  fontSize: '28px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '20px 0',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '20px 0',
};

const codeContainer = {
  background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
  borderRadius: '12px',
  padding: '30px',
  textAlign: 'center' as const,
  margin: '30px 0',
};

const code = {
  color: '#ffffff',
  fontSize: '48px',
  fontWeight: 'bold',
  letterSpacing: '8px',
  fontFamily: "'Courier New', monospace",
  margin: 0,
};

const footer = {
  color: '#6b7280',
  fontSize: '14px',
  textAlign: 'center' as const,
  marginTop: '40px',
};
```

Luego en el servicio de correo:

```typescript
import { render } from '@react-email/components';
import PasswordResetEmail from '../../emails/password-reset';

const emailHtml = render(
  <PasswordResetEmail code={code} userName={userName} />
);

const { data, error } = await resend.emails.send({
  from: 'Thiart 3D <noreply@tudominio.com>',
  to: [to],
  subject: 'Código de recuperación - Thiart 3D',
  html: emailHtml,
});
```

## 🔧 Configurar dominio personalizado

1. Ve a Resend Dashboard → Domains
2. Agrega tu dominio
3. Configura los registros DNS (MX, TXT, CNAME)
4. Verifica el dominio
5. Actualiza el `from` en el código:

```typescript
from: 'Thiart 3D <noreply@tudominio.com>'
```

## 📊 Monitoreo

En el dashboard de Resend puedes ver:
- Emails enviados
- Tasa de apertura
- Rebotes
- Quejas de spam
- Logs detallados

## 🧪 Testing

### Desarrollo
Resend permite enviar a cualquier email en desarrollo.

### Preview de emails
```bash
npx email dev
```

Esto abre un servidor local para previsualizar tus plantillas.

## 🚀 Deploy

1. Agrega `RESEND_API_KEY` a las variables de entorno en Vercel/Railway/etc
2. Configura tu dominio en Resend
3. Actualiza el `from` con tu dominio verificado
4. Deploy!

## 📝 Checklist de Resend

- [ ] Cuenta creada en Resend
- [ ] API key generada
- [ ] Variable de entorno configurada
- [ ] Servicio de correo creado
- [ ] API route actualizado
- [ ] Dominio agregado (opcional pero recomendado)
- [ ] DNS configurado
- [ ] Dominio verificado
- [ ] Plantillas personalizadas
- [ ] Testing completo
- [ ] Deploy a producción

## 💡 Tips

- **Dominio personalizado**: Mejora significativamente la deliverability
- **React Email**: Mantiene las plantillas con type-safety
- **Testing**: Usa el preview server para desarrollo
- **Logs**: Revisa el dashboard de Resend para debugging
- **Rate limits**: Plan gratuito tiene límites, considera upgrade para producción

---

Con Resend, tus correos de recuperación de contraseña se verán profesionales y llegarán confiablemente! 🎉
