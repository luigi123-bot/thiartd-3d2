import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseServiceKey) {
  console.warn("Warning: SUPABASE_SERVICE_ROLE_KEY not set. /api/admin/whoami may fail due to RLS.");
}
const supabase = createClient(supabaseUrl, supabaseServiceKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function POST(req: Request) {
  try {
    const body = await req.json() as { auth_id?: unknown };
    const authId = typeof body?.auth_id === 'string' ? body.auth_id : null;
    if (!authId) return NextResponse.json({ isAdmin: false });

    const tables = ["usuarios", "usuario", "users"];
    for (const t of tables) {
      try {
        const { data, error } = await supabase
          .from(t)
          .select("role,rol,nombre,email,auth_id")
          .or(`auth_id.eq.${authId},email.eq.${authId}`)
          .limit(1)
          .maybeSingle();

        if (error) {
          const msg = String(error.message ?? "").toLowerCase();
          if (msg.includes("does not exist") || msg.includes("relation")) continue;
          console.error("Error querying table", t, error.message);
          continue;
        }

        if (data && (data.role || data.rol)) {
          const role = (data.role ?? data.rol) as string;
          return NextResponse.json({ isAdmin: String(role).toLowerCase() === 'admin', role });
        }
      } catch (err) {
        console.warn('Ignoring error checking table', t, err);
        continue;
      }
    }

    return NextResponse.json({ isAdmin: false });
  } catch (err) {
    console.error('Error in /api/admin/whoami:', err);
    return NextResponse.json({ isAdmin: false });
  }
}
