"use client";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Progress } from "~/components/ui/progress";

/**
 * Spinner 3D animado, requiere los estilos personalizados en tu archivo global de CSS.
 */
const SpinnerLoader = () => (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity duration-500">
    <div className="spinner-3d">
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
    </div>
  </div>
);

// Provider que muestra el Loader y el Progress en cambios de ruta
export function UiProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setLoading(true);
    setShow(true);
    setProgress(10);
    // Simula progreso
    const interval = setInterval(() => {
      setProgress((p) => (p < 90 ? p + 10 : p));
    }, 120);
    // Muestra el loader durante 1 segundo para mayor fluidez
    const timeout = setTimeout(() => {
      setProgress(100);
      setLoading(false);
    }, 1000);
    // Oculta el overlay después de la transición
    const hideTimeout = setTimeout(() => {
      setShow(false);
      setProgress(0);
    }, 1500);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      clearTimeout(hideTimeout);
    };
  }, [pathname]);

  return (
    <>
      {(loading || show) && (
        <>
          {/* Barra de progreso arriba */}
          <div className="fixed top-0 left-0 w-full z-[10000]">
            <Progress value={progress} className="h-1 bg-[#00a19a]/20" />
          </div>
          <SpinnerLoader />
        </>
      )}
      <div>{children}</div>
    </>
  );
}

export default SpinnerLoader;
