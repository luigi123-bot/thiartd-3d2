import { NextResponse } from "next/server";
import { type PostgrestError } from "@supabase/supabase-js";
import { getSupabaseAnon } from "~/lib/supabaseServer";

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  role: string;
}

export async function GET() {
  const supabase = getSupabaseAnon();
  const { data, error }: { data: Usuario[] | null; error: PostgrestError | null } = await supabase.from("usuarios").select("id, nombre, email, role");
  if (error) {
    console.error("Error en GET /api/admin/usuarios:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ usuarios: data });
}

export async function POST(req: Request) {
  const supabase = getSupabaseAnon();
  const body = await req.json() as { email: string; role: string };
  const { email, role } = body;
  if (!email || !role) {
    return NextResponse.json({ error: "Email y role son obligatorios" }, { status: 400 });
  }
  const { data, error }: { data: Usuario | null; error: PostgrestError | null } = await supabase
    .from("usuarios")
    .update({ role })
    .eq("email", email)
    .select("id, nombre, email, role")
    .single();
  if (error) {
    console.error("Error en POST /api/admin/usuarios:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ usuario: data });
}
