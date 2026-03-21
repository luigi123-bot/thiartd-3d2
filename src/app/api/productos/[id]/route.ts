import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ProductoBody {
  nombre?: string;
  precio?: number;
  descripcion?: string;
  tamano?: string;
  categoria?: string;
  stock?: number;
  detalles?: string;
  destacado?: boolean;
  image_url?: string;
  model_url?: string;
  video_url?: string;
  user_id?: string;
  imagenes?: string[];
}

interface Producto extends ProductoBody {
  id: number;
  created_at?: string;
  updated_at?: string;
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rawBody = (await req.json()) as ProductoBody & { draft?: boolean };
    // Strip fields that don't exist in the productos table
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { draft: _draft, ...body } = rawBody;
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "ID del producto es requerido." },
        { status: 400 }
      );
    }

    const productToUpdate = {
      nombre: body.nombre,
      precio: body.precio,
      descripcion: body.descripcion,
      tamano: body.tamano,
      categoria: body.categoria,
      stock: body.stock !== undefined ? Number(body.stock) : undefined,
      destacado: body.destacado,
      detalles: body.detalles,
      image_url: body.image_url,
      model_url: body.model_url,
      video_url: body.video_url,
    };

    console.log("[PUT API] Actualizando producto con:", JSON.stringify(productToUpdate, null, 2));

    const result = await supabase
      .from("productos")
      .update(productToUpdate)
      .eq("id", id)
      .select()
      .single();

    if (result.error) {
      console.error("[PUT API] Error al actualizar:", result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    const data = result.data as Producto;
    console.log("[PUT API] Producto actualizado con éxito:", data);

    // Actualizar imágenes adicionales
    if (rawBody.imagenes) {
      console.log("[PUT API] Actualizando galería de imágenes:", rawBody.imagenes);
      // Borrar anteriores
      await supabase.from("producto_imagenes").delete().eq("producto_id", id);
      
      const filteredImgs = rawBody.imagenes.filter(url => url && url.trim() !== "");
      if (filteredImgs.length > 0) {
        const imageInserts = filteredImgs.map((url, index) => ({
          producto_id: id,
          image_url: url,
          orden: index + 1,
          es_portada: false
        }));
        const { error: imgError } = await supabase.from("producto_imagenes").insert(imageInserts);
        if (imgError) console.error("[PUT API] Error en imagenes secundarias:", imgError);
        else console.log("[PUT API] Galería actualizada correctamente");
      }
    }

    return NextResponse.json({ producto: data });
  } catch (error) {
    console.error("Error inesperado:", error);
    return NextResponse.json(
      { error: "Error inesperado al actualizar producto." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "ID del producto es requerido." },
        { status: 400 }
      );
    }

    // Eliminar producto
    const { error } = await supabase
      .from("productos")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error al eliminar producto:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Producto eliminado correctamente" });
  } catch (error) {
    console.error("Error inesperado:", error);
    return NextResponse.json(
      { error: "Error inesperado al eliminar producto." },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`[GET PRODUCT API] Consultando producto con ID: ${id}`);

  try {
    const result = await supabase
      .from("productos")
      .select("*, usuarios:user_id(nombre), producto_imagenes(*)")
      .eq("id", id)
      .single();

    if (result.error || !result.data) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    const data = result.data as { id: string };

    // Consulta independiente para imágenes si el join falla o para asegurar persistencia
    const { data: galeria } = await supabase
      .from("producto_imagenes")
      .select("*")
      .eq("producto_id", data.id)
      .order("orden", { ascending: true });

    return NextResponse.json({
      ...result.data,
      producto_imagenes: galeria ?? []
    });
  } catch (err) {
    console.error("[GET PRODUCT API] Error inesperado:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
