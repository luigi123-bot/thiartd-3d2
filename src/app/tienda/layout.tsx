import TopbarTienda from "./componentes/TopbarTienda";

export default function TiendaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopbarTienda />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
