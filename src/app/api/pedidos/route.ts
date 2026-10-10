import { NextResponse } from "next/server";
import { getSupabaseServer } from "~/lib/supabaseServer";
import { crearEnvioParaPedido } from "../../../../utils/envia";


interface ProductoPedido {
  id?: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  categoria?: string;
  escala?: string;
  estilo?: string;
  es_pod?: boolean;
  dias_fabricacion?: number;
}

interface DatosContacto {
  nombre: string;
  email: string;
  telefono: string;
  cedula?: string;
}

interface DatosEnvio {
  direccion?: string;
  ciudad?: string;
  departamento?: string;
  codigoPostal?: string;
  telefono?: string;
  notas?: string;
}

interface PedidoRequestBody {
  cliente_id?: string;
  productos: ProductoPedido[];
  total: number;
  subtotal?: number;
  costo_envio: number;
  estado: string;
  tipo_entrega?: "envio" | "recoleccion";
  es_pod?: boolean;
  fecha_estimada_lista?: string;
  etapa_kanban?: number;
  datos_contacto: DatosContacto;
  datos_envio?: DatosEnvio;
}

interface PedidoInserted {
  id: number;
  cliente_id: string;
  productos: string;
  total: number;
  estado: string;
  tipo_entrega?: string;
  es_pod?: boolean;
  fecha_estimada_lista?: string;
  etapa_kanban?: number;
  datos_contacto: string;
  direccion_envio?: string;
  ciudad_envio?: string;
  departamento_envio?: string;
  codigo_postal_envio?: string;
  telefono_envio?: string;
  notas_envio?: string;
  costo_envio: number;
  created_at: string;
}

interface SupabaseError {
  message: string;
  code?: string;
  hint?: string;
}

interface PedidoResponse {
  id: number;
  cliente_id: string | null;
  productos: string;
  total: number;
  estado: string;
  tipo_entrega?: string;
  es_pod?: boolean;
  fecha_estimada_lista?: string;
  etapa_kanban?: number;
  datos_contacto: string;
  direccion_envio?: string;
  ciudad_envio?: string;
  departamento_envio?: string;
  codigo_postal_envio?: string;
  telefono_envio?: string;
  notas_envio?: string;
  costo_envio: number;
  payment_id?: string;
  payment_method?: string;
  created_at: string;
  updated_at?: string;
}

interface ProductoEnArreglo {
  nombre?: string;
  name?: string;
  cantidad?: number;
  precio?: number;
  precio_unitario?: number;
  escala?: string;
  estilo?: string;
  es_pod?: boolean;
}

interface ContactoEnPedido {
  email?: string;
  nombre?: string;
}

export async function POST(req: Request) {
  const supabase = getSupabaseServer();
  try {
    const body = await req.json() as PedidoRequestBody;
    console.log("Datos recibidos en /api/pedidos:", body);

    const {
      cliente_id,
      productos,
      total,
      costo_envio,
      estado,
      tipo_entrega = "envio",
      es_pod: explicitEsPod,
      datos_contacto,
      datos_envio = {}
    } = body;

    if (!productos || !estado || !datos_contacto) {
      return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 });
    }

    // Calcular si la orden tiene ítems de fabricación Print-on-Demand (POD)
    const tieneItemsPOD = explicitEsPod ?? productos.some((p) => p.es_pod === true);

    // Calcular fecha estimada de entrega / recogida
    const diasEspera = tieneItemsPOD 
      ? Math.max(...productos.map((p) => p.dias_fabricacion ?? 4), 4) 
      : 1;
    const fechaEstimada = new Date();
    fechaEstimada.setDate(fechaEstimada.getDate() + diasEspera);

    // Actualizar datos del usuario si está registrado
    if (cliente_id && cliente_id !== "guest") {
      try {
        const { data: usuarioExistente } = await supabase
          .from("usuarios")
          .select("id, telefono, direccion")
          .eq("auth_id", cliente_id)
          .single();

        if (usuarioExistente) {
          await supabase
            .from("usuarios")
            .update({
              telefono: datos_contacto.telefono || datos_envio.telefono,
              direccion: datos_envio.direccion,
              ciudad: datos_envio.ciudad,
              departamento: datos_envio.departamento,
              codigo_postal: datos_envio.codigoPostal,
              cedula: datos_contacto.cedula
            })
            .eq("auth_id", cliente_id);
        }
      } catch (err) {
        console.warn("Excepción al intentar actualizar datos del usuario:", err);
      }
    }

    const insertData = {
      cliente_id: cliente_id ?? null,
      productos: JSON.stringify(productos),
      total,
      estado,
      tipo_entrega,
      es_pod: tieneItemsPOD,
      fecha_estimada_lista: fechaEstimada.toISOString(),
      etapa_kanban: 1, // 1: Por procesar
      datos_contacto: JSON.stringify(datos_contacto ?? {}),
      direccion_envio: tipo_entrega === "recoleccion" ? "RECOGIDA EN TIENDA / TALLER" : (datos_envio.direccion ?? ""),
      ciudad_envio: tipo_entrega === "recoleccion" ? "Cali" : (datos_envio.ciudad ?? ""),
      departamento_envio: tipo_entrega === "recoleccion" ? "Valle del Cauca" : (datos_envio.departamento ?? ""),
      codigo_postal_envio: datos_envio.codigoPostal ?? "",
      telefono_envio: datos_envio.telefono ?? datos_contacto.telefono ?? "",
      notas_envio: datos_envio.notas ?? "",
      costo_envio: tipo_entrega === "recoleccion" ? 0 : costo_envio,
      created_at: new Date().toISOString(),
    };

    console.log("Insertando en pedidos:", insertData);

    const { data, error } = await supabase
      .from("pedidos")
      .insert([insertData])
      .select()
      .single<PedidoInserted>();

    if (error) {
      console.error("❌ Error Supabase pedidos:", error);
      return NextResponse.json(
        { error: error.message, hint: error.hint, details: error.details },
        { status: 500 }
      );
    }
    return NextResponse.json({ pedido: data });
  } catch (err) {
    console.error("Error inesperado en /api/pedidos:", err);
    return NextResponse.json({ error: "Error inesperado al crear pedido." }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const supabase = getSupabaseServer();
  try {
    const { searchParams } = new URL(req.url);
    const pedidoId = searchParams.get("id");

    if (pedidoId) {
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .eq("id", pedidoId)
        .single<PedidoResponse>();

      if (error) {
        const supabaseError = error as SupabaseError;
        return NextResponse.json({ error: supabaseError.message }, { status: 500 });
      }

      return NextResponse.json({ pedido: data });
    }

    const { data, error } = await supabase
      .from("pedidos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      const supabaseError = error as SupabaseError;
      return NextResponse.json({ error: supabaseError.message }, { status: 500 });
    }

    return NextResponse.json({ pedidos: data as PedidoResponse[] });
  } catch (err) {
    console.error("Error obteniendo pedidos:", err);
    return NextResponse.json({ error: "Error obteniendo pedidos" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const supabase = getSupabaseServer();
  try {
    const body = await req.json() as {
      pedido_id?: number;
      pedidoId?: number;
      payment_id?: string;
      payment_method?: string;
      estado?: string;
      etapa_kanban?: number;
    };
    
    const pedidoId = body.pedido_id ?? body.pedidoId;
    const { payment_id, payment_method, estado, etapa_kanban } = body;

    console.log("Recibida actualización de pedido:", { pedidoId, estado, etapa_kanban, payment_id });

    if (!pedidoId) {
      return NextResponse.json({ error: "Falta el ID del pedido" }, { status: 400 });
    }

    // Consultar datos actuales del pedido para aplicar automatizaciones de stock vs POD
    const { data: pedidoOriginal } = await supabase
      .from("pedidos")
      .select("id, es_pod, tipo_entrega, fecha_estimada_lista, datos_contacto, total, direccion_envio, ciudad_envio, productos")
      .eq("id", pedidoId)
      .single();

    const esPOD = Boolean(pedidoOriginal?.es_pod);

    const updateData: {
      updated_at: string;
      payment_id?: string;
      payment_method?: string;
      estado?: string;
      etapa_kanban?: number;
    } = {
      updated_at: new Date().toISOString()
    };

    if (payment_id) updateData.payment_id = payment_id;
    if (payment_method) updateData.payment_method = payment_method;
    if (estado) updateData.estado = estado;

    // ── REGLA 1: Si tiene stock, no pasa por impresión -> directo al funnel en Etapa 3 (Por recoger / Listo)
    // Si es POD, pasa a Etapa 2 (En fabricación POD)
    if (typeof etapa_kanban === "number") {
      updateData.etapa_kanban = etapa_kanban;
    } else if (estado === "pagado") {
      updateData.etapa_kanban = esPOD ? 2 : 3;
    }

    const result = await supabase
      .from("pedidos")
      .update(updateData)
      .eq("id", pedidoId)
      .select("*")
      .single<PedidoResponse>();

    if (result.error) {
      console.error("Error actualizando pedido en Supabase:", result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    const pedidoActualizado = result.data;

    // Disparar automatizaciones si el pedido pasó a PAGADO
    if (estado === "pagado" || (pedidoActualizado && pedidoActualizado.estado === "pagado")) {
      console.log(`Pedido #${pedidoId} pagado. Procesando automatizaciones...`);
      
      // Enviar correo de factura al cliente
      try {
        const { enviarEmailConfirmacion } = await import("../webhooks/wompi/emailConfirmacion");
        
        let contacto: ContactoEnPedido = {};
        try {
          if (pedidoActualizado) {
            contacto = typeof pedidoActualizado.datos_contacto === "string" 
              ? JSON.parse(pedidoActualizado.datos_contacto) as ContactoEnPedido
              : (pedidoActualizado.datos_contacto as unknown as ContactoEnPedido ?? {});
          }
        } catch (e) { console.error("Error parseando contacto:", e); }

        let productosRaw: ProductoEnArreglo[] = [];
        try {
          if (pedidoActualizado) {
            productosRaw = typeof pedidoActualizado.productos === "string" 
              ? JSON.parse(pedidoActualizado.productos) as ProductoEnArreglo[]
              : (pedidoActualizado.productos as unknown as ProductoEnArreglo[] ?? []);
          }
        } catch (e) { console.error("Error parseando productos:", e); }

        const emailDestino = contacto.email;
        const nombreCliente = contacto.nombre ?? "Cliente";

        if (emailDestino && pedidoActualizado) {
          await enviarEmailConfirmacion({
            to: emailDestino,
            pedidoId: pedidoActualizado.id,
            nombreCliente,
            productos: productosRaw.map((p) => ({
              nombre: p.nombre ?? p.name ?? "Producto",
              cantidad: p.cantidad ?? 1,
              precio: p.precio ?? p.precio_unitario ?? 0,
            })),
            total: pedidoActualizado.total,
            metodoPago: pedidoActualizado.payment_method ?? "MANUAL",
            transaccionId: pedidoActualizado.payment_id ?? `TX-${pedidoActualizado.id}`,
            referencia: pedidoActualizado.payment_id ?? `REF-${pedidoActualizado.id}`,
            direccionEnvio: pedidoActualizado.direccion_envio,
            ciudadEnvio: pedidoActualizado.ciudad_envio,
            fechaPago: new Date().toISOString()
          });
          console.log("Factura enviada automáticamente al cliente.");
        }
      } catch (emailErr) {
        console.error("Error en envío automático de factura:", emailErr);
      }

      // ── REGLA 2: Cuando el pedido esté en print on demand (POD), programar con Envía el día y hora para recoger
      if (esPOD && pedidoOriginal?.tipo_entrega !== "recoleccion") {
        try {
          const { programarRecogidaEnvia } = await import("../../../../utils/envia");
          const fechaLista = pedidoOriginal?.fecha_estimada_lista 
            ? new Date(pedidoOriginal.fecha_estimada_lista)
            : new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
          const pickupDateStr = fechaLista.toISOString().split("T")[0];
          
          if (pickupDateStr) {
            await programarRecogidaEnvia({
              carrier: "coordinadora",
              pickupDate: pickupDateStr,
              pickupTimeFrom: "09:00",
              pickupTimeTo: "17:00",
              totalPackages: 1,
              totalWeight: 1.5,
              instructions: `Recolección POD Pedido #${pedidoId} en Taller Thiart 3D (Cali)`,
              pedidosIds: [pedidoId]
            });
            console.log(`[POD ENVIA] Recolección programada automáticamente para el ${pickupDateStr} de 09:00 a 17:00`);
          }
        } catch (pickupErr) {
          console.warn("[POD ENVIA] Error al programar recolección Envía:", pickupErr);
        }
      }
    }

    return NextResponse.json({ success: true, pedido: result.data });
  } catch (err) {
    console.error("Error inesperado en PATCH /api/pedidos:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
