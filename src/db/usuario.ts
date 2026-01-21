import { db } from "./client";

// Define an interface for Usuario
export interface Usuario {
  id?: number;
  nombre: string;
  email: string;
  password: string;
  auth_id?: string; // UUID de Supabase Auth
  rol?: string; // rol del usuario
}

// Agregar un usuario
export async function agregarUsuario(nombre: string, email: string, password: string, auth_id?: string, rol = "user"): Promise<Usuario[]> {
  const { data, error } = await db.from('usuario').insert({ nombre, email, password, auth_id, rol }).select();
  if (error) throw error;
  return data as Usuario[];
}

// Obtener todos los usuarios
export async function obtenerUsuarios(): Promise<Usuario[]> {
  const { data, error } = await db.from('usuario').select('*');
  if (error) throw error;
  return data as Usuario[];
}
