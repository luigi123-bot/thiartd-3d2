"use client";
import React, { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "TU_SUPABASE_URL";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "TU_SUPABASE_ANON_KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AdminEnviosPage() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    nombre_cliente: "",
    direccion: "",
    fecha_envio: "",
    estado: "En proceso",
    dia_entrega: ""
  });
  const [envios, setEnvios] = useState<any[]>([]);
  const [selectedEnvio, setSelectedEnvio] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchEnvios = async () => {
    const { data, error } = await supabase.from('envios').select('*').order('id', { ascending: false });
    if (!error) setEnvios(data || []);
  };

  useEffect(() => {
    fetchEnvios();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('envios').insert([
      {
        nombre_cliente: form.nombre_cliente,
        direccion: form.direccion,
        fecha_envio: form.fecha_envio,
        estado: form.estado,
        dia_entrega: form.dia_entrega
      }
    ]);
    if (error) {
      alert('Error al guardar el envío: ' + error.message);
    } else {
      alert('Envío guardado correctamente');
      setShowModal(false);
      setForm({ nombre_cliente: '', direccion: '', fecha_envio: '', estado: 'En proceso', dia_entrega: '' });
      fetchEnvios();
    }
  };

  const handleRowClick = (envio: any) => {
    setSelectedEnvio(envio);
    setShowDetailModal(true);
  };

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-6">Envíos</h1>
      <Button className="mb-4" onClick={() => setShowModal(true)}>
        Agregar Envío
      </Button>
      <p className="text-gray-600 mb-4">Aquí irá la gestión de envíos.</p>
      <div className="overflow-x-auto mb-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Día de entrega</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {envios.map((envio) => (
              <TableRow key={envio.id} className="cursor-pointer hover:bg-gray-100" onClick={() => handleRowClick(envio)}>
                <TableCell>{envio.nombre_cliente}</TableCell>
                <TableCell>{envio.direccion}</TableCell>
                <TableCell>{envio.fecha_envio}</TableCell>
                <TableCell>{envio.estado}</TableCell>
                <TableCell>{envio.dia_entrega}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* Modal para agregar envío */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Envío</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              name="nombre_cliente"
              placeholder="Nombre del cliente"
              value={form.nombre_cliente}
              onChange={handleChange}
              required
            />
            <Input
              type="text"
              name="direccion"
              placeholder="Dirección"
              value={form.direccion}
              onChange={handleChange}
              required
            />
            <Input
              type="date"
              name="fecha_envio"
              value={form.fecha_envio}
              onChange={handleChange}
              required
              placeholder="Fecha de envío"
            />
            <label htmlFor="estado" className="block font-medium">
              Estado
            </label>
            <Select name="estado" value={form.estado} onValueChange={v => setForm(f => ({ ...f, estado: v }))}>
              <SelectTrigger id="estado">
                <SelectValue placeholder="Selecciona estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="En proceso">En proceso</SelectItem>
                <SelectItem value="Orden en proceso">Orden en proceso</SelectItem>
                <SelectItem value="Finalizado">Finalizado</SelectItem>
                <SelectItem value="Enviado">Enviado</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="text"
              name="dia_entrega"
              placeholder="Día de entrega (opcional)"
              value={form.dia_entrega}
              onChange={handleChange}
            />
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Modal de detalles */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle del Envío</DialogTitle>
          </DialogHeader>
          {selectedEnvio && (
            <>
              <div className="mb-2"><b>Cliente:</b> {selectedEnvio.nombre_cliente}</div>
              <div className="mb-2"><b>Dirección:</b> {selectedEnvio.direccion}</div>
              <div className="mb-2"><b>Fecha de envío:</b> {selectedEnvio.fecha_envio}</div>
              <div className="mb-2"><b>Estado:</b> {selectedEnvio.estado}</div>
              <div className="mb-2"><b>Día de entrega:</b> {selectedEnvio.dia_entrega}</div>
              <div className="mb-4">
                <iframe
                  title="mapa"
                  width="100%"
                  height="250"
                  className="map-iframe"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(selectedEnvio.direccion)}&output=embed`}
                ></iframe>
              </div>
            </>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
