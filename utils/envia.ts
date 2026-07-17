import axios from "axios";
import { createClient } from "@supabase/supabase-js";

// Determinar el endpoint correcto de Envía
const isProduction = process.env.NODE_ENV === "production" && !process.env.ENVIA_API_KEY?.startsWith("test");
const ENVIA_API_URL = process.env.ENVIA_API_URL || (isProduction ? "https://api.envia.com" : "https://api-test.envia.com");
const ENVIA_API_KEY = process.env.ENVIA_API_KEY;

// Cliente de Supabase con Service Role Key para operaciones de administración
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const normalizarDepartamento = (depto: string): string => {
  const d = depto.trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Quitar acentos/tildes
  
  if (d.includes("valle")) return "VC";
  if (d.includes("bogota") || d.includes("distrito") || d === "dc") return "DC";
  if (d.includes("antioquia")) return "AN";
  if (d.includes("arauca")) return "AR";
  if (d.includes("atlantico")) return "AT";
  if (d.includes("bolivar")) return "BL";
  if (d.includes("boyaca")) return "BY";
  if (d.includes("caldas")) return "CL";
  if (d.includes("caqueta")) return "CA";
  if (d.includes("casanare")) return "CS";
  if (d.includes("cauca") && !d.includes("valle")) return "CU";
  if (d.includes("cesar")) return "CE";
  if (d.includes("choco")) return "CH";
  if (d.includes("cordoba")) return "CO";
  if (d.includes("cundinamarca")) return "CN";
  if (d.includes("guainia")) return "GU";
  if (d.includes("guaviare")) return "GA";
  if (d.includes("huila")) return "HU";
  if (d.includes("guajira")) return "LG";
  if (d.includes("magdalena")) return "MA";
  if (d.includes("meta")) return "ME";
  if (d.includes("narino")) return "NA";
  if (d.includes("norte de santander") || d.includes("norte santander")) return "NS";
  if (d.includes("putumayo")) return "PU";
  if (d.includes("quindio")) return "QU";
  if (d.includes("risaralda")) return "RI";
  if (d.includes("san andres") || d.includes("providencia")) return "SA";
  if (d.includes("santander") && !d.includes("norte")) return "SN";
  if (d.includes("sucre")) return "SU";
  if (d.includes("tolima")) return "TO";
  if (d.includes("vaupes")) return "VA";
  if (d.includes("vichada")) return "VI";
  if (d.includes("amazonas")) return "AM";
  
  return depto.length === 2 ? depto.toUpperCase() : "DC";
};

// Origen por defecto (Bodega principal de la tienda)
const ORIGEN_DEFECTO = {
  name: "Luis Gotopo",
  company: "Thiart 3D",
  phone: "3012906861",
  email: "gotopoluis19@gmail.com",
  street: "Calle 5",
  number: "24A-152",
  city: "Cali",
  state: "VC",
  country: "CO",
  postalCode: "760001",
  taxId: "9018453128" // NIT Thiart 3D (sin guión)
};

interface ProductoEnPedido {
  nombre?: string;
  name?: string;
  cantidad?: number;
  precio?: number;
  precio_unitario?: number;
}

interface DatosContacto {
  nombre?: string;
  email?: string;
  telefono?: string;
  cedula?: string;
}

export const crearEnvio = async (data: string) => {
  if (!ENVIA_API_KEY) {
    throw new Error("ENVIA_API_KEY no está configurada");
  }
  try {
    const response = await axios.post(`${ENVIA_API_URL}/ship/generate`, data, {
      headers: {
        Authorization: `Bearer ${ENVIA_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error("Error creando envío:", error.response?.data || error.message);
    } else if (error instanceof Error) {
      console.error("Error creando envío:", error.message);
    } else {
      console.error("Error creando envío:", error);
    }
    throw error;
  }
};

/**
 * Crea automáticamente una guía de envío en Envía para un pedido pagado
 */
export const crearEnvioParaPedido = async (pedidoId: number) => {
  console.log(`[ENVIA] Iniciando proceso de envío para pedido #${pedidoId}`);
  
  if (!ENVIA_API_KEY) {
    console.error("[ENVIA] ENVIA_API_KEY no está configurada. Omitiendo.");
    return null;
  }

  try {
    // 1. Obtener pedido de la base de datos
    const { data: pedido, error: fetchError } = await supabase
      .from("pedidos")
      .select("*")
      .eq("id", pedidoId)
      .single();

    if (fetchError || !pedido) {
      console.error(`[ENVIA] No se encontró el pedido #${pedidoId}:`, fetchError?.message);
      return null;
    }

    // 2. Verificar si ya fue procesado
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (pedido.numero_tracking) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.log(`[ENVIA] El pedido #${pedidoId} ya tiene número de guía: ${pedido.numero_tracking}. Omitiendo.`);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return pedido;
    }

    // Parsear datos de contacto
    let datosContacto: DatosContacto = {};
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      datosContacto = typeof pedido.datos_contacto === "string" ? JSON.parse(pedido.datos_contacto) : (pedido.datos_contacto || {});
    } catch (e) {
      console.warn("[ENVIA] Error parseando datos de contacto:", e);
    }

    // Parsear productos
    let productos: ProductoEnPedido[] = [];
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      productos = typeof pedido.productos === "string" ? JSON.parse(pedido.productos) : (pedido.productos || []);
    } catch (e) {
      console.warn("[ENVIA] Error parseando productos:", e);
    }

    // Calcular el peso de los paquetes (estimado: 0.5 kg por unidad de producto, mínimo 0.5 kg)
    const cantidadTotal = productos.reduce((acc, p) => acc + (p.cantidad || 1), 0);
    const pesoTotal = Math.max(0.5, cantidadTotal * 0.5);

    // Mapear la dirección de destino dividiendo calle y número
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const addressStr = String(pedido.direccion_envio || "Direccion no provista");
    let street = addressStr;
    let number = "1";
    
    if (addressStr.includes("#")) {
      const parts = addressStr.split("#");
      street = parts[0]?.trim() || addressStr;
      number = parts[1]?.trim() || "1";
    } else {
      const match = /\s+(\d+[-a-zA-Z0-9]*)$/.exec(addressStr);
      if (match && match[1]) {
        street = addressStr.substring(0, addressStr.lastIndexOf(match[1])).trim();
        number = match[1];
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const departamento = (pedido.departamento_envio || "DC").toUpperCase();
    const destino = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      name: datosContacto.nombre || "Destinatario",
      email: datosContacto.email || "correo@cliente.com",
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      phone: pedido.telefono_envio || datosContacto.telefono || "3000000000",
      street: street,
      number: number,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      city: pedido.ciudad_envio || "Bogota",
      state: normalizarDepartamento(departamento),
      country: "CO",
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      postalCode: pedido.codigo_postal_envio || "110111",
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      taxId: datosContacto.cedula || "1000000000" // Cédula/NIT de destino requerida en Colombia
    };

    const packagesPayload = [
      {
        type: "box",
        content: productos.map(p => `${p.cantidad}x ${p.nombre || p.name}`).join(", ").substring(0, 100),
        amount: 1,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        declaredValue: Number(pedido.total) || 10000,
        weight: pesoTotal,
        weightUnit: "KG",
        lengthUnit: "CM",
        dimensions: {
          length: 15,
          width: 15,
          height: 15
        }
      }
    ];

    console.log("[ENVIA] Cotizando tarifa más barata...");
    let carrierSeleccionado = "coordinadora";
    let servicioSeleccionado = "standard";

    try {
      const rateResponse = await axios.post(`${ENVIA_API_URL}/ship/rate`, {
        origin: ORIGEN_DEFECTO,
        destination: destino,
        packages: packagesPayload,
        shipment: { type: 1, carrier: "coordinadora" }
      }, {
        headers: {
          Authorization: `Bearer ${ENVIA_API_KEY}`,
          "Content-Type": "application/json",
        }
      });

      console.log("[ENVIA] Respuesta rate:", JSON.stringify(rateResponse.data).substring(0, 1000));

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (rateResponse.data && Array.isArray(rateResponse.data.data) && rateResponse.data.data.length > 0) {
        // Encontrar la tarifa más económica
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const tarifas = rateResponse.data.data;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-explicit-any, @typescript-eslint/no-unsafe-member-access
        tarifas.sort((a: any, b: any) => Number(a.totalPrice) - Number(b.totalPrice));
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        carrierSeleccionado = String(tarifas[0].carrier);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        servicioSeleccionado = String(tarifas[0].service);
        console.log(`[ENVIA] Transportista elegido: ${carrierSeleccionado} (${servicioSeleccionado})`);
      } else {
        console.warn("[ENVIA] No se encontraron tarifas en la respuesta.");
      }
    } catch (rateErr) {
      if (axios.isAxiosError(rateErr)) {
        console.warn("[ENVIA] Falló la cotización automatizada:", JSON.stringify(rateErr.response?.data) || rateErr.message);
      } else {
        console.warn("[ENVIA] Falló la cotización automatizada:", rateErr);
      }
    }

    // 3. Generar la guía
    console.log("[ENVIA] Generando guía de envío...");
    const payloadEnvio = {
      settings: {
        printFormat: "PDF",
        printSize: "PAPER_4X6"
      },
      origin: ORIGEN_DEFECTO,
      destination: destino,
      packages: packagesPayload,
      shipment: {
        type: 1,
        carrier: carrierSeleccionado,
        service: servicioSeleccionado
      }
    };

    const responseEnvio = await axios.post(`${ENVIA_API_URL}/ship/generate`, payloadEnvio, {
      headers: {
        Authorization: `Bearer ${ENVIA_API_KEY}`,
        "Content-Type": "application/json",
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (responseEnvio.data && responseEnvio.data.data && responseEnvio.data.data.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const shippingData = responseEnvio.data.data[0];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const trackingNumber = String(shippingData.trackingNumber || shippingData.hawb || "");
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const carrier = String(shippingData.carrier || carrierSeleccionado);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const labelUrl = String(shippingData.label || "");

      console.log(`[ENVIA] Guía generada exitosamente. Tracking: ${trackingNumber}, Transportista: ${carrier}`);

      // 4. Actualizar pedido en Supabase (omitiendo pdf_guia_url ya que no existe en el cache de Supabase físico)
      const { data: pedidoActualizado, error: updateError } = await supabase
        .from("pedidos")
        .update({
          numero_tracking: trackingNumber,
          empresa_envio: carrier,
          updated_at: new Date().toISOString()
        })
        .eq("id", pedidoId)
        .select()
        .single();

      if (pedidoActualizado) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        pedidoActualizado.pdf_guia_url = labelUrl;
      }

      if (updateError) {
        console.error(`[ENVIA] Error actualizando el pedido #${pedidoId} con el tracking:`, updateError.message);
      }

      // 5. Agregar registro en historial_envios
      const { error: historialError } = await supabase
        .from("historial_envios")
        .insert([{
          pedido_id: pedidoId,
          estado: "preparacion",
          descripcion: `Guía de envío generada automáticamente con ${carrier}. Número de rastreo: ${trackingNumber}. URL etiqueta: ${labelUrl}`,
          ubicacion: ORIGEN_DEFECTO.city,
          fecha: new Date().toISOString()
        }]);

      if (historialError) {
        console.error("[ENVIA] Error guardando historial de envío:", historialError.message);
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return pedidoActualizado;
    } else {
      console.error("[ENVIA] Respuesta inesperada al generar guía:", responseEnvio.data);
      throw new Error("Respuesta de API de Envía vacía o inesperada.");
    }

  } catch (err: unknown) {
    let errorMsg = "Error al conectar con la API de Envía.";
    if (axios.isAxiosError(err)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const apiErr = err.response?.data;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      errorMsg = String(apiErr?.error?.message || apiErr?.error?.description || err.message);
      console.error("[ENVIA] Error en API Envía:", apiErr || err.message);
    } else if (err instanceof Error) {
      errorMsg = err.message;
      console.error("[ENVIA] Excepción en crearEnvioParaPedido:", err.message);
    }
    throw new Error(errorMsg);
  }
};
