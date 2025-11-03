# ✅ CHECKLIST DE INSTALACIÓN - Thiart 3D Database

## 📋 Pre-instalación

### Requisitos
- [ ] Cuenta de Supabase activa
- [ ] Proyecto de Supabase creado
- [ ] Acceso al SQL Editor de Supabase
- [ ] Editor de texto (VS Code recomendado)
- [ ] Archivos SQL descargados/disponibles

### Variables de Entorno
- [ ] `NEXT_PUBLIC_SUPABASE_URL` anotada
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` anotada
- [ ] Email de administrador definido

---

## 🚀 Instalación Base (CRÍTICO)

### Paso 1: Schema Principal ⭐⭐⭐⭐⭐
- [ ] Abrir Supabase Dashboard
- [ ] Ir a SQL Editor
- [ ] Abrir archivo: `supabase_schema_completo.sql`
- [ ] Copiar TODO el contenido
- [ ] Pegar en SQL Editor
- [ ] Ejecutar (Ctrl + Enter o botón RUN)
- [ ] ✅ Verificar mensaje de éxito
- [ ] ✅ Verificar que se crearon 15 tablas

**Verificación:**
```sql
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';
-- Debe retornar: 15
```

### Paso 2: Configuración RLS ⭐⭐⭐⭐⭐
- [ ] Nueva pestaña en SQL Editor
- [ ] Abrir archivo: `supabase_configuracion_adicional.sql`
- [ ] Copiar TODO el contenido
- [ ] Pegar en nueva pestaña
- [ ] Ejecutar (Ctrl + Enter)
- [ ] ✅ Verificar que no hay errores
- [ ] ✅ Verificar funciones creadas

**Verificación:**
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public';
-- Debe listar varias funciones
```

### Paso 3: Asignar Administrador ⭐⭐⭐⭐⭐
- [ ] Abrir archivo: `asignar_rol_admin.sql`
- [ ] Reemplazar `EMAIL_DEL_USUARIO_AQUI` con tu email real
- [ ] Copiar y ejecutar en SQL Editor
- [ ] ✅ Verificar mensaje de éxito
- [ ] ✅ Tu usuario ahora es admin

**Verificación:**
```sql
SELECT nombre, email, role FROM usuario 
WHERE role = 'admin';
-- Debe mostrar tu usuario
```

---

## 🧪 Testing y Verificación (RECOMENDADO)

### Verificar Tablas Creadas
- [ ] Ejecutar query de verificación de tablas
- [ ] Confirmar que hay exactamente 15 tablas
- [ ] Revisar estructura de tabla `usuario`
- [ ] Revisar estructura de tabla `productos_3d`
- [ ] Revisar estructura de tabla `pedidos`

**Query:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Verificar Funciones
- [ ] Ejecutar query de funciones
- [ ] Confirmar que existen al menos 9 funciones
- [ ] Probar función: `obtener_estadisticas_dashboard()`

**Query:**
```sql
SELECT obtener_estadisticas_dashboard();
```

### Verificar Vistas
- [ ] Verificar que se crearon 6 vistas
- [ ] Probar vista: `vista_pedidos_completos`
- [ ] Probar vista: `vista_productos_stock_bajo`

**Query:**
```sql
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'public';
```

### Verificar Políticas RLS
- [ ] Confirmar que RLS está habilitado en tablas críticas
- [ ] Verificar política en tabla `usuario`
- [ ] Verificar política en tabla `pedidos`

**Query:**
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

---

## 📊 Datos de Prueba (OPCIONAL)

### Insertar Usuarios de Prueba
- [ ] Abrir: `queries_ejemplo.sql`
- [ ] Copiar sección 1.1 (Crear usuarios)
- [ ] Ejecutar en SQL Editor
- [ ] ✅ Verificar que se crearon usuarios

### Insertar Productos de Prueba
- [ ] Copiar sección 1.2 (Crear productos)
- [ ] Ejecutar en SQL Editor
- [ ] ✅ Verificar que se crearon 5 productos

### Insertar Pedidos de Prueba
- [ ] Copiar sección 1.3 (Crear pedidos)
- [ ] Ejecutar en SQL Editor
- [ ] ✅ Verificar que se crearon pedidos

### Datos Adicionales (Opcional)
- [ ] Insertar historial de envíos (1.4)
- [ ] Insertar personalizaciones (1.5)
- [ ] Insertar tickets (1.6)
- [ ] Insertar conversaciones (1.7)
- [ ] Insertar mensajes de chat (1.8)
- [ ] Insertar valoraciones (1.9)
- [ ] Insertar inventario (1.10)

---

## 🔧 Configuración del Proyecto

### Variables de Entorno
- [ ] Abrir archivo: `.env.local`
- [ ] Agregar `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Agregar `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Verificar otras variables (Wompi, etc.)

**Ejemplo:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### Cliente Supabase en Next.js
- [ ] Verificar instalación de `@supabase/supabase-js`
- [ ] Verificar archivo de cliente Supabase
- [ ] Probar conexión desde el frontend

**En tu código:**
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### Sincronización con Drizzle (Opcional)
- [ ] Actualizar `drizzle.config.json` con URL de Supabase
- [ ] Ejecutar `npm run db:push` para sincronizar
- [ ] Verificar que no hay conflictos

---

## 🎨 Integración Frontend

### Probar Queries Básicas
- [ ] Query: Obtener todos los productos
- [ ] Query: Obtener productos destacados
- [ ] Query: Buscar productos por categoría
- [ ] Query: Obtener carrito del usuario

**Ejemplo:**
```typescript
// Obtener productos
const { data: productos } = await supabase
  .from('productos_3d')
  .select('*')
  .eq('featured', true)
```

### Probar Autenticación
- [ ] Usuario puede registrarse
- [ ] Usuario puede iniciar sesión
- [ ] RLS permite ver solo datos propios
- [ ] Admin puede ver todos los datos

### Probar Funcionalidades
- [ ] Agregar producto al carrito
- [ ] Crear un pedido
- [ ] Ver tracking de envío
- [ ] Crear ticket de soporte
- [ ] Enviar mensaje de contacto

---

## 🛠️ Configuración Avanzada (OPCIONAL)

### Mantenimiento Automático
- [ ] Revisar archivo: `supabase_mantenimiento.sql`
- [ ] Decidir qué scripts automatizar
- [ ] Configurar CRON jobs en Supabase

### CRON Jobs Sugeridos
- [ ] Limpiar carritos antiguos (Diario 3 AM)
- [ ] Limpiar notificaciones (Semanal Domingo 2 AM)
- [ ] Actualizar estadísticas (Diario 4 AM)
- [ ] Vacuum DB (Semanal Lunes 1 AM)

**Configurar:**
```sql
SELECT cron.schedule(
  'limpiar-carritos',
  '0 3 * * *',
  'SELECT limpiar_carritos_antiguos()'
);
```

### Reportes Personalizados
- [ ] Identificar reportes necesarios
- [ ] Crear funciones personalizadas adicionales
- [ ] Integrar con dashboard

---

## 📈 Optimización y Monitoreo

### Rendimiento
- [ ] Ejecutar: `SELECT * FROM monitorear_tamano_tablas();`
- [ ] Revisar tablas grandes
- [ ] Considerar particionamiento si es necesario

### Validación de Datos
- [ ] Ejecutar: `SELECT * FROM validar_integridad_pedidos();`
- [ ] Ejecutar: `SELECT * FROM validar_stock_productos();`
- [ ] Ejecutar: `SELECT * FROM validar_usuarios_duplicados();`
- [ ] Corregir cualquier problema encontrado

### Backup
- [ ] Configurar backups automáticos en Supabase
- [ ] Probar restauración de backup
- [ ] Documentar proceso de backup/restore

---

## 🔐 Seguridad

### Revisión de Seguridad
- [ ] Verificar que RLS está activo en todas las tablas
- [ ] Probar acceso como usuario normal
- [ ] Probar acceso como administrador
- [ ] Verificar que no hay fugas de datos

### Políticas RLS Personalizadas
- [ ] Revisar políticas según lógica de negocio
- [ ] Ajustar políticas si es necesario
- [ ] Documentar cambios realizados

### API Keys y Secrets
- [ ] Verificar que API keys no están en código
- [ ] Confirmar uso de variables de entorno
- [ ] Rotar keys si fueron expuestas

---

## 📚 Documentación

### Leer Documentación
- [ ] Leer: `README_BASE_DATOS.md` completo
- [ ] Revisar: `RESUMEN_BASE_DATOS.md`
- [ ] Consultar: `INDICE_BASE_DATOS.md`
- [ ] Ver: `DIAGRAMA_BASE_DATOS.md`

### Documentar Cambios
- [ ] Crear log de cambios personalizados
- [ ] Documentar funciones adicionales
- [ ] Actualizar diagramas si cambió estructura

---

## 🎓 Capacitación del Equipo

### Onboarding
- [ ] Compartir documentación con el equipo
- [ ] Explicar estructura de base de datos
- [ ] Mostrar queries comunes
- [ ] Demostrar uso de funciones

### Training
- [ ] Sesión sobre RLS y seguridad
- [ ] Sesión sobre queries optimizadas
- [ ] Sesión sobre mantenimiento
- [ ] Sesión sobre debugging

---

## 🚀 Deployment

### Pre-producción
- [ ] Todos los tests pasando
- [ ] Datos de prueba eliminados
- [ ] Backups configurados
- [ ] Monitoreo activo

### Producción
- [ ] Deploy de base de datos completo
- [ ] Variables de entorno en producción
- [ ] Verificar acceso y permisos
- [ ] Monitorear primeras queries

### Post-producción
- [ ] Revisar logs de errores
- [ ] Optimizar queries lentas
- [ ] Ajustar índices según uso real
- [ ] Documentar lecciones aprendidas

---

## 📊 Métricas de Éxito

### ✅ Instalación Completa
- [X] 15 tablas creadas
- [X] 40+ políticas RLS activas
- [X] 9 funciones personalizadas
- [X] 6 vistas útiles
- [X] 10 triggers activos
- [X] 35+ índices optimizados

### ✅ Funcionalidades Operativas
- [ ] E-commerce funciona end-to-end
- [ ] Sistema de personalización operativo
- [ ] Chat en tiempo real activo
- [ ] Tickets de soporte funcionando
- [ ] Tracking de envíos operativo
- [ ] Dashboard admin muestra datos

### ✅ Rendimiento
- [ ] Queries principales < 100ms
- [ ] Tamaño de DB monitoreado
- [ ] Backups funcionando
- [ ] Sin errores en logs

---

## 🎉 ¡Completado!

### Una vez marcados todos los checkboxes críticos:

**Tu base de datos está LISTA para producción** ✅

### Próximos pasos:
1. Comenzar desarrollo de features
2. Integrar con servicios externos (Wompi, Cloudinary)
3. Configurar CI/CD
4. Monitorear y optimizar

---

## 📞 Ayuda

Si tienes problemas en algún paso:

1. **Revisa la documentación**: `README_BASE_DATOS.md`
2. **Consulta ejemplos**: `queries_ejemplo.sql`
3. **Verifica logs**: SQL Editor de Supabase
4. **Debug**: Usa las queries de validación

---

**Versión:** 1.0.0  
**Última actualización:** Noviembre 2025  
**Estado:** ✅ Checklist Completo
