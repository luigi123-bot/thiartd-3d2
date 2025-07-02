"use client";
import React, { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { cn } from "~/lib/utils";

// Simulación de pedidos
type Producto = {
  nombre: string;
  precio: number;
};

type Pedido = {
  id: number;
  cliente: string;
  direccion: string;
  metodoEnvio: string;
  estado: string;
  total: number;
  productos: Producto[];
  impuestos: number;
  logistica: number;
  codigoUnico: string;
};

const pedidos: Pedido[] = [
  {
    id: 1,
    cliente: "Juan Pérez",
    direccion: "Calle 123, Ciudad",
    metodoEnvio: "Express (24h)",
    estado: "En proceso",
    total: 29500,
    productos: [
      { nombre: "Producto 1", precio: 10000 },
      { nombre: "Producto 2", precio: 15000 },
    ],
    impuestos: 4750,
    logistica: 5000,
    codigoUnico: "ABCD1234",
  },
  {
    id: 2,
    cliente: "Ana Gómez",
    direccion: "Av. Central 456, Ciudad",
    metodoEnvio: "Normal (3-5 días)",
    estado: "Enviado",
    total: 11900,
    productos: [{ nombre: "Producto 3", precio: 8000 }],
    impuestos: 1520,
    logistica: 2380,
    codigoUnico: "EFGH5678",
  },
];

// Color para chips de estado
const estadoColor = {
  "En proceso": "bg-blue-100 text-blue-600",
  Enviado: "bg-purple-100 text-purple-600",
  Entregado: "bg-green-100 text-green-600",
};

export default function PedidosPage() {
  const [selectedPedido, setSelectedPedido] = useState<(typeof pedidos)[number] | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <div className="bg-white shadow-md rounded-xl p-6">
        <h1 className="text-3xl font-semibold mb-6 text-gray-800">📦 Pedidos</h1>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="uppercase text-xs text-gray-500">Cliente</TableHead>
                <TableHead className="uppercase text-xs text-gray-500">Dirección</TableHead>
                <TableHead className="uppercase text-xs text-gray-500">Método de envío</TableHead>
                <TableHead className="uppercase text-xs text-gray-500">Estado</TableHead>
                <TableHead className="uppercase text-xs text-gray-500 text-right">Total</TableHead>
                <TableHead className="uppercase text-xs text-gray-500">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedidos.map((pedido) => (
                <TableRow
                  key={pedido.id}
                  className="hover:bg-muted transition-all duration-150"
                >
                  <TableCell>{pedido.cliente}</TableCell>
                  <TableCell>{pedido.direccion}</TableCell>
                  <TableCell>{pedido.metodoEnvio}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "text-sm px-3 py-1 rounded-full font-medium",
                        estadoColor[pedido.estado as keyof typeof estadoColor] ||
                          "bg-gray-100 text-gray-500"
                      )}
                    >
                      {pedido.estado}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ${pedido.total.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="default"
                      className="rounded-full"
                      onClick={() => {
                        setSelectedPedido(pedido);
                        setShowDetail(true);
                      }}
                    >
                      Ver detalles
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal de detalles */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle del Pedido</DialogTitle>
          </DialogHeader>
          {selectedPedido && (
            <div className="space-y-2 text-sm">
              <div><b>Cliente:</b> {selectedPedido.cliente}</div>
              <div><b>Dirección:</b> {selectedPedido.direccion}</div>
              <div><b>Método de envío:</b> {selectedPedido.metodoEnvio}</div>
              <div><b>Estado:</b> {selectedPedido.estado}</div>
              <div><b>Productos:</b></div>
              <ul className="ml-4 list-disc">
                {selectedPedido.productos.map((p: Producto, i: number) => (
                  <li key={i}>{p.nombre} - ${p.precio.toLocaleString()}</li>
                ))}
              </ul>
              <div><b>Subtotal:</b> ${(selectedPedido.total - selectedPedido.impuestos - selectedPedido.logistica).toLocaleString()}</div>
              <div><b>Impuestos:</b> ${selectedPedido.impuestos.toLocaleString()}</div>
              <div><b>Logística:</b> ${selectedPedido.logistica.toLocaleString()}</div>
              <div className="font-bold"><b>Total:</b> ${selectedPedido.total.toLocaleString()}</div>
              <div className="text-green-700 font-bold">Garantía de 10 días para tu compra.</div>
              <div className="text-blue-700 font-bold">
                Código único para recibir el producto:
                <span className="ml-1 bg-gray-200 px-2 py-1 rounded">{selectedPedido.codigoUnico}</span>
              </div>
              <div className="text-xs text-gray-500">
                Debes ingresar este código en la plataforma para poder recibir tu producto.
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowDetail(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
