import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  const { data: productos, error } = await supabase.from("productos").select("*");
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
    };
    const body = (await req.json()) as ProductoBody;
    // Ajusta los campos según tu tabla productos
    const { nombre, precio, descripcion, tamano, categoria, stock, detalles, destacado, image_url, model_url } = body;
    if (!nombre || precio === undefined || !descripcion || !tamano || !categoria || stock === undefined) {
      return NextResponse.json(
        { error: "Todos los campos son obligatorios." },
        { status: 400 }
      );
    }
    // Log para depuración
    console.log("Insertando producto:", { nombre, precio, descripcion, tamano, categoria, stock, detalles, destacado, image_url, model_url });

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
      // Agrega aquí otros campos si existen en la tabla
    }

    const insertResult = await supabase
      .from("productos")
      .insert([{
        nombre,
        precio,
        descripcion,
        tamano,
        categoria,
        stock,
        detalles,
        destacado,
        image_url,
        model_url,
      }])
      .select()
      .single();

    const data = insertResult.data as Producto;
    const error = insertResult.error;

    if (error) {
      console.error("Error Supabase:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ producto: data });
  } catch (error) {
    console.error("Error inesperado:", error);
    return NextResponse.json({ error: "Error inesperado al guardar producto." }, { status: 500 });
  }
}
