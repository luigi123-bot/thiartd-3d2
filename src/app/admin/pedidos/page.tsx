"use client";
import React, { useState } from "react";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";

// Simulación de pedidos
const pedidos = [
  {
    id: 1,
    cliente: "Juan Pérez",
    direccion: "Calle 123, Ciudad",
    metodoEnvio: "Express (24h)",
    estado: "En proceso",
    total: 29500,
    productos: [
      { nombre: "Producto 1", precio: 10000 },
      { nombre: "Producto 2", precio: 15000 }
    ],
    impuestos: 4750,
    logistica: 5000,
    codigoUnico: "ABCD1234"
  },
  {
    id: 2,
    cliente: "Ana Gómez",
    direccion: "Av. Central 456, Ciudad",
    metodoEnvio: "Normal (3-5 días)",
    estado: "Enviado",
    total: 11900,
    productos: [
      { nombre: "Producto 3", precio: 8000 }
    ],
    impuestos: 1520,
    logistica: 2380,
    codigoUnico: "EFGH5678"
  }
];

export default function PedidosPage() {
  const [selectedPedido, setSelectedPedido] = useState<any | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Pedidos</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Dirección</TableHead>
            <TableHead>Método de envío</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pedidos.map((pedido) => (
            <TableRow key={pedido.id}>
              <TableCell>{pedido.cliente}</TableCell>
              <TableCell>{pedido.direccion}</TableCell>
              <TableCell>{pedido.metodoEnvio}</TableCell>
              <TableCell>{pedido.estado}</TableCell>
              <TableCell>${pedido.total.toLocaleString()}</TableCell>
              <TableCell>
                <Button size="sm" onClick={() => { setSelectedPedido(pedido); setShowDetail(true); }}>
                  Ver detalles
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Modal de detalles */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle del Pedido</DialogTitle>
          </DialogHeader>
          {selectedPedido && (
            <div className="space-y-2">
              <div><b>Cliente:</b> {selectedPedido.cliente}</div>
              <div><b>Dirección:</b> {selectedPedido.direccion}</div>
              <div><b>Método de envío:</b> {selectedPedido.metodoEnvio}</div>
              <div><b>Estado:</b> {selectedPedido.estado}</div>
              <div><b>Productos:</b></div>
              <ul className="ml-4 list-disc">
                {selectedPedido.productos.map((p: any, i: number) => (
                  <li key={i}>{p.nombre} - ${p.precio.toLocaleString()}</li>
                ))}
              </ul>
              <div><b>Subtotal:</b> ${(selectedPedido.total - selectedPedido.impuestos - selectedPedido.logistica).toLocaleString()}</div>
              <div><b>Impuestos:</b> ${selectedPedido.impuestos.toLocaleString()}</div>
              <div><b>Logística:</b> ${selectedPedido.logistica.toLocaleString()}</div>
              <div className="font-bold"><b>Total:</b> ${selectedPedido.total.toLocaleString()}</div>
              <div className="text-green-700 font-bold">Garantía de 10 días para tu compra.</div>
              <div className="text-blue-700 font-bold">Código único para recibir el producto: <span className="bg-gray-200 px-2 py-1 rounded">{selectedPedido.codigoUnico}</span></div>
              <div className="text-xs text-gray-500">Debes ingresar este código en la plataforma para poder recibir tu producto.</div>
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