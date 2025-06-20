import { pgTable, serial, varchar, text, numeric, integer, boolean, uuid } from "drizzle-orm/pg-core";

export const usuario = pgTable("usuario", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: varchar("nombre", { length: 100 }),
  email: varchar("email", { length: 100 }),
  password: varchar("password", { length: 255 }).notNull(),
});

export const products = pgTable("productos_3d", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }),
  size: varchar("size", { length: 50 }),
  stock: integer("stock").default(0),
  category: varchar("category", { length: 50 }),
  featured: boolean("featured").default(false),
  details: text("details"),
  image_url: text("image_url"),
  user_id: uuid("user_id").references(() => usuario.id).notNull(), // Relación con usuario
});
