import React, { useState } from "react";

type TrackResult = Record<string, unknown> | null;

export default function TrackForm() {
  const [trackingNumber, setTrackingNumber] = useState<string>("");
  const [result, setResult] = useState<TrackResult>(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = async () => {
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/envia/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingNumber }),
    });
    const data: unknown = await res.json();
    setResult(data as TrackResult);
    setLoading(false);
  };

  return (
    <div className="p-4">
      <input
        className="border p-2"
        value={trackingNumber}
        onChange={(e) => setTrackingNumber(e.target.value)}
        placeholder="Número de guía"
      />
      <button
        onClick={handleTrack}
        className="ml-2 px-4 py-2 bg-blue-500 text-white rounded"
      >
        {loading ? "Cargando..." : "Rastrear"}
      </button>

      {result && (
        <pre className="mt-4 bg-gray-100 p-2 rounded text-sm">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
