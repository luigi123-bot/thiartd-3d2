import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY!;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nombre, email, password } = body;
    if (!nombre || !email || !password) {
      return NextResponse.json(
        { error: "Todos los campos son obligatorios: nombre, email y password." },
        { status: 400 }
      );
    }

    // 1. Crear usuario en Clerk
    const [first_name, ...rest] = nombre.trim().split(" ");
    const last_name = rest.join(" ");
    const resClerk = await fetch("https://api.clerk.com/v1/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CLERK_SECRET_KEY}`,
      },
      body: JSON.stringify({
        email_address: email,
        password,
        first_name,
        last_name,
      }),
    });

    const clerkUser = await resClerk.json();

    if (!resClerk.ok) {
      return NextResponse.json({
        error: clerkUser.errors?.[0]?.message || "No se pudo crear el usuario en Clerk.",
      }, { status: 400 });
    }

    // 2. Crear usuario en Supabase (usa el id de Clerk)
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from("usuarios")
      .insert([{ nombre, email, clerk_id: clerkUser.id }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ usuario: data });
  } catch (error) {
    return NextResponse.json({ error: "Error inesperado al crear usuario." }, { status: 500 });
  }
}
