import { Geist, Geist_Mono } from "next/font/google";
import "~/styles/globals.css";
import { ToastProvider } from "~/components/ui/use-toast";
import Footer from "~/components/Footer";
import { UiProvider } from "~/components/providers/UiProvider";
import NotificacionesUsuario from "~/components/NotificacionesUsuario";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function UsuarioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ToastProvider>
          <UiProvider>
            <div className="flex flex-col min-h-screen bg-gray-50">
              <header className="flex justify-end items-center gap-4 p-4 border-b bg-white">
                <NotificacionesUsuario />
                {/* Aquí puedes agregar tu propio UserButton si usas Supabase Auth */}
              </header>
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </UiProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
   
