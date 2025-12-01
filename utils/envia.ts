import axios from "axios";

const ENVIA_API_URL = "https://envia-api.thiartd.com.br";
const ENVIA_API_KEY = process.env.ENVIA_API_KEY;

export const crearEnvio = async (data: string) => {
  if (!ENVIA_API_KEY) {
    throw new Error("ENVIA_API_KEY no está configurada");
  }
  try {
    const response = await axios.post(ENVIA_API_URL, data, {
      headers: {
        Authorization: `Bearer ${ENVIA_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error("Error creando envío:", error.response?.data && error.message);
    } else if (error instanceof Error) {
      console.error("Error creando envío:", error.message);
    } else {
      console.error("Error creando envío:", error);
    }
    throw error;
  }
};
if (process.env.NODE_ENV !== "production") {
  void (async () => {
    try {
      const response = await fetch("https://api.envia.com/ship/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer 8f0f8203bd22977cc23ad28aa971db018894ca56c029740c15e29c2caef8154a"
        },
        body: JSON.stringify({
          origin: { name: "Test", country: "CO" },
          destination: { name: "Test", country: "CO" },
          packages: [{ content: "Ping test", amount: 1, type: "box" }]
        })
      });

      console.log("Respuesta ENVIA:", await response.json());
    } catch (err) {
      console.error("Error probando ENVIA:", err);
    }
  })();
}

