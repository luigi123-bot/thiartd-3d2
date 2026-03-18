"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

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

  // Carrito persistence
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("carrito");
      if (stored) {
        try {
          setCarrito(JSON.parse(stored) as CarritoItem[]);
        } catch (e) {
          console.error("Error al cargar carrito:", e);
        }
      }
      
      const syncCarrito = (e: StorageEvent) => {
        if (e.key === "carrito") {
          setCarrito(e.newValue ? (JSON.parse(e.newValue) as CarritoItem[]) : []);
        }
      };
      window.addEventListener("storage", syncCarrito);
      return () => window.removeEventListener("storage", syncCarrito);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("carrito", JSON.stringify(carrito));
      window.dispatchEvent(new CustomEvent("cart-updated"));
    }
  }, [carrito]);

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
