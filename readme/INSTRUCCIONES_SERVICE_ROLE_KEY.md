# 🔑 Configuración de SUPABASE_SERVICE_ROLE_KEY

## Error Actual
```
Error [AuthApiError]: User not allowed
status: 403,
code: 'not_admin'
```

Este error indica que tu API está usando la clave anónima (`anon key`) en lugar de la clave de servicio (`service_role key`).

## Solución: Obtener tu Service Role Key

### Paso 1: Ir a tu proyecto de Supabase
1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto

### Paso 2: Obtener la Service Role Key
1. En el menú lateral, haz clic en **⚙️ Settings** (Configuración)
2. Luego en **API**
3. Busca la sección **Project API keys**
4. Encontrarás dos claves:
   - `anon` / `public` - Esta es pública ✅
   - `service_role` - Esta es **PRIVADA** ⚠️ (la que necesitas)

### Paso 3: Copiar la Service Role Key
1. En la fila de `service_role`, haz clic en el ícono de **"Reveal"** o **"Show"**
2. Copia la clave completa (es muy larga, empieza con `eyJ...`)

### Paso 4: Agregar al archivo .env.local
Crea o edita el archivo `.env.local` en la raíz de tu proyecto:

```env
# Supabase Service Role Key (PRIVADA - NO COMPARTIR)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...
```

⚠️ **IMPORTANTE**: 
- Esta clave debe estar **SOLO** en `.env.local`
- **NUNCA** la compartas en GitHub o la hagas pública
- **NO** la uses en el código del cliente (solo en API routes)
- Asegúrate de que `.env.local` esté en tu `.gitignore`

### Paso 5: Reiniciar el servidor de desarrollo
Después de agregar la variable de entorno:

```powershell
# Detener el servidor (Ctrl + C)
# Luego reiniciar
npm run dev
```

## Verificación

El archivo `.env.local` debe contener:

```env
# Supabase (públicas)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey... (anon key)

# Supabase Service Role (PRIVADA)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey... (service_role key - diferente!)

# JWT para reset password
JWT_SECRET=tu_jwt_secret_generado

# Resend
RESEND_API_KEY=re_tu_api_key
```

## ¿Por qué necesitamos la Service Role Key?

La `service_role key` tiene **permisos completos de administrador** y permite:
- ✅ Actualizar contraseñas de usuarios sin autenticación previa
- ✅ Crear, leer, actualizar y eliminar usuarios
- ✅ Bypasear Row Level Security (RLS)
- ✅ Acceso completo a todas las tablas y operaciones

La `anon key` es limitada y solo permite operaciones de usuarios autenticados.

## Seguridad

La `service_role key` solo debe usarse en:
- ✅ API Routes de Next.js (backend)
- ✅ Funciones serverless
- ✅ Scripts de servidor

**NUNCA** en:
- ❌ Componentes de React
- ❌ Código del cliente
- ❌ Variables de entorno públicas (NEXT_PUBLIC_*)

---

Una vez configurada la clave, el endpoint de reset password funcionará correctamente.
