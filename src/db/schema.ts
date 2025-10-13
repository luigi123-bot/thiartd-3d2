import { pgTable, serial, varchar, text, numeric, integer, boolean, uuid, timestamp } from "drizzle-orm/pg-core";

export const usuario = pgTable("usuario", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: varchar("nombre", { length: 100 }),
  email: varchar("email", { length: 100 }),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).default("user"), // <-- Cambiado a 'role'
});

export const products = pgTable("productos_3d", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),         // OBLIGATORIO
  description: text("description"),                         // Opcional
  price: numeric("price", { precision: 10, scale: 2 }),     // Opcional (puede ser obligatorio en tu lógica)
  size: varchar("size", { length: 50 }),                    // Opcional
  stock: integer("stock").default(0),                       // Opcional (default 0)
  category: varchar("category", { length: 50 }),            // Opcional
  featured: boolean("featured").default(false),             // Opcional (default false)
  details: text("details"),                                 // Opcional
  image_url: text("image_url"),                             // Opcional
  user_id: uuid("user_id").references(() => usuario.id).notNull(), // OBLIGATORIO
});

export const personalizaciones = pgTable("personalizaciones", {
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

export const pedidos = pgTable("pedidos", {
  id: serial("id").primaryKey(),
  cliente_id: uuid("cliente_id"),
  productos: text("productos"),
  total: numeric("total", { precision: 10, scale: 2 }),
  estado: varchar("estado", { length: 30 }),
  direccion: text("direccion"), // <-- Agregado
  datos_contacto: text("datos_contacto"),
  created_at: timestamp("created_at").defaultNow(),
});
