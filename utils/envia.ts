import axios from "axios";
import { createClient } from "@supabase/supabase-js";

// Determinar el endpoint correcto de Envía (Por defecto producción api.envia.com para reflejar en el panel real)
const ENVIA_API_URL = process.env.ENVIA_API_URL || "https://api.envia.com";
const ENVIA_API_KEY = process.env.ENVIA_API_KEY;

// Cliente de Supabase con Service Role Key para operaciones de administración
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface GuiaDetalles {
  origen: {
    nombre: string;
    empresa: string;
    telefono: string;
    email: string;
    direccion: string;
    ciudad: string;
    departamento: string;
    codigoPostal: string;
    taxId: string;
  };
  destino: {
    nombre: string;
    email: string;
    telefono: string;
    direccion: string;
    ciudad: string;
    departamento: string;
    codigoPostal: string;
    taxId: string;
  };
  paquetes: {
    contenido: string;
    cantidad: number;
    pesoKg: number;
    dimensionesCm: { largo: number; ancho: number; alto: number };
    valorDeclarado: number;
  }[];
  logistica: {
    carrier: string;
    service: string;
    trackingNumber: string;
    labelUrl: string;
    fechaGeneracion: string;
    fechaEstimada?: string;
  };
}

export interface ProgramarRecogidaParams {
  carrier: string;
  pickupDate: string; // YYYY-MM-DD
  pickupTimeFrom: string; // HH:mm
  pickupTimeTo: string; // HH:mm
  totalPackages?: number;
  totalWeight?: number;
  instructions?: string;
  pedidosIds?: number[];
}

export interface RecogidaProgramada {
  id?: number;
  carrier: string;
  confirmation_number: string;
  pickup_date: string;
  pickup_time_from: string;
  pickup_time_to: string;
  origin_address: string;
  origin_city: string;
  total_packages: number;
  total_weight: number;
  pedidos_ids?: string;
  instructions?: string;
  status: string;
  created_at?: string;
}

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
export const ORIGEN_DEFECTO = {
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
  taxId: "9018453128" // NIT Thiart 3D
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
 * Crea una guía de envío en Envía para un pedido específico (Invocado de forma manual o programada)
 * y almacena toda la información enriquecida de origen, destino, pesos y dimensiones.
 */
export const crearEnvioParaPedido = async (pedidoId: number) => {
  console.log(`[ENVIA] Iniciando proceso de generación de guía para pedido #${pedidoId}`);
  
  if (!ENVIA_API_KEY) {
    console.error("[ENVIA] ENVIA_API_KEY no está configurada.");
    throw new Error("ENVIA_API_KEY no está configurada en las variables de entorno.");
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
      throw new Error(`Pedido #${pedidoId} no encontrado.`);
    }

    // 2. Verificar si es recolección en tienda
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (pedido.tipo_entrega === "recoleccion") {
      console.log(`[ENVIA] El pedido #${pedidoId} es RECOGIDA EN TIENDA. No requiere guía de transporte.`);
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

    // Calcular el peso y dimensiones de los paquetes
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
    const stateCode = normalizarDepartamento(departamento);

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
      state: stateCode,
      country: "CO",
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      postalCode: pedido.codigo_postal_envio || "110111",
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      taxId: datosContacto.cedula || "1000000000"
    };

    const packageContent = productos.map(p => `${p.cantidad || 1}x ${p.nombre || p.name || 'Pieza 3D'}`).join(", ").substring(0, 100);

    const packagesPayload = [
      {
        type: "box",
        content: packageContent || "Piezas y Arte 3D Thiart",
        amount: 1,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        declaredValue: Number(pedido.total) || 15000,
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

    console.log("[ENVIA] Cotizando tarifa más óptima...");
    let carrierSeleccionado = "coordinadora";
    let servicioSeleccionado = "ground";

    const baseUrls = process.env.ENVIA_API_URL
      ? [process.env.ENVIA_API_URL]
      : [
          "https://api-test.envia.com",
          "https://api.envia.com"
        ];

    for (const baseUrl of baseUrls) {
      try {
        const rateResponse = await axios.post(`${baseUrl}/ship/rate`, {
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

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (rateResponse.data && Array.isArray(rateResponse.data.data) && rateResponse.data.data.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const tarifas = rateResponse.data.data;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-explicit-any, @typescript-eslint/no-unsafe-member-access
          tarifas.sort((a: any, b: any) => Number(a.totalPrice) - Number(b.totalPrice));
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          carrierSeleccionado = String(tarifas[0].carrier || "coordinadora");
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          servicioSeleccionado = String(tarifas[0].service || "standard");
          console.log(`[ENVIA] Transportista elegido (${baseUrl}): ${carrierSeleccionado} (${servicioSeleccionado})`);
          break;
        }
      } catch (rateErr) {
        console.warn(`[ENVIA] Cotización en ${baseUrl} no disponible, intentando siguiente.`);
      }
    }

    // 3. Generar la guía oficial en Envía
    console.log("[ENVIA] Solicitando generación de guía oficial...");
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

    let responseEnvio: any = null;
    let lastGenError = "";

    for (const baseUrl of baseUrls) {
      try {
        const resp = await axios.post(`${baseUrl}/ship/generate`, payloadEnvio, {
          headers: {
            Authorization: `Bearer ${ENVIA_API_KEY}`,
            "Content-Type": "application/json",
          }
        });
        if (resp.data && resp.data.data && resp.data.data.length > 0) {
          responseEnvio = resp;
          break;
        }
      } catch (genErr) {
        if (axios.isAxiosError(genErr)) {
          if (genErr.response?.status === 401) {
            lastGenError = "Error de autenticación con Envía (401): Tu clave ENVIA_API_KEY es de modo pruebas (Sandbox) o no tiene permisos en Producción. Configura el token de Producción de tu cuenta en el archivo .env para que aparezca en tu panel oficial.";
          } else {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            const d = genErr.response?.data;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            lastGenError = String(d?.error?.message || d?.message || d?.error?.description || genErr.message);
          }
        }
        console.warn(`[ENVIA] Generación en ${baseUrl} no disponible: ${lastGenError}`);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (responseEnvio && responseEnvio.data && responseEnvio.data.data && responseEnvio.data.data.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const shippingData = responseEnvio.data.data[0];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const trackingNumber = String(shippingData.trackingNumber || shippingData.hawb || "");
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const carrier = String(shippingData.carrier || carrierSeleccionado);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const labelUrl = String(shippingData.label || "");

      console.log(`[ENVIA] Guía creada con éxito. Tracking: ${trackingNumber}, Transportista: ${carrier}`);

      // 4. Construir objeto estructurado GuiaDetalles
      const guiaCompleta: GuiaDetalles = {
        origen: {
          nombre: ORIGEN_DEFECTO.name,
          empresa: ORIGEN_DEFECTO.company,
          telefono: ORIGEN_DEFECTO.phone,
          email: ORIGEN_DEFECTO.email,
          direccion: `${ORIGEN_DEFECTO.street} #${ORIGEN_DEFECTO.number}`,
          ciudad: ORIGEN_DEFECTO.city,
          departamento: ORIGEN_DEFECTO.state,
          codigoPostal: ORIGEN_DEFECTO.postalCode,
          taxId: ORIGEN_DEFECTO.taxId
        },
        destino: {
          nombre: destino.name,
          email: destino.email,
          telefono: destino.phone,
          direccion: `${destino.street} #${destino.number}`,
          ciudad: destino.city,
          departamento: departamento,
          codigoPostal: destino.postalCode,
          taxId: destino.taxId
        },
        paquetes: [
          {
            contenido: packagesPayload[0]?.content ?? "Piezas 3D",
            cantidad: cantidadTotal,
            pesoKg: pesoTotal,
            dimensionesCm: { largo: 15, ancho: 15, alto: 15 },
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            valorDeclarado: Number(pedido.total) || 15000
          }
        ],
        logistica: {
          carrier: carrier,
          service: servicioSeleccionado,
          trackingNumber: trackingNumber,
          labelUrl: labelUrl,
          fechaGeneracion: new Date().toISOString()
        }
      };

      // 5. Guardar en Base de Datos
      const { data: pedidoActualizado, error: updateError } = await supabase
        .from("pedidos")
        .update({
          numero_tracking: trackingNumber,
          empresa_envio: carrier,
          guia_detalles: JSON.stringify(guiaCompleta),
          updated_at: new Date().toISOString()
        })
        .eq("id", pedidoId)
        .select()
        .single();

      if (pedidoActualizado) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        pedidoActualizado.pdf_guia_url = labelUrl;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        pedidoActualizado.guia_detalles = guiaCompleta;
      }

      if (updateError) {
        console.error(`[ENVIA] Error guardando guía en pedido #${pedidoId}:`, updateError.message);
      }

      // 6. Registrar en historial de envíos
      await supabase
        .from("historial_envios")
        .insert([{
          pedido_id: pedidoId,
          estado: "en_envio",
          descripcion: `Guía generada (${carrier}) - Tracking: ${trackingNumber}`,
          ubicacion: ORIGEN_DEFECTO.city,
          fecha: new Date().toISOString()
        }]);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return pedidoActualizado;
    } else {
      throw new Error(lastGenError || "Respuesta de API de Envía vacía o fallida.");
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

/**
 * Programa una recogida física con la transportadora a través de la API de Envía
 */
export const programarRecogidaEnvia = async (params: ProgramarRecogidaParams): Promise<RecogidaProgramada> => {
  console.log(`[ENVIA-PICKUP] Programando recogida con ${params.carrier} para el ${params.pickupDate} en ${ENVIA_API_URL}`);

  const totalPackages = params.totalPackages || 1;
  const totalWeight = params.totalWeight || 1.0;
  const originAddress = `${ORIGEN_DEFECTO.street} #${ORIGEN_DEFECTO.number}`;
  const originCity = ORIGEN_DEFECTO.city;

  // Extraer números de tracking reales de los pedidos seleccionados
  let trackingNumbers: string[] = [];
  if (params.pedidosIds && params.pedidosIds.length > 0) {
    try {
      const { data: pedidosData } = await supabase
        .from("pedidos")
        .select("numero_tracking")
        .in("id", params.pedidosIds);
      
      if (pedidosData) {
        trackingNumbers = pedidosData
          .map((p) => p.numero_tracking)
          .filter(Boolean) as string[];
      }
    } catch (e) {
      console.warn("[ENVIA-PICKUP] Error buscando tracking numbers:", e);
    }
  }

  let confirmationNumber = "";
  let lastPickupError = "";

  if (!ENVIA_API_KEY) {
    throw new Error("ENVIA_API_KEY no está configurada en las variables de entorno.");
  }

  const payloadPickup = {
    carrier: params.carrier.toLowerCase(),
    origin: ORIGEN_DEFECTO,
    pickupDate: params.pickupDate,
    pickupTime: {
      from: params.pickupTimeFrom,
      to: params.pickupTimeTo
    },
    trackingNumbers: trackingNumbers.length > 0 ? trackingNumbers : undefined,
    packages: [
      {
        content: "Paquetes y piezas 3D Thiart",
        amount: totalPackages,
        weight: totalWeight,
        weightUnit: "KG",
        dimensions: { length: 20, width: 20, height: 20 }
      }
    ],
    totalPackages: totalPackages,
    totalWeight: totalWeight,
    instructions: params.instructions || "Taller Thiart 3D, favor timbrar."
  };

  console.log("[ENVIA-PICKUP] Payload enviado a Envia:", JSON.stringify(payloadPickup));

  const endpoints = process.env.ENVIA_API_URL
    ? [`${process.env.ENVIA_API_URL.replace(/\/+$/, "")}/ship/pickup/`]
    : [
        "https://api-test.envia.com/ship/pickup/",
        "https://api.envia.com/ship/pickup/"
      ];

  let apiSuccess = false;

  for (const url of endpoints) {
    if (apiSuccess) break;
    try {
      const resp = await axios.post(url, payloadPickup, {
        headers: {
          Authorization: `Bearer ${ENVIA_API_KEY}`,
          "Content-Type": "application/json",
        }
      });

      console.log(`[ENVIA-PICKUP] Respuesta exitosa de (${url}):`, JSON.stringify(resp.data));
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (resp.data) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const item = Array.isArray(resp.data.data) ? resp.data.data[0] : resp.data.data;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        confirmationNumber = String(
          item?.pickupNumber ||
          item?.confirmationNumber ||
          resp.data.pickupNumber ||
          resp.data.confirmationNumber ||
          resp.data.pickupId ||
          `PK-${params.carrier.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`
        );
      }
      console.log(`[ENVIA-PICKUP] Confirmación de recogida oficial en Envía: ${confirmationNumber}`);
      apiSuccess = true;
    } catch (apiErr) {
      if (axios.isAxiosError(apiErr)) {
        if (apiErr.response?.status === 401) {
          lastPickupError = "Error de autenticación con Envía (401): Tu clave ENVIA_API_KEY pertenece a Modo Pruebas (Sandbox) o no tiene permisos en Producción. Para que la recolección se vea reflejada en tu panel oficial de Envia.com (Empresa #5729), debes copiar el Token de Producción desde Envia.com y configurarlo en el archivo .env.";
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const errData = apiErr.response?.data;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          lastPickupError = String(errData?.error?.message || errData?.message || errData?.error?.description || apiErr.message);
        }
        console.warn(`[ENVIA-PICKUP] Intento fallido en ${url}:`, lastPickupError);
      } else if (apiErr instanceof Error) {
        lastPickupError = apiErr.message;
        console.warn(`[ENVIA-PICKUP] Intento fallido en ${url}:`, apiErr.message);
      }
    }
  }

  if (!apiSuccess) {
    throw new Error(lastPickupError || "No fue posible programar la recogida con Envía.");
  }

  // Cache en memoria para resiliencia si la tabla de Supabase aún no ha sido migrada físicamente
  const inMemoryRecogidas: RecogidaProgramada[] = (globalThis as unknown as { __recogidasCache?: RecogidaProgramada[] }).__recogidasCache || [];
  (globalThis as unknown as { __recogidasCache: RecogidaProgramada[] }).__recogidasCache = inMemoryRecogidas;

  const record: RecogidaProgramada = {
    carrier: params.carrier,
    confirmation_number: confirmationNumber,
    pickup_date: params.pickupDate,
    pickup_time_from: params.pickupTimeFrom,
    pickup_time_to: params.pickupTimeTo,
    origin_address: originAddress,
    origin_city: originCity,
    total_packages: totalPackages,
    total_weight: totalWeight,
    pedidos_ids: params.pedidosIds ? JSON.stringify(params.pedidosIds) : "[]",
    instructions: params.instructions || "",
    status: "programada",
    created_at: new Date().toISOString()
  };

  inMemoryRecogidas.unshift(record);

  try {
    const { data: inserted, error } = await supabase
      .from("recogidas_envia")
      .insert([record])
      .select()
      .single();

    if (error) {
      if (error.code !== "42P01") {
        console.warn("[ENVIA-PICKUP] Error insertando en recogidas_envia:", error.message);
      }
    } else if (inserted) {
      return inserted as RecogidaProgramada;
    }
  } catch {
    // Graceful fallback to in-memory record
  }

  return record;
};

/**
 * Obtiene todas las recogidas registradas
 */
export const obtenerRecogidas = async (): Promise<RecogidaProgramada[]> => {
  const inMemoryRecogidas = (globalThis as unknown as { __recogidasCache?: RecogidaProgramada[] }).__recogidasCache || [];

  try {
    const { data, error } = await supabase
      .from("recogidas_envia")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code !== "42P01") {
        console.error("[ENVIA-PICKUP] Error listando recogidas:", error);
      }
      return inMemoryRecogidas;
    }
    return (data as RecogidaProgramada[]) || inMemoryRecogidas;
  } catch {
    return inMemoryRecogidas;
  }
};
