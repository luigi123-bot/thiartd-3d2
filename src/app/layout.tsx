import type { ReactNode } from "react";
import { type Metadata } from "next";
import "../styles/globals.css";

import { ToastProvider } from "~/components/ui/use-toast";
import { UiProvider } from "~/components/providers/UiProvider";
import { CarritoProvider } from "~/components/providers/CarritoProvider";

export const metadata: Metadata = {
  title: {
    default: "Thiart3D — Impresión 3D Sostenible",
    template: "%s | Thiart3D",
  },
  description:
    "Descubre productos 3D únicos hechos con botellas recicladas. Arte tridimensional sostenible para empresas y personas con propósito.",
  keywords: ["3D", "productos", "arte", "esculturas", "personalizados", "reciclado", "sostenible", "Colombia"],
  authors: [{ name: "Thiart3D" }],
  creator: "Thiart3D",
  publisher: "Thiart3D",
  metadataBase: new URL("https://thiart3d.com"),
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: "https://thiart3d.com",
    siteName: "Thiart3D",
    title: "Thiart3D — Impresión 3D Sostenible",
    description:
      "Piezas 3D únicas fabricadas con botellas recicladas. Diseño con propósito para marcas y personas.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Thiart3D Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Thiart3D — Impresión 3D Sostenible",
    description:
      "Piezas 3D únicas fabricadas con botellas recicladas. Diseño con propósito.",
    images: ["/logo.png"],
  },
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Supabase — used on every page for auth */}
        <link
          rel="preconnect"
          href={`https://${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace("https://", "") ?? "supabase.co"}`}
        />

        {/* Cloudinary for product images */}
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body className="antialiased font-sans" suppressHydrationWarning>
        <ToastProvider>
          <UiProvider>
            <CarritoProvider>
              {children}
            </CarritoProvider>
          </UiProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
