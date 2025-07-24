import { db } from "./client";
import { usuario } from "./schema";

// Agregar un usuario
export async function agregarUsuario(nombre: string, email: string, password: string) {
  return db.insert(usuario).values({ nombre, email, password }).returning();
}

// Obtener todos los usuarios
export async function obtenerUsuarios() {
  return db.select().from(usuario);
}
