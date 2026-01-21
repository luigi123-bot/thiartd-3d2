# 🗺️ Diagrama de Base de Datos - Thiart 3D

## Diagrama de Relaciones (Mermaid)

```mermaid
erDiagram
    usuario ||--o{ productos_3d : crea
    usuario ||--o{ pedidos : realiza
    usuario ||--o{ personalizaciones : solicita
    usuario ||--o{ carrito : tiene
    usuario ||--o{ valoraciones : escribe
    usuario ||--o{ tickets : abre
    usuario ||--o{ conversaciones : participa
    usuario ||--o{ notificaciones : recibe
    
    productos_3d ||--o{ carrito : contiene
    productos_3d ||--o{ valoraciones : tiene
    productos_3d ||--o{ inventario : gestiona
    
    pedidos ||--o{ historial_envios : registra
    pedidos ||--o{ notificaciones : genera
    
    conversaciones ||--o{ chat_mensajes : contiene
    
    inventario ||--o{ ajustes_inventario : registra

    usuario {
        uuid id PK
        varchar nombre
        varchar email UK
        varchar password
        varchar role
        varchar clerk_id UK
        timestamp created_at
        timestamp updated_at
    }

    productos_3d {
        serial id PK
        varchar name
        text description
        numeric price
        varchar size
        integer stock
        varchar category
        boolean featured
        text details
        text image_url
        uuid user_id FK
        timestamp created_at
        timestamp updated_at
    }

    pedidos {
        serial id PK
        uuid cliente_id FK
        text productos
        numeric total
        varchar estado
        text direccion_envio
        varchar ciudad_envio
        varchar departamento_envio
        varchar telefono_envio
        numeric costo_envio
        varchar payment_id
        varchar payment_method
        varchar numero_tracking
        varchar empresa_envio
        timestamp created_at
        timestamp updated_at
    }

    personalizaciones {
        serial id PK
        uuid usuario_id FK
        varchar nombre
        varchar email
        varchar tamano
        varchar material
        varchar color
        varchar acabado
        varchar presupuesto
        varchar plazo
        text descripcion
        text referencia_url
        varchar estado
        timestamp created_at
        timestamp updated_at
    }

    carrito {
        serial id PK
        uuid usuario_id FK
        integer producto_id FK
        integer cantidad
        numeric precio_unitario
        timestamp created_at
        timestamp updated_at
    }

    historial_envios {
        serial id PK
        integer pedido_id FK
        varchar estado
        text descripcion
        varchar ubicacion
        timestamp fecha
        boolean notificado_cliente
        timestamp created_at
    }

    notificaciones {
        serial id PK
        uuid usuario_id FK
        integer pedido_id FK
        varchar tipo
        varchar titulo
        text mensaje
        boolean enviado
        boolean leido
        timestamp fecha_envio
        timestamp created_at
    }

    mensajes {
        serial id PK
        varchar nombre
        varchar email
        text mensaje
        boolean respondido
        timestamp creado_en
    }

    tickets {
        serial id PK
        uuid usuario_id FK
        varchar titulo
        text descripcion
        varchar categoria
        varchar estado
        text imagen_url
        timestamp created_at
        timestamp updated_at
    }

    conversaciones {
        serial id PK
        uuid cliente_id FK
        varchar cliente_nombre
        varchar cliente_email
        text cliente_avatar_url
        timestamp ultima_actividad
        timestamp created_at
    }

    chat_mensajes {
        serial id PK
        integer conversacion_id FK
        varchar remitente
        text texto
        varchar hora
        boolean leido_cliente
        boolean leido_admin
        timestamp created_at
    }

    valoraciones {
        serial id PK
        integer producto_id FK
        uuid usuario_id FK
        integer puntuacion
        text comentario
        boolean aprobado
        timestamp created_at
    }

    inventario {
        serial id PK
        integer producto_id FK
        varchar material
        integer cantidad_disponible
        integer cantidad_minima
        varchar ubicacion
        timestamp ultima_reposicion
        timestamp created_at
        timestamp updated_at
    }

    ajustes_inventario {
        serial id PK
        integer inventario_id FK
        integer producto_id FK
        varchar tipo_ajuste
        integer cantidad
        integer cantidad_anterior
        integer cantidad_nueva
        text motivo
        uuid usuario_id FK
        timestamp created_at
    }

    configuracion_sistema {
        serial id PK
        varchar clave UK
        text valor
        text descripcion
        varchar tipo
        timestamp created_at
        timestamp updated_at
    }
```

## Diagrama de Flujos Principales

### Flujo de Compra

```mermaid
flowchart TD
    A[Cliente navega productos] --> B{¿Usuario registrado?}
    B -->|No| C[Registrarse]
    B -->|Sí| D[Agregar al carrito]
    C --> D
    D --> E[Ver carrito]
    E --> F[Proceder al checkout]
    F --> G[Ingresar datos de envío]
    G --> H[Seleccionar método de pago]
    H --> I[Procesar pago Wompi]
    I --> J{¿Pago exitoso?}
    J -->|No| K[Mostrar error]
    J -->|Sí| L[Crear pedido]
    L --> M[Actualizar stock]
    M --> N[Enviar notificación]
    N --> O[Mostrar confirmación]
    K --> H
```

### Flujo de Tracking

```mermaid
flowchart TD
    A[Cliente accede a pedidos] --> B[Ver lista de pedidos]
    B --> C[Seleccionar pedido]
    C --> D[Ver detalles y tracking]
    D --> E{¿Hay actualizaciones?}
    E -->|Sí| F[Mostrar historial completo]
    E -->|No| G[Mostrar último estado]
    F --> H[Timeline visual]
    G --> H
    H --> I{¿Desea notificaciones?}
    I -->|Sí| J[Activar notificaciones]
    I -->|No| K[Fin]
    J --> K
```

### Flujo de Personalización

```mermaid
flowchart TD
    A[Cliente solicita personalización] --> B[Completar formulario]
    B --> C[Subir archivo STL opcional]
    C --> D[Enviar solicitud]
    D --> E[Crear registro personalización]
    E --> F[Notificar admin]
    F --> G[Admin revisa solicitud]
    G --> H{¿Aprobada?}
    H -->|No| I[Rechazar con motivo]
    H -->|Sí| J[Calcular precio]
    I --> K[Notificar cliente]
    J --> L[Enviar cotización]
    L --> M{¿Cliente acepta?}
    M -->|No| N[Cancelar solicitud]
    M -->|Sí| O[Generar pedido]
    N --> K
    O --> P[Iniciar producción]
    K --> Q[Fin]
    P --> Q
```

### Flujo de Tickets

```mermaid
flowchart TD
    A[Cliente reporta problema] --> B[Crear ticket]
    B --> C[Asignar estado: abierto]
    C --> D[Notificar admin]
    D --> E[Admin revisa ticket]
    E --> F[Cambiar a: en_progreso]
    F --> G{¿Requiere más info?}
    G -->|Sí| H[Solicitar información]
    G -->|No| I[Trabajar en solución]
    H --> J[Cliente responde]
    J --> I
    I --> K[Resolver problema]
    K --> L[Cambiar a: resuelto]
    L --> M[Notificar cliente]
    M --> N{¿Cliente satisfecho?}
    N -->|Sí| O[Cerrar ticket]
    N -->|No| P[Reabrir ticket]
    P --> I
    O --> Q[Fin]
```

### Flujo de Chat

```mermaid
flowchart TD
    A[Cliente inicia chat] --> B{¿Conversación existe?}
    B -->|No| C[Crear conversación]
    B -->|Sí| D[Cargar conversación]
    C --> D
    D --> E[Mostrar mensajes]
    E --> F[Cliente escribe mensaje]
    F --> G[Guardar en chat_mensajes]
    G --> H[Notificar admin en tiempo real]
    H --> I{¿Admin disponible?}
    I -->|Sí| J[Admin responde]
    I -->|No| K[Mostrar mensaje automático]
    J --> L[Guardar respuesta]
    K --> M[Fin temporal]
    L --> N[Notificar cliente]
    N --> O{¿Conversación continúa?}
    O -->|Sí| F
    O -->|No| P[Marcar como leído]
    P --> M
```

## Diagrama de Estados

### Estados de Pedidos

```mermaid
stateDiagram-v2
    [*] --> pendiente: Pedido creado
    pendiente --> confirmado: Pago exitoso
    pendiente --> cancelado: Pago fallido
    confirmado --> en_proceso: Comienza producción
    en_proceso --> en_envio: Producto listo
    en_envio --> completado: Cliente recibe
    en_envio --> problema: Incidencia en envío
    problema --> en_envio: Resuelto
    problema --> cancelado: No resuelto
    completado --> [*]
    cancelado --> [*]
```

### Estados de Tickets

```mermaid
stateDiagram-v2
    [*] --> abierto: Ticket creado
    abierto --> en_progreso: Admin trabaja
    en_progreso --> resuelto: Problema solucionado
    resuelto --> cerrado: Cliente confirma
    resuelto --> abierto: Cliente no satisfecho
    cerrado --> [*]
    abierto --> cerrado: Duplicado/Spam
```

### Estados de Personalización

```mermaid
stateDiagram-v2
    [*] --> pendiente_aprobacion: Solicitud enviada
    pendiente_aprobacion --> rechazada: No viable
    pendiente_aprobacion --> pendiente_pago: Cotización aprobada
    pendiente_pago --> en_produccion: Pago confirmado
    en_produccion --> completada: Producto terminado
    en_produccion --> cancelada: Cliente cancela
    completada --> [*]
    rechazada --> [*]
    cancelada --> [*]
```

## Arquitectura de Seguridad (RLS)

```mermaid
flowchart TD
    A[Request del Cliente] --> B{¿Usuario autenticado?}
    B -->|No| C{¿Recurso público?}
    B -->|Sí| D[Obtener auth.uid]
    C -->|Sí| E[Permitir lectura]
    C -->|No| F[Denegar acceso]
    D --> G{¿Qué operación?}
    G -->|SELECT| H{¿Es su dato o admin?}
    G -->|INSERT| I{¿Puede crear?}
    G -->|UPDATE| J{¿Puede modificar?}
    G -->|DELETE| K{¿Puede eliminar?}
    H -->|Sí| E
    H -->|No| F
    I -->|Sí| E
    I -->|No| F
    J -->|Sí| E
    J -->|No| F
    K -->|Sí| E
    K -->|No| F
    E --> L[Ejecutar query]
    F --> M[Retornar error 403]
    L --> N[Retornar resultado]
```

## Diagrama de Integración

```mermaid
flowchart LR
    A[Frontend Next.js] -->|API Calls| B[Supabase]
    A -->|Auth| C[Clerk]
    A -->|Images| D[Cloudinary]
    B -->|Webhooks| E[Backend API Routes]
    E -->|Process Payment| F[Wompi]
    F -->|Webhook| E
    E -->|Update DB| B
    E -->|Send Email| G[Email Service]
    E -->|Push Notification| H[Notification Service]
    B -->|Realtime| A
    C -->|User Sync| B
```

## Diagrama de Mantenimiento

```mermaid
flowchart TD
    A[CRON Job Diario 3 AM] --> B[Limpiar carritos antiguos]
    A --> C[Actualizar estadísticas]
    
    D[CRON Job Semanal Domingo 2 AM] --> E[Limpiar notificaciones]
    D --> F[Vacuum DB]
    
    G[CRON Job Mensual] --> H[Archivar pedidos antiguos]
    G --> I[Reindexar tablas]
    
    B --> J[Log resultados]
    C --> J
    E --> J
    F --> J
    H --> J
    I --> J
    
    J --> K[Enviar reporte admin]
```

## Índice de Consultas Frecuentes

```mermaid
mindmap
  root((Queries))
    Productos
      Buscar por nombre
      Filtrar por categoría
      Stock bajo
      Más vendidos
    Pedidos
      Por cliente
      Por estado
      Con tracking
      Ventas mes
    Usuarios
      Lista completa
      VIP clientes
      Nuevos registros
      Actividad reciente
    Reportes
      Dashboard stats
      Ventas mensuales
      Tickets summary
      Inventario
    Mantenimiento
      Limpiar datos
      Optimizar DB
      Validar integridad
      Generar backup
```

---

## Notas sobre los Diagramas

### Cómo visualizar
1. **En GitHub**: Los diagramas Mermaid se renderizan automáticamente
2. **En VS Code**: Instala la extensión "Markdown Preview Mermaid Support"
3. **Online**: Copia el código a [mermaid.live](https://mermaid.live)

### Convenciones
- **PK**: Primary Key (Clave Primaria)
- **FK**: Foreign Key (Clave Foránea)
- **UK**: Unique Key (Clave Única)
- `||--o{`: Relación uno a muchos
- `||--||`: Relación uno a uno

---

**Versión:** 1.0.0  
**Fecha:** Noviembre 2025  
**Proyecto:** Thiart 3D
