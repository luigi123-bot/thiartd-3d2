import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface PersonalizacionRequestBody {
  usuario_id?: string;
  nombre: string;
  email: string;
  tamano: string;
  material: string;
  color: string;
  acabado: string;
  presupuesto: string;
  plazo: string;
  descripcion: string;
  referencia_url?: string;
  estado?: string;
  titulo?: string;
}

interface PersonalizacionInserted {
  id: number;
  usuario_id?: string;
  nombre: string;
  email: string;
  tamano: string;
  material: string;
  color: string;
  acabado: string;
  presupuesto: string;
  plazo: string;
  descripcion: string;
  referencia_url?: string;
  estado: string;
  created_at: string;
  titulo?: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as PersonalizacionRequestBody;
    const { usuario_id, nombre, email, tamano, material, color, acabado, presupuesto, plazo, descripcion, referencia_url, estado, titulo } = body;
    if (!nombre || !email || !tamano || !material || !color || !acabado || !presupuesto || !plazo || !descripcion) {
      return NextResponse.json({ error: "Todos los campos son obligatorios." }, { status: 400 });
    }
    const insertResult = await supabase
      .from("personalizaciones")
      .insert([{
        usuario_id,
        nombre,
        email,
        tamano,
        material,
        color,
        acabado,
        presupuesto,
        plazo,
        descripcion,
        referencia_url,
        estado: estado ?? "pendiente_pago",
        titulo,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();
      
    const data = insertResult.data as PersonalizacionInserted | null;
    const insertError = insertResult.error;
    
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    return NextResponse.json({ personalizacion: data });
  } catch {
    return NextResponse.json({ error: "Error inesperado al guardar personalización." }, { status: 500 });
  }
}

export async function GET() {
  const { data, error } = await supabase.from("personalizaciones").select("*").order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ personalizaciones: data });
}
