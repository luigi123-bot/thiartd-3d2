import { NextResponse } from "next/server";
import { getSupabaseServer } from "~/lib/supabaseServer";

export const dynamic = "force-dynamic";

interface ContactoData {
  nombre?: string;
  email?: string;
  telefono?: string;
  cedula?: string;
}

interface ProductItem {
  nombre?: string;
  name?: string;
  cantidad?: number;
  precio_unitario?: number;
  precio?: number;
  categoria?: string;
  es_pod?: boolean;
}

const ESTADOS_CONFIRMADOS = [
  "pagado",
  "en_produccion",
  "listo_entrega",
  "en_transito",
  "entregado",
  "completado"
];

function isVentaConfirmada(estado: string | null | undefined): boolean {
  if (!estado) return false;
  return ESTADOS_CONFIRMADOS.includes(estado.trim().toLowerCase());
}

const MESES_NOMBRES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function formatMesLabel(mesKey: string): string {
  if (!mesKey || !mesKey.includes("-")) return mesKey || "N/A";
  const [year, monthStr] = mesKey.split("-");
  const monthNum = parseInt(monthStr ?? "1", 10);
  const name = MESES_NOMBRES[monthNum - 1] ?? monthStr;
  return `${name} ${year}`;
}

export async function GET(req: Request) {
  try {
    const supabase = getSupabaseServer();
    const url = new URL(req.url);
    const range = url.searchParams.get("range") ?? "all"; // 'all', '30d', '90d', 'year'

    // Consultar todas las fuentes relevantes con service role
    const [
      { data: pedidosRaw, error: errPedidos },
      { data: usuariosRaw, error: errUsuarios },
      { data: productosRaw, error: errProductos },
      { data: carritosRaw },
      { data: recogidasRaw },
      { data: mensajesRaw },
      { data: notificacionesRaw }
    ] = await Promise.all([
      supabase.from("pedidos").select("*").order("created_at", { ascending: false }),
      supabase.from("usuarios").select("id, nombre, email, role, creado_en").order("creado_en", { ascending: true }),
      supabase.from("productos").select("id, nombre, categoria, precio, stock"),
      supabase.from("carrito").select("id, usuario_id, productos, updated_at"),
      supabase.from("recogidas_envia").select("id, status, carrier, pickup_date, total_packages, created_at"),
      supabase.from("mensajes").select("id, created_at, leido, asunto, nombre_cliente"),
      supabase.from("notificaciones").select("id, created_at, enviado, tipo")
    ]);

    if (errPedidos) {
      console.error("[BI-API] Error fetching pedidos:", errPedidos);
    }
    if (errUsuarios) {
      console.error("[BI-API] Error fetching usuarios:", errUsuarios);
    }

    const pedidos = pedidosRaw ?? [];
    const usuarios = usuariosRaw ?? [];
    const productos = productosRaw ?? [];
    const carritos = carritosRaw ?? [];
    const recogidas = recogidasRaw ?? [];
    const mensajes = mensajesRaw ?? [];
    const notificaciones = notificacionesRaw ?? [];

    // Filtrar por rango de fechas si se solicita
    const now = new Date();
    let fechaCorte: Date | null = null;
    if (range === "30d") {
      fechaCorte = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (range === "90d") {
      fechaCorte = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (range === "year") {
      fechaCorte = new Date(now.getFullYear(), 0, 1);
    }

    const pedidosFiltrados = fechaCorte
      ? pedidos.filter(p => new Date(p.created_at) >= fechaCorte)
      : pedidos;

    // Métricas Financieras
    const pedidosConfirmados = pedidosFiltrados.filter(p => isVentaConfirmada(p.estado));
    const totalIngresos = pedidosConfirmados.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
    const totalPedidosConfirmados = pedidosConfirmados.length;
    const ticketPromedio = totalPedidosConfirmados > 0 ? Math.round(totalIngresos / totalPedidosConfirmados) : 0;

    // Métricas de Carritos Abandonados / Activos
    let potencialCarritos = 0;
    let itemsEnCarritos = 0;
    carritos.forEach(c => {
      try {
        const items = typeof c.productos === "string" ? JSON.parse(c.productos) : c.productos;
        if (Array.isArray(items)) {
          items.forEach((it: ProductItem) => {
            const qty = Number(it.cantidad) || 1;
            const precio = Number(it.precio_unitario || it.precio) || 0;
            itemsEnCarritos += qty;
            potencialCarritos += qty * precio;
          });
        }
      } catch {}
    });

    // Ventas por Mes (Orden Cronológico)
    const ventasMesMap: Record<string, { mes: string; label: string; total: number; pedidos: number }> = {};
    pedidosConfirmados.forEach(p => {
      const mesKey = typeof p.created_at === "string" ? p.created_at.slice(0, 7) : "Sin fecha";
      if (!ventasMesMap[mesKey]) {
        ventasMesMap[mesKey] = {
          mes: mesKey,
          label: formatMesLabel(mesKey),
          total: 0,
          pedidos: 0
        };
      }
      ventasMesMap[mesKey].total += Number(p.total) || 0;
      ventasMesMap[mesKey].pedidos += 1;
    });

    const ventasPorMes = Object.values(ventasMesMap).sort((a, b) => a.mes.localeCompare(b.mes));

    // Crecimiento de Usuarios (Orden Cronológico Acumulado)
    const usuariosMesMap: Record<string, number> = {};
    usuarios.forEach(u => {
      const mesKey = typeof u.creado_en === "string" ? u.creado_en.slice(0, 7) : "Sin fecha";
      usuariosMesMap[mesKey] = (usuariosMesMap[mesKey] || 0) + 1;
    });

    const sortedUserMonths = Object.keys(usuariosMesMap).sort();
    let acumuladoUsuarios = 0;
    const usuariosPorMes = sortedUserMonths.map(mesKey => {
      acumuladoUsuarios += usuariosMesMap[mesKey] ?? 0;
      return {
        mes: mesKey,
        label: formatMesLabel(mesKey),
        nuevos: usuariosMesMap[mesKey] ?? 0,
        acumulado: acumuladoUsuarios
      };
    });

    // Desglose de Pedidos por Estado
    const estadosMap: Record<string, number> = {};
    pedidosFiltrados.forEach(p => {
      const estadoNorm = (p.estado || "sin_estado").toLowerCase();
      estadosMap[estadoNorm] = (estadosMap[estadoNorm] || 0) + 1;
    });

    const estadosTraducidos: Record<string, { label: string; color: string }> = {
      pagado: { label: "Pagado", color: "#10b981" },
      en_produccion: { label: "En Producción (POD)", color: "#3b82f6" },
      listo_entrega: { label: "Listo para Entrega", color: "#8b5cf6" },
      en_transito: { label: "En Camino", color: "#06b6d4" },
      entregado: { label: "Entregado", color: "#059669" },
      completado: { label: "Completado", color: "#10b981" },
      pendiente_pago: { label: "Pendiente de Pago", color: "#f59e0b" },
      pendiente_cotizacion: { label: "Cotización Pendiente", color: "#f97316" },
      pago_rechazado: { label: "Pago Rechazado", color: "#ef4444" },
      pago_cancelado: { label: "Cancelado", color: "#6b7280" },
      cancelado: { label: "Cancelado", color: "#6b7280" }
    };

    const pedidosPorEstado = Object.entries(estadosMap).map(([estado, count]) => {
      const meta = estadosTraducidos[estado] ?? { label: estado.replace(/_/g, " "), color: "#94a3b8" };
      return {
        estado,
        label: meta.label,
        count,
        color: meta.color
      };
    });

    // Desglose por Método / Tipo de Entrega
    const enviosCount = pedidosFiltrados.filter(p => (p.tipo_entrega || "envio").toLowerCase() === "envio").length;
    const recoleccionCount = pedidosFiltrados.filter(p => (p.tipo_entrega || "").toLowerCase() === "recoleccion").length;

    // Productos Más Vendidos (Analizando pedidos confirmados)
    const productSalesMap: Record<string, { nombre: string; categoria: string; cantidad: number; total: number; imagen?: string }> = {};
    pedidosConfirmados.forEach(p => {
      try {
        const items = typeof p.productos === "string" ? JSON.parse(p.productos) : p.productos;
        if (Array.isArray(items)) {
          items.forEach((item: ProductItem & { imagen?: string }) => {
            const rawName = item.nombre || item.name || "Producto sin nombre";
            const qty = Number(item.cantidad) || 1;
            const price = Number(item.precio_unitario || item.precio) || 0;
            const cat = item.categoria || "General";

            if (!productSalesMap[rawName]) {
              productSalesMap[rawName] = {
                nombre: rawName,
                categoria: cat,
                cantidad: 0,
                total: 0,
                imagen: item.imagen
              };
            }
            productSalesMap[rawName].cantidad += qty;
            productSalesMap[rawName].total += qty * price;
          });
        }
      } catch {}
    });

    const topProductos = Object.values(productSalesMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Productos por Categoría en Catálogo
    const categoriasCatMap: Record<string, number> = {};
    productos.forEach(pr => {
      const cat = pr.categoria || "Sin categoría";
      categoriasCatMap[cat] = (categoriasCatMap[cat] || 0) + 1;
    });
    const productosPorCategoria = Object.entries(categoriasCatMap).map(([categoria, value]) => ({
      categoria,
      value
    }));

    // Stock bajo (alertas de inventario)
    const productosStockBajo = productos.filter(p => Number(p.stock) <= 3);

    // Pedidos Recientes (para tabla detallada)
    const pedidosRecientes = pedidos.slice(0, 8).map(p => {
      let clienteNombre = "Cliente General";
      let clienteEmail = "";
      let clienteTelefono = "";
      try {
        const datos = typeof p.datos_contacto === "string" ? JSON.parse(p.datos_contacto) as ContactoData : p.datos_contacto as ContactoData;
        if (datos?.nombre) clienteNombre = datos.nombre.trim();
        if (datos?.email) clienteEmail = datos.email.trim();
        if (datos?.telefono) clienteTelefono = datos.telefono.trim();
      } catch {}

      return {
        id: p.id,
        clienteNombre,
        clienteEmail,
        clienteTelefono,
        total: Number(p.total) || 0,
        estado: p.estado || "pendiente",
        tipoEntrega: p.tipo_entrega || "envio",
        fecha: p.created_at,
        esPod: Boolean(p.es_pod)
      };
    });

    // Mensajes no leídos
    const mensajesNoLeidos = mensajes.filter(m => !m.leido).length;

    return NextResponse.json({
      success: true,
      resumen: {
        totalIngresos,
        totalPedidos: pedidosFiltrados.length,
        pedidosConfirmados: totalPedidosConfirmados,
        ticketPromedio,
        totalUsuarios: usuarios.length,
        totalProductos: productos.length,
        productosStockBajo: productosStockBajo.length,
        totalCarritos: carritos.length,
        potencialCarritos,
        totalRecogidas: recogidas.length,
        totalMensajes: mensajes.length,
        mensajesNoLeidos,
        totalNotificaciones: notificaciones.length,
        enviosCount,
        recoleccionCount
      },
      ventasPorMes,
      usuariosPorMes,
      pedidosPorEstado,
      topProductos,
      productosPorCategoria,
      pedidosRecientes,
      range
    });

  } catch (error) {
    console.error("[BI-API] Critical Error:", error);
    return NextResponse.json(
      { error: "Error calculando métricas de Business Intelligence" },
      { status: 500 }
    );
  }
}
