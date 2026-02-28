import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Usar service_role key para bypass RLS policies
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface ProductoPedido {
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  categoria?: string;
}

interface DatosContacto {
  nombre: string;
  email: string;
  telefono: string;
}

interface DatosEnvio {
  direccion: string;
  ciudad: string;
  departamento: string;
  codigoPostal: string;
  telefono: string;
  notas?: string;
}

interface PedidoRequestBody {
  cliente_id?: string;
  productos: ProductoPedido[];
  total: number;
  subtotal?: number; // Opcional, no se usa en la BD
  costo_envio: number;
  estado: string;
  datos_contacto: DatosContacto;
  datos_envio: DatosEnvio;
}

interface PedidoInserted {
  id: number;
  cliente_id: string;
  productos: string;
  total: number;
  estado: string;
  datos_contacto: string;
  direccion_envio: string;
  ciudad_envio: string;
  departamento_envio: string;
  codigo_postal_envio: string;
  telefono_envio: string;
  notas_envio?: string;
  costo_envio: number;
  created_at: string;
}

interface SupabaseError {
  message: string;
  code?: string;
  hint?: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as PedidoRequestBody;
    console.log("Datos recibidos en /api/pedidos:", body);

    const {
      cliente_id,
      productos,
      total,
      // subtotal ya no existe en la tabla
      costo_envio,
      estado,
      datos_contacto,
      datos_envio
    } = body;

    if (!productos || !estado || !datos_envio) {
      return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 });
    }

    // Verificar si el usuario existe en la tabla usuario, si no, crearlo (solo si cliente_id existe)
    if (cliente_id) {
      const { data: usuarioExistente } = await supabase
        .from("usuario")
        .select("id")
        .eq("id", cliente_id)
        .single();

      if (!usuarioExistente) {
        console.log("Usuario no existe en tabla 'usuario', creándolo...");
        // Obtener datos del usuario de Supabase Auth
        const { data: authUser } = await supabase.auth.admin.getUserById(cliente_id);

        if (authUser?.user) {
          const userMetadata = authUser.user.user_metadata as { nombre?: string } | undefined;
          const nombreUsuario = userMetadata?.nombre ?? authUser.user.email?.split('@')[0] ?? 'Usuario';

          const { error: insertUserError } = await supabase
            .from("usuario")
            .insert([{
              id: cliente_id,
              email: authUser.user.email ?? '',
              nombre: nombreUsuario,
              password: '', // Password vacío porque usa Supabase Auth
              role: 'user'
            }]);

          if (insertUserError) {
            console.error("Error creando usuario:", insertUserError);
            // Continuar de todas formas, el pedido es más importante
          } else {
            console.log("✅ Usuario creado en tabla 'usuario'");
          }
        }
      }
    }

    const insertData = {
      cliente_id: cliente_id ?? null,
      productos: JSON.stringify(productos),
      total,
      // REMOVIDO: subtotal (no existe en la tabla)
      estado,
      datos_contacto: JSON.stringify(datos_contacto ?? {}),
      // Información de envío detallada
      direccion_envio: datos_envio.direccion,
      ciudad_envio: datos_envio.ciudad,
      departamento_envio: datos_envio.departamento,
      codigo_postal_envio: datos_envio.codigoPostal,
      telefono_envio: datos_envio.telefono,
      notas_envio: datos_envio.notas,
      costo_envio,
      created_at: new Date().toISOString(),
    };

    console.log("Insertando en pedidos:", insertData);

    const { data, error } = await supabase
      .from("pedidos")
      .insert([insertData])
      .select()
      .single<PedidoInserted>();

    if (error) {
      console.error("Error Supabase pedidos:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ pedido: data });
  } catch (err) {
    console.error("Error inesperado en /api/pedidos:", err);
    return NextResponse.json({ error: "Error inesperado al crear pedido." }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pedidoId = searchParams.get("id");

    // Si hay un ID específico, buscar ese pedido
    if (pedidoId) {
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .eq("id", pedidoId)
        .single<Record<string, unknown>>();

      if (error) {
        const supabaseError = error as SupabaseError;
        return NextResponse.json({ error: supabaseError.message }, { status: 500 });
      }

      return NextResponse.json({ pedido: data });
    }

    // Si no hay ID, devolver todos los pedidos
    const { data, error } = await supabase
      .from("pedidos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      const supabaseError = error as SupabaseError;
      return NextResponse.json({ error: supabaseError.message }, { status: 500 });
    }

    return NextResponse.json({ pedidos: data as Record<string, unknown>[] });
  } catch (err) {
    console.error("Error obteniendo pedidos:", err);
    return NextResponse.json({ error: "Error obteniendo pedidos" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json() as {
      pedido_id?: number;
      pedidoId?: number;
      payment_id?: string;
      payment_method?: string;
      estado?: string;
    };
    console.log("Actualizando pedido:", body);

    // Aceptar tanto pedido_id como pedidoId
    const pedidoId = body.pedido_id ?? body.pedidoId;
    const { payment_id, payment_method, estado } = body;

    if (!pedidoId) {
      return NextResponse.json({ error: "Falta el ID del pedido" }, { status: 400 });
    }

    const updateData: {
      payment_id?: string;
      payment_method?: string;
      estado?: string;
      updated_at?: string;
    } = {
      updated_at: new Date().toISOString()
    };

    // Solo actualizar los campos que vienen en el body
    if (payment_id) {
      updateData.payment_id = payment_id;
    }

    if (payment_method) {
      updateData.payment_method = payment_method;
    }

    if (estado) {
      updateData.estado = estado;
    }

    const result = await supabase
      .from("pedidos")
      .update(updateData)
      .eq("id", pedidoId)
      .select()
      .single();

    if (result.error) {
      console.error("Error actualizando pedido:", result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    console.log("✅ Pedido actualizado:", result.data);
    return NextResponse.json({ pedido: result.data as Record<string, unknown> });
  } catch (err) {
    console.error("Error en PATCH /api/pedidos:", err);
    return NextResponse.json({ error: "Error actualizando pedido" }, { status: 500 });
  }
}
