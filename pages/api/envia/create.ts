import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const response = await fetch(
      `${process.env.ENVIA_API_BASE_URL}/ship/generate/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.ENVIA_API_TOKEN}`,
        },
        body: JSON.stringify({
          origin: {
            name: "Luis Gotopo",
            company: "Thiart-3D",
            email: "gotopoluis19@gmail.com",
            phone: "3183414976",
            street: "Calle 123 #45-67",
            number: "123",
            district: "Chapinero",
            city: "Bogotá",
            state: "Cundinamarca",
            country: "CO",
            postalCode: "110111",
          },
          destination: {
            name: "Cliente Test",
            company: "Mi Cliente",
            email: "cliente@test.com",
            phone: "3001234567",
            street: "Carrera 89 #12-34",
            number: "89",
            district: "Laureles",
            city: "Medellín",
            state: "Antioquia",
            country: "CO",
            postalCode: "050021",
          },
          packages: [
            {
              content: "Caja con accesorios 3D",
              amount: 1,
              type: "box",
              weight: 2,
              insurance: 100000,
              declaredValue: 100000,
              dimensions: {
                length: 30,
                width: 20,
                height: 15,
              },
            },
          ],
          shipment: {
            carrier: "ENVIA",
            type: 1,
            service: "standard",
          },
          settings: {
            printFormat: "PDF",
            currency: "COP",
          },
        }),
      }
    );

    // Tipar la respuesta y los datos
    type EnviaResponse = Record<string, unknown>;
    const data = (await response.json()) as EnviaResponse;

    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Error al crear envío:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
