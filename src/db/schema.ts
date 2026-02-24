// @ts-nocheck
import { pgTable, serial, varchar, text, numeric, integer, boolean, uuid, timestamp } from "drizzle-orm/pg-core";
// If you get an error, ensure your drizzle-orm version is >=0.30.0. Otherwise, use:
// import { table, serial, varchar, text, numeric, integer, boolean, uuid, timestamp } from "drizzle-orm/pg-core";

export const usuario = pgTable("public.usuario", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: varchar("nombre", { length: 100 }),
  email: varchar("email", { length: 100 }),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).default("user"), // <-- Cambiado a 'role'
});

export const products = pgTable("public.productos", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),         // OBLIGATORIO
  description: text("description"),                         // Opcional
  price: numeric("price", { precision: 10, scale: 2 }),     // Opcional (puede ser obligatorio en tu lógica)
  size: varchar("size", { length: 50 }),                    // Opcional
  stock: integer("stock").default(0),                       // Opcional (default 0)
  category: varchar("category", { length: 50 }),            // Opcional
  featured: boolean("featured").default(false),             // Opcional (default false)
  details: text("details"),                                 // Opcional
  image_url: text("image_url"),                             // Opcional (deprecated - usar producto_imagenes)
  model_url: text("model_url"),                             // Opcional - URL del modelo 3D (GLB/GLTF)
  video_url: text("video_url"),                             // Opcional - URL del video del producto
  user_id: uuid("user_id").references(() => usuario.id).notNull(), // OBLIGATORIO
});

// Nueva tabla para múltiples imágenes por producto
export const productoImagenes = pgTable("public.producto_imagenes", {
  id: serial("id").primaryKey(),
  producto_id: integer("producto_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  image_url: text("image_url").notNull(),
  orden: integer("orden").default(0).notNull(),
  es_portada: boolean("es_portada").default(false),
  alt_text: varchar("alt_text", { length: 255 }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const personalizaciones = pgTable("public.personalizaciones", {
  id: serial("id").primaryKey(),
  usuario_id: uuid("usuario_id"),
  nombre: varchar("nombre", { length: 100 }),
  email: varchar("email", { length: 100 }),
  tamano: varchar("tamano", { length: 50 }),
  material: varchar("material", { length: 50 }),
  color: varchar("color", { length: 50 }),
  acabado: varchar("acabado", { length: 50 }),
  presupuesto: varchar("presupuesto", { length: 50 }),
  plazo: varchar("plazo", { length: 50 }),
  descripcion: text("descripcion"),
  referencia_url: text("referencia_url"),
  estado: varchar("estado", { length: 30 }).default("pendiente_pago"),
  created_at: timestamp("created_at").defaultNow(),
});

export const pedidos = pgTable("public.pedidos", {
  id: serial("id").primaryKey(),
  cliente_id: uuid("cliente_id"),
  productos: text("productos"),
  total: numeric("total", { precision: 10, scale: 2 }),
  estado: varchar("estado", { length: 30 }),
  direccion: text("direccion"),
  datos_contacto: text("datos_contacto"),
  // Información de envío detallada
  direccion_envio: text("direccion_envio"),
  ciudad_envio: varchar("ciudad_envio", { length: 100 }),
  departamento_envio: varchar("departamento_envio", { length: 100 }),
  codigo_postal_envio: varchar("codigo_postal_envio", { length: 20 }),
  telefono_envio: varchar("telefono_envio", { length: 20 }),
  notas_envio: text("notas_envio"),
  costo_envio: numeric("costo_envio", { precision: 10, scale: 2 }).default("0"),
  // Información de pago
  payment_id: varchar("payment_id", { length: 100 }),
  payment_method: varchar("payment_method", { length: 50 }),
  // Tracking de envío
  numero_tracking: varchar("numero_tracking", { length: 100 }),
  empresa_envio: varchar("empresa_envio", { length: 50 }),
  fecha_estimada_entrega: timestamp("fecha_estimada_entrega", { withTimezone: true }),
  fecha_real_entrega: timestamp("fecha_real_entrega", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Nueva tabla para el historial de estados
export const historial_envios = pgTable("public.historial_envios", {
  id: serial("id").primaryKey(),
  pedido_id: integer("pedido_id").references(() => pedidos.id).notNull(),
  estado: varchar("estado", { length: 50 }).notNull(),
  descripcion: text("descripcion"),
  ubicacion: varchar("ubicacion", { length: 200 }),
  fecha: timestamp("fecha", { withTimezone: true }).defaultNow(),
  notificado_cliente: boolean("notificado_cliente").default(false),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Nueva tabla para notificaciones
export const notificaciones = pgTable("public.notificaciones", {
  id: serial("id").primaryKey(),
  usuario_id: uuid("usuario_id"),
  pedido_id: integer("pedido_id").references(() => pedidos.id),
  tipo: varchar("tipo", { length: 50 }).notNull(), // 'email', 'push', 'sms'
  titulo: varchar("titulo", { length: 200 }).notNull(),
  mensaje: text("mensaje").notNull(),
  enviado: boolean("enviado").default(false),
  fecha_envio: timestamp("fecha_envio", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
