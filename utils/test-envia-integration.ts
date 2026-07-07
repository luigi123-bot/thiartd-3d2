import { createClient } from "@supabase/supabase-js";
import { crearEnvioParaPedido } from "./envia.js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  console.log("=== INICIANDO PRUEBA DE INTEGRACIÓN DE ENVÍA ===");

  // 1. Crear un pedido de prueba temporal en la base de datos
  const testPedido = {
    cliente_id: null,
    productos: JSON.stringify([
      { nombre: "Figura 3D Impresa de Prueba", cantidad: 2, precio_unitario: 15000 }
    ]),
    total: 30000,
    estado: "pagado",
    datos_contacto: JSON.stringify({
      nombre: "Juan Perez Prueba",
      email: "juan.perez.test@example.com",
      telefono: "3115551234"
    }),
    direccion_envio: "Calle 100 #15-30, Apto 402",
    ciudad_envio: "Bogota",
    departamento_envio: "DC",
    codigo_postal_envio: "110111",
    telefono_envio: "3115551234",
    costo_envio: 0,
    created_at: new Date().toISOString()
  };

  console.log("1. Insertando pedido de prueba...");
  const { data: pedido, error: insertError } = await supabase
    .from("pedidos")
    .insert([testPedido])
    .select()
    .single();

  if (insertError || !pedido) {
    console.error("❌ Falló la inserción del pedido de prueba:", insertError?.message);
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const pedidoId = Number(pedido.id);
  console.log(`✅ Pedido de prueba creado con ID: ${pedidoId}`);

  try {
    // 2. Ejecutar la función de envío automático
    console.log("2. Llamando a crearEnvioParaPedido...");
    const result = await crearEnvioParaPedido(pedidoId);

    if (result) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.log("✅ Proceso completado con éxito!");
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.log(`   Número de Guía (Tracking): ${result.numero_tracking}`);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.log(`   Transportista (Carrier): ${result.empresa_envio}`);
    } else {
      console.error("❌ La creación del envío falló o devolvió null.");
    }
  } catch (err) {
    console.error("❌ Excepción durante la prueba:", err);
  } finally {
    // 3. Limpiar base de datos (eliminar pedido de prueba e historial)
    console.log("3. Limpiando datos de prueba...");
    
    const { error: histDelErr } = await supabase
      .from("historial_envios")
      .delete()
      .eq("pedido_id", pedidoId);
      
    if (histDelErr) {
      console.warn("⚠️ No se pudo limpiar el historial de envíos de prueba:", histDelErr.message);
    }

    const { error: deleteError } = await supabase
      .from("pedidos")
      .delete()
      .eq("id", pedidoId);

    if (deleteError) {
      console.error("❌ Falló la eliminación del pedido de prueba:", deleteError.message);
    } else {
      console.log("🗑️ Pedido de prueba eliminado de la base de datos.");
    }
  }
}

void runTest();
