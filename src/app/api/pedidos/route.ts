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

interface PedidoResponse {
  id: number;
  cliente_id: string | null;
  productos: string; // JSON string from Supabase
  total: number;
  estado: string;
  datos_contacto: string; // JSON string from Supabase
  direccion_envio: string;
  ciudad_envio: string;
  departamento_envio: string;
  codigo_postal_envio: string;
  telefono_envio: string;
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
}

interface ContactoEnPedido {
  email?: string;
  nombre?: string;
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

    // Actualizar datos del usuario si está registrado
    if (cliente_id && cliente_id !== "guest") {
      try {
        // Verificar si el usuario existe en la tabla usuarios usando su auth_id
        const { data: usuarioExistente } = await supabase
          .from("usuarios")
          .select("id, telefono, direccion")
          .eq("auth_id", cliente_id)
          .single();

        if (!usuarioExistente) {
          console.log("Usuario no existe en tabla 'usuarios', omitiendo actualización o puedes crearlo aquí si lo deseas.");
        } else {
          console.log("✅ Usuario encontrado. Actualizando datos de contacto y envío en perfil...");
          const { error: updateError } = await supabase
            .from("usuarios")
            .update({
              telefono: datos_contacto.telefono || datos_envio.telefono,
              direccion: datos_envio.direccion,
              ciudad: datos_envio.ciudad,
              departamento: datos_envio.departamento,
              codigo_postal: datos_envio.codigoPostal
            })
            .eq("auth_id", cliente_id);
            
          if (updateError) {
            console.warn("No se pudieron actualizar los datos del usuario. ¿Agregaste las columnas?", updateError.message);
          } else {
            console.log("✅ Perfil de usuario actualizado con los datos de esta compra.");
          }
        }
      } catch (err) {
        console.warn("Excepción al intentar actualizar datos del usuario:", err);
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
      console.error("❌ Error Supabase pedidos:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        insertData,
      });
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
  try {
    const { searchParams } = new URL(req.url);
    const pedidoId = searchParams.get("id");

    // Si hay un ID específico, buscar ese pedido
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

    // Si no hay ID, devolver todos los pedidos
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
  try {
    const body = await req.json() as {
      pedido_id?: number;
      pedidoId?: number;
      payment_id?: string;
      payment_method?: string;
      estado?: string;
    };
    
    // Aceptar tanto pedido_id como pedidoId
    const pedidoId = body.pedido_id ?? body.pedidoId;
    const { payment_id, payment_method, estado } = body;

    console.log("➡️ Recibida actualización de pedido:", { pedidoId, estado, payment_id });

    if (!pedidoId) {
      return NextResponse.json({ error: "Falta el ID del pedido" }, { status: 400 });
    }

    const updateData: {
      updated_at: string;
      payment_id?: string;
      payment_method?: string;
      estado?: string;
    } = {
      updated_at: new Date().toISOString()
    };

    if (payment_id) updateData.payment_id = payment_id;
    if (payment_method) updateData.payment_method = payment_method;
    if (estado) updateData.estado = estado;

    const result = await supabase
      .from("pedidos")
      .update(updateData)
      .eq("id", pedidoId)
      .select("*")
      .single<PedidoResponse>();

    if (result.error) {
      console.error("❌ Error actualizando pedido en Supabase:", result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    const pedidoActualizado = result.data;

    // 🔥 SI EL PEDIDO PASÓ A "pagado", DISPARAR EL CORREO AUTOMÁTICO
    if (estado === "pagado" || (pedidoActualizado && pedidoActualizado.estado === "pagado")) {
      console.log("🚀 El pedido está PAGADO. Iniciando automatización de correo...");
      
      try {
        const { enviarEmailConfirmacion } = await import("../webhooks/wompi/emailConfirmacion");
        
        // Extraer datos del contacto
        let contacto: ContactoEnPedido = {};
        try {
          if (pedidoActualizado) {
            contacto = typeof pedidoActualizado.datos_contacto === 'string' 
              ? JSON.parse(pedidoActualizado.datos_contacto) as ContactoEnPedido
              : (pedidoActualizado.datos_contacto as unknown as ContactoEnPedido ?? {});
          }
        } catch (e) { console.error("Error parseando contacto:", e); }

        // Extraer productos
        let productosRaw: ProductoEnArreglo[] = [];
        try {
          if (pedidoActualizado) {
            productosRaw = typeof pedidoActualizado.productos === 'string' 
              ? JSON.parse(pedidoActualizado.productos) as ProductoEnArreglo[]
              : (pedidoActualizado.productos as unknown as ProductoEnArreglo[] ?? []);
          }
        } catch (e) { console.error("Error parseando productos:", e); }

        const emailDestino = contacto.email;
        const nombreCliente = contacto.nombre ?? "Cliente";

        if (emailDestino && pedidoActualizado) {
          console.log(`📧 Enviando factura a ${emailDestino} (Backup desde API Pedidos)...`);
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
            metodoPago: pedidoActualizado.payment_method ?? "TARJETA",
            transaccionId: pedidoActualizado.payment_id ?? `TX-${pedidoActualizado.id}`,
            referencia: pedidoActualizado.payment_id ?? `REF-${pedidoActualizado.id}`,
            direccionEnvio: pedidoActualizado.direccion_envio,
            ciudadEnvio: pedidoActualizado.ciudad_envio,
            fechaPago: new Date().toISOString()
          });
          console.log("✅ Factura enviada automáticamente.");
        } else {
          console.warn("⚠️ No se encontró email del cliente en el pedido.");
        }
      } catch (emailErr) {
        console.error("❌ Error en envío automático de factura:", emailErr);
      }
    }

    return NextResponse.json({ success: true, pedido: result.data });
  } catch (err) {
    console.error("❌ Error inesperado en PATCH /api/pedidos:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

