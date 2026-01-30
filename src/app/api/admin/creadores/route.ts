import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  const tables = ["usuarios", "usuario", "users"];
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select("id,nombre,name,email,role,rol")
        .order("nombre", { ascending: true });

      if (error) {
        const msg = String(error.message || "").toLowerCase();
        if (msg.includes("does not exist") || msg.includes("relation")) {
          continue;
        }
        console.error("Error consultando table", table, error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      interface UserRow {
        nombre?: string;
        name?: string;
        email: string;
        role?: string;
        rol?: string;
      }
      const rows: UserRow[] = data ?? [];
      const filtered = rows.filter((r) => (String(r.role ?? "").toLowerCase() === "creador") || (String(r.rol ?? "").toLowerCase() === "creador"));
      if (filtered.length > 0) {
        // Log readable names (prefer `nombre` then `name`, fallback to email/id)
        const names = filtered.map((r) => r.nombre ?? r.name ?? r.email);
        console.log("Creadores encontrados:", names);
        return NextResponse.json({ creators: filtered });
      }
    } catch (err) {
      console.warn("Ignorando error consultando table", table, err);
      continue;
    }
  }

  return NextResponse.json({ creators: [] });
}
