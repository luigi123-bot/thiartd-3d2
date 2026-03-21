import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Usar Service Role Key para saltar RLS si es necesario al insertar reseñas
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { data, error } = await supabase
      .from("valoraciones")
      .select("*, usuarios:usuario_id(nombre)")
      .eq("producto_id", id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    const error = err as { message: string };
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json() as { usuario_id?: string; nombre_cliente?: string; estrellas?: number; comentario?: string };
    console.log("[REVIEWS POST DEBUG] Datos recibidos:", body);
    
    const { usuario_id, nombre_cliente, estrellas, comentario } = body;

    const { data, error } = await supabase
      .from("valoraciones")
      .insert([
        {
          producto_id: id,
          usuario_id: usuario_id ?? null,
          nombre_cliente: nombre_cliente ?? "Cliente Anónimo",
          estrellas: Number(estrellas ?? 5),
          comentario: typeof comentario === "string" ? comentario.trim() : ""
        }
      ])
      .select();

    if (error) {
      console.error("[REVIEWS POST ERROR]", error);
      throw error;
    }
    
    return NextResponse.json(data ? data[0] : { success: true });
  } catch (err) {
    const error = err as { message: string };
    console.error("[REVIEWS POST CATCH]", error);
    return NextResponse.json({ 
      error: "No se pudo guardar la reseña",
      details: error.message,
      hint: "Asegúrate de haber ejecutado el SQL en Supabase para crear la tabla 'valoraciones'."
    }, { status: 500 });
  }
}
