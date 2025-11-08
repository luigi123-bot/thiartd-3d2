import { Card } from "~/components/ui/card";
import { User, Mail, Phone } from "lucide-react";

interface DatosContacto {
  nombre?: string;
  email?: string;
}

interface Pedido {
  telefono_envio?: string;
}

interface ClienteCardProps {
  pedido: Pedido;
  datos: DatosContacto;
}

export function ClienteCard({ pedido, datos }: ClienteCardProps) {
  return (
    <Card className="rounded-3xl shadow-md p-8 bg-white border-0 hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      <div className="flex items-center gap-4 pb-4 border-b-2 border-gray-100 mb-5">
        <div className="w-12 h-12 bg-gradient-to-br from-[#00897B] to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Cliente</h3>
          <p className="text-xs text-gray-500 font-medium">Información de contacto</p>
        </div>
      </div>

      <div className="space-y-5">
        <Item 
          label="Nombre completo" 
          value={datos.nombre ?? "No especificado"} 
          icon={<User className="w-5 h-5 text-blue-600" />} 
          bg="bg-blue-50" 
        />
        <Item 
          label="Correo electrónico" 
          value={datos.email ?? "No especificado"} 
          icon={<Mail className="w-5 h-5 text-green-600" />} 
          bg="bg-green-50" 
        />
        <Item 
          label="Teléfono" 
          value={pedido.telefono_envio ?? "No especificado"} 
          icon={<Phone className="w-5 h-5 text-purple-600" />} 
          bg="bg-purple-50" 
        />
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
        <p className="text-sm font-semibold text-gray-900 break-words">{value}</p>
      </div>
    </div>
  );
}
