import { Card } from "~/components/ui/card";
import { Package } from "lucide-react";

interface Producto {
  id: string;
  titulo?: string;
  nombre?: string;
  producto_id?: string;
  cantidad: number;
  precio_unitario: number;
  descripcion?: string;
}

interface ProductosCardProps {
  productos: Producto[];
}

export function ProductosCard({ productos }: ProductosCardProps) {
  return (
    <div className="lg:col-span-2">
      <Card className="rounded-3xl shadow-md p-8 bg-white border-0 hover:shadow-xl transition-shadow duration-300 overflow-hidden">
        <div className="flex items-center gap-4 pb-4 border-b-2 border-gray-100 mb-5">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Productos del Pedido</h3>
            <p className="text-xs text-gray-500 font-medium">
              {productos.length} artículo{productos.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scroll-smooth">
          {productos.map((prod, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-br from-gray-50 to-purple-50 border-2 border-gray-100 rounded-2xl p-5 hover:shadow-md transition-all duration-300 hover:border-purple-200"
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-gray-900 text-base flex-1 leading-tight pr-4">
                  {prod.titulo ?? prod.nombre ?? prod.producto_id}
                </h4>
                <span className="bg-gradient-to-r from-[#00897B] to-emerald-600 text-white text-sm px-4 py-2 rounded-full font-bold shadow-md whitespace-nowrap">
                  ×{prod.cantidad}
                </span>
              </div>

              {prod.descripcion && (
                <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                  {prod.descripcion}
                </p>
              )}

              <div className="border-t-2 border-gray-200 pt-3 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 font-medium">Precio unitario</span>
                  <span className="font-bold text-gray-900">
                    ${Number(prod.precio_unitario).toLocaleString("es-CO")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-900 font-bold">Subtotal</span>
                  <span className="font-extrabold text-[#00897B] text-lg">
                    ${(prod.cantidad * prod.precio_unitario).toLocaleString("es-CO")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
