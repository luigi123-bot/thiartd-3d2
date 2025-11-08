# Instrucciones de Configuración - Recuperación de Contraseña

## 📋 Pasos para implementar la funcionalidad

### 1. Crear la tabla en Supabase

1. Ve al panel de Supabase: https://app.supabase.com
2. Selecciona tu proyecto
3. Ve a **SQL Editor** en el menú lateral
4. Copia y pega el contenido del archivo `database/create_codigos_recuperacion_table.sql`
5. Haz clic en **Run** para ejecutar el script

### 2. Configurar variables de entorno

Asegúrate de tener estas variables en tu archivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000  # O tu dominio en producción
```

**Importante:** El `SUPABASE_SERVICE_ROLE_KEY` es necesario para actualizar contraseñas de usuarios. Lo encuentras en:
- Supabase Dashboard → Settings → API → Project API keys → `service_role` key

⚠️ **NUNCA expongas esta clave en el frontend**

### 3. Configurar correos electrónicos (Opcional pero recomendado)

#### Opción A: Usar SMTP de Supabase (Por defecto)
Supabase envía correos automáticamente, pero tienen limitaciones en el plan gratuito.

#### Opción B: Configurar tu propio SMTP
1. Ve a Supabase Dashboard → Authentication → Email Templates
2. Configura tu proveedor SMTP (Gmail, SendGrid, Resend, etc.)

#### Opción C: Integrar servicio de correo dedicado
Para producción, considera integrar servicios como:
- **Resend** (recomendado, fácil de usar)
- **SendGrid**
- **Mailgun**
- **Amazon SES**

Para integrar Resend, por ejemplo:
```bash
npm install resend
```

Luego modifica el archivo `src/app/api/auth/reset-password/route.ts` para usar Resend en lugar de Supabase Auth.

### 4. Probar la funcionalidad

1. Inicia tu aplicación: `npm run dev`
2. Ve a la página de login
3. Haz clic en "¿Olvidaste tu contraseña?"
4. Ingresa tu correo electrónico
5. **En desarrollo**, el código aparecerá en la respuesta (revisa la consola o el mensaje de éxito)
6. Ingresa el código de 6 dígitos
7. Establece tu nueva contraseña

### 5. Modo desarrollo vs Producción

**Desarrollo:**
- El código se muestra en el mensaje de éxito
- Se registra en la tabla `notificaciones`

**Producción:**
- El código SOLO se envía por correo
- Asegúrate de eliminar o comentar la línea que devuelve `debug_codigo` en el API

## 🔒 Seguridad

- Los códigos expiran en 15 minutos
- Los códigos son de un solo uso
- Se usa HTTPS en producción
- El service role key nunca se expone al frontend
- Los códigos usados se marcan como "usado"

## 🧹 Mantenimiento

Para limpiar códigos expirados, ejecuta periódicamente en Supabase:

```sql
SELECT limpiar_codigos_expirados();
```

O configura un cron job en Supabase Dashboard → Database → Cron Jobs.

## 📧 Personalizar el correo

Edita las plantillas de correo en:
- Supabase Dashboard → Authentication → Email Templates
- O implementa tu propio servicio de correo en el API route

## ✅ Checklist de implementación

- [ ] Tabla `codigos_recuperacion` creada en Supabase
- [ ] Variables de entorno configuradas
- [ ] SMTP configurado (opcional pero recomendado)
- [ ] Funcionalidad probada en desarrollo
- [ ] Código de debug eliminado para producción
- [ ] Plantillas de correo personalizadas
- [ ] Cron job para limpieza de códigos configurado

## 🆘 Solución de problemas

### El código no llega por correo
- Verifica que el email esté registrado en la tabla `usuarios`
- Revisa la configuración SMTP en Supabase
- Revisa la tabla `notificaciones` para ver si se guardó el mensaje
- En desarrollo, el código aparece en el mensaje de éxito

### Error al actualizar contraseña
- Verifica que tengas el `SUPABASE_SERVICE_ROLE_KEY` configurado
- Asegúrate de que el usuario existe en Supabase Auth

### Código inválido o expirado
- Los códigos expiran en 15 minutos
- Solicita un nuevo código
- Verifica que el código sea de 6 dígitos numéricos
