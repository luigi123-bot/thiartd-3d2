import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from "pdf-lib";
import fs from "fs";
import path from "path";
import { supabase } from "~/lib/supabaseClient";
import { ORIGEN_DEFECTO } from "../../utils/envia";

export interface GuiaPdfData {
  pedidoId: number;
  numeroTracking: string;
  empresaEnvio: string;
  fechaCreacion?: string;
  origen: {
    nombre: string;
    empresa: string;
    direccion: string;
    ciudad: string;
    departamento: string;
    codigoPostal: string;
    telefono: string;
    email: string;
  };
  destino: {
    nombre: string;
    direccion: string;
    ciudad: string;
    departamento: string;
    codigoPostal: string;
    telefono: string;
    email?: string;
    cedula?: string;
  };
  paquete: {
    pesoKg: number;
    dimensiones: string; // e.g. "15 x 15 x 15 cm"
    valorDeclarado: number;
    contenido: string[];
    totalPiezas?: number;
  };
}

/**
 * Reemplaza caracteres especiales fuera del estándar WinAnsi para evitar excepciones en pdf-lib
 */
function sanitizeText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/[—–]/g, " - ") // Guiones largos y medios a guion con espacios
    .replace(/[“”"«»]/g, '"')
    .replace(/[‘’`´]/g, "'")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remueve tildes para compatibilidad estándar
    .replace(/[^\x20-\x7E\n\r]/g, ""); // Solo caracteres imprimibles ASCII
}

/**
 * Formatea fechas a formato estándar colombiano DD/MM/AAAA
 */
function formatFechaCo(fechaStr?: string): string {
  if (!fechaStr) return new Date().toLocaleDateString("es-CO");
  try {
    const d = new Date(fechaStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return new Date().toLocaleDateString("es-CO");
  }
}

/**
 * Patrón Code 39 estándar para código de barras vectorial
 */
const CODE39_MAP: Record<string, string> = {
  "0": "000110100", "1": "100100001", "2": "001100001", "3": "101100000",
  "4": "000110001", "5": "100110000", "6": "001110000", "7": "000100101",
  "8": "100100100", "9": "001100100", "A": "100001001", "B": "001001001",
  "C": "101001000", "D": "000011001", "E": "100011000", "F": "001011000",
  "G": "000001101", "H": "100001100", "I": "001001100", "J": "000011100",
  "K": "100000011", "L": "001000011", "M": "101000010", "N": "000010011",
  "O": "100010010", "P": "001010010", "Q": "000000111", "R": "100000110",
  "S": "001000110", "T": "000010110", "U": "110000001", "V": "011000001",
  "W": "111000000", "X": "010010001", "Y": "110010000", "Z": "011010000",
  "-": "010000101", ".": "110000100", " ": "011000100", "*": "010010100",
};

/**
 * Dibuja un código de barras Code 39 nítido, vectorial y perfectamente acotado al contenedor
 */
function drawBarcode(
  page: PDFPage,
  font: PDFFont,
  text: string,
  boxX: number,
  boxY: number,
  boxWidth: number,
  height: number
) {
  const cleanCode = "*" + text.toUpperCase().replace(/[^0-9A-Z\-]/g, "") + "*";

  // Ancho total máximo permitido para el código de barras (evita cualquier desborde)
  const maxBarcodeWidth = Math.min(boxWidth - 20, 140);

  // En Code 39 cada carácter consta de 3 barras anchas, 6 estrechas y 1 espacio inter-carácter
  const unitsPerChar = 13.5;
  const totalUnits = cleanCode.length * unitsPerChar;
  const narrowWidth = Math.min(0.85, maxBarcodeWidth / totalUnits);
  const wideWidth = narrowWidth * 2.2;
  const gap = narrowWidth;

  let calculatedWidth = 0;
  for (let i = 0; i < cleanCode.length; i++) {
    const char = cleanCode[i] || "*";
    const pattern = CODE39_MAP[char] || CODE39_MAP["*"]!;
    for (let j = 0; j < pattern.length; j++) {
      calculatedWidth += pattern[j] === "1" ? wideWidth : narrowWidth;
    }
    calculatedWidth += gap;
  }

  // Centrar con precisión matemática dentro de boxX y boxWidth
  let currentX = boxX + Math.max(0, (boxWidth - calculatedWidth) / 2);
  const barColor = rgb(0.08, 0.12, 0.18);

  for (let i = 0; i < cleanCode.length; i++) {
    const char = cleanCode[i] || "*";
    const pattern = CODE39_MAP[char] || CODE39_MAP["*"]!;

    for (let j = 0; j < pattern.length; j++) {
      const isBar = j % 2 === 0;
      const isWide = pattern[j] === "1";
      const w = isWide ? wideWidth : narrowWidth;

      if (isBar) {
        page.drawRectangle({
          x: currentX,
          y: boxY,
          width: w,
          height,
          color: barColor,
        });
      }
      currentX += w;
    }
    currentX += gap;
  }

  // Etiqueta del código de barras centrada exactamente debajo de las barras
  const labelText = `* ${text.toUpperCase()} *`;
  const textWidth = font.widthOfTextAtSize(labelText, 7);
  const textX = boxX + Math.max(0, (boxWidth - textWidth) / 2);

  page.drawText(labelText, {
    x: textX,
    y: boxY - 9,
    size: 7,
    font,
    color: rgb(0.40, 0.46, 0.55),
  });
}

export async function generateGuiaPdfBuffer(data: GuiaPdfData): Promise<Buffer> {
  const doc = await PDFDocument.create();
  // Formato estándar etiqueta logística: 420 x 650 puntos
  const page = doc.addPage([420, 650]);

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

  // Paleta de colores profesional Thiart 3D
  const tealPrimary = rgb(0, 0.631, 0.604); // #00a19a
  const tealDark = rgb(0, 0.474, 0.450);    // #007973
  const tealSoftBg = rgb(0.92, 0.98, 0.98); // #eaf8f7
  const slateDark = rgb(0.06, 0.09, 0.16);  // #0f172a
  const slateText = rgb(0.20, 0.25, 0.33);  // #334155
  const slateMuted = rgb(0.45, 0.52, 0.62); // #718096
  const borderLight = rgb(0.88, 0.91, 0.94);// #e2e8f0
  const blueSoftBg = rgb(0.93, 0.96, 1.0);  // #eff6ff
  const blueHeader = rgb(0.12, 0.35, 0.78); // #1e40af
  const amberBg = rgb(1.0, 0.98, 0.92);     // #fefce8
  const amberBorder = rgb(0.96, 0.78, 0.35);// #f59e0b
  const amberText = rgb(0.71, 0.33, 0.04);  // #b45309

  // Fondo blanco con borde exterior doble estilizado
  page.drawRectangle({
    x: 14,
    y: 14,
    width: 392,
    height: 622,
    borderColor: borderLight,
    borderWidth: 1.5,
    color: rgb(1, 1, 1),
  });

  // Intentar cargar logo oficial de Thiart 3D
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath);
      const logoImg = await doc.embedPng(logoBytes);
      page.drawImage(logoImg, {
        x: 24,
        y: 584,
        width: 38,
        height: 38,
      });
    }
  } catch (e) {
    console.warn("[PDF-GUIA] No se pudo incrustar logo.png:", e);
  }

  // ── 1. CABECERA THIART 3D & CARRIER ──
  page.drawText("THIART 3D", {
    x: 68,
    y: 606,
    size: 15,
    font: fontBold,
    color: tealPrimary,
  });

  page.drawText("ESTUDIO DE DISENO & IMPRESION 3D", {
    x: 68,
    y: 595,
    size: 6.5,
    font: fontBold,
    color: slateMuted,
  });

  page.drawText("GUIA LOGISTICA DE DESPACHO NACIONAL", {
    x: 68,
    y: 585,
    size: 6.5,
    font: fontRegular,
    color: slateText,
  });

  // Placa de la Transportadora (Top Right)
  const carrierNombre = sanitizeText(data.empresaEnvio || "COORDINADORA").toUpperCase();
  const carrierBg = carrierNombre.includes("ENVIA")
    ? rgb(0.72, 0.11, 0.11)
    : carrierNombre.includes("SERVI")
    ? rgb(0.02, 0.44, 0.28)
    : rgb(0.12, 0.27, 0.64); // Coordinadora / Default azul

  page.drawRectangle({
    x: 260,
    y: 584,
    width: 135,
    height: 40,
    color: carrierBg,
  });

  page.drawText("TRANSPORTADORA OFICIAL", {
    x: 270,
    y: 612,
    size: 6,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(carrierNombre, {
    x: 270,
    y: 597,
    size: 12,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText("SERVICIO EXPRESS / ESTANDAR", {
    x: 270,
    y: 588,
    size: 5.5,
    font: fontRegular,
    color: rgb(0.9, 0.9, 0.9),
  });

  // ── 2. SECCIÓN TRACKING & CÓDIGO DE BARRAS (Y: 512 a 574) ──
  page.drawRectangle({
    x: 20,
    y: 512,
    width: 380,
    height: 62,
    color: rgb(0.97, 0.98, 0.99),
    borderColor: borderLight,
    borderWidth: 1,
  });

  // Columna Izquierda: Tracking Info
  page.drawText("CODIGO DE RASTREO / NUMERO DE GUIA:", {
    x: 30,
    y: 558,
    size: 7,
    font: fontBold,
    color: slateMuted,
  });

  const trackingStr = sanitizeText(data.numeroTracking || `PED-${data.pedidoId}`);
  page.drawText(trackingStr, {
    x: 30,
    y: 538,
    size: 16,
    font: fontBold,
    color: tealDark,
  });

  const fechaFormateada = formatFechaCo(data.fechaCreacion);

  page.drawText(`PEDIDO #${data.pedidoId}   |   EMISION: ${fechaFormateada}`, {
    x: 30,
    y: 522,
    size: 7.5,
    font: fontBold,
    color: slateText,
  });

  // Columna Derecha: Código de barras vectorial perfectamente contenido y centrado
  try {
    drawBarcode(page, fontRegular, trackingStr, 220, 526, 170, 26);
  } catch (bcErr) {
    console.warn("[PDF-GUIA] Error dibujando código de barras:", bcErr);
  }

  // ── 3. SECCIÓN REMITENTE / ORIGEN (Y: 418 a 502) ──
  page.drawRectangle({
    x: 20,
    y: 418,
    width: 380,
    height: 84,
    color: rgb(1, 1, 1),
    borderColor: borderLight,
    borderWidth: 1,
  });

  // Barra de título Origen (Azul Suave)
  page.drawRectangle({
    x: 20,
    y: 484,
    width: 380,
    height: 18,
    color: blueSoftBg,
  });

  page.drawText("ORIGEN / REMITENTE (TALLER PRINCIPAL)", {
    x: 28,
    y: 489,
    size: 7.5,
    font: fontBold,
    color: blueHeader,
  });

  page.drawText(sanitizeText(data.origen.nombre || "Luis Gotopo - Thiart 3D"), {
    x: 28,
    y: 468,
    size: 10,
    font: fontBold,
    color: slateDark,
  });

  page.drawText(`Direccion: ${sanitizeText(data.origen.direccion)}`, {
    x: 28,
    y: 454,
    size: 8,
    font: fontRegular,
    color: slateText,
  });

  page.drawText(`Ciudad: ${sanitizeText(data.origen.ciudad)}, ${sanitizeText(data.origen.departamento)}   |   Codigo Postal: ${sanitizeText(data.origen.codigoPostal)}`, {
    x: 28,
    y: 441,
    size: 8,
    font: fontRegular,
    color: slateMuted,
  });

  page.drawText(`Telefono: ${sanitizeText(data.origen.telefono)}   |   Email: ${sanitizeText(data.origen.email)}`, {
    x: 28,
    y: 428,
    size: 8,
    font: fontRegular,
    color: slateMuted,
  });

  // ── 4. SECCIÓN DESTINATARIO / DESTINO (Y: 312 a 408) ──
  page.drawRectangle({
    x: 20,
    y: 314,
    width: 380,
    height: 94,
    color: rgb(1, 1, 1),
    borderColor: tealPrimary,
    borderWidth: 1.5,
  });

  // Barra de título Destino (Verde/Teal)
  page.drawRectangle({
    x: 20,
    y: 390,
    width: 380,
    height: 18,
    color: tealSoftBg,
  });

  page.drawText("DESTINATARIO / DESTINO FINAL DE ENTREGA", {
    x: 28,
    y: 395,
    size: 7.5,
    font: fontBold,
    color: tealDark,
  });

  page.drawText(sanitizeText(data.destino.nombre || "Cliente Destinatario"), {
    x: 28,
    y: 372,
    size: 11,
    font: fontBold,
    color: slateDark,
  });

  // Resaltado de dirección de entrega
  page.drawRectangle({
    x: 26,
    y: 349,
    width: 368,
    height: 18,
    color: rgb(0.95, 0.98, 1.0),
    borderColor: rgb(0.85, 0.92, 0.98),
    borderWidth: 0.8,
  });

  page.drawText(`DIRECCION: ${sanitizeText(data.destino.direccion)}`, {
    x: 32,
    y: 355,
    size: 8.5,
    font: fontBold,
    color: rgb(0.08, 0.38, 0.74),
  });

  page.drawText(`Ciudad: ${sanitizeText(data.destino.ciudad)}, ${sanitizeText(data.destino.departamento)}   |   CP: ${sanitizeText(data.destino.codigoPostal || "760000")}`, {
    x: 28,
    y: 336,
    size: 8,
    font: fontBold,
    color: slateText,
  });

  const telDestino = sanitizeText(data.destino.telefono || "Sin telefono");
  const cedulaDestino = sanitizeText(data.destino.cedula ? `C.C.: ${data.destino.cedula}` : "");
  const emailDestino = sanitizeText(data.destino.email ? `Email: ${data.destino.email}` : "");

  page.drawText(`Tel: ${telDestino}   ${cedulaDestino ? `|   ${cedulaDestino}   ` : ""}${emailDestino ? `|   ${emailDestino}` : ""}`, {
    x: 28,
    y: 323,
    size: 7.5,
    font: fontRegular,
    color: slateMuted,
  });

  // ── 5. SECCIÓN CONTENIDO & ESPECIFICACIONES 3D (Y: 188 a 304) ──
  page.drawRectangle({
    x: 20,
    y: 190,
    width: 380,
    height: 114,
    color: rgb(1, 1, 1),
    borderColor: borderLight,
    borderWidth: 1,
  });

  // Barra de título Contenido
  page.drawRectangle({
    x: 20,
    y: 286,
    width: 380,
    height: 18,
    color: rgb(0.95, 0.96, 0.98),
  });

  page.drawText("DECLARACION DE PAQUETES & ARTICULOS DE ARTE 3D", {
    x: 28,
    y: 291,
    size: 7.5,
    font: fontBold,
    color: slateText,
  });

  // 4 Cuadros de métricas clave (Stats Grid)
  const statsY = 250;
  const statBoxW = 88;
  const statGap = 8;
  const startStatX = 26;

  // Stat 1: Cantidad
  page.drawRectangle({
    x: startStatX,
    y: statsY,
    width: statBoxW,
    height: 30,
    color: rgb(0.98, 0.99, 1.0),
    borderColor: borderLight,
    borderWidth: 0.8,
  });
  page.drawText("PIEZAS TOTALES", { x: startStatX + 6, y: statsY + 19, size: 5.5, font: fontBold, color: slateMuted });
  page.drawText(`${data.paquete.totalPiezas ?? data.paquete.contenido.length ?? 1} unidades`, { x: startStatX + 6, y: statsY + 7, size: 8, font: fontBold, color: slateDark });

  // Stat 2: Peso
  const x2 = startStatX + statBoxW + statGap;
  page.drawRectangle({
    x: x2,
    y: statsY,
    width: statBoxW,
    height: 30,
    color: rgb(0.98, 0.99, 1.0),
    borderColor: borderLight,
    borderWidth: 0.8,
  });
  page.drawText("PESO DECLARADO", { x: x2 + 6, y: statsY + 19, size: 5.5, font: fontBold, color: slateMuted });
  page.drawText(`${data.paquete.pesoKg.toFixed(1)} KG`, { x: x2 + 6, y: statsY + 7, size: 8, font: fontBold, color: tealDark });

  // Stat 3: Medidas
  const x3 = x2 + statBoxW + statGap;
  page.drawRectangle({
    x: x3,
    y: statsY,
    width: statBoxW,
    height: 30,
    color: rgb(0.98, 0.99, 1.0),
    borderColor: borderLight,
    borderWidth: 0.8,
  });
  page.drawText("DIMENSIONES CAJA", { x: x3 + 6, y: statsY + 19, size: 5.5, font: fontBold, color: slateMuted });
  page.drawText(sanitizeText(data.paquete.dimensiones || "15 x 15 x 15 cm"), { x: x3 + 6, y: statsY + 7, size: 7.5, font: fontBold, color: slateDark });

  // Stat 4: Valor Declarado
  const x4 = x3 + statBoxW + statGap;
  page.drawRectangle({
    x: x4,
    y: statsY,
    width: statBoxW,
    height: 30,
    color: rgb(0.98, 0.99, 1.0),
    borderColor: borderLight,
    borderWidth: 0.8,
  });
  page.drawText("VALOR DECLARADO", { x: x4 + 6, y: statsY + 19, size: 5.5, font: fontBold, color: slateMuted });
  const valorStr = `$${Number(data.paquete.valorDeclarado || 0).toLocaleString("es-CO")}`;
  page.drawText(valorStr, { x: x4 + 6, y: statsY + 7, size: 8, font: fontBold, color: rgb(0.1, 0.5, 0.3) });

  // Lista detallada de productos
  page.drawText("Articulos incluidos en este envio:", {
    x: 28,
    y: 236,
    size: 7,
    font: fontBold,
    color: slateMuted,
  });

  let prodY = 224;
  const items = data.paquete.contenido.slice(0, 3);
  for (const item of items) {
    page.drawText(`- ${sanitizeText(item).substring(0, 75)}`, {
      x: 32,
      y: prodY,
      size: 7.5,
      font: fontRegular,
      color: slateText,
    });
    prodY -= 11;
  }
  if (data.paquete.contenido.length > 3) {
    page.drawText(`  ... y ${data.paquete.contenido.length - 3} articulos adicionales.`, {
      x: 32,
      y: prodY,
      size: 7,
      font: fontBold,
      color: tealDark,
    });
  }

  // ── 6. SECCIÓN MANEJO FRÁGIL & CONSTANCIA DE ENTREGA (Y: 66 a 180) ──
  // Box Izquierdo: Frágil (Ámbar)
  page.drawRectangle({
    x: 20,
    y: 68,
    width: 185,
    height: 112,
    color: amberBg,
    borderColor: amberBorder,
    borderWidth: 1,
  });

  page.drawText("! MANEJAR CON CUIDADO - FRAGIL", {
    x: 28,
    y: 165,
    size: 8,
    font: fontBold,
    color: amberText,
  });

  page.drawText("Contiene piezas de arte y esculturas 3D", {
    x: 28,
    y: 151,
    size: 7,
    font: fontBold,
    color: slateDark,
  });
  page.drawText("fabricadas con polimeros de alta definicion.", {
    x: 28,
    y: 141,
    size: 6.5,
    font: fontRegular,
    color: slateText,
  });
  page.drawText("Proteger de golpes, caidas y calor excesivo.", {
    x: 28,
    y: 131,
    size: 6.5,
    font: fontRegular,
    color: slateText,
  });

  page.drawText("Verificado por Control de Calidad Thiart 3D", {
    x: 28,
    y: 105,
    size: 6.5,
    font: fontBold,
    color: tealDark,
  });
  page.drawText("Sello de Embalaje Protegido [OK]", {
    x: 28,
    y: 93,
    size: 6.5,
    font: fontBold,
    color: rgb(0.15, 0.45, 0.2),
  });

  // Box Derecho: Constancia de Firma y Entrega
  page.drawRectangle({
    x: 215,
    y: 68,
    width: 185,
    height: 112,
    color: rgb(1, 1, 1),
    borderColor: borderLight,
    borderWidth: 1,
  });

  page.drawRectangle({
    x: 215,
    y: 162,
    width: 185,
    height: 18,
    color: rgb(0.95, 0.96, 0.98),
  });

  page.drawText("CONSTANCIA DE ENTREGA", {
    x: 224,
    y: 167,
    size: 7,
    font: fontBold,
    color: slateDark,
  });

  page.drawText("Firma de Recibido:", {
    x: 224,
    y: 142,
    size: 6.5,
    font: fontBold,
    color: slateMuted,
  });
  page.drawLine({
    start: { x: 224, y: 122 },
    end: { x: 388, y: 122 },
    color: rgb(0.7, 0.75, 0.8),
    thickness: 1,
  });

  page.drawText("Cedula / C.C.: __________________________", {
    x: 224,
    y: 104,
    size: 6.5,
    font: fontRegular,
    color: slateText,
  });

  page.drawText("Fecha: ______ / ______ / 202___   Hora: _______", {
    x: 224,
    y: 86,
    size: 6.5,
    font: fontRegular,
    color: slateText,
  });

  // ── 7. PIE DE PÁGINA PROFESIONAL (Y: 20 a 54) ──
  page.drawLine({
    start: { x: 20, y: 52 },
    end: { x: 400, y: 52 },
    color: tealPrimary,
    thickness: 1,
  });

  page.drawText("THIART 3D  -  ARTE, ESCULTURA & TECNOLOGIA EN IMPRESION 3D", {
    x: 75,
    y: 38,
    size: 6.5,
    font: fontBold,
    color: tealDark,
  });

  page.drawText("Cali, Valle del Cauca, Colombia   |   Soporte: thiart3d@gmail.com   |   www.thiart3d.com", {
    x: 62,
    y: 26,
    size: 6,
    font: fontRegular,
    color: slateMuted,
  });

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Obtiene directamente el Buffer del PDF con el diseño oficial de Thiart 3D
 * a partir del ID de un pedido en la base de datos.
 */
export async function obtenerGuiaPdfBufferPorPedidoId(pedidoId: number): Promise<Buffer | null> {
  try {
    const { data: pedido, error } = await supabase
      .from("pedidos")
      .select("*")
      .eq("id", pedidoId)
      .single();

    if (error || !pedido) {
      console.warn(`[GUIA-PDF] No se encontró pedido #${pedidoId}:`, error?.message);
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = pedido as any;

    // Parsear lista de productos para el detalle del paquete
    let listaProductos: string[] = [];
    let totalPiezas = 0;
    try {
      if (p.productos) {
        const parsed = typeof p.productos === "string" ? JSON.parse(p.productos) : p.productos;
        if (Array.isArray(parsed)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          listaProductos = parsed.map((item: any) => {
            const cant = Number(item.cantidad) || 1;
            totalPiezas += cant;
            return `${cant}x ${item.nombre || item.name || "Pieza 3D"}`;
          });
        }
      }
    } catch {
      listaProductos = ["Piezas y Arte 3D Thiart"];
      totalPiezas = 1;
    }

    if (listaProductos.length === 0) {
      listaProductos = ["Piezas y Arte 3D Thiart"];
      totalPiezas = 1;
    }

    // Parsear datos de contacto
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let contacto: any = {};
    try {
      if (p.datos_contacto) {
        contacto = typeof p.datos_contacto === "string" ? JSON.parse(p.datos_contacto) : p.datos_contacto;
      }
    } catch {
      contacto = {};
    }

    const trackingNum = p.numero_tracking || `COORSBX${pedidoId.toString().padStart(6, "0")}`;
    const empresaEnvio = p.empresa_envio || "coordinadora";

    return await generateGuiaPdfBuffer({
      pedidoId: p.id,
      numeroTracking: trackingNum,
      empresaEnvio: empresaEnvio,
      fechaCreacion: p.created_at,
      origen: {
        nombre: ORIGEN_DEFECTO.name,
        empresa: ORIGEN_DEFECTO.company,
        direccion: `${ORIGEN_DEFECTO.street} #${ORIGEN_DEFECTO.number}`,
        ciudad: ORIGEN_DEFECTO.city,
        departamento: ORIGEN_DEFECTO.state === "VC" ? "Valle del Cauca" : ORIGEN_DEFECTO.state,
        codigoPostal: ORIGEN_DEFECTO.postalCode,
        telefono: ORIGEN_DEFECTO.phone,
        email: ORIGEN_DEFECTO.email,
      },
      destino: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        nombre: String(contacto?.nombre || "Destinatario"),
        direccion: String(p.direccion_envio || "Direccion no especificada"),
        ciudad: String(p.ciudad_envio || "Cali"),
        departamento: String(p.departamento_envio || "Valle del Cauca"),
        codigoPostal: String(p.codigo_postal_envio || "760000"),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        telefono: String(p.telefono_envio || contacto?.telefono || "3000000000"),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        email: contacto?.email ? String(contacto.email) : undefined,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        cedula: contacto?.cedula ? String(contacto.cedula) : undefined,
      },
      paquete: {
        pesoKg: totalPiezas > 0 ? Math.max(0.5, totalPiezas * 0.5) : 1.0,
        dimensiones: "15 x 15 x 15 cm",
        valorDeclarado: Number(p.total) || 150000,
        contenido: listaProductos,
        totalPiezas: totalPiezas || 1,
      },
    });
  } catch (err) {
    console.error(`[GUIA-PDF] Error en obtenerGuiaPdfBufferPorPedidoId para pedido #${pedidoId}:`, err);
    return null;
  }
}

