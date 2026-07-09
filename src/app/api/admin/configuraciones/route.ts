import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const getAdminClient = () => {
  const key = supabaseServiceKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// GET: Recuperar todas las configuraciones
export async function GET() {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("configuraciones_globales")
      .select("*");

    if (error) {
      console.error("Error cargando configuraciones:", error.message);
      // Retornar fallback para el dashboard original
      return NextResponse.json({ valor: "", configuraciones: {} });
    }

    // Convertir array de filas a un objeto clave-valor
    const configRows = (data ?? []) as { clave: string; valor: unknown }[];
    const configObj: Record<string, unknown> = configRows.reduce((acc: Record<string, unknown>, row) => {
      acc[row.clave] = row.valor;
      return acc;
    }, {});

    // Retornamos "valor" (para compatibilidad con correo_gerente del dashboard) y "configuraciones"
    return NextResponse.json({ 
      valor: (configObj.correo_gerente as string) ?? "", 
      configuraciones: configObj 
    });
  } catch (err) {
    console.error("Error en GET /api/admin/configuraciones:", err);
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}

// POST: Guardar o actualizar una configuración
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { clave?: string; valor: unknown };
    let { clave } = body;
    const { valor } = body;

    // Si viene sin clave, asumimos que es el correo del gerente por compatibilidad
    clave ??= "correo_gerente";

    const supabase = getAdminClient();
    const { error } = await supabase
      .from("configuraciones_globales")
      .upsert({ clave, valor, updated_at: new Date().toISOString() }, { onConflict: "clave" });

    if (error) {
      console.error("Error guardando configuración:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error en POST /api/admin/configuraciones:", err);
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}
