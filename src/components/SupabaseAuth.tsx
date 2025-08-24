'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ nombre: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const { user } = data.session;
        const { data: usuarioData } = await supabase
          .from("usuarios")
          .select("*")
          .eq("id", user.id)
          .single<UsuarioDB>();
        if (onAuth && usuarioData) onAuth(usuarioData);
      }
    };

    void getSession();

    // Escucha cambios en el estado de sesión
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        router.push("/"); // 🔁 Redirige después de login o registro
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router, onAuth]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { nombre: form.nombre } }
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    const userId = data.user?.id;
    if (!userId) {
      setError("No se pudo obtener el ID del usuario.");
      setLoading(false);
      return;
    }

    await supabase.from("usuarios").upsert({
      id: userId,
      nombre: form.nombre,
      email: form.email,
      creado_en: new Date().toISOString(),
      role: "cliente"
    });

    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

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
    if (onAuth) onAuth(usuarioData);
    router.push("/"); // 🔁 Redirige después de login
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
        </form>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={handleLogin}>
          <Input name="email" placeholder="Correo electrónico" type="email" value={form.email} onChange={handleChange} required />
          <Input name="password" placeholder="Contraseña" type="password" value={form.password} onChange={handleChange} required />
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Ingresando..." : "Iniciar sesión"}</Button>
          {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
        </form>
      )}
    </div>
  );
}
