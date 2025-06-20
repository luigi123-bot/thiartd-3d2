import TopbarTienda from "./componentes/TopbarTienda";

export default function TiendaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <TopbarTienda />
      {children}
    </div>
  );
}
