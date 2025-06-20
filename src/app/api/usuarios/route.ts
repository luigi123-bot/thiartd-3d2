import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Webhook } from "svix";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET!;

export async function GET(req: Request) {
  // Obtener JWT de Clerk del header Authorization
  const authHeader = req.headers.get("authorization");
  let supabase = createClient(supabaseUrl, supabaseKey);

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const jwt = authHeader.replace("Bearer ", "");
    supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      },
    });
  }

  const { data: usuarios, error } = await supabase.from("usuarios").select("*");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ usuarios });
}

export async function POST(req: Request) {
  const svix_id = req.headers.get("svix-id");
  const svix_timestamp = req.headers.get("svix-timestamp");
  const svix_signature = req.headers.get("svix-signature");

  let supabase = createClient(supabaseUrl, supabaseKey);

  if (svix_id && svix_timestamp && svix_signature && CLERK_WEBHOOK_SECRET) {
    // --- Webhook Clerk ---
    const payload = await req.text();
    try {
      const wh = new Webhook(CLERK_WEBHOOK_SECRET);
      const evt = wh.verify(payload, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as { data: { id: string, email_addresses: { email_address: string }[], first_name?: string, last_name?: string } };
      const { id, email_addresses, first_name, last_name } = evt.data;
      const clerk_id = id;
      const email = email_addresses?.[0]?.email_address;
      const nombre = (first_name && last_name) ? `${first_name} ${last_name}` : "";
      if (!clerk_id || !email || !nombre) {
        return NextResponse.json(
          { error: "Faltan datos obligatorios: clerk_id, email, nombre." },
          { status: 400 }
        );
      }
      const { data, error } = await supabase
        .from("usuarios")
        .upsert([{ clerk_id, email, nombre }], { onConflict: "clerk_id" })
        .select()
        .single();
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ usuario: data });
    } catch (error) {
      return NextResponse.json({ error: "Unauthorized request" }, { status: 401 });
    }
  } else {
    // --- POST normal desde el frontend ---
    let body;
    try {
      body = await req.json();
      console.log("Body recibido en POST /api/usuarios:", body);
    } catch (err) {
      return NextResponse.json({ error: "Request body inválido" }, { status: 400 });
    }
    const { nombre, email, password } = body;
    if (!nombre || !email || !password) {
      return NextResponse.json(
        { error: "Todos los campos son obligatorios: nombre, email y password." },
        { status: 400 }
      );
    }
    const { data, error } = await supabase
      .from("usuarios")
      .insert([{ nombre, email, password, clerk_id: null }])
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ usuario: data });
  }
}
