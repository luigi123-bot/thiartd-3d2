"use client";
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type ToastType = {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  action?: ReactNode;
};

type ToastContextType = {
  toast: (toast: ToastType) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  const toast = (toast: ToastType) => {
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 3500);
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t: ToastType, i: number) => (
          <div
            key={i}
            className={`rounded-lg shadow-lg px-6 py-4 bg-white border-l-4 ${
              t.variant === "destructive" ? "border-red-500" : "border-green-500"
            }`}
          >
            <div className="font-bold">{t.title}</div>
            {t.description && <div className="text-sm">{t.description}</div>}
            {t.action && <div className="mt-2">{t.action}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast debe usarse dentro de ToastProvider");
  return context;
}