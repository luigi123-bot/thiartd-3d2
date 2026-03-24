import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Endpoint de API para obtener la lista de roles disponibles.
 * Esta API es crítica porque provee los identificadores (ids) que se guardan en el perfil del usuario.
 */
export async function GET() {
  try {
    // Intentar buscar en tablas comunes de roles (esquema flexible)
    const tables = ["roles", "role"];
    for (const table of tables) {
      try {
        const res = await supabase.from(table).select("*").order("id", { ascending: true });
        const { data, error } = res as { data: Record<string, unknown>[] | null; error: { message?: string } | null };
        
        if (error) {
          const msg = String(error.message ?? "").toLowerCase();
          // Si la tabla no existe, intentamos con la siguiente opción
          if (msg.includes("does not exist") || msg.includes("relation")) continue;
          return NextResponse.json({ error: error.message ?? JSON.stringify(error) }, { status: 500 });
        }

        if (Array.isArray(data) && data.length > 0) {
          // Normalización de filas para asegurar que siempre haya un 'id' técnico y una 'label' legible
          const asUnknown = data as unknown[];
          const getString = (v: unknown) =>
            typeof v === "string" || typeof v === "number" || typeof v === "boolean" ? String(v) : "";

          const mapped = asUnknown.map((row) => {
            const obj = (row as Record<string, unknown>) ?? {};
            
            /**
             * LÓGICA ESTRATÉGICA DE IDENTIFICACIÓN:
             * Priorizamos identificadores legibles (slus/nombres) como 'admin' o 'creador' sobre los UUIDs de la BD.
             * Esto asegura que al asignar un rol en el panel de Admin, se guarde el texto que el sistema de permisos reconoce.
             */
            const id = getString(obj.nombre ?? obj.name ?? obj.role ?? obj.key ?? obj.id);
            const label = getString(
              obj.nombre ?? obj.name ?? obj.label ?? obj.title ?? obj.role ?? obj.key ?? id
            );
            
            return { id, label, raw: obj } as { id: string; label: string; raw: Record<string, unknown> };
          });
          
          return NextResponse.json({ roles: mapped });
        }
      } catch (err) {
        console.warn("Ignorando error al consultar tabla de roles:", table, err);
        continue;
      }
    }
    
    // Si no se encontró ninguna tabla con datos, devolver lista vacía
    return NextResponse.json({ roles: [] });
  } catch (err) {
    console.error("Error crítico en /api/admin/roles:", err);
    return NextResponse.json({ roles: [] });
  }
}
