import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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

    // Actualizar producto
    const result = await supabase
      .from("productos")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (result.error) {
      console.error("Error al actualizar producto:", result.error.message);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ producto: result.data as Producto });
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
