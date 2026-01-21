# 🔐 Sistema de Recuperación de Contraseña sin Base de Datos

## ✨ ¿Cómo funciona?

En lugar de guardar los códigos en una tabla de base de datos, usamos **JWT (JSON Web Tokens)** para:
- Generar códigos de 6 dígitos aleatorios
- Cifrar el código junto con el email en un token JWT
- Validar el código directamente desde el token (sin consultar DB)
- Expiración automática de 15 minutos integrada en el token

## 🎯 Ventajas de este enfoque

✅ **Sin tabla adicional** - No necesitas crear `codigos_recuperacion`  
✅ **Más simple** - Menos queries a la base de datos  
✅ **Seguro** - Los tokens están firmados y tienen expiración  
✅ **Escalable** - No acumula registros en la DB  
✅ **Stateless** - El servidor no necesita guardar estado  

## 📋 Configuración

### 1. Variables de Entorno

Agrega a tu `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# JWT Secret (IMPORTANTE: Cambia esto en producción)
JWT_SECRET=tu_clave_secreta_super_segura_minimo_32_caracteres_aleatorios

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**⚠️ IMPORTANTE:** 
- El `JWT_SECRET` debe ser único y seguro
- Usa un generador de contraseñas para crear uno fuerte
- NUNCA compartas este secret en repositorios públicos

### 2. Generar un JWT_SECRET seguro

Puedes generar uno con Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

O en PowerShell:
```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

## 🔄 Flujo del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│ 1. SOLICITAR CÓDIGO                                         │
├─────────────────────────────────────────────────────────────┤
│ Usuario ingresa email                                       │
│   ↓                                                         │
│ Sistema verifica que el usuario existe                      │
│   ↓                                                         │
│ Genera código aleatorio de 6 dígitos                        │
│   ↓                                                         │
│ Crea JWT con: { email, codigo, exp: 15min }                │
│   ↓                                                         │
│ Envía código por correo                                     │
│   ↓                                                         │
│ Devuelve JWT token al frontend (para validación posterior)  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 2. VERIFICAR CÓDIGO                                         │
├─────────────────────────────────────────────────────────────┤
│ Usuario ingresa código de 6 dígitos                         │
│   ↓                                                         │
│ Frontend envía: { code, token }                             │
│   ↓                                                         │
│ Backend decodifica JWT                                       │
│   ↓                                                         │
│ Verifica: ¿Token válido? ¿No expirado? ¿Código coincide?   │
│   ↓                                                         │
│ Si todo OK → Código verificado ✓                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 3. ACTUALIZAR CONTRASEÑA                                    │
├─────────────────────────────────────────────────────────────┤
│ Usuario ingresa nueva contraseña                            │
│   ↓                                                         │
│ Frontend envía: { code, token, newPassword }                │
│   ↓                                                         │
│ Backend verifica JWT y código nuevamente                    │
│   ↓                                                         │
│ Actualiza contraseña en Supabase Auth                       │
│   ↓                                                         │
│ Contraseña actualizada exitosamente ✓                       │
└─────────────────────────────────────────────────────────────┘
```

## 🛡️ Seguridad

### ✅ Implementado:
- Tokens JWT firmados con secret
- Expiración automática de 15 minutos
- Validación en cada paso
- El código nunca se almacena en texto plano
- HTTPS en producción
- Service role key solo en backend

### 🔒 Mejores Prácticas:
- Cambia el `JWT_SECRET` en cada ambiente (dev, staging, prod)
- Usa HTTPS siempre en producción
- No expongas el service role key al frontend
- Limita intentos de verificación (opcional: implementar rate limiting)
- Usa correos con plantillas profesionales

## 📧 Envío de Correos

El sistema actualmente **registra en la tabla `notificaciones`** pero NO envía correos automáticamente.

### Opciones para enviar correos:

#### Opción 1: Resend (Recomendado) ✅

```bash
npm install resend
```

Ver guía completa en: `readme/INTEGRACION_RESEND.md`

#### Opción 2: SendGrid

```bash
npm install @sendgrid/mail
```

```typescript
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY ?? '');

await sgMail.send({
  to: email,
  from: 'noreply@tudominio.com',
  subject: 'Código de recuperación - Thiart 3D',
  html: `<h1>Tu código es: ${codigo}</h1>`,
});
```

#### Opción 3: Nodemailer con SMTP

```bash
npm install nodemailer
```

```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

await transporter.sendMail({
  from: '"Thiart 3D" <noreply@thiart3d.com>',
  to: email,
  subject: "Código de recuperación",
  html: `<h1>Tu código es: ${codigo}</h1>`,
});
```

## 🧪 Testing

### En Desarrollo:
El código aparece en la respuesta del API (propiedad `debug_codigo`).

```typescript
// En el API
debug_codigo: process.env.NODE_ENV === "development" ? codigo : undefined,
```

### En Producción:
**⚠️ IMPORTANTE:** Elimina o comenta la línea `debug_codigo` antes de hacer deploy.

## 🔍 Debugging

### Si el código no llega:
1. Revisa la tabla `notificaciones` en Supabase
2. Verifica que el usuario existe en la tabla `usuarios`
3. En desarrollo, el código aparece en el mensaje de éxito
4. Revisa la consola del servidor para errores

### Si el código es inválido:
1. Verifica que no hayan pasado 15 minutos
2. Asegúrate de usar el mismo token durante todo el flujo
3. El código debe ser exactamente 6 dígitos numéricos
4. Revisa que el `JWT_SECRET` sea el mismo en todas las llamadas

### Si no se actualiza la contraseña:
1. Verifica que tienes el `SUPABASE_SERVICE_ROLE_KEY` configurado
2. Revisa los logs del servidor
3. Asegúrate de que el usuario existe en Supabase Auth

## 📦 Archivos del Sistema

```
src/
├── app/
│   └── api/
│       └── auth/
│           └── reset-password/
│               └── route.ts          # API endpoint (JWT-based)
└── components/
    └── SupabaseAuth.tsx              # Componente con UI

readme/
├── RECUPERACION_SIN_BASE_DATOS.md    # Esta guía
└── INTEGRACION_RESEND.md             # Guía de correos
```

## ✅ Checklist de Implementación

- [x] `jsonwebtoken` instalado
- [ ] `JWT_SECRET` generado y agregado a `.env.local`
- [ ] Variables de Supabase configuradas
- [ ] Servicio de correo elegido e integrado
- [ ] Plantillas de correo personalizadas
- [ ] Testing en desarrollo
- [ ] `debug_codigo` eliminado para producción
- [ ] Deploy con variables de entorno correctas

## 🎨 Personalización

### Cambiar tiempo de expiración:
```typescript
// En route.ts, función generarTokenReset
exp: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutos
```

### Cambiar longitud del código:
```typescript
// En route.ts, función generarCodigo
return Math.floor(10000 + Math.random() * 90000).toString(); // 5 dígitos
return Math.floor(1000000 + Math.random() * 9000000).toString(); // 7 dígitos
```

## 🚀 Deploy

### Vercel:
```bash
vercel env add JWT_SECRET
vercel env add SUPABASE_SERVICE_ROLE_KEY
# ... otras variables
```

### Railway/Render:
Agrega las variables de entorno en el dashboard.

## 💡 Tips

- **Rate Limiting**: Considera implementar límites de intentos por IP
- **Logs**: Usa un servicio como Sentry para monitorear errores
- **Analytics**: Trackea cuántos usuarios recuperan su contraseña
- **UX**: Considera agregar un botón "Reenviar código"
- **Seguridad**: Implementa CAPTCHA si detectas muchos intentos

## 🆘 Soporte

Si tienes problemas:
1. Revisa los logs del servidor
2. Verifica todas las variables de entorno
3. Usa el modo debug (código visible en desarrollo)
4. Revisa la tabla `notificaciones` en Supabase
5. Asegúrate de que el servicio de correo esté configurado

---

## 📊 Comparación: Con DB vs Sin DB

| Aspecto | Con Base de Datos | Sin Base de Datos (JWT) |
|---------|-------------------|-------------------------|
| **Complejidad** | Alta (tabla, RLS, limpieza) | Baja (solo JWT) |
| **Queries DB** | 3-4 por flujo | 1-2 por flujo |
| **Escalabilidad** | Requiere limpieza | Automática |
| **Seguridad** | Alta | Alta |
| **Debugging** | Fácil (ver tabla) | Medio (logs) |
| **Mantenimiento** | Alto | Bajo |
| **Recomendado** | Apps enterprise | Apps pequeñas/medianas |

**✅ Recomendación:** Para Thiart 3D, el enfoque sin base de datos (JWT) es ideal por su simplicidad y eficiencia.

---

¡Sistema implementado exitosamente sin necesidad de tabla adicional! 🎉
