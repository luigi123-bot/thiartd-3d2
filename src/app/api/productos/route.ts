import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ productos });
}

export async function POST(req: Request) {
  try {
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
    // Ajusta los campos según tu tabla productos
    const { nombre, precio, descripcion, tamano, categoria, stock, detalles, destacado, image_url, model_url, video_url, user_id, imagenes } = body;
    if (!nombre || precio === undefined || !descripcion || !tamano || !categoria || stock === undefined) {
      return NextResponse.json(
        { error: "Los campos nombre, precio, descripción, tamaño, categoría y stock son obligatorios." },
        { status: 400 }
      );
    }
    // Log para depuración profunda
    console.log("[POST API] Body recibido:", JSON.stringify(body, null, 2));

    interface Producto {
      id?: number;
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
      // Agrega aquí otros campos si existen en la tabla
    }

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

    console.log("[POST API] Intentando insertar con:", productToInsert);

    const insertResult = await supabase
      .from("productos")
      .insert([productToInsert])
      .select()
      .single();

    const data = insertResult.data as Producto;
    const error = insertResult.error;

    if (error) {
      console.error("[POST API] Error al insertar en productos:", error);
      return NextResponse.json({ error: error.message, details: error.details }, { status: 500 });
    }

    console.log("[POST API] Producto insertado correctamente:", data);

    // Insertar imágenes adicionales si existen
    if (imagenes && imagenes.length > 0 && data.id) {
      const filteredImgs = imagenes.filter(url => url && url.trim() !== "");
      console.log("[POST API] Insertando imágenes secundarias:", filteredImgs);
      
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
        } else {
          console.log("[POST API] Imágenes secundarias guardadas con éxito");
        }
      }
    }

    return NextResponse.json({ producto: data });
  } catch (error) {
    console.error("Error inesperado:", error);
    return NextResponse.json({ error: "Error inesperado al guardar producto." }, { status: 500 });
  }
}
