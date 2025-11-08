# Integración de Wompi - Guía Completa

## 🎯 Resumen de la Integración

Se ha implementado completamente el sistema de pagos con Wompi usando el entorno de pruebas (sandbox). El flujo completo incluye:

1. ✅ Creación de pedido en la base de datos
2. ✅ Generación de link de pago con Wompi
3. ✅ Redirección del usuario a la pasarela de pago
4. ✅ Webhook para recibir notificaciones de estado
5. ✅ Página de confirmación con verificación de pago

## 🔑 Credenciales Configuradas

Las siguientes variables están configuradas en `.env.local`:

```env
# Wompi Test Environment
NEXT_PUBLIC_WOMPI_PUBLIC_KEY=pub_test_zNyc4KdZBloTFFf6TGHe4uA6tyzyHM9t
WOMPI_PRIVATE_KEY=prv_test_swXdcpZnTANgkTQ5ekxUtsBY17Krz7Ki
WOMPI_EVENTS_SECRET=test_events_9lDwab7WrKl442bnMItmNVji3QyDC5jq
WOMPI_INTEGRITY_SECRET=test_integrity_O0GrS556qjHWbMkfLY1GDBWrT80Y4HV8
```

## 📁 Archivos Modificados

### 1. `/src/app/tienda/carrito/page.tsx`
**Función principal:** `procesarPagoWompi()`

**Flujo:**
```typescript
1. Validar carrito y usuario
2. Crear pedido en BD con estado "pendiente_pago"
3. Llamar a /api/pago-wompi para crear link de pago
4. Actualizar pedido con payment_id
5. Guardar pedido_id en localStorage
6. Redirigir a Wompi
```

**Botón de pago:**
```tsx
<Button onClick={procesarPagoWompi}>
  Pagar con Wompi ${formatearPrecio(total)}
</Button>
```

### 2. `/src/app/api/pago-wompi/route.ts`
**Función:** Crear links de pago en Wompi

**Características:**
- ✅ Auto-detección de entorno (test/producción)
- ✅ Usa `sandbox.wompi.co` para keys de test
- ✅ Usa `production.wompi.co` para keys de producción
- ✅ Genera referencias únicas: `PEDIDO-{id}-{timestamp}`
- ✅ Configura redirect_url para retorno

**Endpoint:** `POST /api/pago-wompi`

**Body:**
```json
{
  "amount": 50000,
  "customer_email": "cliente@ejemplo.com",
  "customer_name": "Cliente",
  "customer_phone": "+57 300 123 4567",
  "reference": "PEDIDO-123",
  "redirect_url": "https://tuapp.com/tienda/pago-exitoso?pedido=123"
}
```

**Response:**
```json
{
  "payment_id": "123-abc-xyz",
  "permalink": "https://sandbox.wompi.co/l/abc123"
}
```

### 3. `/src/app/api/webhooks/wompi/route.ts`
**Función:** Recibir notificaciones de Wompi

**Eventos procesados:**
- `transaction.updated` - Cambios en el estado de la transacción

**Mapeo de estados:**
```typescript
Wompi          →  Base de Datos
---------------------------------
APPROVED       →  pagado
DECLINED       →  pago_rechazado
VOIDED         →  pago_cancelado
ERROR          →  error_pago
PENDING        →  pendiente_pago
```

**Verificación de firma:**
- ✅ Valida signature de Wompi usando WOMPI_EVENTS_SECRET
- ✅ Protege contra requests maliciosos

**Endpoint:** `POST /api/webhooks/wompi`

### 4. `/src/app/api/pedidos/route.ts`
**Nuevas funciones:**

**GET con ID:**
```typescript
GET /api/pedidos?id=123
// Retorna un pedido específico
```

**PATCH:**
```typescript
PATCH /api/pedidos
Body: {
  pedido_id: 123,
  payment_id: "wompi-123-abc",
  estado: "pagado" // opcional
}
// Actualiza payment_id y estado del pedido
```

### 5. `/src/app/tienda/pago-exitoso/page.tsx`
**Función:** Página de confirmación después del pago

**Características:**
- ✅ Verifica estado del pago al cargar
- ✅ Muestra UI diferente según el estado
- ✅ Limpia carrito de localStorage
- ✅ Muestra información del pedido
- ✅ Enlaces a seguir comprando o ver pedidos

**Estados UI:**
- 🔄 **Verificando:** Spinner azul, "Verificando pago..."
- ✅ **Pagado:** Check verde, "¡Pago exitoso!"
- ⏳ **Pendiente:** Spinner amarillo, "Pago pendiente"
- ❌ **Rechazado:** X roja, "Pago no completado"
- ⚠️ **Error:** X gris, mensaje de error

## 🔄 Flujo Completo de Pago

```
1. USUARIO EN CARRITO
   ↓
2. Click "Pagar con Wompi"
   ↓
3. POST /api/pedidos
   - Crea pedido con estado "pendiente_pago"
   - Retorna pedido_id
   ↓
4. POST /api/pago-wompi
   - Crea link de pago en Wompi
   - Retorna payment_id y permalink
   ↓
5. PATCH /api/pedidos
   - Actualiza pedido con payment_id
   ↓
6. REDIRECT a sandbox.wompi.co/l/xxx
   - Usuario completa el pago
   ↓
7. WOMPI WEBHOOK → POST /api/webhooks/wompi
   - Wompi notifica cambio de estado
   - Actualiza estado del pedido en BD
   ↓
8. REDIRECT a /tienda/pago-exitoso?pedido=123
   - Página verifica estado final
   - Muestra confirmación al usuario
   ↓
9. GET /api/pedidos?id=123
   - Obtiene estado actualizado del pedido
   - Muestra UI según el estado
```

## 🧪 Pruebas en Entorno Sandbox

### Tarjetas de Prueba de Wompi

**Transacción Aprobada:**
```
Número: 4242 4242 4242 4242
CVV: 123
Fecha: Cualquier fecha futura
```

**Transacción Rechazada:**
```
Número: 4111 1111 1111 1111
CVV: 123
Fecha: Cualquier fecha futura
```

### Cómo Probar

1. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```

2. **Agregar productos al carrito:**
   - Navega a `/tienda/productos`
   - Agrega productos al carrito
   - Ve a `/tienda/carrito`

3. **Procesar pago:**
   - Click en "Pagar con Wompi ${total}"
   - Serás redirigido a sandbox.wompi.co
   - Completa el pago con tarjeta de prueba

4. **Verificar resultado:**
   - Después del pago, serás redirigido a `/tienda/pago-exitoso`
   - La página verificará el estado automáticamente
   - Verás confirmación visual del resultado

5. **Revisar logs:**
   ```bash
   # En la consola del navegador verás:
   👤 Usuario actual: {...}
   🛒 Carrito actual: [...]
   💰 Total: 50000
   📤 Creando pedido en BD...
   ✅ Pedido creado: {pedido: {id: 123}}
   💳 Creando link de pago en Wompi...
   ✅ Link de pago creado: {payment_id: "...", permalink: "..."}
   🔗 Redirigiendo a: https://sandbox.wompi.co/l/...
   
   # En el servidor verás:
   🔧 Usando modo: TEST (Sandbox)
   💳 Creando link de pago en Wompi...
   🔔 Webhook de Wompi recibido:
   - Evento: transaction.updated
   - Status: APPROVED
   ✅ Pedido actualizado: {...}
   ```

## 🔐 Configuración del Webhook en Wompi

Para que Wompi envíe notificaciones a tu servidor:

1. **Ingresar al Dashboard de Wompi:**
   - https://dashboard.wompi.co (producción)
   - https://sandbox.wompi.co (test)

2. **Configurar URL del webhook:**
   - Ir a "Configuración" → "Webhooks"
   - Agregar URL: `https://tudominio.com/api/webhooks/wompi`
   - Seleccionar evento: `transaction.updated`

3. **En desarrollo local (ngrok):**
   ```bash
   # Instalar ngrok
   npm install -g ngrok
   
   # Exponer puerto local
   ngrok http 3000
   
   # Usar URL de ngrok en dashboard de Wompi
   https://abc123.ngrok.io/api/webhooks/wompi
   ```

## 📊 Estados de Pedido

| Estado | Descripción | Cuándo se establece |
|--------|-------------|---------------------|
| `pendiente_pago` | Pedido creado, esperando pago | Al crear el pedido |
| `pagado` | Pago confirmado por Wompi | Webhook con status APPROVED |
| `pago_rechazado` | Pago rechazado por el banco | Webhook con status DECLINED |
| `pago_cancelado` | Pago cancelado por el usuario | Webhook con status VOIDED |
| `error_pago` | Error en el procesamiento | Webhook con status ERROR |

## 🔧 Debugging

### Ver logs del webhook:
```bash
# En la terminal del servidor verás:
🔔 Webhook de Wompi recibido:
- Evento: transaction.updated
- Transaction ID: 123-abc
- Status: APPROVED
- Reference: PEDIDO-123-1234567890
🔐 Verificando firma:
- Checksum recibido: abc123...
- Checksum calculado: abc123...
✅ Firma verificada correctamente
📝 Actualizando pedido: 123
✅ Pedido actualizado
```

### Verificar pedido en base de datos:
```sql
SELECT id, estado, payment_id, payment_method, total, created_at 
FROM pedidos 
WHERE id = 123;
```

### Probar webhook manualmente:
```bash
curl -X POST http://localhost:3000/api/webhooks/wompi \
  -H "Content-Type: application/json" \
  -d '{
    "event": "transaction.updated",
    "data": {
      "transaction": {
        "id": "test-123",
        "status": "APPROVED",
        "reference": "PEDIDO-123-1234567890",
        "amount_in_cents": 50000,
        "customer_email": "test@test.com"
      }
    },
    "timestamp": 1234567890
  }'
```

## ⚠️ Importante

1. **Nunca commitear las credenciales:**
   - `.env.local` está en `.gitignore`
   - No subir keys a repositorios públicos

2. **Usar HTTPS en producción:**
   - Wompi requiere HTTPS para webhooks
   - Obtener certificado SSL válido

3. **Validar firma del webhook:**
   - Siempre verificar la firma en producción
   - Protege contra requests maliciosos

4. **Manejo de errores:**
   - Implementar reintentos para webhooks fallidos
   - Logs detallados para debugging

## 🚀 Pasar a Producción

1. **Obtener credenciales de producción:**
   - Crear cuenta empresarial en Wompi
   - Obtener keys de producción
   - Actualizar `.env.local`

2. **Actualizar variables:**
   ```env
   NEXT_PUBLIC_WOMPI_PUBLIC_KEY=pub_prod_xxx
   WOMPI_PRIVATE_KEY=prv_prod_xxx
   WOMPI_EVENTS_SECRET=prod_events_xxx
   WOMPI_INTEGRITY_SECRET=prod_integrity_xxx
   ```

3. **Configurar webhook:**
   - URL debe ser HTTPS
   - Configurar en dashboard de Wompi producción
   - Probar con transacciones reales pequeñas

4. **Deploy:**
   ```bash
   npm run build
   npm start
   ```

## 📞 Soporte

- **Documentación Wompi:** https://docs.wompi.co
- **Dashboard Test:** https://sandbox.wompi.co
- **Dashboard Producción:** https://dashboard.wompi.co
- **Soporte Wompi:** soporte@wompi.co
