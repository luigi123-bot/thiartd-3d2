import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Endpoint de API para la gestión del catálogo de productos (obras artísticas).
 * Permite listar todos los productos y crear nuevas entradas en el catálogo.
 */

/**
 * GET: Recupera la lista completa de productos.
 * Incluye el nombre del artista (relación con la tabla usuarios) y las imágenes secundarias.
 */
export async function GET() {
  const { data: productos, error } = await supabase
    .from("productos")
    .select(`
      *,
      usuarios:user_id (
        nombre
      ),
      producto_imagenes (*)
    `);
    
  if (error) {
    console.error("Error al obtener productos:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ productos });
}

/**
 * POST: Crea un nuevo producto en el catálogo.
 * Soporta la inserción del producto principal y la carga masiva de imágenes secundarias.
 */
export async function POST(req: Request) {
  try {
    // Definición de la estructura esperada en el cuerpo de la petición
    type ProductoBody = {
      nombre: string;
      precio: number;
      descripcion: string;
      tamano: string;
      categoria: string;
      stock: number;
      detalles?: string;
      destacado?: boolean;
      image_url?: string;
      model_url?: string;
      video_url?: string;
      user_id?: string;
      imagenes?: string[];
    };
    
    const body = (await req.json()) as ProductoBody;
    const { 
      nombre, precio, descripcion, tamano, categoria, stock, 
      detalles, destacado, image_url, model_url, video_url, user_id, imagenes 
    } = body;

    // Validación de campos obligatorios
    if (!nombre || precio === undefined || !descripcion || !tamano || !categoria || stock === undefined) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios para crear el producto." },
        { status: 400 }
      );
    }

    // Preparación del objeto para insertar en la tabla 'productos'
    const productToInsert = {
      nombre,
      precio,
      descripcion,
      tamano,
      categoria,
      stock: Number(stock),
      detalles: detalles ?? null,
      destacado: destacado ?? false,
      image_url: image_url ?? null,
      model_url: model_url ?? null,
      video_url: video_url ?? null,
      ...(user_id ? { user_id } : {}),
    };

    // 1. Inserción del producto base
    const insertResult = await supabase
      .from("productos")
      .insert([productToInsert])
      .select()
      .single<{ id: number | string }>();

    const data = insertResult.data;
    const error = insertResult.error;

    if (error || !data) {
      console.error("[POST API] Error al insertar en productos:", error);
      return NextResponse.json({ error: error?.message ?? "Error desconocido" }, { status: 500 });
    }

    // 2. Inserción de imágenes adicionales vinculadas
    // Esto permite que una obra tenga una galería completa además de su imagen de portada.
    if (imagenes && imagenes.length > 0 && data.id) {
      const filteredImgs = imagenes.filter(url => url && url.trim() !== "");
      
      if (filteredImgs.length > 0) {
        const imageInserts = filteredImgs.map((url, index) => ({
          producto_id: data.id,
          image_url: url,
          orden: index + 1,
          es_portada: false
        }));
        
        const { error: imgError } = await supabase.from("producto_imagenes").insert(imageInserts);
        if (imgError) {
          console.error("[POST API] Error al insertar imágenes secundarias:", imgError);
        }
      }
    }

    return NextResponse.json({ producto: data });
  } catch (error) {
    console.error("Error inesperado en creación de producto:", error);
    return NextResponse.json({ error: "Error inesperado al salvar el producto." }, { status: 500 });
  }
}
