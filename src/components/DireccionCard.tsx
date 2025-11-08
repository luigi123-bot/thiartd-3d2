import { Card } from "~/components/ui/card";
import { MapPin, Home, Building2, MapIcon, Mail } from "lucide-react";

interface Pedido {
  direccion_envio?: string;
  ciudad_envio?: string;
  departamento_envio?: string;
  codigo_postal_envio?: string;
  notas_envio?: string;
}

interface DireccionCardProps {
  pedido: Pedido;
}

export function DireccionCard({ pedido }: DireccionCardProps) {
  const direccionCompleta = [
    pedido.direccion_envio,
    pedido.ciudad_envio,
    pedido.departamento_envio,
    "Colombia",
  ]
    .filter(Boolean)
    .join(", ");

  const mapUrl = direccionCompleta
    ? `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(direccionCompleta)}`
    : null;

  return (
    <Card className="rounded-3xl shadow-md p-8 bg-white border-0 hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      <div className="flex items-center gap-4 pb-4 border-b-2 border-gray-100 mb-5">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
          <MapPin className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Dirección de Envío</h3>
          <p className="text-xs text-gray-500 font-medium">Ubicación de entrega</p>
        </div>
      </div>

      <div className="space-y-5">
        <Item 
          label="Dirección" 
          value={pedido.direccion_envio ?? "No especificada"} 
          icon={<Home className="w-5 h-5 text-orange-600" />} 
          bg="bg-orange-50" 
        />

        <div className="grid grid-cols-2 gap-4">
          <Item 
            label="Ciudad" 
            value={pedido.ciudad_envio ?? "-"} 
            icon={<Building2 className="w-5 h-5 text-teal-600" />} 
            bg="bg-teal-50" 
          />
          <Item 
            label="Departamento" 
            value={pedido.departamento_envio ?? "-"} 
            icon={<MapIcon className="w-5 h-5 text-indigo-600" />} 
            bg="bg-indigo-50" 
          />
        </div>

        {pedido.codigo_postal_envio && (
          <Item 
            label="Código Postal" 
            value={pedido.codigo_postal_envio} 
            icon={<Mail className="w-5 h-5 text-pink-600" />} 
            bg="bg-pink-50" 
          />
        )}

        {pedido.notas_envio && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-bold text-amber-800 uppercase mb-2 flex items-center gap-2">
              <span>📝</span> Notas especiales
            </p>
            <p className="text-sm text-amber-900 leading-relaxed">{pedido.notas_envio}</p>
          </div>
        )}

        {mapUrl && (
          <div className="rounded-2xl overflow-hidden border-2 border-gray-200 shadow-lg mt-4">
            <iframe
              title={`Ubicación: ${direccionCompleta}`}
              width="100%"
              height="220"
              className="border-0"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={mapUrl}
              aria-label="Mapa de ubicación de entrega"
            />
          </div>
        )}
      </div>
    </Card>
  );
}

interface ItemProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  bg: string;
}

function Item({ label, value, icon, bg }: ItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}
