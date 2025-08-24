import type { NextApiRequest, NextApiResponse } from "next";
import type { TrackingRequest, TrackingResponse } from "../../../types/envia";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { trackingNumber } = req.body as { trackingNumber: string };

  if (!trackingNumber) {
    return res.status(400).json({ error: "Se requiere trackingNumber" });
  }

  try {
    const response = await fetch(
      `${process.env.ENVIA_API_BASE_URL}/ship/generaltrack/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.ENVIA_API_TOKEN}`,
        },
        body: JSON.stringify({ trackingNumbers: [trackingNumber] } as TrackingRequest),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    const data = (await response.json()) as TrackingResponse;
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error al conectar con Envia:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
