# 📦 Base de Datos Thiart 3D - Guía de Instalación

Este proyecto incluye los scripts SQL completos para crear todas las tablas necesarias en **Supabase**.

## 📋 Archivos Incluidos

### 1. `supabase_schema_completo.sql`
**Descripción:** Schema principal con todas las tablas del sistema.

**Contiene:**
- ✅ 15 tablas principales
- ✅ Relaciones (Foreign Keys)
- ✅ Índices optimizados
- ✅ Triggers automáticos
- ✅ Vistas útiles
- ✅ Datos iniciales

**Tablas creadas:**
1. `usuario` - Usuarios del sistema
2. `productos_3d` - Catálogo de productos
3. `personalizaciones` - Solicitudes personalizadas
4. `pedidos` - Pedidos de clientes
5. `historial_envios` - Tracking de envíos
6. `notificaciones` - Sistema de notificaciones
7. `mensajes` - Formulario de contacto
8. `tickets` - Soporte y reportes
9. `conversaciones` - Chat con clientes
10. `chat_mensajes` - Mensajes individuales del chat
11. `carrito` - Carrito de compras
12. `valoraciones` - Reviews de productos
13. `inventario` - Gestión de stock
14. `ajustes_inventario` - Historial de movimientos
15. `configuracion_sistema` - Configuraciones generales

### 2. `supabase_configuracion_adicional.sql`
**Descripción:** Configuración de seguridad y funciones avanzadas.

**Contiene:**
- 🔒 Políticas RLS (Row Level Security)
- 🔧 Funciones personalizadas
- 📊 Vistas adicionales
- ⚡ Índices de optimización
- 🎯 Triggers automáticos

**Funciones incluidas:**
- `obtener_estadisticas_dashboard()` - Stats del dashboard
- `calcular_precio_personalizacion()` - Cotización automática
- `verificar_stock_disponible()` - Control de inventario
- `actualizar_stock_pedido()` - Actualización automática de stock
- `crear_notificacion_pedido()` - Notificaciones automáticas

### 3. `asignar_rol_admin.sql`
**Descripción:** Script para asignar rol de administrador a un usuario.

---

## 🚀 Guía de Instalación

### Paso 1: Acceder a Supabase
1. Ve a [https://supabase.com](https://supabase.com)
2. Inicia sesión en tu proyecto
3. Ve a **SQL Editor** en el menú lateral

### Paso 2: Ejecutar Schema Principal
1. Abre el archivo `supabase_schema_completo.sql`
2. Copia todo el contenido
3. Pégalo en el SQL Editor de Supabase
4. Click en **RUN** o presiona `Ctrl + Enter`
5. ✅ Verifica que se ejecutó sin errores

**Tiempo estimado:** 2-3 minutos

### Paso 3: Ejecutar Configuración Adicional
1. Abre el archivo `supabase_configuracion_adicional.sql`
2. Copia todo el contenido
3. Pégalo en un nuevo query del SQL Editor
4. Click en **RUN**
5. ✅ Verifica que se ejecutó correctamente

**Tiempo estimado:** 1-2 minutos

### Paso 4: Asignar Rol de Administrador
1. Abre el archivo `asignar_rol_admin.sql`
2. Reemplaza `EMAIL_DEL_USUARIO_AQUI` con tu email
3. Ejecuta el script en Supabase
4. ✅ Ahora tienes acceso como admin

---

## 🔍 Verificación de Instalación

### Verificar Tablas Creadas
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Deberías ver **15 tablas** listadas.

### Verificar Funciones
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION';
```

### Verificar Vistas
```sql
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public';
```

### Probar Función de Estadísticas
```sql
SELECT obtener_estadisticas_dashboard();
```

---

## 🔐 Configuración de RLS (Row Level Security)

Las políticas RLS están **incluidas** en `supabase_configuracion_adicional.sql`.

### ¿Qué hace RLS?
- ✅ Los usuarios solo ven sus propios datos
- ✅ Los admins pueden ver todo
- ✅ Protección automática a nivel de base de datos
- ✅ No requiere código adicional en el frontend

### Roles Disponibles
- `user` - Usuario normal (por defecto)
- `admin` - Administrador del sistema

---

## 📊 Estructura de Datos

### Diagrama de Relaciones

```
usuario (1) ──< (N) productos_3d
usuario (1) ──< (N) pedidos
usuario (1) ──< (N) personalizaciones
usuario (1) ──< (N) carrito
usuario (1) ──< (N) valoraciones
usuario (1) ──< (N) tickets
usuario (1) ──< (N) conversaciones
usuario (1) ──< (N) notificaciones

pedidos (1) ──< (N) historial_envios
pedidos (1) ──< (N) notificaciones

conversaciones (1) ──< (N) chat_mensajes

productos_3d (1) ──< (N) inventario
productos_3d (1) ──< (N) carrito
productos_3d (1) ──< (N) valoraciones

inventario (1) ──< (N) ajustes_inventario
```

---

## 🎯 Datos de Ejemplo (Opcional)

Si quieres agregar datos de prueba, ejecuta estos scripts:

### Crear Usuario de Prueba
```sql
INSERT INTO usuario (nombre, email, password, role) 
VALUES 
  ('Admin Test', 'admin@thiart3d.com', 'hashed_password', 'admin'),
  ('Cliente Test', 'cliente@test.com', 'hashed_password', 'user');
```

### Crear Productos de Prueba
```sql
INSERT INTO productos_3d (name, description, price, stock, category, featured, user_id) 
VALUES 
  ('Figura Dragon', 'Figura de dragón en PLA', 45000, 10, 'Figuras', true, (SELECT id FROM usuario WHERE role = 'admin' LIMIT 1)),
  ('Maceta Geométrica', 'Maceta moderna diseño hexagonal', 35000, 15, 'Decoración', true, (SELECT id FROM usuario WHERE role = 'admin' LIMIT 1)),
  ('Soporte Móvil', 'Soporte ajustable para smartphone', 25000, 20, 'Funcional', false, (SELECT id FROM usuario WHERE role = 'admin' LIMIT 1));
```

### Crear Configuraciones del Sistema
```sql
-- Ya están incluidas en el schema principal, pero puedes agregar más:
INSERT INTO configuracion_sistema (clave, valor, descripcion, tipo) VALUES
  ('whatsapp_contacto', '+57123456789', 'Número de WhatsApp para contacto', 'texto'),
  ('instagram_url', 'https://instagram.com/thiart3d', 'Perfil de Instagram', 'url');
```

---

## 🛠️ Mantenimiento y Limpieza

### Limpiar Carritos Antiguos (ejecutar mensualmente)
```sql
SELECT limpiar_carritos_antiguos();
```

### Ver Productos con Stock Bajo
```sql
SELECT * FROM vista_productos_stock_bajo;
```

### Ver Estadísticas de Ventas
```sql
SELECT * FROM obtener_estadisticas_dashboard();
```

### Ver Clientes VIP
```sql
SELECT * FROM vista_clientes_vip;
```

---

## 🔄 Actualizaciones Futuras

Si necesitas agregar nuevas columnas o modificar tablas:

```sql
-- Ejemplo: Agregar campo de descuento a productos
ALTER TABLE productos_3d 
ADD COLUMN descuento NUMERIC(5, 2) DEFAULT 0;

-- Ejemplo: Agregar campo de teléfono a usuarios
ALTER TABLE usuario 
ADD COLUMN telefono VARCHAR(20);
```

---

## 🐛 Solución de Problemas

### Error: "relation already exists"
**Solución:** La tabla ya está creada. Puedes ignorar este error o eliminar la tabla primero:
```sql
DROP TABLE IF EXISTS nombre_tabla CASCADE;
```

### Error: "permission denied"
**Solución:** Asegúrate de tener permisos de admin en Supabase.

### Error con RLS
**Solución:** Verifica que el usuario esté autenticado correctamente con Supabase Auth.

### Las políticas RLS no funcionan
**Solución:** Asegúrate de que el `auth.uid()` coincida con el `id` del usuario en la tabla `usuario`.

---

## 📞 Contacto y Soporte

Si encuentras algún problema durante la instalación:

1. Verifica que ejecutaste los scripts en el orden correcto
2. Revisa los mensajes de error en el SQL Editor
3. Consulta la documentación de Supabase: [supabase.com/docs](https://supabase.com/docs)

---

## 📝 Notas Importantes

- ⚠️ **Backup:** Siempre haz backup antes de ejecutar scripts en producción
- 🔒 **Seguridad:** Las contraseñas deben ser hasheadas antes de guardarlas
- 🌐 **Variables de Entorno:** Configura correctamente las variables en `.env.local`
- 🔐 **API Keys:** Nunca compartas tus API Keys de Supabase públicamente

---

## ✅ Checklist de Instalación

- [ ] Ejecutado `supabase_schema_completo.sql`
- [ ] Verificadas las 15 tablas creadas
- [ ] Ejecutado `supabase_configuracion_adicional.sql`
- [ ] Verificadas las políticas RLS
- [ ] Asignado rol de admin con `asignar_rol_admin.sql`
- [ ] Probada función `obtener_estadisticas_dashboard()`
- [ ] Configuradas variables de entorno en el proyecto
- [ ] Datos de prueba insertados (opcional)

---

## 🎉 ¡Listo!

Tu base de datos está completamente configurada y lista para usar con Thiart 3D.

**Próximos pasos:**
1. Configura las variables de entorno en tu proyecto Next.js
2. Prueba las conexiones desde tu aplicación
3. Implementa la autenticación con Clerk/Supabase
4. Comienza a desarrollar las funcionalidades

---

**Versión:** 1.0.0  
**Última actualización:** Noviembre 2025  
**Creado para:** Thiart 3D - E-commerce de Impresiones 3D
