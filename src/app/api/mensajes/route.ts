import { NextResponse } from "next/server";
import { getSupabaseAnon } from "~/lib/supabaseServer";


export async function POST(req: Request) {
  const supabase = getSupabaseAnon();
  try {
    const maybeBody: unknown = await req.json();
    if (
      typeof maybeBody !== "object" ||
      maybeBody === null ||
      !("nombre" in maybeBody) ||
      !("email" in maybeBody) ||
      !("mensaje" in maybeBody)
    ) {
      return NextResponse.json({ error: "Todos los campos son obligatorios." }, { status: 400 });
    }
    const { nombre, email, mensaje } = maybeBody as { nombre: string; email: string; mensaje: string };
    if (!nombre || !email || !mensaje) {
      return NextResponse.json({ error: "Todos los campos son obligatorios." }, { status: 400 });
    }
    interface Mensaje {
      id: number;
      nombre: string;
      email: string;
      mensaje: string;
      creado_en?: string;
    }
    
    const { data, error }: { data: Mensaje | null; error: { message: string } | null } = await supabase
      .from("mensajes")
      .insert([{ nombre, email, mensaje }])
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Programar alerta por correo si pasan más de 2 minutos sin respuesta
    try {
      const url = new URL("/api/mensajes/notify-delayed", req.url).toString();
      void fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: data?.id,
          clienteNombre: nombre,
          clienteEmail: email,
          mensaje,
        }),
      }).catch(err => console.error("Error programando alerta:", err));
    } catch {
      // Ignorar errores de URL en entornos aislados
    }

    return NextResponse.json({ mensaje: data });
  } catch {
    return NextResponse.json({ error: "Error inesperado al enviar mensaje." }, { status: 500 });
  }
}

export async function GET() {
  const supabase = getSupabaseAnon();
  const { data: mensajes, error } = await supabase.from("mensajes").select("*").order("creado_en", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ mensajes });
}
