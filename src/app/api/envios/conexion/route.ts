import { NextResponse } from "next/server";
import axios from "axios";

/**
 * GET /api/envios/conexion
 * Verifica el estado de autenticación y el entorno de la ENVIA_API_KEY configurada.
 */
export async function GET() {
  const apiKey = process.env.ENVIA_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      configured: false,
      environment: "missing",
      isProduction: false,
      message: "No se ha configurado la variable ENVIA_API_KEY en el archivo .env",
    });
  }

  try {
    // 1. Probar en Producción (api.envia.com)
    let prodStatus = 0;
    try {
      const resProd = await axios.post(
        "https://api.envia.com/ship/rate",
        {
          origin: { country: "CO", postalCode: "760001" },
          destination: { country: "CO", postalCode: "110111" },
          packages: [{ content: "test", amount: 1, weight: 1, dimensions: { length: 10, width: 10, height: 10 } }],
          shipment: { type: 1 }
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 8000,
        }
      );
      prodStatus = resProd.status;
    } catch (e: any) {
      prodStatus = e.response?.status || 500;
    }

    // Si respondió 200 o un error de validación de datos (400), la clave ES VÁLIDA en Producción
    if (prodStatus === 200 || prodStatus === 400 || prodStatus === 422) {
      return NextResponse.json({
        configured: true,
        environment: "production",
        isProduction: true,
        message: "Conectado exitosamente a Envia.com en modo Producción. Tus envíos y recolecciones aparecerán en tu panel oficial.",
      });
    }

    // 2. Si dio 401 en Producción, probar si es una clave válida de Sandbox (api-test.envia.com)
    let testStatus = 0;
    try {
      const resTest = await axios.post(
        "https://api-test.envia.com/ship/rate",
        {},
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 8000,
        }
      );
      testStatus = resTest.status;
    } catch (e: any) {
      testStatus = e.response?.status || 500;
    }

    if (testStatus === 200 || testStatus === 400 || testStatus === 422) {
      return NextResponse.json({
        configured: true,
        environment: "sandbox",
        isProduction: false,
        portalUrl: "https://ship-test.envia.com",
        message: "Modo Pruebas (Sandbox) activo. Puedes generar guías y programar recolecciones de prueba sin consumir tu saldo real. Podrás verlas en el panel de pruebas de Envía (ship-test.envia.com).",
      });
    }

    return NextResponse.json({
      configured: true,
      environment: "invalid",
      isProduction: false,
      message: "La clave ENVIA_API_KEY no es válida o ha sido revocada por Envia.com (Error 401).",
    });
  } catch (error: any) {
    return NextResponse.json({
      configured: true,
      environment: "error",
      isProduction: false,
      message: `Error al conectar con los servidores de Envía: ${error.message}`,
    });
  }
}
