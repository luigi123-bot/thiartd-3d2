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

