"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "~/lib/supabaseClient";
import TopbarCreador from "~/components/TopbarCreador";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import Image from "next/image";
import Link from "next/link";

import { 
  Package, Search, Filter, Plus, Edit2, Trash2, Eye, 
  AlertCircle, ChevronRight, LayoutGrid
} from "lucide-react";
import CreateProductModal from "~/components/CreateProductModal";

interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  tamano: string;
  stock: number;
  precio: number;
  destacado: boolean;
  image_url?: string;
  user_id: string;
  detalles?: string;
}

interface UsuarioDB {
  id: string;
  nombre: string;
  email: string;
  role: string;
}

interface ProductoAPI {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  tamano: string;
  stock: number;
  precio: number;
  destacado: boolean;
  image_url?: string;
  user_id?: string;
  usuario_id?: string;
}

export default function MisObrasPage() {
  const router = useRouter();
  const [creatorUser, setCreatorUser] = useState<UsuarioDB | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingProds, setLoadingProds] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);

  const totalObras = productos.length;
  const sinStock = productos.filter(p => p.stock <= 0).length;
  const destacadas = productos.filter(p => p.destacado).length;

  const fetchProductos = useCallback(async (userId: string) => {
    setLoadingProds(true);
    try {
      const res = await fetch("/api/productos");
      if (!res.ok) throw new Error("Error en API de productos");
      
      const json = await res.json() as { productos: ProductoAPI[] };
      const allProducts: ProductoAPI[] = json.productos ?? [];
      
      if (allProducts.length > 0) {
        console.log("[DEBUG MisObras] Ejemplo de producto recibido:", allProducts[0]);
      }
      
      const misObras = allProducts.filter((p: ProductoAPI) => 
        p.user_id === userId || p.usuario_id === userId
      ) as Producto[];
      
      setProductos(misObras);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProds(false);
    }
  }, []);

  const checkUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/");
        return;
      }

      const { data: userData } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", session.user.id)
        .single() as { data: UsuarioDB | null };

      if (!userData || (userData.role !== "creador" && userData.role !== "admin")) {
        router.push("/");
        return;
      }

      setCreatorUser(userData);
      setLoadingUser(false);
      console.log("[DEBUG MisObras] Usuario identificado:", userData.id, userData.nombre);
      void fetchProductos(userData.id);
    } catch (err) {
      console.error(err);
      router.push("/");
    }
  }, [router, fetchProductos]);

  useEffect(() => {
    void checkUser();
  }, [checkUser]);

  const filteredProducts = productos.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta obra? Esta acción no se puede deshacer.")) return;
    
    try {
      const { error } = await supabase
        .from("productos")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      setProductos(productos.filter(p => p.id !== id));
      alert("Obra eliminada con éxito");
    } catch (err) {
      alert("Error al eliminar la obra");
      console.error(err);
    }
  };

  if (loadingUser) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  if (!creatorUser) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopbarCreador user={creatorUser} />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div>
              <div className="flex items-center gap-2 mb-2">
                 <Link href="/creador" className="text-[10px] font-black text-slate-400 hover:text-teal-600 transition-colors uppercase tracking-widest">Dashboard</Link>
                 <ChevronRight className="w-3 h-3 text-slate-300" />
                 <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Mis Obras</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none uppercase">
                 Gestión de <span className="text-teal-500">Obras</span>
              </h1>
              <p className="text-slate-500 text-sm font-medium mt-2">Administra tu inventario y catálogo de productos artísticos.</p>
           </div>
           
           <Button 
              onClick={() => {
                setEditingProduct(null);
                setModalOpen(true);
              }}
              className="bg-black hover:bg-slate-800 text-white h-14 px-8 rounded-2xl font-black shadow-xl shadow-black/10 transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
           >
              <Plus className="w-5 h-5 text-teal-400" />
              Publicar Nueva Obra
           </Button>
        </div>

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <StatMiniCard label="Total Obras" value={totalObras} icon={Package as React.ComponentType<{ className?: string }>} color="teal" />
           <StatMiniCard label="En Stock" value={totalObras - sinStock} icon={LayoutGrid as React.ComponentType<{ className?: string }>} color="blue" />
           <StatMiniCard label="Sin Stock" value={sinStock} icon={AlertCircle as React.ComponentType<{ className?: string }>} color="red" />
           <StatMiniCard label="Destacadas" value={destacadas} icon={Edit2 as React.ComponentType<{ className?: string }>} color="amber" />
        </div>

        {/* Search & Filters */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
           <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
              <input 
                 type="text" 
                 placeholder="Buscar por nombre o categoría..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-teal-500 transition-all outline-none text-sm font-medium"
              />
           </div>
           <Button variant="outline" className="h-12 rounded-xl px-6 border-slate-200 text-slate-600 font-bold gap-2">
              <Filter className="w-4 h-4" /> Filtros
           </Button>
        </div>

        {/* Products List/Grid */}
        {loadingProds ? (
          <div className="py-20 text-center flex flex-col items-center">
             <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin mb-4"></div>
             <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest animate-pulse">Sincronizando Catálogo...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <Package className="w-16 h-16 text-slate-200 mx-auto mb-6" />
            <p className="text-2xl font-black text-slate-800 tracking-tight">Sin obras todavía</p>
            <p className="text-slate-400 text-sm mt-2 mb-8">Comienza publicando tu primera obra artística</p>
            <Button onClick={() => setModalOpen(true)} className="bg-black text-white hover:bg-slate-800 rounded-2xl px-8 h-12 font-bold">
              <Plus className="w-4 h-4 mr-2" /> Publicar mi primera obra
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(producto => (
              <div key={producto.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden group">
                <div className="aspect-square relative bg-slate-50 overflow-hidden">
                  {producto.image_url ? (
                    <Image src={producto.image_url} alt={producto.nombre} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-16 h-16 text-slate-200" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex gap-2">
                    {producto.destacado && <span className="bg-amber-400 text-amber-950 text-[9px] font-black uppercase px-2 py-1 rounded-full">Destacado</span>}
                    {producto.stock <= 0 && <span className="bg-red-100 text-red-700 text-[9px] font-black uppercase px-2 py-1 rounded-full">Sin Stock</span>}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-black text-slate-900 text-lg leading-tight truncate">{producto.nombre}</h3>
                  <p className="text-slate-400 text-xs mt-1 font-medium">{producto.categoria} · {producto.tamano}</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-2xl font-black text-teal-600">${Number(producto.precio).toLocaleString()}</span>
                    <span className="text-xs text-slate-400 font-bold">Stock: {producto.stock}</span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1 h-9 rounded-xl text-xs font-bold gap-1.5" onClick={() => { setEditingProduct(producto); setModalOpen(true); }}>
                      <Edit2 className="w-3 h-3" /> Editar
                    </Button>
                    <Button variant="outline" size="sm" className="h-9 rounded-xl text-xs font-bold gap-1.5 text-blue-600 border-blue-100 hover:bg-blue-50" onClick={() => router.push(`/tienda/productos/${producto.id}`)}>
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-9 rounded-xl text-xs font-bold gap-1.5 text-red-600 border-red-100 hover:bg-red-50" onClick={() => void handleDelete(producto.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <CreateProductModal 
        open={modalOpen} 
        isCreatorMode={true}
        onOpenChangeAction={setModalOpen}
        onProductCreatedAction={() => {
           setModalOpen(false);
           void fetchProductos(creatorUser.id);
        }}
        product={editingProduct ? { ...editingProduct, detalles: editingProduct.detalles ?? "" } : {
          nombre: "",
          descripcion: "",
          precio: 0,
          tamano: "Mediano",
          categoria: "Moderno",
          stock: 0,
          detalles: "",
          destacado: false as const,
          user_id: creatorUser.id
        }}
      />

      <footer className="py-12 text-center text-slate-400">
         <p className="text-[10px] font-black uppercase tracking-[0.3em]">
            &copy; {new Date().getFullYear()} Thiart3D • Centro de Gestión Artística
         </p>
      </footer>
    </div>
  );
}

function StatMiniCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ComponentType<{ className?: string }>; color: string }) {
  const colors: Record<string, string> = {
    teal: "bg-teal-50 text-teal-600 border-teal-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    red: "bg-red-50 text-red-600 border-red-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
  };

  return (
    <Card className={`p-5 rounded-2xl border flex items-center justify-between shadow-sm ${colors[color]}`}>
       <div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{label}</p>
          <p className="text-2xl font-black tracking-tighter leading-none">{value}</p>
       </div>
       <Icon className="w-7 h-7 opacity-20" />
    </Card>
  );
}
