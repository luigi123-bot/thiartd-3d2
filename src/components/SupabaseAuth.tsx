import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

type UsuarioDB = {
  id: string;
  nombre: string;
  email: string;
  creado_en: string;
  role: string;
};

export default function SupabaseAuth({ onAuth }: { onAuth?: (user: UsuarioDB) => void }) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ nombre: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [usuario, setUsuario] = useState<UsuarioDB | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  // Registro de usuario
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setUsuario(null);

    // 1. Registro en Supabase Auth (sin requerir confirmación de correo)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { nombre: form.nombre },
        emailRedirectTo: undefined,
        // Forzar confirmación automática (solo para proyectos donde esté permitido)
        // Si tu proyecto requiere confirmación, debes desactivarla en el panel de Supabase Auth
      }
    });

    // Si el usuario ya existe, intenta loguear directamente
    if (signUpError?.message?.includes("User already registered")) {
      setError("El correo ya está registrado. Inicia sesión.");
      setLoading(false);
      return;
    }
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // 2. Crear entrada en la tabla usuarios
    const userId = data.user?.id;
    if (!userId) {
      setError("No se pudo obtener el ID del usuario.");
      setLoading(false);
      return;
    }

    // Inserta en la tabla usuarios (ignora si ya existe)
    await supabase.from("usuarios").upsert({
      id: userId,
      nombre: form.nombre,
      email: form.email,
      creado_en: new Date().toISOString(),
      role: "cliente"
    });

    // 3. Obtener usuario de la tabla usuarios
    const { data: usuarioData } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", userId)
      .single<UsuarioDB>();

    setLoading(false);
    setUsuario(usuarioData ?? null);
    if (onAuth && usuarioData) onAuth(usuarioData);
  };

  // Inicio de sesión
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setUsuario(null);

    // 1. Login en Supabase Auth
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    // 2. Buscar usuario en la tabla usuarios
    const userId = data.user?.id;
    if (!userId) {
      setError("No se pudo obtener el ID del usuario.");
      setLoading(false);
      return;
    }

    const { data: usuarioData, error: usuarioError } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", userId)
      .single<UsuarioDB>();

    if (usuarioError || !usuarioData) {
      setError("No se encontró el usuario en la base de datos.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setUsuario(usuarioData);
    if (onAuth) onAuth(usuarioData);
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow p-8">
      <div className="flex gap-2 mb-6 justify-center">
        <Button variant={tab === "login" ? "default" : "outline"} onClick={() => setTab("login")}>Iniciar sesión</Button>
        <Button variant={tab === "register" ? "default" : "outline"} onClick={() => setTab("register")}>Registrarse</Button>
      </div>
      {tab === "register" ? (
        <form className="flex flex-col gap-4" onSubmit={handleRegister}>
          <Input name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} required />
          <Input name="email" placeholder="Correo electrónico" type="email" value={form.email} onChange={handleChange} required />
          <Input name="password" placeholder="Contraseña" type="password" value={form.password} onChange={handleChange} required />
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Registrando..." : "Registrarse"}</Button>
          {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
          {usuario && (
            <div className="text-green-600 text-sm mt-2">
              ¡Registro exitoso! Bienvenido, {usuario.nombre}.
            </div>
          )}
        </form>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={handleLogin}>
          <Input name="email" placeholder="Correo electrónico" type="email" value={form.email} onChange={handleChange} required />
          <Input name="password" placeholder="Contraseña" type="password" value={form.password} onChange={handleChange} required />
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Ingresando..." : "Iniciar sesión"}</Button>
          {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
          {usuario && (
            <div className="text-green-600 text-sm mt-2">
              ¡Bienvenido, {usuario.nombre}!
            </div>
          )}
        </form>
      )}
    </div>
  );
}
