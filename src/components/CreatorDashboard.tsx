"use client";

import { useEffect, useState } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { motion } from "framer-motion";
import { 
  Package, MessageSquare, Plus, DollarSign, ShoppingBag, ArrowRight
} from "lucide-react";
import CreateProductModal from "~/components/CreateProductModal";
import CreatorChat from "./CreatorChat";
import { supabase } from "~/lib/supabaseClient";

interface CreatorDashboardProps {
  user: {
    id: string;
    nombre: string;
    email: string;
    role: string;
  };
  externalView?: "stats" | "chat";
  onViewChange?: (view: "stats" | "chat") => void;
  forceOpenModal?: boolean;
  onModalHandled?: () => void;
}

interface Stats {
  totalVentas: number;
  totalPedidos: number;
  totalProductos: number;
}

export default function CreatorDashboard({ 
  user, 
  externalView, 
  onViewChange, 
  forceOpenModal, 
  onModalHandled 
}: CreatorDashboardProps) {
  const [stats, setStats] = useState<Stats>({
    totalVentas: 0,
    totalPedidos: 0,
    totalProductos: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [view, setView] = useState<"stats" | "chat">("stats");

  // Sincronizar vista interna con externa
  useEffect(() => {
    if (externalView) setView(externalView);
  }, [externalView]);

  // Sincronizar apertura de modal externa
  useEffect(() => {
    if (forceOpenModal) {
      setShowAddProduct(true);
      onModalHandled?.();
    }
  }, [forceOpenModal, onModalHandled]);

  useEffect(() => {
    async function fetchCreatorStats() {
      setLoading(true);
      try {
        const { data: rawProducts, error: prodError } = await supabase
          .from("productos")
          .select("id")
          .eq("user_id", user.id);
        
        if (prodError) throw prodError;
        const products = rawProducts as { id: string }[] | null;
        
        const productIds = (products ?? []).map((p: { id: string }) => p.id);
        const totalProductos = productIds.length;

        const { data: pedidos, error: pedError } = await supabase
          .from("pedidos")
          .select("productos, total, estado")
          .eq("estado", "pagado");

        if (pedError) throw pedError;

        let totalVentas = 0;
        const totalPedidosSet = new Set<number>();

        interface PedidoRaw { productos: string | unknown[] }
        interface ItemRaw { producto_id?: string; id?: string; id_producto?: string; precio_unitario?: number; precio?: number; cantidad?: number; }

        (pedidos ?? []).forEach((pedido: PedidoRaw, index: number) => {
          try {
            const items = typeof pedido.productos === "string" 
              ? (JSON.parse(pedido.productos) as unknown[]) 
              : (pedido.productos);
            
            if (Array.isArray(items)) {
              let pedidoHasCreatorProduct = false;
              (items as ItemRaw[]).forEach((item: ItemRaw) => {
                const pid = item.producto_id ?? item.id ?? item.id_producto;
                if (productIds.includes(pid ?? "")) {
                  totalVentas += (Number(item.precio_unitario ?? item.precio ?? 0) * (item.cantidad ?? 1));
                  pedidoHasCreatorProduct = true;
                }
              });
              if (pedidoHasCreatorProduct) {
                totalPedidosSet.add(index);
              }
            }
          } catch {
            // silently ignore parse errors
          }
        });

        setStats({
          totalVentas,
          totalPedidos: totalPedidosSet.size,
          totalProductos,
        });
      } catch {
        // silently ignore stats fetch errors
      } finally {
        setLoading(false);
      }
    }

    if (user?.id) {
       void fetchCreatorStats();
    }
  }, [user?.id, user?.email]);

  const handleInternalViewChange = (newView: "stats" | "chat") => {
    setView(newView);
    onViewChange?.(newView);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#009688]/20 border-t-[#009688] rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-8 h-8 bg-[#009688]/10 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-800 animate-pulse">Sincronizando Panel...</p>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-[0.2em] font-medium">Analizando tus obras y ventas</p>
        </div>
      </div>
    );
  }

  if (view === "chat") {
    return <CreatorChat creatorEmail={user.email} onBack={() => handleInternalViewChange("stats")} />;
  }

  return (
    <div className="space-y-8">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-6 border-none bg-emerald-50 shadow-sm hover:shadow-md transition-shadow rounded-[1.5rem]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-600">
                <DollarSign className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Ingresos Totales</span>
            </div>
            <p className="text-3xl font-black text-emerald-950">${stats.totalVentas.toLocaleString()}</p>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-6 border-none bg-blue-50 shadow-sm hover:shadow-md transition-shadow rounded-[1.5rem]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-blue-100 rounded-xl text-blue-600">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Ventas Logradas</span>
            </div>
            <p className="text-3xl font-black text-blue-950">{stats.totalPedidos} Pedidos</p>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="sm:col-span-2 lg:col-span-1">
          <Card className="p-6 border-none bg-slate-50 shadow-sm hover:shadow-md transition-shadow rounded-[1.5rem]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-slate-200 rounded-xl text-slate-600">
                <Package className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Obras Activas</span>
            </div>
            <p className="text-3xl font-black text-slate-950">{stats.totalProductos}</p>
          </Card>
        </motion.div>
      </div>

      {/* Main Actions Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button 
          onClick={() => setShowAddProduct(true)}
          className="h-16 bg-black text-white hover:bg-gray-800 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-black/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-6 h-6" />
          Publicar Nueva Obra
        </Button>
        
        <Button 
          onClick={() => handleInternalViewChange("chat")}
          variant="outline"
          className="h-16 border-gray-200 border-2 rounded-2xl font-black text-lg flex items-center justify-center gap-3 text-gray-700 hover:bg-gray-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <MessageSquare className="w-6 h-6 text-[#009688]" />
          Chat con Clientes
          <ArrowRight className="w-5 h-5 ml-auto text-gray-300" />
        </Button>
      </div>

      {/* Info Banner */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 0.5 }}
        className="bg-slate-50 border-2 border-dashed border-slate-200 p-6 rounded-[2rem] text-center"
      >
        <p className="text-slate-500 text-sm font-medium">
          ¿Necesitas ayuda con tus ventas? Contacta con el equipo de soporte de <span className="text-black font-black">Thiart 3D</span>
        </p>
      </motion.div>

      {/* MODAL MULTIPASO PROFESIONAL */}
      <CreateProductModal 
        open={showAddProduct} 
        isCreatorMode={true}
        onOpenChangeAction={setShowAddProduct} 
        onProductCreatedAction={() => {
           alert("¡Tu obra ha sido publicada con éxito!");
           window.location.reload();
        }}
        product={{
          nombre: "",
          descripcion: "",
          precio: 0,
          tamano: "Mediano",
          categoria: "Moderno",
          stock: 0,
          detalles: "",
          destacado: false,
          user_id: user.id
        }}
      />
    </div>
  );
}
