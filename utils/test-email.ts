import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

// Leer variables de .env directamente sin dependencias externas
function loadEnv(): Record<string, string> {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, "utf-8");
  const env: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1]?.trim() ?? "";
      let val = match[2]?.trim() ?? "";
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

export async function testMail() {
  const env = loadEnv();
  const user = env.GMAIL_USER || process.env.GMAIL_USER || "thiart3d@gmail.com";
  const pass = env.GMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD;

  console.log("Probando envío desde:", user);

  if (!pass) {
    console.error("❌ No se encontró GMAIL_APP_PASSWORD en el archivo .env");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"Thiart 3D Test" <${user}>`,
      to: user,
      subject: "Test de Correo Thiart 3D ✅",
      text: "¡El sistema de correos de Thiart 3D está configurado y funcionando correctamente!",
    });
    console.log("✅ Correo enviado con éxito! ID:", (info as { messageId?: string }).messageId);
  } catch (err) {
    console.error("❌ Error al enviar:", err);
  }
}
