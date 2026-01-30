import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // Intentar tablas comunes: roles, role
    const tables = ["roles", "role"];
    for (const table of tables) {
      try {
        const res = await supabase.from(table).select("*").order("id", { ascending: true });
        const { data, error } = res as { data: Record<string, unknown>[] | null; error: { message?: string } | null };
        if (error) {
          const msg = String(error.message ?? "").toLowerCase();
          if (msg.includes("does not exist") || msg.includes("relation")) continue;
          return NextResponse.json({ error: error.message ?? JSON.stringify(error) }, { status: 500 });
        }
        if (Array.isArray(data) && data.length > 0) {
          // normalize rows to always include an id and a human label
          const asUnknown = data as unknown[];
          const getString = (v: unknown) =>
            typeof v === "string" || typeof v === "number" || typeof v === "boolean" ? String(v) : "";

          const mapped = asUnknown.map((row) => {
            const obj = (row as Record<string, unknown>) ?? {};
            const id = getString(obj.id ?? obj.key ?? obj.role);
            const label = getString(
              obj.nombre ?? obj.name ?? obj.label ?? obj.title ?? obj.role ?? obj.key ?? id
            );
            return { id, label, raw: obj } as { id: string; label: string; raw: Record<string, unknown> };
          });
          return NextResponse.json({ roles: mapped });
        }
      } catch (err) {
        console.warn("Ignoring error querying roles table", table, err);
        continue;
      }
    }
    return NextResponse.json({ roles: [] });
  } catch (err) {
    console.error("Error in /api/admin/roles:", err);
    return NextResponse.json({ roles: [] });
  }
}
