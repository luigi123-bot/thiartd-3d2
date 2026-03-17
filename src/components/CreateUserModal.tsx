"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { useToast } from "~/components/ui/use-toast";
import { User, Mail, Key, Shield, RefreshCw, Send, Loader2 } from "lucide-react";

interface CreateUserModalProps {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  onUserCreated?: () => void;
}

export function CreateUserModal({ open, onOpenChangeAction, onUserCreated }: CreateUserModalProps) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
  });
  const [role, setRole] = useState<string>("cliente");
  const [rolesOptions, setRolesOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ nombre?: string; email?: string; password?: string }>({});

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm(prev => ({ ...prev, password: pass }));
    setErrors(prev => ({ ...prev, password: undefined }));
  };

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!form.nombre.trim()) newErrors.nombre = "El nombre es obligatorio.";
    if (!form.email.trim()) newErrors.email = "El correo es obligatorio.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Correo inválido.";
    if (!form.password) newErrors.password = "La contraseña es obligatoria.";
    else if (form.password.length < 6) newErrors.password = "Mínimo 6 caracteres.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const getLabelForValue = (val: string) => {
        const found = rolesOptions.find((rv) => rv.split("|")[1] === val);
        if (!found) return val;
        return found.split("|")[0];
      };
      const payload = { ...form, role, role_label: getLabelForValue(role) };
      
      const res = await fetch("/api/crear-usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data: { error?: string } = {};
      try {
        data = (await res.json()) as { error?: string };
      } catch {
        data = {};
      }

      setLoading(false);
      if (res.ok) {
        toast({ 
          title: "✅ Usuario creado", 
          description: `Se ha enviado un correo de bienvenida a ${form.email}` 
        });
        setForm({ nombre: "", email: "", password: "" });
        setRole("cliente");
        setErrors({});
        onOpenChangeAction(false);
        onUserCreated?.();
      } else {
        toast({
          title: "❌ Error",
          description: data.error ?? "No se pudo crear el usuario.",
          variant: "destructive",
        });
      }
    } catch {
      setLoading(false);
      toast({ title: "❌ Error", description: "Error de red o inesperado.", variant: "destructive" });
    }
  };

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const res = await fetch('/api/admin/roles');
        if (!res.ok) return setRolesOptions(['cliente','creador','admin']);
        const json = await res.json() as unknown;
        type RoleRow = {
          id?: string;
          key?: string;
          role?: string;
          name?: string;
          label?: string;
        };
        const maybe = (json as { roles?: RoleRow[] }).roles;
        if (Array.isArray(maybe)) {
          const parsed = maybe.map(r => `${r.label ?? r.name ?? r.role ?? 'Rol'}|${r.id ?? r.key ?? r.role ?? ''}`);
          setRolesOptions(parsed);
          if (role === 'cliente' && parsed[0]) setRole(parsed[0].split('|')[1] ?? 'cliente');
        } else {
          setRolesOptions(['Cliente|cliente','Creador|creador','Admin|admin']);
        }
      } catch {
        setRolesOptions(['Cliente|cliente','Creador|creador','Admin|admin']);
      }
    };
    if (open) void loadRoles();
  }, [open, role]);

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl rounded-[32px]">
        <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-10">
            <Shield className="w-32 h-32" />
          </div>
          <DialogHeader className="relative z-10">
            <DialogTitle className="text-3xl font-black tracking-tighter uppercase mb-2">Nuevo Usuario</DialogTitle>
            <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">Registrar acceso al sistema</p>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-8 bg-white space-y-6">
          <div className="space-y-4">
            {/* Nombre */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Nombre Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  name="nombre"
                  placeholder="Ej: Juan Pérez"
                  value={form.nombre}
                  onChange={handleChange}
                  className="pl-12 h-14 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#00a19a] font-bold text-slate-900"
                  required
                />
              </div>
              {errors.nombre && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.nombre}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  name="email"
                  type="email"
                  placeholder="name@company.com"
                  value={form.email}
                  onChange={handleChange}
                  className="pl-12 h-14 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#00a19a] font-bold text-slate-900"
                  required
                />
              </div>
              {errors.email && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Contraseña Temporal</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    name="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    className="pl-12 h-14 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#00a19a] font-bold text-slate-900"
                    required
                  />
                </div>
                <Button 
                  type="button" 
                  onClick={generatePassword}
                  variant="outline"
                  className="h-14 w-14 rounded-2xl border-2 border-slate-50 hover:bg-slate-50 transition-all flex items-center justify-center p-0"
                >
                  <RefreshCw className="w-5 h-5 text-[#00a19a]" />
                </Button>
              </div>
              {errors.password && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.password}</p>}
            </div>

            {/* Rol */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Rol de Usuario</label>
              <div className="relative">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#00a19a] outline-none font-bold text-slate-900 appearance-none cursor-pointer"
                >
                  {rolesOptions.map((rv) => {
                    const [label, value] = rv.split("|");
                    return <option key={value} value={value}>{label}</option>;
                  })}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  ▼
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button 
              type="submit" 
              className="w-full h-14 bg-[#00a19a] hover:bg-[#008f89] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-[#00a19a]/20 transition-all flex items-center justify-center gap-3" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Crear y Enviar Accesos
                </>
              )}
            </Button>
            <p className="text-center text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-widest">
              El usuario recibirá sus credenciales por email
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}