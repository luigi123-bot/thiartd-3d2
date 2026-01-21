# Flujo Completo de Pedidos con Wompi

## 📋 Resumen del Sistema

El sistema ahora está completamente integrado con Wompi y maneja todo el flujo desde el carrito hasta la confirmación del pago, guardando toda la información en la base de datos.

---

## 🔄 Flujo Completo Paso a Paso

### 1. **Usuario agrega productos al carrito**
**Ubicación:** `/tienda/productos` → `/tienda/carrito`

- El usuario navega por los productos
- Agrega productos al carrito (se guarda en `localStorage`)
- Puede ajustar cantidades y eliminar productos

### 2. **Usuario va al Checkout**
**Ubicación:** `/tienda/carrito` → `/tienda/checkout`

- Click en el botón "Continuar al pago"
- Redirige a la página de checkout

### 3. **Formulario de Checkout**
**Ubicación:** `/tienda/checkout`

**Datos solicitados:**
- ✅ Nombre completo *
- ✅ Email *
- ✅ Teléfono *
- ✅ Dirección completa *
- ✅ Ciudad *
- ✅ Departamento *
- ✅ Código postal
- ✅ Notas adicionales

**Cálculos automáticos:**
- Subtotal de productos
- Costo de envío ($8,000 o gratis si >$50,000)
- Total a pagar

### 4. **Creación del Pedido**
**Archivo:** `src/app/api/pedidos/route.ts`

Cuando el usuario hace click en "Pagar $XXXX":

```typescript
POST /api/pedidos
{
  cliente_id: "usuario_id",
  productos: [{nombre, cantidad, precio_unitario, categoria}],
  subtotal: 0,
  costo_envio: 8000,
  total: 8000,
  estado: "pendiente_pago",
  datos_contacto: {nombre, email, telefono},
  datos_envio: {direccion, ciudad, departamento, codigoPostal, telefono, notas}
}
```

**Base de datos - Campos guardados:**
```sql
INSERT INTO pedidos (
  cliente_id,
  productos (JSON),
  total,
  estado,
  datos_contacto (JSON),
  direccion_envio,
  ciudad_envio,
  departamento_envio,
  codigo_postal_envio,
  telefono_envio,
  notas_envio,
  costo_envio,
  created_at
)
```

**Respuesta:**
```json
{
  "pedido": {
    "id": 14,
    ...todos los datos del pedido
  }
}
```

### 5. **Creación del Link de Pago en Wompi**
**Archivo:** `src/app/api/pago-wompi/route.ts`

```typescript
POST /api/pago-wompi
{
  amount: 8000,
  customer_email: "usuario@email.com",
  customer_name: "Nombre Usuario",
  customer_phone: "+57 300 123 4567",
  reference: "PEDIDO-14-1762307213008",
  redirect_url: "http://localhost:3001/tienda/pago-exitoso?pedido=14"
}
```

**Llamada a Wompi:**
```typescript
POST https://sandbox.wompi.co/v1/payment_links
Headers: {
  "Authorization": "Bearer prv_test_..."
}
Body: {
  name: "Pedido Thiart3D - PEDIDO-14-...",
  description: "Compra en Thiart3D - Ref: PEDIDO-14-...",
  single_use: true,
  collect_shipping: false,
  currency: "COP",
  amount_in_cents: 800000,
  redirect_url: "http://localhost:3001/tienda/pago-exitoso?pedido=14",
  customer_data: {
    full_name: "Nombre Usuario",
    phone_number: "+57 300 123 4567"
  }
}
```

**Respuesta de Wompi:**
```json
{
  "data": {
    "id": "VPOS_wMfPSi",
    "name": "Pedido Thiart3D - PEDIDO-14-...",
    "amount_in_cents": 800000,
    "currency": "COP",
    ...
  }
}
```

**Permalink construido:**
```
https://checkout.wompi.co/l/VPOS_wMfPSi
```

### 6. **Actualización del Pedido con Payment ID**
**Archivo:** `src/app/api/pedidos/route.ts`

```typescript
PATCH /api/pedidos
{
  pedido_id: 14,
  payment_id: "VPOS_wMfPSi"
}
```

**Base de datos actualizada:**
```sql
UPDATE pedidos 
SET 
  payment_id = 'VPOS_wMfPSi',
  payment_method = 'wompi',
  updated_at = NOW()
WHERE id = 14
```

### 7. **Redirección a Wompi**
**Archivo:** `src/app/tienda/checkout/page.tsx`

```typescript
// Limpiar carrito
localStorage.removeItem("carrito");

// Redirigir
window.location.href = "https://checkout.wompi.co/l/VPOS_wMfPSi"
```

### 8. **Usuario completa el pago en Wompi**
**Plataforma:** Wompi Checkout

El usuario:
1. Ve el resumen del pago
2. Ingresa datos de su tarjeta
3. Confirma el pago

**Tarjetas de prueba:**
- ✅ Aprobada: `4242 4242 4242 4242`
- ❌ Rechazada: `4111 1111 1111 1111`

### 9. **Wompi envía Webhook**
**Archivo:** `src/app/api/webhooks/wompi/route.ts`

Cuando el pago cambia de estado, Wompi envía:

```typescript
POST /api/webhooks/wompi
{
  event: "transaction.updated",
  data: {
    transaction: {
      id: "123-abc-xyz",
      status: "APPROVED",
      reference: "PEDIDO-14-1762307213008",
      amount_in_cents: 800000,
      customer_email: "usuario@email.com",
      payment_method_type: "CARD",
      ...
    }
  },
  timestamp: 1762307213008,
  signature: {...}
}
```

**Procesamiento del Webhook:**

```typescript
// 1. Verificar firma (seguridad)
if (signature válida) {
  
  // 2. Extraer ID del pedido
  const regex = /PEDIDO-(\d+)-/;
  const pedidoId = 14; // extraído de "PEDIDO-14-..."
  
  // 3. Mapear estado de Wompi a estado del pedido
  switch (transaction.status) {
    case "APPROVED": 
      nuevoEstado = "pagado"; 
      break;
    case "DECLINED": 
      nuevoEstado = "pago_rechazado"; 
      break;
    case "VOIDED": 
      nuevoEstado = "pago_cancelado"; 
      break;
    case "ERROR": 
      nuevoEstado = "error_pago"; 
      break;
  }
  
  // 4. Actualizar pedido en base de datos
  UPDATE pedidos SET
    estado = "pagado",
    payment_id = "123-abc-xyz",
    payment_method = "CARD",
    payment_status = "APPROVED",
    updated_at = NOW()
  WHERE id = 14
}
```

**Logs del servidor:**
```
🔔 Webhook de Wompi recibido:
- Evento: transaction.updated
- Transaction ID: 123-abc-xyz
- Status: APPROVED
- Reference: PEDIDO-14-1762307213008

📦 Procesando actualización para pedido #14
💳 Transaction ID: 123-abc-xyz
📊 Status: APPROVED
💰 Amount: $8000
✅ Pago APROBADO

✅ Pedido actualizado exitosamente:
   - ID: 14
   - Estado: pagado
   - Payment ID: 123-abc-xyz
   - Método: CARD
   - Cliente: usuario@email.com
```

### 10. **Wompi redirige al usuario**
**Redirección:** `http://localhost:3001/tienda/pago-exitoso?pedido=14`

### 11. **Página de Confirmación**
**Archivo:** `src/app/tienda/pago-exitoso/page.tsx`

```typescript
// 1. Obtener pedido_id de la URL
const pedidoId = searchParams.get("pedido"); // "14"

// 2. Consultar estado del pedido
GET /api/pedidos?id=14

// 3. Verificar estado
if (pedido.estado === "pagado") {
  // ✅ Mostrar confirmación de pago exitoso
} else if (pedido.estado === "pago_rechazado") {
  // ❌ Mostrar mensaje de pago rechazado
} else {
  // ⏳ Mostrar que está pendiente
}

// 4. Limpiar localStorage
localStorage.removeItem("carrito");
localStorage.removeItem("pedido_pendiente");
```

**UI mostrada:**
```
✅ ¡Pago exitoso!
Tu pago ha sido confirmado exitosamente

Número de pedido: #14

[Pasos del proceso]
✅ Confirmación enviada
⏳ Preparando pedido
🚚 Envío pronto

[Botones]
📦 Seguir comprando
👁️ Ver mis pedidos
🏠 Ir al inicio
```

---

## 📊 Estado del Pedido en Base de Datos

### Después de la creación (Paso 4):
```json
{
  "id": 14,
  "cliente_id": "uuid-del-usuario",
  "productos": "[{\"nombre\":\"Producto X\",\"cantidad\":2,\"precio_unitario\":4000}]",
  "total": 8000,
  "estado": "pendiente_pago",
  "datos_contacto": "{\"nombre\":\"Usuario\",\"email\":\"user@email.com\",\"telefono\":\"+57...\"}",
  "direccion_envio": "Calle 123 #45-67",
  "ciudad_envio": "Bogotá",
  "departamento_envio": "Cundinamarca",
  "codigo_postal_envio": "110111",
  "telefono_envio": "+57 300 123 4567",
  "notas_envio": "Dejar en portería",
  "costo_envio": 8000,
  "payment_id": null,
  "payment_method": null,
  "payment_status": null,
  "created_at": "2025-11-05T02:00:00.000Z"
}
```

### Después de crear link de pago (Paso 6):
```json
{
  ...
  "payment_id": "VPOS_wMfPSi",
  "payment_method": "wompi",
  "updated_at": "2025-11-05T02:00:30.000Z"
}
```

### Después del webhook (Paso 9):
```json
{
  ...
  "estado": "pagado",
  "payment_id": "123-abc-xyz",
  "payment_method": "CARD",
  "payment_status": "APPROVED",
  "updated_at": "2025-11-05T02:01:00.000Z"
}
```

---

## 👥 Vistas de Usuario

### 1. Usuario regular en `/envios`
**Ver sus propios pedidos:**

```sql
SELECT * FROM pedidos 
WHERE cliente_id = 'usuario_actual_id'
ORDER BY created_at DESC
```

**Información mostrada:**
- Número de pedido
- Fecha de creación
- Estado (pendiente_pago, pagado, pago_rechazado, etc.)
- Total
- Productos incluidos
- Información de envío completa
- Datos de contacto
- Payment ID si existe

### 2. Admin en `/admin/pedidos`
**Ver TODOS los pedidos:**

```sql
SELECT * FROM pedidos 
ORDER BY created_at DESC
```

**Información mostrada en tabla:**
- Cliente (nombre)
- Ciudad de envío
- Estado
- Fecha
- Subtotal
- Envío
- Total
- Botón "Ver detalle"

**Modal de detalle incluye:**
- ✅ Información del cliente (nombre, email, teléfono)
- ✅ Información de envío (dirección completa, ciudad, departamento, código postal, notas)
- ✅ Información de pago (método, transaction ID, estado con colores)
- ✅ Productos del pedido
- ✅ Totales (subtotal, envío, total)

---

## 🔐 Seguridad Implementada

### 1. **Validación de firma en Webhook**
```typescript
// Wompi firma cada webhook con:
// SHA256(properties + timestamp + events_secret)

const concatenated = `${signatureString}${timestamp}${eventsSecret}`;
const calculatedChecksum = crypto
  .createHash("sha256")
  .update(concatenated)
  .digest("hex");

if (calculatedChecksum !== receivedChecksum) {
  return 401 Unauthorized;
}
```

### 2. **Service Role Key para bypass RLS**
```typescript
// En API routes usamos service_role_key para
// operaciones de admin sin restricciones RLS
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
```

### 3. **Validación de Email**
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(customer_email)) {
  return 400 Bad Request;
}
```

### 4. **HTTPS requerido en producción**
- Wompi solo envía webhooks a URLs HTTPS
- Certificado SSL válido necesario

---

## 🧪 Testing

### Ambiente de pruebas (Sandbox):
```
Endpoint: https://sandbox.wompi.co/v1/payment_links
Checkout: https://checkout.wompi.co/l/{id}

Tarjetas de prueba:
- Aprobada: 4242 4242 4242 4242
- Rechazada: 4111 1111 1111 1111
CVV: 123
Fecha: Cualquier fecha futura
```

### Flujo de prueba completo:
1. ✅ Agregar productos al carrito
2. ✅ Ir al checkout
3. ✅ Llenar todos los campos
4. ✅ Click "Pagar"
5. ✅ Verificar creación del pedido en BD (estado: pendiente_pago)
6. ✅ Verificar redirección a Wompi
7. ✅ Completar pago con tarjeta de prueba
8. ✅ Verificar webhook recibido (ver logs del servidor)
9. ✅ Verificar actualización del pedido en BD (estado: pagado)
10. ✅ Verificar redirección a página de confirmación
11. ✅ Verificar que el pedido aparece en `/envios` para el usuario
12. ✅ Verificar que el pedido aparece en `/admin/pedidos` con toda la info

---

## 📝 Campos en la Base de Datos

```sql
CREATE TABLE pedidos (
  id SERIAL PRIMARY KEY,
  cliente_id UUID NOT NULL,
  productos TEXT, -- JSON stringified
  total NUMERIC NOT NULL,
  estado VARCHAR(50) DEFAULT 'pendiente_pago',
  
  -- Contacto (JSON stringified)
  datos_contacto TEXT,
  
  -- Envío (campos separados)
  direccion_envio TEXT,
  ciudad_envio VARCHAR(100),
  departamento_envio VARCHAR(100),
  codigo_postal_envio VARCHAR(20),
  telefono_envio VARCHAR(20),
  notas_envio TEXT,
  costo_envio NUMERIC DEFAULT 0,
  
  -- Pago
  payment_id VARCHAR(255),
  payment_method VARCHAR(50),
  payment_status VARCHAR(50),
  
  -- Tracking (opcional para futuro)
  numero_tracking VARCHAR(100),
  empresa_envio VARCHAR(100),
  fecha_estimada_entrega TIMESTAMP,
  fecha_real_entrega TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## ✅ Resumen de lo Implementado

1. ✅ Formulario completo de checkout con todos los datos
2. ✅ Creación de pedido en BD antes de pagar
3. ✅ Integración completa con Wompi (Payment Links API)
4. ✅ Redirección a pasarela de pago
5. ✅ Webhook para recibir confirmación de Wompi
6. ✅ Actualización automática del estado del pedido
7. ✅ Verificación de firma del webhook (seguridad)
8. ✅ Página de confirmación con estado del pago
9. ✅ Vista de pedidos para usuarios (/ envios)
10. ✅ Vista de pedidos para admin (/admin/pedidos) con toda la información
11. ✅ Logs detallados en cada paso del proceso
12. ✅ Manejo de errores y estados (aprobado, rechazado, cancelado, error)
13. ✅ Limpieza de carrito después del pago
14. ✅ Validaciones de datos (email, monto, campos requeridos)
15. ✅ Tarjetas de prueba funcionando

## 🚀 Próximos Pasos (Opcional)

- [ ] Envío de emails de confirmación
- [ ] Notificaciones push
- [ ] Integración con empresas de envío (tracking)
- [ ] Estados adicionales (en preparación, enviado, entregado)
- [ ] Permitir cancelaciones
- [ ] Generar facturas PDF
- [ ] Reportes y analíticas
- [ ] Multi-moneda
- [ ] Métodos de pago adicionales
