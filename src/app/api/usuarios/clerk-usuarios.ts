import type { NextApiRequest, NextApiResponse } from "next";

// Importa el SDK de Clerk para Node.js
import clerk from "@clerk/clerk-sdk-node";

// Clerk SDK usará automáticamente la clave secreta desde las variables de entorno

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Opcional: puedes validar el token del admin aquí si lo deseas

    // Trae todos los usuarios de Clerk (paginación opcional)
    const users = await clerk.users.getUserList({ limit: 100 });

    type ClerkUser = {
      id: string;
      firstName: string | null;
      lastName: string | null;
      emailAddresses: Array<{ emailAddress: string }>;
      createdAt: number;
    };

    res.status(200).json({
      usuarios: users.map((u: ClerkUser) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        emailAddresses: u.emailAddresses,
        createdAt: u.createdAt,
      })),
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Error al obtener usuarios de Clerk" });
    }
  }
}
