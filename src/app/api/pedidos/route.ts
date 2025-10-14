import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
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
  cliente_id: string;
  productos: ProductoPedido[];
  total: number;
  subtotal: number;
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
  subtotal?: number;
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
      subtotal, 
      costo_envio,
      estado, 
      datos_contacto,
      datos_envio 
    } = body;
    
    if (!cliente_id || !productos || !estado || !datos_envio) {
      return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 });
    }

    const insertData = {
      cliente_id,
      productos: JSON.stringify(productos),
      total,
      subtotal,
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

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("pedidos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      const supabaseError = error as SupabaseError;
      return NextResponse.json({ error: supabaseError.message }, { status: 500 });
    }

    return NextResponse.json({ pedidos: data });
  } catch (err) {
    console.error("Error obteniendo pedidos:", err);
    return NextResponse.json({ error: "Error obteniendo pedidos" }, { status: 500 });
  }
}
