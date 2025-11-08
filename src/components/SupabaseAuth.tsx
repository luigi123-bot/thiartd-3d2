'use client';

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Dialog, DialogContent } from "~/components/ui/dialog";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import Image from "next/image";

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

export default function SupabaseAuth({ onAuth, open = false, onOpenChange }: { 
  onAuth?: (user: UsuarioDB) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [tab, setTab] = useState<"login" | "register" | "reset" | "verify-code" | "new-password">("login");
  const [form, setForm] = useState({ nombre: "", email: "", password: "", confirmPassword: "", code: "", newPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [resetToken, setResetToken] = useState<string>("");

  useEffect(() => {
    // Solo ejecutar si el modal está abierto
    if (!open) return;

    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const { user } = data.session;
        const { data: usuarioData } = await supabase
          .from("usuarios")
          .select("*")
          .eq("id", user.id)
          .single<UsuarioDB>();
        if (onAuth && usuarioData) {
          onAuth(usuarioData);
        }
        // Cerrar el modal si hay sesión
        if (onOpenChange) {
          onOpenChange(false);
        }
      }
    };

    void getSession();

    // Escucha cambios en el estado de sesión
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: usuarioData } = await supabase
          .from("usuarios")
          .select("*")
          .eq("id", session.user.id)
          .single<UsuarioDB>();
        
        if (onAuth && usuarioData) {
          onAuth(usuarioData);
        }
        
        // Cerrar el modal después de login o registro exitoso
        if (onOpenChange) {
          onOpenChange(false);
        }
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [open, onAuth, onOpenChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validar que las contraseñas coincidan
    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

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
    
    // Cerrar el modal después de login exitoso
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, action: "send-code" }),
      });

      const data = await response.json() as { 
        error?: string; 
        success?: boolean; 
        message?: string; 
        debug_codigo?: string;
        token?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Error al enviar el código");
        setLoading(false);
        return;
      }

      // Guardar el token para uso posterior
      if (data.token) {
        setResetToken(data.token);
      }

      setSuccess(`Código enviado a ${form.email}. Revisa tu correo electrónico.`);
      // En desarrollo, mostrar el código
      if (data.debug_codigo) {
        setSuccess(`Código enviado: ${data.debug_codigo} (solo visible en desarrollo)`);
      }
      
      // Cambiar a la vista de verificación de código
      setTimeout(() => {
        setTab("verify-code");
        setSuccess("");
      }, 3000);
      
      setLoading(false);
    } catch (err) {
      console.error("Error:", err);
      setError("Error al procesar la solicitud");
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: form.email, 
          code: form.code, 
          token: resetToken,
          action: "verify-code" 
        }),
      });

      const data = await response.json() as { error?: string; success?: boolean; message?: string; email?: string };

      if (!response.ok) {
        setError(data.error ?? "Código inválido");
        setLoading(false);
        return;
      }

      // Cambiar a la pantalla de nueva contraseña
      setTab("new-password");
      setSuccess("");
      setError("");
      setLoading(false);
    } catch (err) {
      console.error("Error:", err);
      setError("Error al verificar el código");
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (form.newPassword !== form.confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    if (form.newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          code: form.code,
          newPassword: form.newPassword,
          token: resetToken,
          action: "update-password",
        }),
      });

      const data = await response.json() as { error?: string; success?: boolean; message?: string };

      if (!response.ok) {
        setError(data.error ?? "Error al actualizar la contraseña");
        setLoading(false);
        return;
      }

      setSuccess("¡Contraseña actualizada exitosamente! Redirigiendo...");
      
      setTimeout(() => {
        setTab("login");
        setForm({ nombre: "", email: form.email, password: "", code: "", newPassword: "", confirmPassword: "" });
        setSuccess("");
      }, 2000);

      setLoading(false);
    } catch (err) {
      console.error("Error:", err);
      setError("Error al actualizar la contraseña");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-sm w-full rounded-2xl shadow-lg p-0 bg-white/90 backdrop-blur-sm border-none"
        showCloseButton={false}
      >
        {/* Botón Cerrar Personalizado */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange?.(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
        >
          <X className="w-5 h-5" />
        </Button>

        <Card className="border-none shadow-none bg-transparent">
          <CardHeader className="pt-8 pb-4 px-6">
            {/* Logo con animación */}
            <motion.div 
              className="flex justify-center mb-4"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#009688] to-[#00796b] flex items-center justify-center shadow-lg">
                <Image
                  src="/IG Foto de Perfil.png"
                  alt="Thiart 3D Logo"
                  width={70}
                  height={70}
                  className="object-contain rounded-full"
                  priority
                />
              </div>
            </motion.div>

            {/* Título */}
            <h2 className="text-2xl font-semibold text-center text-gray-800">
              {tab === "login" || tab === "register" ? "Bienvenido a Thiart 3D" : 
               tab === "reset" ? "Recuperar contraseña" :
               tab === "verify-code" ? "Verificar código" :
               "Nueva contraseña"}
            </h2>
          </CardHeader>

          <CardContent className="px-6 pb-6 pt-2">
            {/* Tabs para Login/Registro */}
            {tab !== "reset" && tab !== "verify-code" && tab !== "new-password" && (
              <Tabs 
                value={tab} 
                onValueChange={(value) => {
                  setTab(value as "login" | "register");
                  setError("");
                  setSuccess("");
                }}
                className="mb-6"
              >
                <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                  <TabsTrigger 
                    value="login"
                    className="data-[state=active]:bg-black data-[state=active]:text-white data-[state=inactive]:border data-[state=inactive]:border-[#009688] data-[state=inactive]:text-gray-700"
                  >
                    Iniciar sesión
                  </TabsTrigger>
                  <TabsTrigger 
                    value="register"
                    className="data-[state=active]:bg-black data-[state=active]:text-white data-[state=inactive]:border data-[state=inactive]:border-[#009688] data-[state=inactive]:text-gray-700"
                  >
                    Registrarse
                  </TabsTrigger>
                </TabsList>

                {/* Contenido Tab Login */}
                <TabsContent value="login" className="mt-6">
                  <form className="flex flex-col gap-4" onSubmit={handleLogin}>
                    <div className="space-y-2">
                      <label htmlFor="login-email" className="text-sm font-medium text-gray-700">
                        Correo electrónico
                      </label>
                      <Input 
                        id="login-email"
                        name="email" 
                        placeholder="tu@email.com" 
                        type="email" 
                        value={form.email} 
                        onChange={handleChange} 
                        required 
                        className="h-11 border-gray-300 focus:ring-[#009688] focus:border-[#009688]"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="login-password" className="text-sm font-medium text-gray-700">
                        Contraseña
                      </label>
                      <Input 
                        id="login-password"
                        name="password" 
                        placeholder="••••••••" 
                        type="password" 
                        value={form.password} 
                        onChange={handleChange} 
                        required 
                        className="h-11 border-gray-300 focus:ring-[#009688] focus:border-[#009688]"
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setTab("reset");
                          setError("");
                          setSuccess("");
                        }}
                        className="text-sm text-[#009688] hover:text-[#00796b] font-medium hover:underline transition-all"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-11 bg-black text-white hover:bg-[#00796b] transition-all mt-2" 
                      disabled={loading}
                    >
                      {loading ? "Ingresando..." : "Iniciar sesión"}
                    </Button>

                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
                      >
                        {error}
                      </motion.div>
                    )}
                  </form>
                </TabsContent>

                {/* Contenido Tab Registro */}
                <TabsContent value="register" className="mt-6">
                  <form className="flex flex-col gap-4" onSubmit={handleRegister}>
                    <div className="space-y-2">
                      <label htmlFor="register-nombre" className="text-sm font-medium text-gray-700">
                        Nombre completo
                      </label>
                      <Input 
                        id="register-nombre"
                        name="nombre" 
                        placeholder="Juan Pérez" 
                        value={form.nombre} 
                        onChange={handleChange} 
                        required 
                        className="h-11 border-gray-300 focus:ring-[#009688] focus:border-[#009688]"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="register-email" className="text-sm font-medium text-gray-700">
                        Correo electrónico
                      </label>
                      <Input 
                        id="register-email"
                        name="email" 
                        placeholder="tu@email.com" 
                        type="email" 
                        value={form.email} 
                        onChange={handleChange} 
                        required 
                        className="h-11 border-gray-300 focus:ring-[#009688] focus:border-[#009688]"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="register-password" className="text-sm font-medium text-gray-700">
                        Contraseña
                      </label>
                      <Input 
                        id="register-password"
                        name="password" 
                        placeholder="••••••••" 
                        type="password" 
                        value={form.password} 
                        onChange={handleChange} 
                        required 
                        minLength={6}
                        className="h-11 border-gray-300 focus:ring-[#009688] focus:border-[#009688]"
                      />
                      <p className="text-xs text-gray-500">Mínimo 6 caracteres</p>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="register-confirm-password" className="text-sm font-medium text-gray-700">
                        Confirmar contraseña
                      </label>
                      <Input 
                        id="register-confirm-password"
                        name="confirmPassword" 
                        placeholder="••••••••" 
                        type="password" 
                        value={form.confirmPassword} 
                        onChange={handleChange} 
                        required 
                        minLength={6}
                        className="h-11 border-gray-300 focus:ring-[#009688] focus:border-[#009688]"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-11 bg-black text-white hover:bg-[#00796b] transition-all mt-2" 
                      disabled={loading}
                    >
                      {loading ? "Registrando..." : "Registrarse"}
                    </Button>

                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
                      >
                        {error}
                      </motion.div>
                    )}
                  </form>
                </TabsContent>
              </Tabs>
            )}

            {/* Formulario de Recuperación de Contraseña */}
            {tab === "reset" && (
              <motion.form 
                className="flex flex-col gap-4 mt-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleResetPassword}
              >
                <p className="text-sm text-gray-600 mb-2">
                  Ingresa tu correo electrónico y te enviaremos un código de verificación.
                </p>
                <div className="space-y-2">
                  <label htmlFor="reset-email" className="text-sm font-medium text-gray-700">
                    Correo electrónico
                  </label>
                  <Input 
                    id="reset-email"
                    name="email" 
                    placeholder="tu@email.com" 
                    type="email" 
                    value={form.email} 
                    onChange={handleChange} 
                    required 
                    className="h-11 border-gray-300 focus:ring-[#009688] focus:border-[#009688]"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-11 bg-black text-white hover:bg-[#00796b] transition-all mt-2" 
                  disabled={loading}
                >
                  {loading ? "Enviando..." : "Enviar código"}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setTab("login");
                    setError("");
                    setSuccess("");
                  }}
                  className="w-full h-11 border-gray-300"
                >
                  Volver al inicio de sesión
                </Button>

                {success && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm"
                  >
                    {success}
                  </motion.div>
                )}
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
                  >
                    {error}
                  </motion.div>
                )}
              </motion.form>
            )}

            {/* Formulario de Verificación de Código */}
            {tab === "verify-code" && (
              <motion.form 
                className="flex flex-col gap-4 mt-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleVerifyCode}
              >
                <p className="text-sm text-gray-600 mb-2">
                  Ingresa el código de 6 dígitos que enviamos a <strong>{form.email}</strong>
                </p>
                <div className="space-y-2">
                  <label htmlFor="verify-code" className="text-sm font-medium text-gray-700">
                    Código de verificación
                  </label>
                  <Input 
                    id="verify-code"
                    name="code" 
                    placeholder="000000" 
                    type="text" 
                    value={form.code} 
                    onChange={handleChange} 
                    required 
                    maxLength={6}
                    pattern="[0-9]{6}"
                    className="h-11 text-center text-2xl tracking-widest font-bold border-gray-300 focus:ring-[#009688] focus:border-[#009688]"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-11 bg-black text-white hover:bg-[#00796b] transition-all mt-2" 
                  disabled={loading}
                >
                  {loading ? "Verificando..." : "Verificar código"}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setTab("reset");
                    setForm({ ...form, code: "" });
                    setError("");
                  }}
                  className="w-full h-11 border-gray-300"
                >
                  Reenviar código
                </Button>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
                  >
                    {error}
                  </motion.div>
                )}
              </motion.form>
            )}

            {/* Formulario de Nueva Contraseña */}
            {tab === "new-password" && (
              <motion.form 
                className="flex flex-col gap-4 mt-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleUpdatePassword}
              >
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-2">
                  ✓ Código verificado correctamente
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Ingresa tu nueva contraseña
                </p>
                
                <div className="space-y-2">
                  <label htmlFor="new-password" className="text-sm font-medium text-gray-700">
                    Nueva contraseña
                  </label>
                  <Input 
                    id="new-password"
                    name="newPassword" 
                    placeholder="••••••••" 
                    type="password" 
                    value={form.newPassword} 
                    onChange={handleChange} 
                    required 
                    minLength={6}
                    className="h-11 border-gray-300 focus:ring-[#009688] focus:border-[#009688]"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirm-new-password" className="text-sm font-medium text-gray-700">
                    Confirmar contraseña
                  </label>
                  <Input 
                    id="confirm-new-password"
                    name="confirmPassword" 
                    placeholder="••••••••" 
                    type="password" 
                    value={form.confirmPassword} 
                    onChange={handleChange} 
                    required 
                    minLength={6}
                    className="h-11 border-gray-300 focus:ring-[#009688] focus:border-[#009688]"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-11 bg-black text-white hover:bg-[#00796b] transition-all mt-2" 
                  disabled={loading}
                >
                  {loading ? "Actualizando..." : "Actualizar contraseña"}
                </Button>

                {success && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm"
                  >
                    {success}
                  </motion.div>
                )}
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
                  >
                    {error}
                  </motion.div>
                )}
              </motion.form>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
