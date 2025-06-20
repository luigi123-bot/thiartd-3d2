import { type Metadata } from "next";
import {
  ClerkProvider,
} from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "~/styles/globals.css";

import { ToastProvider } from "~/components/ui/use-toast";
import SyncUser from "../components/SyncUser";
import Footer from "~/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Thiart3D",
  keywords: ["3D", "productos", "arte", "esculturas", "personalizados"],
  authors: [{ name: "Thiart3D" }],
  creator: "Thiart3D",
  publisher: "Thiart3D",
  description: "Descubre productos 3D únicos y personalizados. Arte tridimensional para todos los gustos y espacios.",
  icons: [{ rel: "icon", url: "/IG%20Foto%20de%20Perfil.png" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <SyncUser />
          <ToastProvider>
            {children}
            <Footer />
          </ToastProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
export const dynamic = "force-dynamic"; // Forzar la regeneración de la página en cada solicitud
export const revalidate = 0; // Desactivar la caché para esta página
export const fetchCache = "force-no-store"; // Desactivar la caché de Next.js para esta página
export const runtime = "edge"; // Ejecutar en el edge para mejor rendimiento
export const preferredRegion = "auto"; // Usar la región más cercana automáticamente
export const tags = ["nextjs", "react", "typescript", "tailwindcss"]; // Etiquetas para la página
export const dynamicParams = false; // Desactivar los parámetros dinámicos para esta página
export const fetchCacheKey = "root-layout"; // Clave de caché para esta página
export const revalidateTag = "root-layout"; // Etiqueta de revalidación para esta página
export const fetchCacheOptions = {
  maxAge: 0, // Desactivar la caché para esta página
  staleWhileRevalidate: 0, // Desactivar la revalidación en segundo plano
  swr: false, // Desactivar la revalidación en segundo plano  
  cache: "no-store", // Desactivar la caché de Next.js para esta página
  next: {
    revalidate: 0, // Desactivar la revalidación de Next.js para esta página
    tags: ["root-layout"], // Etiquetas de revalidación para esta página
  },
  headers: {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
  },
  cookies: {
    "next-auth.session-token": {}, // Desactivar la caché de sesión de Next.js para esta página
  },
};
