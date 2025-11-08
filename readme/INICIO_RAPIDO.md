# 🚀 Inicio Rápido - Sistema de Recuperación de Contraseña

## ⚡ En 5 Minutos

### 1️⃣ Crear Cuenta en Resend (2 min)

```
1. Ve a: https://resend.com/signup
2. Regístrate con tu email
3. Verifica tu correo
4. Ve a: https://resend.com/api-keys
5. Crea API Key → Copia la key
```

### 2️⃣ Configurar Variables de Entorno (1 min)

Copia `.env.example` como `.env.local` y completa:

```env
# Pega tu API Key de Resend
RESEND_API_KEY=re_aqui_tu_api_key_de_resend

# Genera un secret con este comando:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=genera_una_clave_secreta_aqui

# Tus datos de Supabase (ya los debes tener)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# URL de tu app
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3️⃣ Generar JWT Secret (30 seg)

```bash
# Ejecuta este comando en tu terminal:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copia el resultado y pégalo en JWT_SECRET
```

### 4️⃣ Iniciar Aplicación (1 min)

```bash
npm run dev
```

### 5️⃣ Probar (30 seg)

```
1. Abre: http://localhost:3000
2. Click en "¿Olvidaste tu contraseña?"
3. Ingresa un email registrado
4. Revisa tu inbox
5. Ingresa el código de 6 dígitos
6. Cambia tu contraseña
7. ✅ ¡Listo!
```

---

## 📧 ¿Qué Correo Llegará?

El usuario recibirá un correo profesional desde **onboarding@resend.dev** con:
- Logo de Thiart 3D
- Código de 6 dígitos grande y destacado
- Instrucciones claras
- Advertencia de expiración (15 minutos)
- Diseño moderno y responsive

> **Nota:** `onboarding@resend.dev` es el dominio gratuito de Resend. Funciona perfectamente para desarrollo y testing. Para producción, puedes configurar tu propio dominio siguiendo la guía en `readme/CONFIGURACION_RESEND.md`.

---

## ⚠️ Solución Rápida de Problemas

### El correo no llega:
- ✅ Revisa spam/correo no deseado
- ✅ Verifica que el email esté registrado en Supabase
- ✅ En desarrollo, el código aparece en el mensaje de éxito
- ✅ Revisa el dashboard de Resend: https://resend.com/emails

### Error de API Key:
- ✅ Verifica que esté en `.env.local`
- ✅ Reinicia el servidor (`Ctrl+C` y `npm run dev`)
- ✅ Asegúrate de que no tenga espacios ni comillas

### Código inválido:
- ✅ Verifica que no hayan pasado 15 minutos
- ✅ El código debe ser exactamente 6 dígitos
- ✅ Usa el código más reciente si solicitaste varios

---

## 📋 Variables Requeridas (Checklist)

- [ ] `RESEND_API_KEY` - De Resend.com
- [ ] `JWT_SECRET` - Generado con crypto
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - De Supabase
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - De Supabase
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - De Supabase (Settings → API)
- [ ] `NEXT_PUBLIC_APP_URL` - http://localhost:3000

---

## 🎯 Próximos Pasos

### Para Desarrollo:
✅ Ya está todo listo, solo configura las variables

### Para Producción:
1. Configura dominio personalizado en Resend (opcional)
2. Elimina la línea `debug_codigo` en el API
3. Usa `JWT_SECRET` diferente al de desarrollo
4. Configura variables en Vercel/Railway/etc
5. Deploy 🚀

---

## 📚 Documentación Completa

Si necesitas más detalles:
- `readme/CONFIGURACION_RESEND.md` - Guía detallada de Resend
- `readme/RECUPERACION_SIN_BASE_DATOS.md` - Explicación técnica
- `RESUMEN_FINAL_COMPLETO.md` - Resumen completo del sistema

---

## 💚 ¡Listo!

Tu sistema de recuperación de contraseña está configurado y listo para usar.

**Correo configurado:** thiart3d@gmail.com  
**Tiempo de configuración:** ~5 minutos  
**Estado:** ✅ Funcional  

**¿Dudas?** Revisa la documentación en la carpeta `readme/`
