import { agregarUsuario, obtenerUsuarios } from "./src/db/usuario";

// Agregar un usuario
await agregarUsuario("Juan", "juan@email.com", "123456");

// Obtener usuarios
const usuarios = await obtenerUsuarios();
console.log(usuarios);
