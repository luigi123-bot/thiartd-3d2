import { useState } from "react";

export default function TrackForm() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [result, setResult] = useState<any>(null);

  const handleTrack = async () => {
    const res = await fetch("/api/envia/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingNumber }),
    });
    const data = await res.json();
    setResult(data);
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
        Rastrear
      </button>

      {result && (
        <pre className="mt-4 bg-gray-100 p-2 rounded text-sm">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
