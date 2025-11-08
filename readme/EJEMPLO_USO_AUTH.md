# 🎨 Guía de Uso: Nuevo Componente de Autenticación

## Cambios Implementados

El componente `SupabaseAuth` ha sido rediseñado con un estilo moderno y limpio siguiendo las especificaciones:

### ✨ Características Nuevas

1. **Card centrado** sin overlay ni fondo difuminado
2. **Logo circular animado** con efecto hover (escala + rotación)
3. **Título "Bienvenido a Thiart 3D"** en texto negro, fuente semibold
4. **Tabs de shadcn/ui** para alternar entre Login y Registro
   - Tab activo: Fondo negro con texto blanco
   - Tab inactivo: Borde turquesa con texto gris
5. **Inputs con labels** y focus en color turquesa (#00a19a)
6. **Enlace "¿Olvidaste tu contraseña?"** en turquesa con hover underline
7. **Botón principal** negro con hover turquesa
8. **Botón cerrar (❌)** en esquina superior derecha (opcional)
9. **Animaciones suaves** con framer-motion
10. **Campo "Confirmar contraseña"** en el registro

### 🎨 Paleta de Colores

```css
Principal: #00a19a (Turquesa)
Hover: #008c87 (Turquesa oscuro)
Botón: #000000 (Negro)
Focus: #00a19a (Turquesa)
Texto: #000000 (Negro)
Labels: #374151 (Gris 700)
Bordes: #D1D5DB (Gris 300)
```

## 📝 Uso Básico

### Opción 1: Página completa (sin botón cerrar)

```tsx
import SupabaseAuth from "~/components/SupabaseAuth";

export default function LoginPage() {
  return <SupabaseAuth />;
}
```

### Opción 2: Con botón cerrar y callback

```tsx
'use client';

import { useState } from "react";
import SupabaseAuth from "~/components/SupabaseAuth";
import { Button } from "~/components/ui/button";

export default function HomePage() {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div>
      <Button onClick={() => setShowAuth(true)}>
        Iniciar Sesión
      </Button>

      {showAuth && (
        <div className="fixed inset-0 z-50">
          <SupabaseAuth 
            onClose={() => setShowAuth(false)}
            onAuth={(user) => {
              console.log("Usuario autenticado:", user);
              setShowAuth(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
```

### Opción 3: Como Modal (con Dialog de shadcn)

```tsx
'use client';

import { useState } from "react";
import { Dialog, DialogContent } from "~/components/ui/dialog";
import SupabaseAuth from "~/components/SupabaseAuth";
import { Button } from "~/components/ui/button";

export default function HomePage() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setOpen(true)}>
        Iniciar Sesión
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 max-w-2xl">
          <SupabaseAuth 
            onClose={() => setOpen(false)}
            onAuth={(user) => {
              console.log("Usuario autenticado:", user);
              setOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

## 🔧 Props del Componente

| Prop | Tipo | Descripción | Requerido |
|------|------|-------------|-----------|
| `onAuth` | `(user: UsuarioDB) => void` | Callback cuando el usuario inicia sesión | No |
| `onClose` | `() => void` | Callback para cerrar el modal (muestra botón ❌) | No |

## 📱 Responsive

El diseño es completamente responsive:

- Mobile: Ancho completo con padding
- Tablet/Desktop: Card de max-width 28rem (448px)
- Centrado vertical y horizontal con flexbox

## 🎭 Animaciones

### Entrada del Card
```tsx
initial={{ opacity: 0, scale: 0.95, y: 20 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
transition={{ duration: 0.3 }}
```

### Logo Hover
```tsx
whileHover={{ scale: 1.05, rotate: 5 }}
```

### Alertas (errores/éxito)
```tsx
initial={{ opacity: 0, y: -10 }}
animate={{ opacity: 1, y: 0 }}
```

## 🔐 Flujos de Autenticación

### 1. Iniciar Sesión
1. Usuario ingresa email y contraseña
2. Click en "Iniciar sesión" (botón negro)
3. Redirección automática tras login exitoso

### 2. Registrarse
1. Usuario cambia a tab "Registrarse"
2. Ingresa: nombre, email, contraseña, confirmar contraseña
3. Validación de contraseñas coincidentes
4. Click en "Registrarse"
5. Redirección automática

### 3. Recuperar Contraseña
1. Click en "¿Olvidaste tu contraseña?"
2. Ingresa email
3. Recibe código de 6 dígitos
4. Ingresa código de verificación
5. Establece nueva contraseña
6. Vuelve al login

## 🎯 Personalización

### Cambiar colores

Edita los valores en el componente:

```tsx
// Color turquesa principal
className="text-[#00a19a]"
className="focus:border-[#00a19a]"

// Botón negro
className="bg-black hover:bg-[#00a19a]"
```

### Cambiar tamaño del logo

```tsx
<div className="relative w-20 h-20"> {/* Cambiar valores */}
  <Image width={70} height={70} /> {/* Ajustar proporcionalmente */}
</div>
```

### Modificar animación del logo

```tsx
whileHover={{ 
  scale: 1.1,      // Más zoom
  rotate: 10,      // Más rotación
}}
transition={{ 
  type: "spring", 
  stiffness: 500   // Más rápido
}}
```

## 🐛 Solución de Problemas

### El botón cerrar no aparece
- Asegúrate de pasar la prop `onClose`
- Si no la pasas, el botón no se renderiza

### Los tabs no cambian de color
- Verifica que Tailwind esté compilando las clases `data-[state=active]`
- Revisa que el componente Tabs esté actualizado

### Las animaciones no funcionan
- Confirma que `framer-motion` está instalado:
  ```bash
  npm install framer-motion
  ```

### El logo no se muestra
- Verifica que `/public/IG Foto de Perfil.png` existe
- Cambia la ruta si el logo está en otra ubicación

## 📚 Dependencias Necesarias

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x",
    "framer-motion": "^11.x",
    "lucide-react": "^0.x",
    "next": "^15.x",
    "react": "^18.x"
  }
}
```

## 🚀 Mejoras Futuras Opcionales

1. **Autenticación con redes sociales** (Google, GitHub)
2. **Verificación de email** tras registro
3. **Captcha** para prevenir bots
4. **Two-Factor Authentication (2FA)**
5. **Recordar sesión** (checkbox)
6. **Modo oscuro** alternativo
