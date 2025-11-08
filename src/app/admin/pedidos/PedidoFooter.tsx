import { Button } from "~/components/ui/button";
import { Printer, Download } from "lucide-react";

interface Pedido {
  created_at: string;
}

interface PedidoFooterProps {
  pedido: Pedido;
}

export function PedidoFooter({ pedido }: PedidoFooterProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    alert("Función de descarga en desarrollo");
  };

  return (
    <div className="flex-shrink-0 bg-white border-t-2 border-gray-100 px-12 py-5 shadow-lg">
      <div className="max-w-[1920px] mx-auto">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500 font-medium">
            Pedido generado el{" "}
            {new Date(pedido.created_at).toLocaleDateString("es-ES")}
          </p>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handlePrint}
              className="border-2 border-gray-300 hover:border-[#00897B] hover:bg-emerald-50 text-gray-700 font-semibold px-6 py-5 rounded-2xl transition-all duration-300"
              aria-label="Imprimir comprobante"
            >
              <Printer className="w-5 h-5 mr-2" />
              Imprimir
            </Button>
            
            <Button
              onClick={handleDownload}
              className="bg-gradient-to-r from-[#00897B] to-emerald-600 hover:from-emerald-600 hover:to-[#00897B] text-white font-bold px-6 py-5 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl"
              aria-label="Descargar comprobante en PDF"
            >
              <Download className="w-5 h-5 mr-2" />
              Descargar PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
