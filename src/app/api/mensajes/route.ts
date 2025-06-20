import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nombre, email, mensaje } = body;
    if (!nombre || !email || !mensaje) {
      return NextResponse.json({ error: "Todos los campos son obligatorios." }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("mensajes")
      .insert([{ nombre, email, mensaje }])
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ mensaje: data });
  } catch (error) {
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
