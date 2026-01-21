# Thiart 3D - Especificación del Proyecto

## 1. Introducción

Thiart 3D es un e-commerce especializado en impresiones 3D unitarias, dirigido a consumidores finales y empresas. Permite la compra de productos propios y la carga de modelos personalizados para impresión. Ubicado en Miraflores, Cali, Colombia, busca ofrecer una plataforma moderna, segura y eficiente, desarrollada con Next.js, Tailwind y Prisma.

---

## 2. Objetivos del Proyecto

### 2.1 Plataforma moderna, escalable y accesible
- Web responsiva y de alto rendimiento (Next.js, TypeScript, Tailwind CSS, Prisma).
- Compatibilidad multiplataforma.
- Escalabilidad horizontal y vertical.
- Código limpio y modular.

### 2.2 Compra de productos 3D y carga de modelos personalizados
- Catálogo de diseños propios.
- Carga de archivos 3D (.STL, .OBJ).
- Previsualización 3D (model-viewer, Three.js).
- Cotización automática por volumen, material, tipo de impresión y tiempo.

### 2.3 Gestión completa del flujo de usuario
- Flujo lógico desde registro hasta entrega.
- Seguimiento de pedidos, notificaciones y panel de usuario.
- Validación automática de modelos y precios.
- Checkout eficiente con múltiples métodos de pago y facturación electrónica.

### 2.4 Experiencia diferenciada para empresas y consumidores
- Experiencia simplificada para consumidores.
- Funcionalidades avanzadas para empresas (compras al por mayor, integración ERP/CRM, cuentas multiusuario).

---

## 3. Requerimientos Funcionales

- Registro e inicio de sesión (clientes y administradores) con NextAuth y OAuth.
- Catálogo de productos con filtros avanzados.
- Visualización detallada de productos y visualizador 3D.
- Carrito de compras editable y guardado automático.
- Checkout con dirección, cálculo de costos y métodos de pago.
- Integración con Stripe, MercadoPago y PayPal.
- Confirmación y seguimiento de pedidos.
- Panel administrativo para gestión de productos, usuarios y pedidos.
- Subida de modelos 3D personalizados (STL, OBJ) con validación y vista previa.
- Sistema de comentarios y valoraciones con moderación.

---

## 4. Requerimientos No Funcionales

- Alta disponibilidad (>99%).
- Escalabilidad del sistema y base de datos.
- Interfaz intuitiva y diseño responsivo.
- Seguridad en datos personales y transacciones (SSL, cifrado).
- Cumplimiento con normativas de protección de datos (GDPR o equivalentes).

---

## 5. Requerimientos Técnicos

- **Frontend:** Next.js (T3 App), Tailwind CSS, TypeScript.
- **Backend/API:** Next.js (App Router), NextAuth.
- **Base de datos:** PostgreSQL con Prisma ORM o Drizzle ORM.
- **Hosting:** Vercel.
- **Almacenamiento de archivos:** Cloudinary o AWS S3.
- **Pasarela de pagos:** Stripe y/o MercadoPago.

---

## 6. Producción y Logística

- Gestión de materiales (PLA, ABS, PETG, etc.).
- Definición de tiempos estándar de producción.
- Cálculo de precios por volumen o peso.
- Gestión de envíos desde Miraflores, Cali.
- Embalaje seguro y personalizado.
- Política clara de devoluciones por errores de impresión.

---

## 7. Aspectos Legales y Comerciales

- Políticas de privacidad, términos y condiciones y devoluciones.
- Cumplimiento de normativas locales en Colombia.
- Gestión de facturación electrónica.
- Protección de propiedad intelectual (modelos propios o subidos por terceros).

---
