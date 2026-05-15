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

export default supabase;

export async function signUpWithEmail(email: string, password: string) {
  // Esta función enviará automáticamente un email de confirmación si está habilitado en Supabase
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // Puedes agregar aquí redirectTo si quieres redirigir después de la confirmación
    // options: { emailRedirectTo: 'https://tusitio.com/confirmacion' }
  });
  return { data, error };
}
