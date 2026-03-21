# Sistema de Recordatorio de Carrito Abandonado

Este sistema permite persistir los carritos de los usuarios registrados y enviarles un recordatorio por correo electrónico si no han completado su compra después de 2 días.

## Componentes

1.  **Tabla `carrito`**: Almacena los productos, el usuario y el estado del recordatorio.
2.  **Sincronización Automática**: El componente `CarritoProvider` sincroniza localmente el carrito con la base de datos cada vez que cambia (para usuarios logueados).
3.  **API de Recordatorios**: `GET /api/cart/remind` busca carritos de hace >2 días y envía el email.
4.  **Limpieza Automática**: El webhook de Wompi elimina el carrito de la BD tras un pago exitoso.

## Cómo Automatizar (Cron Job)

Para que el sistema envíe los correos automáticamente, debes configurar una tarea programada que llame a:
`GET https://tu-dominio.com/api/cart/remind`

### Opciones de Automatización:

#### 1. Vercel Cron Jobs (Recomendado si usas Vercel)
Añade lo siguiente a tu `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cart/remind",
      "schedule": "0 10 * * *"
    }
  ]
}
```
*(Esto ejecutará el recordatorio todos los días a las 10:00 AM)*

#### 2. Manualmente o con un Servicio Externo (Cron-job.org)
Simplemente configura el servicio para que haga una petición GET a la URL de la API una vez al día.

## Personalización del Correo
El diseño del correo se encuentra en `src/lib/email-service.ts` bajo la función `sendAbandonedCartReminder`. Utiliza un estilo premium con degradados y botones interactivos.
