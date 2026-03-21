"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "~/lib/supabaseClient";

export type CarritoItem = {
  id: string;
  nombre: string;
  precio: number;
  imagen: string;
  cantidad: number;
  stock: number;
  categoria: string;
  destacado: boolean;
};

type CarritoContextType = {
  carrito: CarritoItem[];
  addToCarrito: (producto: CarritoItem) => Promise<boolean>;
  removeFromCarrito: (id: string) => void;
  updateCantidad: (id: string, cantidad: number) => void;
  clearCarrito: () => void;
};

const CarritoContext = createContext<CarritoContextType | undefined>(undefined);

export function useCarrito() {
  const ctx = useContext(CarritoContext);
  if (!ctx) throw new Error("useCarrito debe usarse dentro de un CarritoProvider");
  return ctx;
}

export function CarritoProvider({ children }: { children: React.ReactNode }) {
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);

  const [userId, setUserId] = useState<string | null>(null);

  // Obtener usuario de Supabase al montar
  useEffect(() => {
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 1. Cargar desde localStorage al iniciar
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("carrito");
      if (stored) {
        try {
          setCarrito(JSON.parse(stored) as CarritoItem[]);
          console.log("📦 Carrito cargado desde almacenamiento local.");
        } catch (e) {
          console.error("Error al cargar carrito local:", e);
        }
      }
    }
  }, []);

  // 2. Si el usuario se loguea y su carrito local está vacío, intentar cargar el de la BD
  useEffect(() => {
    if (userId && carrito.length === 0) {
      console.log(`📥 Usuario identificado (${userId}). Intentando recuperar carrito de la base de datos...`);
      fetch(`/api/cart/sync?userId=${userId}`)
        .then(res => res.json())
        .then(data => {
          const cartResult = data as { productos?: CarritoItem[] };
          if (cartResult.productos && cartResult.productos.length > 0) {
            setCarrito(cartResult.productos);
            console.log("✅ Carrito recuperado desde la base de datos.");
          }
        })
        .catch(err => console.error("❌ Error recuperando carrito de la BD:", err));
    }
  }, [userId, carrito.length]);

  // 3. Guardar en localStorage (siempre) y en BD (solo si está logueado)
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("carrito", JSON.stringify(carrito));
      window.dispatchEvent(new CustomEvent("cart-updated"));

      if (userId) {
        console.log(`🛒 Sincronizando carrito con la base de datos para usuario ${userId} (${carrito.length} items)...`);
        fetch("/api/cart/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userId, productos: carrito }),
        }).catch(err => console.error("❌ Error sincronizando carrito con BD:", err));
      }
    }
  }, [carrito, userId]);

  const addToCarrito = async (item: CarritoItem) => {
    const nuevoCarrito = [...carrito];
    const idx = nuevoCarrito.findIndex((p) => p.id === item.id);
    let added = false;

    if (idx >= 0 && nuevoCarrito[idx]) {
      const currentItem = nuevoCarrito[idx];
      const totalRequested = currentItem.cantidad + (item.cantidad || 1);
      if (totalRequested <= item.stock) {
        nuevoCarrito[idx] = { ...currentItem, cantidad: totalRequested };
        added = true;
      }
    } else {
      if (item.stock > 0) {
        nuevoCarrito.push({ ...item, cantidad: item.cantidad || 1 });
        added = true;
      }
    }

    if (added) {
      console.log(`🛒 Producto añadido al carrito: ${item.nombre}. Nuevo total de items: ${nuevoCarrito.length}`);
      setCarrito(nuevoCarrito);
      return true;
    }
    return false;
  };

  const removeFromCarrito = (id: string) => {
    setCarrito(carrito.filter(item => item.id !== id));
  };

  const updateCantidad = (id: string, cantidad: number) => {
    setCarrito(carrito.map(item => {
      if (item.id === id) {
        return { ...item, cantidad: Math.max(1, Math.min(item.stock, cantidad)) };
      }
      return item;
    }));
  };

  const clearCarrito = () => {
    setCarrito([]);
  };

  return (
    <CarritoContext.Provider value={{ carrito, addToCarrito, removeFromCarrito, updateCantidad, clearCarrito }}>
      {children}
    </CarritoContext.Provider>
  );
}
