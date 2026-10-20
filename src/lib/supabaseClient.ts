import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. " +
      "Add them to your .env file and restart the Next.js dev server."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Sincronización automática del token de sesión en la cookie 'sb-access-token'
// para permitir validación en middleware y API routes del servidor.
if (typeof window !== "undefined") {
  void supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.access_token) {
      document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=604800; SameSite=Lax`;
    }
  });

  supabase.auth.onAuthStateChange((event, session) => {
    if (session?.access_token) {
      document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=604800; SameSite=Lax`;
    } else if (event === "SIGNED_OUT") {
      document.cookie = "sb-access-token=; path=/; max-age=0; SameSite=Lax";
    }
  });
}

export default supabase;

export async function signUpWithEmail(email: string, password: string) {
  // Esta función enviará automáticamente un email de confirmación si está habilitado en Supabase
  const origin = typeof window !== "undefined" && window.location.origin ? window.location.origin : "https://thiart.co";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  return { data, error };
}
