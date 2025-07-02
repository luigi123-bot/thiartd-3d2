import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
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
    return NextResponse.json({ mensaje: data });
  } catch {
    return NextResponse.json({ error: "Error inesperado al enviar mensaje." }, { status: 500 });
  }
}

export async function GET() {
  const { data: mensajes, error } = await supabase.from("mensajes").select("*").order("creado_en", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ mensajes });
}
