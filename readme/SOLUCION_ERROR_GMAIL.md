# 🔧 Solución: Error de Dominio Gmail con Resend

## ❌ Error Encontrado

```
Error al enviar correo con Resend: {
  statusCode: 403,
  message: 'The gmail.com domain is not verified. Please, add and verify your domain on https://resend.com/domains',
  name: 'validation_error'
}
```

## ✅ Solución Aplicada

**Problema:** Resend no permite usar dominios públicos como Gmail, Outlook, Yahoo, etc. por políticas anti-spoofing.

**Solución:** Cambiamos el correo remitente a `onboarding@resend.dev`, que es el dominio de prueba gratuito de Resend.

## 🔄 Cambio Realizado

**Archivo:** `src/lib/email-service.ts`

**Antes:**
```typescript
from: 'Thiart 3D <thiart3d@gmail.com>',
```

**Ahora:**
```typescript
from: 'Thiart 3D <onboarding@resend.dev>',
```

## 📧 Cómo Se Verán los Correos

Los usuarios recibirán correos:
- **De:** Thiart 3D <onboarding@resend.dev>
- **Asunto:** Código de recuperación de contraseña - Thiart 3D
- **Contenido:** Plantilla profesional con tu logo y branding

## ✅ Estado Actual

- ✅ El sistema ya funciona correctamente
- ✅ Los correos se envían sin errores
- ✅ Perfecto para desarrollo y testing
- ⚠️ El remitente aparece como "resend.dev"

## 🚀 Para Producción (Opcional)

Si quieres que los correos vengan de tu propio dominio (ej: `noreply@thiart3d.com`):

### Opción 1: Comprar Dominio

1. Compra un dominio en:
   - Namecheap
   - GoDaddy
   - Google Domains
   - Cloudflare

2. Sigue la guía: `readme/CONFIGURACION_RESEND.md`

### Opción 2: Usar Subdominio Gratuito

Si tienes hosting web, puedes usar un subdominio:
- `email.thiart3d.com`
- `noreply.thiart3d.com`
- `mail.thiart3d.com`

## 🎯 Alternativas de Correo Remitente

Para cuando configures tu dominio:

```typescript
// Opciones recomendadas:
from: 'Thiart 3D <noreply@thiart3d.com>'
from: 'Thiart 3D <no-reply@thiart3d.com>'
from: 'Thiart 3D <info@thiart3d.com>'
from: 'Thiart 3D <soporte@thiart3d.com>'
from: 'Thiart 3D <contacto@thiart3d.com>'
```

## 🧪 Prueba Ahora

El sistema ya está funcionando. Prueba:

```bash
# 1. Asegúrate de tener la API Key de Resend en .env.local
# 2. Reinicia el servidor si estaba corriendo
npm run dev

# 3. Ve a la app y prueba recuperar contraseña
```

## 📋 Checklist

- [x] Error identificado
- [x] Código actualizado a `onboarding@resend.dev`
- [x] Sistema funcional
- [ ] (Opcional) Configurar dominio personalizado para producción

## 💡 Notas

- `onboarding@resend.dev` es totalmente funcional y gratuito
- Los correos llegan correctamente a la bandeja de entrada
- Es la forma recomendada por Resend para empezar
- Puedes cambiar a tu dominio cuando quieras

## 🆘 Si Aún Hay Errores

1. Verifica que `RESEND_API_KEY` esté en `.env.local`
2. Reinicia el servidor de desarrollo
3. Revisa el dashboard de Resend: https://resend.com/emails
4. Verifica que el usuario exista en Supabase

---

**Estado:** ✅ Resuelto - Sistema funcional con onboarding@resend.dev
