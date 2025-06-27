import type { NextApiRequest, NextApiResponse } from "next";

// Importa el SDK de Clerk para Node.js
import { Clerk } from "@clerk/clerk-sdk-node";

// Usa tu clave secreta de Clerk (asegúrate de tenerla en tus variables de entorno)
const clerk = new Clerk({ apiKey: process.env.CLERK_SECRET_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Opcional: puedes validar el token del admin aquí si lo deseas

    // Trae todos los usuarios de Clerk (paginación opcional)
    const users = await clerk.users.getUserList({ limit: 100 });

    res.status(200).json({
      usuarios: users.map((u: any) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        emailAddresses: u.emailAddresses,
        createdAt: u.createdAt,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Error al obtener usuarios de Clerk" });
  }
}
