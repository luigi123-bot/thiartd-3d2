export function parseJSON<T>(data: unknown): T | null {
  if (typeof data === "string") {
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }
  return (data as T) ?? null;
}

export function getEstadoBadgeClass(estado: string): string {
  const estados: Record<string, string> = {
    pagado: "bg-emerald-100 text-emerald-800 border-emerald-300",
    pendiente_pago: "bg-amber-100 text-amber-800 border-amber-300",
    pago_rechazado: "bg-rose-100 text-rose-800 border-rose-300",
    pago_cancelado: "bg-rose-100 text-rose-800 border-rose-300",
  };
  return estados[estado] ?? "bg-slate-100 text-slate-800 border-slate-300";
}
