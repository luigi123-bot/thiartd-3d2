import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "~/lib/email-service";

export async function POST(req: Request) {
  try {
    interface WelcomeRequest {
      email: string;
      nombre: string;
    }
    const { email, nombre } = (await req.json()) as WelcomeRequest;

    if (!email || !nombre) {
      return NextResponse.json({ error: "Email y nombre son obligatorios" }, { status: 400 });
    }

    const result = await sendWelcomeEmail({
      to: email,
      nombre: nombre,
    });

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (err) {
    console.error("Error en /api/auth/welcome:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
