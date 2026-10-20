"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "~/lib/supabaseClient";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card } from "~/components/ui/card";
import { useToast } from "~/components/ui/use-toast";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Package,
  ShoppingCart,
  Shield,
  Star,
  LogOut,
  Save,
  Loader2,
  Calendar,
  IdCard,
} from "lucide-react";
import Link from "next/link";
import SupabaseAuth from "~/components/SupabaseAuth";
import { DEPARTAMENTOS, MUNICIPIOS_POR_DEPARTAMENTO } from "~/constants/colombia-data";

interface UsuarioPerfil {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  cedula?: string;
  direccion?: string;
  ciudad?: string;
  departamento?: string;
  codigo_postal?: string;
  role?: string;
  creado_en?: string;
}

export default function MiPerfilPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [perfil, setPerfil] = useState<UsuarioPerfil | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Formulario de datos personales y de envío
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    cedula: "",
    direccion: "",
    departamento: "",
    ciudad: "",
    codigo_postal: "",
  });

  // Cambio de contraseña
  const [passwords, setPasswords] = useState({
    nueva: "",
    confirmar: "",
  });
  const [savingPass, setSavingPass] = useState(false);

  // Cargar usuario y datos de BD
  const cargarPerfil = useCallback(async () => {
    try {
      setLoading(true);
      const { data: authData } = await supabase.auth.getUser();

      if (!authData?.user) {
        setPerfil(null);
        return;
      }

      const authUser = authData.user;

      // Buscar en tabla 'usuarios'
      const { data: usuarioDb, error } = await supabase
        .from("usuarios")
        .select("*")
        .or(`id.eq.${authUser.id},email.eq.${authUser.email}`)
        .maybeSingle() as { data: UsuarioPerfil | null; error: { message: string } | null };

      if (error) {
        console.warn("Aviso al consultar usuario en BD:", error.message);
      }

      const perfilData: UsuarioPerfil = {
        id: authUser.id,
        nombre: usuarioDb?.nombre ?? (authUser.user_metadata?.nombre as string) ?? "Usuario",
        email: authUser.email ?? "",
        telefono: usuarioDb?.telefono ?? "",
        cedula: usuarioDb?.cedula ?? "",
        direccion: usuarioDb?.direccion ?? "",
        ciudad: usuarioDb?.ciudad ?? "",
        departamento: usuarioDb?.departamento ?? "",
        codigo_postal: usuarioDb?.codigo_postal ?? "",
        role: (usuarioDb?.role?.toLowerCase()) ?? "cliente",
        creado_en: usuarioDb?.creado_en ?? authUser.created_at,
      };

      setPerfil(perfilData);
      setForm({
        nombre: perfilData.nombre || "",
        telefono: perfilData.telefono || "",
        cedula: perfilData.cedula || "",
        direccion: perfilData.direccion || "",
        departamento: perfilData.departamento || "",
        ciudad: perfilData.ciudad || "",
        codigo_postal: perfilData.codigo_postal || "",
      });
    } catch (err) {
      console.error("Error cargando perfil:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargarPerfil();
  }, [cargarPerfil]);

  const handleChangeForm = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "departamento") {
        next.ciudad = ""; // reset ciudad si cambia departamento
      }
      return next;
    });
  };

  const handleGuardarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perfil?.id) return;

    try {
      setSaving(true);

      const updates = {
        id: perfil.id,
        auth_id: perfil.id,
        email: perfil.email,
        nombre: form.nombre.trim(),
        telefono: form.telefono.trim(),
        cedula: form.cedula.trim(),
        direccion: form.direccion.trim(),
        departamento: form.departamento,
        ciudad: form.ciudad,
        codigo_postal: form.codigo_postal.trim(),
      };

      const { error } = await supabase.from("usuarios").upsert(updates, { onConflict: "id" });

      if (error) {
        throw error;
      }

      toast({
        title: "¡Perfil actualizado!",
        description: "Tus datos personales y de envío fueron guardados con éxito.",
      });

      setPerfil((prev) => (prev ? { ...prev, ...updates } : null));
    } catch (err) {
      const error = err as { message?: string };
      console.error("Error guardando perfil:", err);
      toast({
        title: "Error al guardar",
        description: error.message ?? "No se pudieron guardar los cambios. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.nueva.length < 6) {
      toast({
        title: "Contraseña muy corta",
        description: "La contraseña debe tener al menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }
    if (passwords.nueva !== passwords.confirmar) {
      toast({
        title: "No coinciden",
        description: "Las contraseñas ingresadas no son iguales.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSavingPass(true);
      const { error } = await supabase.auth.updateUser({
        password: passwords.nueva,
      });

      if (error) throw error;

      toast({
        title: "Contraseña actualizada",
        description: "Tu clave ha sido cambiada correctamente.",
      });
      setPasswords({ nueva: "", confirmar: "" });
    } catch (err) {
      const error = err as { message?: string };
      toast({
        title: "Error al cambiar contraseña",
        description: error.message ?? "No se pudo actualizar la contraseña.",
        variant: "destructive",
      });
    } finally {
      setSavingPass(false);
    }
  };

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  // Si está cargando
  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 bg-slate-50">
        <Loader2 className="w-10 h-10 text-[#00a19a] animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Cargando tus datos...</p>
      </div>
    );
  }

  // Si no ha iniciado sesión
  if (!perfil) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 bg-slate-50">
        <Card className="max-w-md w-full p-8 text-center bg-white rounded-3xl shadow-xl border-slate-200">
          <div className="w-16 h-16 bg-teal-50 text-[#00a19a] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-2">Mi Perfil</h1>
          <p className="text-slate-500 text-sm mb-6">
            Inicia sesión o regístrate para gestionar tus pedidos, direcciones de entrega y datos de cuenta.
          </p>
          <Button
            onClick={() => setAuthModalOpen(true)}
            className="w-full bg-[#00a19a] hover:bg-[#008f89] text-white font-bold h-12 rounded-xl text-sm uppercase tracking-wider"
          >
            Iniciar Sesión / Registrarme
          </Button>
          <div className="mt-4">
            <Link href="/tienda/productos" className="text-xs text-slate-400 hover:text-[#00a19a] font-medium">
              Volver a la tienda
            </Link>
          </div>
        </Card>

        <SupabaseAuth
          open={authModalOpen}
          onOpenChange={(op) => {
            setAuthModalOpen(op);
            if (!op) void cargarPerfil();
          }}
          onAuth={() => void cargarPerfil()}
        />
      </div>
    );
  }

  const municipiosDisponibles = form.departamento
    ? MUNICIPIOS_POR_DEPARTAMENTO[form.departamento] ?? []
    : [];

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Encabezado Principal de Perfil */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00a19a] to-[#005f5b] text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-teal-500/20">
              {perfil.nombre?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h1 className="text-2xl font-black text-slate-900">{perfil.nombre}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-100 text-[#007973]">
                  {perfil.role === "admin" ? "Administrador" : perfil.role === "creador" ? "Creador 3D" : "Cliente"}
                </span>
              </div>
              <p className="text-slate-500 text-sm flex items-center justify-center sm:justify-start gap-2">
                <Mail className="w-4 h-4 text-slate-400" /> {perfil.email}
              </p>
              {perfil.creado_en && (
                <p className="text-slate-400 text-xs mt-1 flex items-center justify-center sm:justify-start gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Miembro desde {new Date(perfil.creado_en).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleCerrarSesion}
              className="rounded-xl border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 text-xs font-bold"
            >
              <LogOut className="w-4 h-4 mr-1.5" /> Cerrar Sesión
            </Button>
          </div>
        </div>

        {/* Accesos Rápidos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/envios">
            <Card className="p-5 bg-white rounded-2xl border-slate-200 hover:border-[#00a19a] hover:shadow-md transition cursor-pointer group h-full">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#00a19a] flex items-center justify-center mb-3 group-hover:scale-110 transition">
                <Package className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Mis Pedidos</h3>
              <p className="text-xs text-slate-500 mt-1">Revisa el estado y guía de envío de tus compras.</p>
            </Card>
          </Link>

          <Link href="/tienda/carrito">
            <Card className="p-5 bg-white rounded-2xl border-slate-200 hover:border-[#00a19a] hover:shadow-md transition cursor-pointer group h-full">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Mi Carrito</h3>
              <p className="text-xs text-slate-500 mt-1">Ver productos guardados pendientes de compra.</p>
            </Card>
          </Link>

          {perfil.role === "creador" ? (
            <Link href="/creador">
              <Card className="p-5 bg-white rounded-2xl border-teal-200 bg-teal-50/40 hover:shadow-md transition cursor-pointer group h-full">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition">
                  <Star className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Panel Creador</h3>
                <p className="text-xs text-slate-500 mt-1">Administra tus modelos 3D y ventas.</p>
              </Card>
            </Link>
          ) : perfil.role === "admin" ? (
            <Link href="/admin">
              <Card className="p-5 bg-white rounded-2xl border-purple-200 bg-purple-50/30 hover:shadow-md transition cursor-pointer group h-full">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Administración</h3>
                <p className="text-xs text-slate-500 mt-1">Gestionar métricas, catálogo y envíos.</p>
              </Card>
            </Link>
          ) : (
            <Link href="/tienda/personalizar">
              <Card className="p-5 bg-white rounded-2xl border-slate-200 hover:border-[#00a19a] hover:shadow-md transition cursor-pointer group h-full">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                  <Star className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Personalizar 3D</h3>
                <p className="text-xs text-slate-500 mt-1">Cotiza o encarga tus figuras o piezas a medida.</p>
              </Card>
            </Link>
          )}

          <Link href="/tienda/productos">
            <Card className="p-5 bg-white rounded-2xl border-slate-200 hover:border-[#00a19a] hover:shadow-md transition cursor-pointer group h-full">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                <Package className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Catálogo Thiart</h3>
              <p className="text-xs text-slate-500 mt-1">Explora nuestras esculturas y piezas sostenibles.</p>
            </Card>
          </Link>
        </div>

        {/* Sección de Edición de Datos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario de Información y Envíos (2 columnas) */}
          <div className="lg:col-span-2">
            <Card className="p-6 sm:p-8 bg-white rounded-3xl shadow-sm border-slate-200">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="p-2.5 rounded-xl bg-teal-50 text-[#00a19a]">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Datos Personales y de Envío</h2>
                  <p className="text-xs text-slate-500">
                    Esta información se usará por defecto para agilizar tus compras en el checkout.
                  </p>
                </div>
              </div>

              <form onSubmit={handleGuardarPerfil} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo *</label>
                    <div className="relative">
                      <Input
                        name="nombre"
                        value={form.nombre}
                        onChange={handleChangeForm}
                        required
                        placeholder="Ej. Juan Pérez"
                        className="rounded-xl h-11 border-slate-200 focus:border-[#00a19a]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico</label>
                    <Input
                      value={perfil.email}
                      disabled
                      className="rounded-xl h-11 bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono / WhatsApp</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                      <Input
                        name="telefono"
                        value={form.telefono}
                        onChange={handleChangeForm}
                        placeholder="Ej. 310 123 4567"
                        className="pl-9 rounded-xl h-11 border-slate-200 focus:border-[#00a19a]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Cédula / Documento</label>
                    <div className="relative">
                      <IdCard className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                      <Input
                        name="cedula"
                        value={form.cedula}
                        onChange={handleChangeForm}
                        placeholder="Requerido para envíos"
                        className="pl-9 rounded-xl h-11 border-slate-200 focus:border-[#00a19a]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dirección de Entrega</label>
                  <Input
                    name="direccion"
                    value={form.direccion}
                    onChange={handleChangeForm}
                    placeholder="Calle, Carrera, Edificio, Apto..."
                    className="rounded-xl h-11 border-slate-200 focus:border-[#00a19a]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Departamento</label>
                    <select
                      name="departamento"
                      value={form.departamento}
                      onChange={handleChangeForm}
                      className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:border-[#00a19a]"
                    >
                      <option value="">Seleccionar...</option>
                      {DEPARTAMENTOS.map((dep) => (
                        <option key={dep.codigo} value={dep.nombre}>
                          {dep.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Ciudad / Municipio</label>
                    {municipiosDisponibles.length > 0 ? (
                      <select
                        name="ciudad"
                        value={form.ciudad}
                        onChange={handleChangeForm}
                        className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:border-[#00a19a]"
                      >
                        <option value="">Seleccionar ciudad...</option>
                        {municipiosDisponibles.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        name="ciudad"
                        value={form.ciudad}
                        onChange={handleChangeForm}
                        placeholder="Ciudad"
                        className="rounded-xl h-11 border-slate-200 focus:border-[#00a19a]"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Código Postal</label>
                    <Input
                      name="codigo_postal"
                      value={form.codigo_postal}
                      onChange={handleChangeForm}
                      placeholder="Opcional"
                      className="rounded-xl h-11 border-slate-200 focus:border-[#00a19a]"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-[#00a19a] hover:bg-[#008f89] text-white font-bold px-6 h-11 rounded-xl shadow-md text-xs uppercase tracking-wider"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" /> Guardar Información
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Cambio de Contraseña (1 columna) */}
          <div className="space-y-6">
            <Card className="p-6 bg-white rounded-3xl shadow-sm border-slate-200">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
                <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">Seguridad</h2>
                  <p className="text-xs text-slate-500">Actualiza tu contraseña</p>
                </div>
              </div>

              <form onSubmit={handleCambiarPassword} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nueva Contraseña</label>
                  <Input
                    type="password"
                    value={passwords.nueva}
                    onChange={(e) => setPasswords({ ...passwords, nueva: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    className="rounded-xl h-10 border-slate-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Confirmar Contraseña</label>
                  <Input
                    type="password"
                    value={passwords.confirmar}
                    onChange={(e) => setPasswords({ ...passwords, confirmar: e.target.value })}
                    placeholder="Repite la contraseña"
                    className="rounded-xl h-10 border-slate-200 text-sm"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={savingPass || !passwords.nueva}
                  variant="outline"
                  className="w-full rounded-xl h-10 font-bold text-xs uppercase tracking-wider border-slate-200 hover:bg-slate-50 text-slate-700 mt-2"
                >
                  {savingPass ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Actualizar Contraseña"
                  )}
                </Button>
              </form>
            </Card>

            {/* Tarjeta Informativa de Envíos */}
            <div className="p-5 bg-gradient-to-br from-teal-50 to-slate-50 rounded-2xl border border-teal-100">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#007973] mb-1">
                ¿Compras recurrentes?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Al mantener actualizada tu dirección y departamento, tu proceso de compra en un clic calculará el envío exacto con Envía de forma automática.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
