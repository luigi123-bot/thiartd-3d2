import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseServiceKey) {
  console.warn("Warning: SUPABASE_SERVICE_ROLE_KEY not set. Endpoint may fail due to RLS/permissions.");
}
const supabase = createClient(supabaseUrl, supabaseServiceKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { nombre: string; email: string; password: string; role?: string };
    const { nombre, email, password, role } = body;
    if (!nombre || !email || !password) {
      return NextResponse.json({ error: "Nombre, email y password son obligatorios" }, { status: 400 });
    }

    // Validar que el role exista en la tabla de roles (si se envió)
    const desiredRole = (role ?? "cliente").toString();
    if (desiredRole) {
      let found = false;
      const roleTables = ["roles", "role"];
      for (const t of roleTables) {
        try {
          const r = await supabase.from(t).select("*");
          const rErr = (r as { error?: { message?: string } | null })?.error ?? null;
          const rData = (r as { data?: Record<string, unknown>[] | null })?.data ?? null;
          if (rErr) {
            const msg = String(rErr.message ?? "").toLowerCase();
            if (msg.includes("does not exist") || msg.includes("relation")) continue;
            // other error -> stop
            return NextResponse.json({ error: rErr.message ?? JSON.stringify(rErr) }, { status: 500 });
          }
          if (Array.isArray(rData)) {
            const match = rData.find((row: Record<string, unknown>) => {
              const candidates = [
                row.name,
                row.role,
                row.key,
                row.id,
                row.label,
                row.title,
                row.nombre,
              ].map((x) =>
                (typeof x === "string" || typeof x === "number" || typeof x === "boolean" ? String(x) : "").toLowerCase()
              );
              return candidates.includes(desiredRole.toLowerCase());
            });
            if (match) { found = true; break; }
          }
        } catch {
          continue;
        }
      }
      if (!found) {
        return NextResponse.json({ error: `Role '${desiredRole}' no encontrado en la tabla de roles.` }, { status: 400 });
      }
    }

    // Intentar crear usuario en Auth (requiere service_role key)
    let authUserId: string | undefined = undefined;
    try {
      type AdminCreateParams = { email: string; password: string; user_metadata?: Record<string, unknown> };
      type AdminCreateResult = { data?: unknown; error?: { message?: string } | null; user?: { id?: string } | null };

      const maybeCreate = (supabase as unknown as { auth?: { admin?: { createUser?: (p: AdminCreateParams) => Promise<AdminCreateResult> } } })
        .auth?.admin?.createUser;

      if (typeof maybeCreate === "function") {
        const resp = await maybeCreate({ email, password, user_metadata: { nombre } });
        if (resp?.error) {
          console.warn("auth.createUser error:", resp.error.message);
        } else if (
          resp?.user &&
          typeof resp.user === "object" &&
          "id" in resp.user &&
          typeof (resp.user as { id?: unknown }).id === "string"
        ) {
          authUserId = (resp.user as { id: string }).id;
        } else if (
          resp?.data &&
          typeof (resp.data as { user?: { id?: string } }).user?.id === "string"
        ) {
          // algunos adaptadores devuelven data.user
          authUserId = (resp.data as { user: { id: string } }).user.id;
        }
      } else {
        console.warn("Supabase client does not expose admin.createUser; skipping auth creation.");
      }
    } catch (err) {
      console.warn("No se pudo crear auth user con admin.createUser, intentando crear con insert en tabla 'usuarios' - error:", err);
    }

    // Insertar en tabla usuarios
    try {
      type InsertUser = { nombre: string; email: string; role: string; auth_id?: string };
      const insertBody: InsertUser = { nombre, email, role: role ?? "cliente" };
      if (authUserId) insertBody.auth_id = authUserId;

      const insertRes = await supabase
        .from("usuarios")
        .insert([insertBody])
        .select();
      const insertError = insertRes.error ?? null;
      const insertData = insertRes.data as InsertUser[] | null;
      if (insertError) {
        console.error("Error insertando usuario en tabla usuarios:", insertError.message ?? insertError);
        return NextResponse.json({ error: insertError.message ?? JSON.stringify(insertError) }, { status: 500 });
      }
      return NextResponse.json({ user: Array.isArray(insertData) ? insertData[0] : insertData });
    } catch (err) {
      console.error("Error inesperado creando usuario:", err);
      return NextResponse.json({ error: "Error inesperado creando usuario" }, { status: 500 });
    }
  } catch (err) {
    console.error("Error en /api/crear-usuario:", err);
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}
