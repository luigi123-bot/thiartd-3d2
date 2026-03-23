import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    const user = data?.user;

    if (user) {
      const { data: existingUser } = await supabase
        .from("usuarios")
        .select("id")
        .eq("id", user.id)
        .single() as { data: { id: string } | null };

      if (!existingUser) {
        const fullName = (user.user_metadata?.full_name as string | undefined);
        await supabase.from("usuarios").insert({
          id: user.id,
          auth_id: user.id,
          email: user.email,
          nombre: fullName ?? user.email?.split('@')[0] ?? "Usuario Google",
          role: "cliente"
        });
      }
    }
  }

  return NextResponse.redirect(new URL("/", request.url));
}
