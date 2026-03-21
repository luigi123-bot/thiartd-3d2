import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("configuraciones")
      .select("valor")
      .eq("clave", "correo_gerente")
      .single() as { data: { valor: string } | null; error: unknown };

    if (error) {
       // Table might not exist or record not found
       return NextResponse.json({ valor: process.env.GMAIL_USER ?? "" });
    }

    return NextResponse.json({ valor: data?.valor });
  } catch {
    return NextResponse.json({ valor: "" });
  }
}

export async function POST(req: Request) {
  try {
    const { valor } = (await req.json()) as { valor?: string };
    
    // UPSERT para guardar el correo
    const { error } = await supabase
      .from("configuraciones")
      .upsert({ clave: "correo_gerente", valor }, { onConflict: "clave" });

    if (error) {
        // If it fails, maybe because of missing table, try creating it once via raw SQL is not possible here
        // We'll just return an error and advise the user
        return NextResponse.json({ error: "No se pudo guardar. Verifica que exista la tabla 'configuraciones'." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}
