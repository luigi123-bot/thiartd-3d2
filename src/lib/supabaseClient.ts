import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
