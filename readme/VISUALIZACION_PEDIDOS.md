# Visualización Completa de Pedidos

## 📊 Información Guardada en Base de Datos

Cuando un usuario completa un pedido con Wompi, se guarda la siguiente información:

### Tabla: `pedidos`

```sql
{
  -- Identificación
  id: 14,
  cliente_id: "uuid-del-usuario",
  
  -- Productos (JSON stringified)
  productos: '[
    {
      "nombre": "Producto X",
      "cantidad": 2,
      "precio_unitario": 4000,
      "categoria": "Decoración"
    }
  ]',
  
  -- Totales
  total: 8000,
  costo_envio: 8000,
  subtotal: 0,
  
  -- Estado
  estado: "pagado", // pendiente_pago, pagado, pago_rechazado, pago_cancelado, error_pago
  
  -- Datos de contacto (JSON stringified)
  datos_contacto: '{
    "nombre": "Luis Gotopo",
    "email": "gotopoluis19@gmail.com",
    "telefono": "+57 300 123 4567"
  }',
  
  -- Información de envío (campos separados)
  direccion_envio: "Calle 123 #45-67, Apto 101",
  ciudad_envio: "Bogotá",
  departamento_envio: "Cundinamarca",
  codigo_postal_envio: "110111",
  telefono_envio: "+57 300 123 4567",
  notas_envio: "Dejar en portería",
  
  -- Información de pago
  payment_id: "123-abc-xyz",
  payment_method: "CARD", // wompi, CARD, PSE, etc
  payment_status: "APPROVED",
  
  -- Tracking (opcional)
  numero_tracking: null,
  empresa_envio: null,
  fecha_estimada_entrega: null,
  fecha_real_entrega: null,
  
  -- Timestamps
  created_at: "2025-11-05T02:00:00.000Z",
  updated_at: "2025-11-05T02:01:00.000Z"
}
```

---

## 👤 Vista de Usuario (`/envios`)

### Acceso:
- Solo pedidos del usuario autenticado
- Query: `SELECT * FROM pedidos WHERE cliente_id = current_user_id`

### Información Mostrada:

#### 1. Card del Pedido (Vista Principal)
```
┌─────────────────────────────────────────────┐
│ Pedido #14              [Estado Badge]      │
│ 5 de noviembre de 2025                      │
├─────────────────────────────────────────────┤
│ PRODUCTOS              │ DETALLES           │
│ 2x Producto X          │ Subtotal: $0       │
│                        │ Envío: $8,000      │
│                        │ Total: $8,000      │
│                        │ Método: CARD       │
├─────────────────────────────────────────────┤
│ DATOS DE CONTACTO      │ DIRECCIÓN DE ENVÍO │
│ Nombre: Luis Gotopo    │ Calle 123 #45-67   │
│ Email: gotopoluis...   │ Bogotá, Cund...    │
│ Teléfono: +57 300...   │ CP: 110111         │
│                        │ Tel: +57 300...    │
│                        │ Notas: Dejar en... │
├─────────────────────────────────────────────┤
│ 🚚 Ver seguimiento detallado →              │
└─────────────────────────────────────────────┘
```

#### 2. Secciones Visibles:
✅ **Encabezado:**
- Número de pedido
- Fecha de creación
- Badge de estado con color

✅ **Grid de Información (2 columnas):**
- **Productos:**
  - Lista de productos con cantidad
  - Ejemplo: "2x Producto X"
  
- **Detalles del pedido:**
  - Subtotal
  - Costo de envío
  - Total
  - Método de pago (si existe)
  - Número de tracking (si existe)

✅ **Sección de Contacto y Envío (2 columnas):**
- **Datos de contacto:**
  - Nombre completo
  - Email
  - Teléfono
  
- **Dirección de envío:**
  - Dirección completa
  - Ciudad, Departamento
  - Código postal
  - Teléfono de contacto
  - Notas adicionales

✅ **Link de Tracking:**
- Botón para ver seguimiento detallado

#### 3. Estados Visuales:

**Pagado:**
```
✅ Badge verde: "Pagado"
```

**Pendiente de pago:**
```
⏳ Badge amarillo: "Pendiente de pago"
```

**Pago rechazado:**
```
❌ Badge rojo: "Pago rechazado"
```

**Pago cancelado:**
```
🚫 Badge gris: "Pago cancelado"
```

---

## 👨‍💼 Vista de Admin (`/admin/pedidos`)

### Acceso:
- TODOS los pedidos de todos los usuarios
- Query: `SELECT * FROM pedidos ORDER BY created_at DESC`

### Información Mostrada:

#### 1. Tabla Principal
```
┌──────────┬────────────┬─────────┬─────────┬──────────┬────────┬────────┬─────────┐
│ Cliente  │ Ciudad     │ Estado  │ Fecha   │ Subtotal │ Envío  │ Total  │ Acción  │
├──────────┼────────────┼─────────┼─────────┼──────────┼────────┼────────┼─────────┤
│ Luis G.  │ Bogotá,    │ pagado  │ 2025-   │ $0.00    │ $8,000 │ $8,000 │ Ver     │
│          │ Cund...    │         │ 11-05   │          │        │        │ detalle │
└──────────┴────────────┴─────────┴─────────┴──────────┴────────┴────────┴─────────┘
```

**Columnas:**
- Cliente (nombre del datos_contacto o cliente_id)
- Ciudad de envío (ciudad + departamento)
- Estado (pendiente_pago, pagado, etc.)
- Fecha (YYYY-MM-DD HH:MM:SS)
- Subtotal
- Costo de envío
- Total
- Botón "Ver detalle"

#### 2. Modal de Detalle (Al hacer click en "Ver detalle")

```
┌─────────────────────────────────────────────────────────┐
│               Detalle del pedido #14                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 📋 INFORMACIÓN DEL CLIENTE                             │
│ ┌─────────────────────────────────────────────┐        │
│ │ Cliente: Luis Gotopo                        │        │
│ │ Email: gotopoluis19@gmail.com               │        │
│ │ Teléfono: +57 300 123 4567                  │        │
│ └─────────────────────────────────────────────┘        │
│                                                         │
│ 📦 INFORMACIÓN DE ENVÍO                                │
│ ┌─────────────────────────────────────────────┐        │
│ │ Dirección: Calle 123 #45-67, Apto 101       │        │
│ │ Ciudad: Bogotá                              │        │
│ │ Departamento: Cundinamarca                  │        │
│ │ Código postal: 110111                       │        │
│ │ Notas: Dejar en portería                    │        │
│ └─────────────────────────────────────────────┘        │
│                                                         │
│ 💳 INFORMACIÓN DE PAGO                                 │
│ ┌─────────────────────────────────────────────┐        │
│ │ Método: CARD                                │        │
│ │ Transaction ID: 123-abc-xyz                 │        │
│ │ Estado del pago: [PAGADO] ✅                │        │
│ └─────────────────────────────────────────────┘        │
│                                                         │
│ 📊 INFORMACIÓN DEL PEDIDO                              │
│ ┌─────────────────────────────────────────────┐        │
│ │ Estado: pagado                              │        │
│ │ Fecha: 2025-11-05 02:00:00                  │        │
│ │ Subtotal: $0.00                             │        │
│ │ Costo de envío: $8000.00                    │        │
│ │ Total: $8000.00                             │        │
│ │ Método de pago: CARD                        │        │
│ │ ID de transacción: 123-abc-xyz              │        │
│ └─────────────────────────────────────────────┘        │
│                                                         │
│ 🛍️ PRODUCTOS                                           │
│ ┌─────────────────────────────────────────────┐        │
│ │ • Producto Personalizado                    │        │
│ │   Cantidad: 1                               │        │
│ │   Precio unitario: $0                       │        │
│ │   Total: $0.00                              │        │
│ │                                             │        │
│ │ • Producto Personalizado                    │        │
│ │   Cantidad: 1                               │        │
│ │   Precio unitario: $0                       │        │
│ │   Total: $0.00                              │        │
│ └─────────────────────────────────────────────┘        │
│                                                         │
│                              [Cerrar]                   │
└─────────────────────────────────────────────────────────┘
```

**Secciones del Modal:**

✅ **Información del Cliente:**
- Nombre completo (parseado de datos_contacto JSON)
- Email
- Teléfono

✅ **Información de Envío:**
- Dirección completa
- Ciudad
- Departamento
- Código postal
- Notas de envío

✅ **Información de Pago:** (con fondo azul y border)
- Método de pago (CARD, PSE, wompi, etc.)
- Transaction ID de Wompi (en formato código)
- Estado del pago con badge de color:
  - 🟢 Verde: "PAGADO"
  - 🔴 Rojo: "PAGO RECHAZADO" / "PAGO CANCELADO"
  - 🟡 Amarillo: "PENDIENTE PAGO"

✅ **Información del Pedido:**
- Estado actual
- Fecha y hora de creación
- Subtotal
- Costo de envío
- Total
- Método de pago (duplicado para referencia)
- ID de transacción (duplicado para referencia)

✅ **Productos:**
- Lista completa de productos
- Para cada producto:
  - Nombre/Título
  - Cantidad
  - Precio unitario
  - Total por producto
  - Descripción (si existe)

---

## 🔍 Comparación de Vistas

| Característica | Usuario (`/envios`) | Admin (`/admin/pedidos`) |
|---------------|-------------------|------------------------|
| **Acceso** | Solo sus pedidos | Todos los pedidos |
| **Vista principal** | Cards expansivas | Tabla compacta |
| **Datos de contacto** | ✅ Muestra sus datos | ✅ Muestra datos del cliente |
| **Dirección de envío** | ✅ Visible | ✅ Visible en modal |
| **Información de pago** | ✅ Método y estado | ✅ Método, Transaction ID, Estado con colores |
| **Productos** | ✅ Lista simple | ✅ Lista detallada con precios |
| **Tracking** | ✅ Link a página de tracking | ❌ No implementado |
| **Filtros** | ❌ No | ❌ No (futuro) |
| **Edición** | ❌ No | ❌ No (futuro) |

---

## 📱 Responsive Design

### Usuario (`/envios`):

**Desktop (≥768px):**
- Grid de 2 columnas (Productos | Detalles)
- Grid de 2 columnas (Contacto | Envío)

**Mobile (<768px):**
- Columna única apilada
- Cards completas verticales

### Admin (`/admin/pedidos`):

**Desktop:**
- Tabla completa con todas las columnas
- Modal grande (max-w-2xl)

**Mobile:**
- Tabla con scroll horizontal
- Modal adaptado al ancho de pantalla

---

## 🎨 Códigos de Color por Estado

### Badges de Estado:

**Pagado:**
```css
bg-green-100 text-green-700 border-green-200
```

**Pendiente de pago:**
```css
bg-yellow-100 text-yellow-700 border-yellow-200
```

**Pago rechazado / cancelado:**
```css
bg-red-100 text-red-700 border-red-200
```

**Error en pago:**
```css
bg-gray-100 text-gray-700 border-gray-200
```

### Sección de Pago (Admin):

**Fondo:**
```css
bg-blue-50 border border-blue-200
```

**Transaction ID:**
```css
bg-white px-2 py-1 rounded text-xs font-mono
```

---

## 📊 Queries de Base de Datos

### Usuario (GET /api/pedidos - con filtro):
```sql
SELECT * FROM pedidos 
WHERE cliente_id = 'uuid-actual-usuario'
ORDER BY created_at DESC;
```

### Admin (GET /api/pedidos - sin filtro):
```sql
SELECT * FROM pedidos 
ORDER BY created_at DESC;
```

### Pedido específico (GET /api/pedidos?id=14):
```sql
SELECT * FROM pedidos 
WHERE id = 14
LIMIT 1;
```

---

## ✅ Checklist de Información Visible

### Para Usuarios:
- [x] Número de pedido
- [x] Fecha de creación
- [x] Estado del pedido
- [x] Lista de productos
- [x] Cantidades
- [x] Subtotal
- [x] Costo de envío
- [x] Total
- [x] Método de pago
- [x] Nombre completo
- [x] Email
- [x] Teléfono
- [x] Dirección completa
- [x] Ciudad y departamento
- [x] Código postal
- [x] Notas de envío
- [x] Link a tracking

### Para Admin (Todo lo anterior +):
- [x] Cliente_id (UUID)
- [x] Transaction ID de Wompi
- [x] Payment status
- [x] Precio unitario de cada producto
- [x] Total por producto
- [x] Descripción de productos
- [x] Timestamps (created_at, updated_at)
- [x] Vista de todos los pedidos
- [x] Filtro por cliente en tabla

---

## 🚀 Funcionalidades Implementadas

### Usuario:
✅ Ver todos sus pedidos
✅ Ver estado actual de cada pedido
✅ Ver información completa de contacto
✅ Ver información completa de envío
✅ Ver productos ordenados
✅ Ver totales
✅ Ver método de pago
✅ Link a tracking detallado
✅ Diseño responsive
✅ Estados con colores

### Admin:
✅ Ver todos los pedidos de todos los usuarios
✅ Tabla resumida con información clave
✅ Modal de detalle con información completa
✅ Información de pago destacada
✅ Transaction ID visible
✅ Estado del pago con colores
✅ Productos con precios detallados
✅ Información de cliente completa
✅ Diseño responsive

---

## 📋 Próximas Mejoras (Opcional)

### Usuario:
- [ ] Cancelar pedido (si está pendiente)
- [ ] Descargar factura PDF
- [ ] Filtros por estado
- [ ] Búsqueda por número de pedido
- [ ] Historial de estados
- [ ] Notificaciones por email

### Admin:
- [ ] Editar estado del pedido
- [ ] Agregar número de tracking
- [ ] Filtros avanzados (fecha, cliente, estado)
- [ ] Búsqueda global
- [ ] Exportar a CSV/Excel
- [ ] Generar reportes
- [ ] Estadísticas de ventas
- [ ] Gráficas y analytics
