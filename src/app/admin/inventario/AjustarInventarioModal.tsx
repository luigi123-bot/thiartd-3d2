import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { FiPlus, FiMinus } from "react-icons/fi";

export default function AjustarInventarioModal({
  open,
  onOpenChange,
  producto,
  onAjuste,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  producto: any;
  onAjuste: (ajuste: { tipo: string; cantidad: number; razon: string; precio: number }) => void;
  loading: boolean;
}) {
  const [tipo, setTipo] = useState("add");
  const [cantidad, setCantidad] = useState("");
  const [razon, setRazon] = useState("");
  const [precio, setPrecio] = useState(producto?.precio || "");

  // Reset al abrir/cerrar
  React.useEffect(() => {
    if (open) {
      setTipo("add");
      setCantidad("");
      setRazon("");
      setPrecio(producto?.precio || "");
    }
  }, [open, producto]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Ajustar Inventario
          </DialogTitle>
        </DialogHeader>
        <div className="mb-2 text-sm text-gray-600">
          Ajusta el stock de <b>{producto?.nombre}</b>. Stock actual: <b>{producto?.stock}</b>
        </div>
        <div className="mb-3">
          <label htmlFor="tipo-ajuste-select" className="block text-xs font-semibold mb-1">Tipo de Ajuste</label>
          <select
            id="tipo-ajuste-select"
            className="border rounded px-3 py-2 w-full"
            value={tipo}
            onChange={e => setTipo(e.target.value)}
          >
            <option value="add"> <FiPlus className="inline" /> Añadir Stock</option>
            <option value="remove"> <FiMinus className="inline" /> Quitar Stock</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="block text-xs font-semibold mb-1">Cantidad</label>
          <input
            type="number"
            min={1}
            className="border rounded px-3 py-2 w-full"
            placeholder="Ingresa la cantidad"
            value={cantidad}
            onChange={e => setCantidad(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="block text-xs font-semibold mb-1">Nuevo Precio</label>
          <input
            type="number"
            min={0}
            className="border rounded px-3 py-2 w-full"
            placeholder="Actualizar precio (opcional)"
            value={precio}
            onChange={e => setPrecio(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="block text-xs font-semibold mb-1">Razón del Ajuste</label>
          <textarea
            className="border rounded px-3 py-2 w-full"
            placeholder="Describe la razón del ajuste..."
            value={razon}
            onChange={e => setRazon(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={() =>
              onAjuste({
                tipo,
                cantidad: Number(cantidad),
                razon,
                precio: Number(precio),
              })
            }
            disabled={loading || !cantidad || Number(cantidad) <= 0}
          >
            {loading ? "Ajustando..." : "Ajustar Inventario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
