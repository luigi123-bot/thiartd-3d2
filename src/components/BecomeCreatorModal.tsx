"use client";
import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Star, Send, User, Mail, Globe, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function BecomeCreatorModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    portfolio: "",
    mensaje: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Aquí puedes integrar el envío a una tabla de "solicitudes_creador" o enviar por email
    // Por ahora simularemos el éxito
    try {
      // Simulación de delay
      await new Promise(r => setTimeout(r, 1500));
      
      // Enviar a API (opcional por ahora, asumiendo que el admin revisará logs o correos)
      console.log("Solicitud de Creador:", form);
      
      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
        setForm({ nombre: "", email: "", portfolio: "", mensaje: "" });
      }, 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
        <div className="relative">
          {/* Header con estilo premium */}
          <div className="bg-gradient-to-br from-[#00a19a] to-[#007973] p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                  <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
                </div>
                <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Únete al Equipo</DialogTitle>
              </div>
              <DialogDescription className="text-teal-50/80 font-medium leading-tight">
                Convierte tu arte en piezas 3D reales. Cuéntanos sobre ti y tu portafolio para empezar.
              </DialogDescription>
            </div>
            {/* Elementos decorativos abstractos */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-48 h-48 bg-teal-400/20 rounded-full blur-3xl" />
          </div>

          <div className="p-8 bg-white">
            <AnimatePresence mode="wait">
              {!success ? (
                <motion.form 
                  key="form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onSubmit={handleSubmit} 
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nombre Completo</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <Input 
                        name="nombre" 
                        required 
                        placeholder="Tu nombre artístico o real" 
                        value={form.nombre} 
                        onChange={handleChange}
                        className="pl-12 h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-[#00a19a] transition-all font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Correo de Contacto</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <Input 
                        name="email" 
                        type="email" 
                        required 
                        placeholder="tu@email.com" 
                        value={form.email} 
                        onChange={handleChange}
                        className="pl-12 h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-[#00a19a] transition-all font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Portafolio / Web / Redes</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <Input 
                        name="portfolio" 
                        required 
                        placeholder="Enlace a tus trabajos actuales" 
                        value={form.portfolio} 
                        onChange={handleChange}
                        className="pl-12 h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-[#00a19a] transition-all font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">¿Por qué quieres ser parte de Thiart?</label>
                    <Textarea 
                      name="mensaje" 
                      placeholder="Cuéntanos un poco sobre tu estilo y experiencia..." 
                      value={form.mensaje} 
                      onChange={handleChange}
                      className="min-h-[100px] rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-[#00a19a] transition-all resize-none p-4 font-medium"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-14 bg-black hover:bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-black/10 flex items-center justify-center gap-3 group transition-all"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Enviar Solicitud
                        <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </motion.form>
              ) : (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-10 text-center space-y-4"
                >
                  <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">¡Recibido con éxito!</h3>
                  <p className="text-slate-500 font-medium px-4">
                    Nuestro equipo revisará tu portafolio pronto. Te contactaremos vía email cuando tu perfil sea aprobado.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
