import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface ProductoPedido {
  producto_id?: string;
  nombre?: string;
  descripcion?: string;
  categoria?: string;
  tamano?: string;
  detalles?: string;
  cantidad: number;
  precio_unitario: number;
}

interface DatosContacto {
  nombre?: string;
  email?: string;
}

interface PedidoRequestBody {
  cliente_id: string;
  productos: ProductoPedido[];
  total: number;
  estado: string;
  direccion?: string;
  datos_contacto: DatosContacto;
}

interface PedidoInserted {
  id: number;
  cliente_id: string;
  productos: string;
  total: number;
  estado: string;
  direccion?: string;
  datos_contacto: string;
  created_at: string;
}

export async function POST(req: Request) {
	try {
		const body = await req.json() as PedidoRequestBody;
		console.log("Datos recibidos en /api/pedidos:", body);
		const { cliente_id, productos, total, estado, datos_contacto } = body;
		if (!cliente_id || !productos || !estado) {
			return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 });
		}
		const insertData = {
			cliente_id,
			productos: JSON.stringify(productos),
			total,
			estado,
			datos_contacto: JSON.stringify(datos_contacto ?? {}),
			created_at: new Date().toISOString(),
		};
		console.log("Insertando en pedidos:", insertData);

		const insertResult = await supabase
			.from("pedidos")
			.insert([insertData])
			.select()
			.single();

		const data = insertResult.data as PedidoInserted | null;
		const error = insertResult.error;

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
