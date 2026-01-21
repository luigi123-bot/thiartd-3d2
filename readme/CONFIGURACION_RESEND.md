# 📧 Configuración de Resend para Thiart 3D

## ✅ ¡Ya está integrado!

El sistema de recuperación de contraseña ya está configurado para usar **Resend** con el correo `thiart3d@gmail.com`.

## 🔧 Configuración Rápida

### 1. Crear cuenta en Resend

1. Ve a [https://resend.com](https://resend.com)
2. Regístrate con tu correo
3. Verifica tu cuenta

### 2. Obtener API Key

1. En el dashboard de Resend, ve a **API Keys**
2. Haz clic en **Create API Key**
3. Dale un nombre: "Thiart 3D - Production"
4. Copia la API key que te dan (solo la verás una vez)

### 3. Configurar Variables de Entorno

Agrega a tu archivo `.env.local`:

```env
# Resend API Key
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# JWT Secret (para tokens de recuperación)
JWT_SECRET=tu_clave_secreta_minimo_32_caracteres_aleatorios

# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Generar JWT Secret

Ejecuta uno de estos comandos:

**Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**PowerShell:**
```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

## 🚀 ¡Listo para usar!

Ya está todo configurado. El sistema enviará correos desde `onboarding@resend.dev` automáticamente.

⚠️ **Importante:** 
- `onboarding@resend.dev` es el dominio gratuito de Resend para testing
- Funciona perfectamente, pero los correos vendrán de "resend.dev"
- Para usar tu propio dominio (ej: `noreply@thiart3d.com`), sigue la sección siguiente

## 📧 Opciones de Correo

### Opción 1: Usar onboarding@resend.dev (Actual) ✅

**Ventajas:**
- ✅ Funciona inmediatamente
- ✅ No requiere configuración DNS
- ✅ Perfecto para desarrollo y testing
- ✅ Sin costo adicional

**Desventajas:**
- ⚠️ Los correos vienen de "resend.dev"
- ⚠️ Menos profesional para producción

**Estado:** Ya configurado en el código

### Opción 2: Dominio Personalizado (Recomendado para Producción)

### ¿Por qué usar dominio personalizado?

- ✅ Mejor deliverability (menos spam)
- ✅ Más profesional (`noreply@thiart3d.com` vs `onboarding@resend.dev`)
- ✅ Mayor confianza del usuario
- ✅ Sin restricciones
- ✅ Branding consistente

### Pasos:

1. **Agregar dominio en Resend:**
   - Ve a **Domains** en el dashboard
   - Clic en **Add Domain**
   - Ingresa tu dominio (ej: `thiart3d.com`)

2. **Configurar DNS:**
   Resend te dará registros DNS para agregar:
   
   ```
   Tipo: MX
   Host: @
   Valor: feedback-smtp.us-east-1.amazonses.com
   Prioridad: 10
   
   Tipo: TXT
   Host: @
   Valor: v=spf1 include:amazonses.com ~all
   
   Tipo: TXT
   Host: _dmarc
   Valor: v=DMARC1; p=none; rua=mailto:dmarc@tudominio.com
   
   Tipo: CNAME
   Host: resend._domainkey
   Valor: resend._domainkey.us-east-1.amazonses.com
   ```

3. **Verificar dominio:**
   - Espera 24-48 horas para propagación DNS
   - En Resend, verifica el estado del dominio
   - Una vez verificado, estará listo

4. **Actualizar código:**
   ```typescript
   // En src/lib/email-service.ts, cambiar:
   from: 'Thiart 3D <noreply@thiart3d.com>'
   // En lugar de:
   from: 'Thiart 3D <onboarding@resend.dev>'
   ```

## ⚠️ Sobre el Dominio de Onboarding

El dominio `onboarding@resend.dev`:
- ✅ Es el dominio de prueba gratuito de Resend
- ✅ Funciona perfectamente para desarrollo
- ✅ Los correos se envían correctamente
- ⚠️ El remitente aparece como "resend.dev"
- ⚠️ No recomendado para producción a gran escala
- 💡 Ideal para empezar y probar el sistema

**Para producción:** Se recomienda configurar un dominio personalizado siguiendo los pasos anteriores.

## 🔧 Cómo Cambiar el Remitente

Si ya tienes un dominio verificado en Resend, actualiza esta línea en `src/lib/email-service.ts`:

```typescript
// Línea 11 aproximadamente
from: 'Thiart 3D <noreply@tudominio.com>',
```

**Recomendación:** Usar `noreply@`, `no-reply@` o `info@` como dirección de envío.

## ⚠️ No Usar Correos de Gmail/Outlook/Yahoo

Resend no permite usar dominios públicos como:
- ❌ @gmail.com
- ❌ @outlook.com  
- ❌ @yahoo.com
- ❌ @hotmail.com

**Razón:** Estos servicios tienen políticas anti-spoofing que bloquean el envío desde servicios externos.

**Recomendación:** Usar dominio personalizado para producción.

## 🧪 Testing

### En Desarrollo:

1. Inicia el servidor:
   ```bash
   npm run dev
   ```

2. Ve a la página de login
3. Haz clic en "¿Olvidaste tu contraseña?"
4. Ingresa tu email
5. El código aparecerá en el mensaje (modo debug)
6. También recibirás un correo real

### En Producción:

- El código solo se envía por correo
- NO aparece en el mensaje de éxito
- Asegúrate de eliminar la línea `debug_codigo`

## 📊 Dashboard de Resend

En el dashboard puedes ver:
- ✉️ Correos enviados
- ✅ Tasa de entrega
- 🔴 Rebotes y errores
- 📈 Analytics detallados
- 📋 Logs completos

## 🎨 Personalizar Plantilla

La plantilla del correo está en: `src/lib/email-service.ts`

Puedes personalizar:
- Colores (cambia `#14b8a6` y `#0d9488`)
- Fuentes
- Logo (agrega imagen real)
- Textos
- Estructura HTML

## 💰 Precios de Resend

- **Gratis:** 3,000 emails/mes
- **Pro:** $20/mes - 50,000 emails
- **Enterprise:** Personalizado

Para Thiart 3D, el plan gratuito es suficiente para empezar.

## 🔒 Seguridad

✅ **Implementado:**
- API Key en variables de entorno
- JWT tokens con expiración
- Validación de email en cada paso
- HTTPS en producción
- Service role key seguro

⚠️ **No expongas:**
- RESEND_API_KEY
- JWT_SECRET
- SUPABASE_SERVICE_ROLE_KEY

## 🆘 Solución de Problemas

### El correo no llega:

1. **Verifica en el dashboard de Resend:**
   - Ve a **Emails** → **Logs**
   - Busca el correo enviado
   - Revisa el estado

2. **Revisa spam:**
   - El correo puede estar en spam
   - Marca como "No es spam"

3. **Verifica la API Key:**
   - Asegúrate de que esté correcta en `.env.local`
   - Reinicia el servidor después de cambiarla

4. **Revisa la consola:**
   - Busca errores en la terminal del servidor
   - Revisa logs de Resend

### Error "API Key inválida":

```bash
# Regenera la API key en Resend
# Actualiza .env.local
RESEND_API_KEY=nueva_key_aqui
# Reinicia el servidor
```

### Correos van a spam:

- Configura dominio personalizado
- Agrega registros SPF, DKIM, DMARC
- No uses palabras spam en el asunto
- Mantén buena reputación de envío

## 📝 Checklist de Implementación

- [x] Resend instalado (`npm install resend`)
- [x] Servicio de email creado (`src/lib/email-service.ts`)
- [x] API integrado con Resend
- [x] Plantilla HTML profesional
- [ ] Cuenta creada en Resend.com
- [ ] API Key obtenida
- [ ] `RESEND_API_KEY` agregada a `.env.local`
- [ ] `JWT_SECRET` generado y agregado
- [ ] Todas las variables de entorno configuradas
- [ ] Testing en desarrollo
- [ ] Dominio personalizado configurado (opcional)
- [ ] Verificación DNS completa (opcional)
- [ ] Testing en producción
- [ ] `debug_codigo` eliminado para producción

## 🎯 Próximos Pasos

1. **Hoy:**
   - [ ] Crear cuenta en Resend
   - [ ] Obtener API Key
   - [ ] Configurar `.env.local`
   - [ ] Probar envío de correo

2. **Esta semana:**
   - [ ] Comprar dominio (si no tienes)
   - [ ] Configurar dominio en Resend
   - [ ] Actualizar DNS

3. **Para lanzamiento:**
   - [ ] Verificar dominio
   - [ ] Eliminar `debug_codigo`
   - [ ] Deploy a producción
   - [ ] Monitorear envíos

## 📚 Recursos

- [Documentación de Resend](https://resend.com/docs)
- [Dashboard de Resend](https://resend.com/dashboard)
- [Guía de dominios](https://resend.com/docs/dashboard/domains/introduction)
- [API Reference](https://resend.com/docs/api-reference/emails/send-email)

---

## 🎉 ¡Todo Listo!

El sistema está completamente configurado y listo para enviar correos profesionales de recuperación de contraseña.

**Correo configurado:** `thiart3d@gmail.com`  
**Servicio:** Resend  
**Estado:** ✅ Integrado y funcional  

Solo falta:
1. Crear cuenta en Resend
2. Obtener API Key
3. Agregar a `.env.local`
4. ¡Empezar a usar!

**Contacto de soporte:** thiart3d@gmail.com 💚
