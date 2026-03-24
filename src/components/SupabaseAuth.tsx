'use client';

import { useEffect, useState, useRef } from "react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import Image from "next/image";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";

type UsuarioDB = {
  id: string;
  nombre: string;
  email: string;
  creado_en: string;
  role: string;
};

export default function SupabaseAuth({ onAuth, open = false, onOpenChange, defaultTab = "login" }: { 
  onAuth?: (user: UsuarioDB) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultTab?: "login" | "register" | "creador";
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register" | "reset" | "verify-code" | "new-password">(defaultTab === "creador" ? "login" : defaultTab);
  const [, setAuthUser] = useState<UsuarioDB | null>(null);
  const [form, setForm] = useState({ 
    nombre: "", 
    email: "", 
    password: "", 
    confirmPassword: "", 
    code: "", 
    newPassword: "",
    telefono: "",
    direccion: "",
    ciudad: "",
    departamento: "",
    codigo_postal: ""
  });
  const [registerStep, setRegisterStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [resetToken, setResetToken] = useState<string>("");
  const [showPasswords, setShowPasswords] = useState({ password: false, confirmPassword: false, newPassword: false });
  const isFirstLoad = useRef(true);

  const togglePass = (field: keyof typeof showPasswords) =>
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));

  useEffect(() => {
    // Solo ejecutar si el modal está abierto
    if (!open) return;

    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const { user: authUser } = data.session;
        const { data: usuarioData } = await supabase
          .from("usuarios")
          .select("*")
          .eq("id", authUser.id)
          .single<UsuarioDB>();
        
        if (usuarioData) {
          setAuthUser(usuarioData);
          // NO llamamos a onAuth aquí porque es una sincronización pasiva al montar
        }
      } else {
        setAuthUser(null);
      }
    };

    void getSession();

    // Escucha cambios en el estado de sesión
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: usuarioData } = await supabase
          .from("usuarios")
          .select("*")
          .eq("id", session.user.id)
          .single<UsuarioDB>();
        
        if (usuarioData) {
          setAuthUser(usuarioData);
          
          // Solo cerramos el modal y notificamos si es un inicio de sesión REAL (no al montar)
          // Ignoramos el primer trigger si ya hay sesión
          if (event === "SIGNED_IN" && !isFirstLoad.current) {
             if (onAuth) onAuth(usuarioData);
             if (onOpenChange) onOpenChange(false);
             
             // Redirección por rol
             if (usuarioData.role === "admin") {
               router.push("/admin");
             } else if (usuarioData.role === "creador") {
               router.push("/creador");
             }
          }
        }
      } else {
        setAuthUser(null);
      }
      isFirstLoad.current = false;
    });

    return () => {
      listener.subscription.unsubscribe();
      isFirstLoad.current = true;
    };
  }, [open, onAuth, onOpenChange, router]);

  useEffect(() => {
     if (open && defaultTab && defaultTab !== "creador") {
        setTab(defaultTab);
     }
  }, [open, defaultTab]);
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
      auth_id: userId,
      nombre: form.nombre,
      email: form.email,
      telefono: form.telefono,
      direccion: form.direccion,
      ciudad: form.ciudad,
      departamento: form.departamento,
      codigo_postal: form.codigo_postal,
      creado_en: new Date().toISOString(),
      role: "cliente"
    });

    // Enviar correo de bienvenida personalizado
    try {
      await fetch("/api/auth/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, nombre: form.nombre })
      });
    } catch (err) {
      console.warn("No se pudo enviar el correo de bienvenida:", err);
    }

    setLoading(false);
    setRegisterStep(1); 
    
    if (onAuth) onAuth({
      id: userId,
      nombre: form.nombre,
      email: form.email,
      creado_en: new Date().toISOString(),
      role: "cliente"
    });
    if (onOpenChange) onOpenChange(false);
  };

  const nextRegisterStep = () => {
    if (form.nombre && form.email && form.password && form.confirmPassword) {
      if (form.password !== form.confirmPassword) {
        setError("Las contraseñas no coinciden");
        return;
      }
      if (form.password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres");
        return;
      }
      setError("");
      setRegisterStep(2);
    } else {
      setError("Por favor completa todos los campos de cuenta");
    }
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
    
    // Cerramos el modal inmediatamente tras éxito
    if (onAuth) onAuth(usuarioData);
    if (onOpenChange) onOpenChange(false);

    // Redirección si es admin o creador a sus respectivos paneles si no están allí
    if (usuarioData.role === "admin") {
       router.push("/admin");
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al iniciar sesión con Google";
      setError(message);
      setLoading(false);
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
        setForm({ 
          nombre: "", 
          email: form.email, 
          password: "", 
          code: "", 
          newPassword: "", 
          confirmPassword: "",
          telefono: "",
          direccion: "",
          ciudad: "",
          departamento: "",
          codigo_postal: ""
        });
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
        className="max-w-[420px] w-full rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-0 bg-white border-0"
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
          <CardHeader className="pt-10 pb-2 px-8">
            {/* Logo con animación */}
            <motion.div 
              className="flex justify-center mb-4"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-[#eff7f6] flex items-center justify-center p-2 shadow-sm border border-teal-100/50">
                <Image
                  src="/IG Foto de Perfil.png"
                  alt="Thiart 3D Logo"
                  width={46}
                  height={46}
                  className="object-contain rounded-xl"
                  priority
                />
              </div>
            </motion.div>

            {/* Título */}
            <DialogTitle className="text-xl font-bold text-center text-gray-900 mt-1">
              {tab === "login" ? "Thiart 3D" : 
               tab === "register" ? "Thiart 3D" : 
               tab === "reset" ? "Recuperar contraseña" :
               tab === "verify-code" ? "Verificar código" :
               "Nueva contraseña"}
            </DialogTitle>
            {(tab === "login" || tab === "register") && (
                <p className="text-center text-xs text-gray-500 font-medium mt-1">
                  {tab === "login" ? "Bienvenido a Thiart 3D" : "Crea tu cuenta gratis"}
                </p>
            )}
          </CardHeader>

          <CardContent className="px-8 pb-8 pt-2">
            {/* Tabs para Login/Registro */}
            {tab !== "reset" && tab !== "verify-code" && tab !== "new-password" && (
              <Tabs 
                value={tab} 
                onValueChange={(value) => {
                  setTab(value as "login" | "register");
                  setError("");
                  setSuccess("");
                  setRegisterStep(1);
                }}
                className="mb-2"
              >
                <TabsList className="flex w-full border-b border-gray-100 bg-transparent rounded-none p-0 relative z-10 h-10 mb-0">
                  <TabsTrigger 
                    value="login"
                    className="flex-1 rounded-none border-b-[3px] border-transparent data-[state=active]:border-[#00a19a] py-3 text-xs font-bold data-[state=active]:bg-transparent data-[state=active]:text-[#00a19a] data-[state=active]:shadow-none data-[state=inactive]:text-gray-400 transition-all focus:ring-0 outline-none"
                  >
                    Entrar
                  </TabsTrigger>
                  <TabsTrigger 
                    value="register"
                    className="flex-1 rounded-none border-b-[3px] border-transparent data-[state=active]:border-[#00a19a] py-3 text-xs font-bold data-[state=active]:bg-transparent data-[state=active]:text-[#00a19a] data-[state=active]:shadow-none data-[state=inactive]:text-gray-400 transition-all focus:ring-0 outline-none"
                  >
                    Registro
                  </TabsTrigger>
                </TabsList>

                {/* Contenido Tab Login */}
                <TabsContent value="login" className="mt-8">
                  <form className="flex flex-col gap-5" onSubmit={handleLogin}>
                    <div className="space-y-1 relative">
                       <label htmlFor="login-email" className="text-[10px] sm:text-[10px] font-black tracking-widest text-[#7D8886] uppercase block mb-1">
                          Correo electrónico
                       </label>
                       <div className="relative">
                         <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-500" />
                         <Input 
                            id="login-email"
                            name="email" 
                            placeholder="nombre@ejemplo.com" 
                            type="email" 
                            value={form.email} 
                            onChange={handleChange} 
                            required 
                            className="h-[46px] w-full pl-10 border-none bg-gray-100/90 rounded-xl focus:bg-white focus:ring-1 focus:ring-[#00a19a] transition-all font-medium text-gray-800 placeholder:text-gray-400"
                         />
                       </div>
                    </div>

                    <div className="space-y-1 relative">
                       <div className="flex justify-between items-center mb-1">
                         <label htmlFor="login-password" className="text-[10px] sm:text-[10px] font-black tracking-widest text-[#7D8886] uppercase block">
                            Contraseña
                         </label>
                         <button
                           type="button"
                           onClick={() => {
                             setTab("reset");
                             setError("");
                             setSuccess("");
                           }}
                           className="text-[10px] text-[#00a19a] font-bold hover:underline transition-all"
                         >
                           ¿Olvidaste tu contraseña?
                         </button>
                       </div>
                       <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-500" />
                          <Input 
                            id="login-password"
                            name="password" 
                            placeholder="••••••••" 
                            type={showPasswords.password ? "text" : "password"} 
                            value={form.password} 
                            onChange={handleChange} 
                            required 
                            className="h-[46px] w-full pl-10 pr-10 border-none bg-gray-100/90 rounded-xl focus:bg-white focus:ring-1 focus:ring-[#00a19a] transition-all font-medium text-gray-800 placeholder:text-gray-400"
                          />
                          <button
                            type="button"
                            onClick={() => togglePass("password")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                          >
                            {showPasswords.password ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                       </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-gradient-to-r from-[#00c69d] to-[#007464] text-white hover:opacity-90 rounded-[10px] mt-1 font-bold uppercase tracking-widest text-xs shadow-md shadow-[#007464]/20 transition-all active:scale-[0.98]" 
                      disabled={loading}
                    >
                      {loading ? "Ingresando..." : "Acceder a mi cuenta"}
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

                    <div className="relative mt-2 mb-2">
                       <div className="absolute inset-0 flex items-center">
                         <span className="w-full border-t border-gray-100"></span>
                       </div>
                       <div className="relative flex justify-center text-[10px] uppercase">
                         <span className="bg-white px-3 text-[#7D8886] font-extrabold tracking-widest text-[9px]">O continuar con</span>
                       </div>
                     </div>

                     <Button 
                       type="button" 
                       onClick={handleGoogleLogin} 
                       variant="ghost"
                       className="w-full h-[46px] bg-gray-100/80 hover:bg-gray-200 border-none rounded-[10px] font-bold text-gray-800 text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                       disabled={loading}
                     >
                       <FaGoogle className="w-[18px] h-[18px] text-gray-600" />
                       Google
                     </Button>

                     <div className="w-full flex justify-center mt-3">
                         <span className="text-[11px] text-[#7D8886] font-bold">
                           ¿No tienes una cuenta?{" "}
                           <button type="button" onClick={() => {setTab("register"); setRegisterStep(1);}} className="text-[#00a19a] hover:underline cursor-pointer font-bold">
                              Crea una ahora
                           </button>
                         </span>
                     </div>
                  </form>
                </TabsContent>

                {/* Contenido Tab Registro con Multi-paso */}
                <TabsContent value="register" className="mt-6">
                  <form className="flex flex-col gap-4" onSubmit={handleRegister}>
                    {/* Indicador de pasos */}
                    <div className="flex items-center justify-between mb-4 px-2">
                       <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${registerStep === 1 ? 'bg-black text-white shadow-md' : 'bg-[#00a19a] text-white shadow-md'}`}>1</div>
                          <span className="text-xs font-bold text-gray-500">Cuenta</span>
                       </div>
                       <div className="flex-1 h-[2px] bg-gray-100 mx-4">
                          <motion.div 
                            className="h-full bg-[#00a19a]" 
                            initial={{ width: "0%" }}
                            animate={{ width: registerStep === 2 ? "100%" : "0%" }}
                          />
                       </div>
                       <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${registerStep === 2 ? 'bg-black text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>2</div>
                          <span className="text-xs font-bold text-gray-500">Envío</span>
                       </div>
                    </div>

                    <div className="relative overflow-hidden min-h-[320px]">
                      <AnimatePresence mode="wait">
                        {registerStep === 1 ? (
                          <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                          >
                            <div className="space-y-2">
                              <label htmlFor="register-nombre" className="text-sm font-semibold text-gray-700">Nombre completo</label>
                              <Input id="register-nombre" name="nombre" placeholder="Tu Nombre Completo" value={form.nombre} onChange={handleChange} required className="h-14 border-slate-200 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200/50 focus:bg-white focus:ring-2 focus:ring-[#00a19a] focus:border-transparent transition-all font-semibold text-slate-800" />
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="register-email" className="text-sm font-semibold text-gray-700">Correo electrónico</label>
                              <Input id="register-email" name="email" placeholder="tu@email.com" type="email" value={form.email} onChange={handleChange} required className="h-14 border-slate-200 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200/50 focus:bg-white focus:ring-2 focus:ring-[#00a19a] focus:border-transparent transition-all font-semibold text-slate-800" />
                            </div>
                             <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Contraseña</label>
                                <div className="relative">
                                  <Input name="password" type={showPasswords.password ? "text" : "password"} value={form.password} onChange={handleChange} required minLength={6} className="h-14 pr-10 border-slate-200 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200/50 focus:bg-white focus:ring-2 focus:ring-[#00a19a] focus:border-transparent transition-all font-semibold text-slate-800" />
                                  <button type="button" onClick={() => togglePass("password")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><Eye className="w-4 h-4" /></button>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Confirmar</label>
                                <div className="relative">
                                  <Input name="confirmPassword" type={showPasswords.confirmPassword ? "text" : "password"} value={form.confirmPassword} onChange={handleChange} required minLength={6} className="h-14 pr-10 border-slate-200 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200/50 focus:bg-white focus:ring-2 focus:ring-[#00a19a] focus:border-transparent transition-all font-semibold text-slate-800" />
                                  <button type="button" onClick={() => togglePass("confirmPassword")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><Eye className="w-4 h-4" /></button>
                                </div>
                              </div>
                            </div>
                            <Button type="button" onClick={nextRegisterStep} className="w-full h-14 bg-black hover:bg-slate-800 text-white rounded-2xl font-black mt-4 shadow-xl shadow-black/10">Continuar →</Button>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-4"
                          >
                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-gray-700">Teléfono (WhatsApp)</label>
                              <Input name="telefono" placeholder="300 123 4567" value={form.telefono} onChange={handleChange} className="h-14 border-slate-200 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200/50 focus:bg-white focus:ring-2 focus:ring-[#00a19a] focus:border-transparent transition-all font-semibold text-slate-800" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-gray-700">Dirección Residencial</label>
                              <Input name="direccion" placeholder="Calle 123 #45-67" value={form.direccion} onChange={handleChange} className="h-14 border-slate-200 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200/50 focus:bg-white focus:ring-2 focus:ring-[#00a19a] focus:border-transparent transition-all font-semibold text-slate-800" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Ciudad</label>
                                <Input name="ciudad" placeholder="Medellín" value={form.ciudad} onChange={handleChange} className="h-14 border-slate-200 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200/50 focus:bg-white focus:ring-2 focus:ring-[#00a19a] focus:border-transparent transition-all font-semibold text-slate-800" />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Departamento</label>
                                <Input name="departamento" placeholder="Antioquia" value={form.departamento} onChange={handleChange} className="h-14 border-slate-200 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200/50 focus:bg-white focus:ring-2 focus:ring-[#00a19a] focus:border-transparent transition-all font-semibold text-slate-800" />
                              </div>
                            </div>
                            <div className="flex gap-3 mt-4">
                              <Button type="button" variant="outline" onClick={() => setRegisterStep(1)} className="flex-1 h-14 border border-slate-200 bg-white hover:bg-slate-50 rounded-2xl font-bold">← Atrás</Button>
                              <Button type="submit" className="flex-[2] h-14 bg-[#00a19a] hover:bg-[#008f89] text-white rounded-2xl font-black shadow-xl shadow-[#00a19a]/20" disabled={loading}>
                                {loading ? "Procesando..." : "Completar Registro 🎉"}
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold mt-4"
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
                    className="h-14 border-slate-200 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200/50 focus:bg-white focus:ring-2 focus:ring-[#00a19a] focus:border-transparent transition-all font-semibold text-slate-800"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-14 bg-[#00a19a] text-white hover:bg-[#008f89] rounded-2xl uppercase tracking-wider text-sm font-black mt-4 shadow-xl shadow-[#00a19a]/20 transition-all active:scale-[0.98]" 
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
                  className="w-full h-14 border border-slate-200 bg-white hover:bg-slate-50 rounded-2xl font-bold text-slate-600 transition-all"
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
                    className="h-16 text-center text-3xl tracking-widest font-black border-slate-200 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200/50 focus:bg-white focus:ring-2 focus:ring-[#00a19a] focus:border-transparent transition-all"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-14 bg-[#00a19a] text-white hover:bg-[#008f89] rounded-2xl uppercase tracking-wider text-sm font-black mt-4 shadow-xl shadow-[#00a19a]/20 transition-all active:scale-[0.98]" 
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
                  className="w-full h-14 border border-slate-200 bg-white hover:bg-slate-50 rounded-2xl font-bold text-slate-600 transition-all"
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
                  <div className="relative">
                    <Input 
                      id="new-password"
                      name="newPassword" 
                      placeholder="••••••••" 
                      type={showPasswords.newPassword ? "text" : "password"} 
                      value={form.newPassword} 
                      onChange={handleChange} 
                      required 
                      minLength={6}
                      className="h-14 pr-10 border-slate-200 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200/50 focus:bg-white focus:ring-2 focus:ring-[#00a19a] focus:border-transparent transition-all font-semibold text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => togglePass("newPassword")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={showPasswords.newPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPasswords.newPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirm-new-password" className="text-sm font-medium text-gray-700">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <Input 
                      id="confirm-new-password"
                      name="confirmPassword" 
                      placeholder="••••••••" 
                      type={showPasswords.confirmPassword ? "text" : "password"} 
                      value={form.confirmPassword} 
                      onChange={handleChange} 
                      required 
                      minLength={6}
                      className="h-14 pr-10 border-slate-200 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200/50 focus:bg-white focus:ring-2 focus:ring-[#00a19a] focus:border-transparent transition-all font-semibold text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => togglePass("confirmPassword")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={showPasswords.confirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPasswords.confirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-14 bg-[#00a19a] text-white hover:bg-[#008f89] rounded-2xl uppercase tracking-wider text-sm font-black mt-4 shadow-xl shadow-[#00a19a]/20 transition-all active:scale-[0.98]" 
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
