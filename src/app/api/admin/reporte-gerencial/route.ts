import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendManagerReportEmail } from "~/lib/email-service";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface PedidoRow {
  id: number;
  total: number;
  estado: string;
  created_at: string;
  datos_contacto: string;
}

interface UserRow {
  id: string | number;
  creado_en: string;
  nombre?: string;
  email: string;
  role: string;
}

interface ProductRow {
  id: string | number;
  nombre: string;
  categoria: string;
  stock: number;
  precio: number;
  descripcion?: string;
}

interface MessageRow {
  id: string | number;
  created_at: string;
  nombre_cliente?: string;
  asunto?: string;
  leido: boolean;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { managerEmail?: string };
    const { managerEmail: overrideEmail } = body;
    
    // 1. Obtener toda la información de la plataforma
    const [
      { data: pedidos },
      { data: usuarios },
      { data: productos },
      { data: mensajes }
    ] = (await Promise.all([
      supabase.from("pedidos").select("*").order("created_at", { ascending: false }),
      supabase.from("usuarios").select("*").order("creado_en", { ascending: false }),
      supabase.from("productos").select("*").order("nombre", { ascending: true }),
      supabase.from("mensajes").select("*").order("created_at", { ascending: false })
    ])) as [
      { data: unknown[] | null; error: unknown },
      { data: unknown[] | null; error: unknown },
      { data: unknown[] | null; error: unknown },
      { data: unknown[] | null; error: unknown }
    ];

    if (!pedidos) throw new Error("No se pudieron cargar los pedidos");

    const pRows = pedidos as PedidoRow[];
    const uRows = (usuarios ?? []) as UserRow[];
    const prRows = (productos ?? []) as ProductRow[];
    const mRows = (mensajes ?? []) as MessageRow[];

    // 2. Calcular estadísticas principales
    const totalIncome = pRows
      .filter((p) => p.estado === 'pagado')
      .reduce((acc, p) => acc + Number(p.total), 0);

    const paidCount = pRows.filter((p) => p.estado === 'pagado').length;
    const pendingCount = pRows.filter((p) => p.estado === 'pendiente_pago').length;
    const quotationsCount = pRows.filter((p) => p.estado === 'pendiente_cotizacion').length;
    const cancelledCount = pRows.filter((p) => p.estado === 'pago_cancelado' || p.estado === 'cancelado').length;
    const ordersCount = pRows.length;

    // 3. Obtener los últimos 10 pedidos para el cuerpo del email
    const recentOrders = pRows.slice(0, 10).map((p) => {
      let clienteNombre = "Cliente";
      try {
        const datos = JSON.parse(p.datos_contacto) as { nombre?: string };
        clienteNombre = datos.nombre ?? "Cliente";
      } catch { }
      return {
        id: p.id,
        total: Number(p.total),
        estado: p.estado,
        cliente: clienteNombre
      };
    });

    // 4. Determinar destinatario
    let managerEmail: string = overrideEmail ?? "";
    if (!managerEmail) {
      const { data: config } = await supabase
        .from("configuraciones")
        .select("valor")
        .eq("clave", "correo_gerente")
        .single();
      
      const configVal = config as { valor?: string } | null;
      managerEmail = configVal?.valor ?? process.env.GMAIL_USER ?? "";
    }

    if (!managerEmail.includes('@')) {
      return NextResponse.json({ error: "Correo de gerente no configurado" }, { status: 400 });
    }

    // 5. Enviar email INTEGRAL
    await sendManagerReportEmail({
      to: managerEmail,
      totalIncome,
      ordersCount,
      pendingCount,
      quotationsCount,
      paidCount,
      cancelledCount,
      recentOrders,
      allOrders: pRows,
      allUsers: uRows,
      allProducts: prRows,
      allMessages: mRows
    });

    return NextResponse.json({ success: true, message: "Reporte integral enviado correctamente" });

  } catch (error) {
    console.error("Error generando reporte integral:", error);
    return NextResponse.json(
      { error: "No se pudo generar el reporte integral" },
      { status: 500 }
    );
  }
}
