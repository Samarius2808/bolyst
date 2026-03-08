"use client";

import { useState } from "react";

interface Pin {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export function PinManager({
  boardId,
  pins,
  onPinsChange,
}: {
  boardId: string;
  pins: Pin[];
  onPinsChange: (pins: Pin[]) => void;
}) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/boards/${boardId}/pins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), address: address.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to add pin");
        return;
      }
      const pin = await res.json();
      onPinsChange([...pins, pin]);
      setName("");
      setAddress("");
    } catch {
      setError("Failed to add pin");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(pinId: string) {
    try {
      await fetch(`/api/boards/${boardId}/pins`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinId }),
      });
      onPinsChange(pins.filter((p) => p.id !== pinId));
    } catch {
      // ignore
    }
  }

  return (
    <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <span className="text-violet-500">★</span>
          Reference points
          {pins.length > 0 && (
            <span className="bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
              {pins.length}
            </span>
          )}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-2.5 border-t border-zinc-50">
          {/* Existing pins */}
          {pins.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between py-1.5 group"
            >
              <span className="text-xs text-zinc-700 flex items-center gap-1.5">
                <span className="text-violet-500 text-[10px]">★</span>
                {p.name}
              </span>
              <button
                onClick={() => handleDelete(p.id)}
                className="text-zinc-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>
          ))}

          {/* Add form */}
          <form onSubmit={handleAdd} className="space-y-2 pt-1">
            <input
              type="text"
              placeholder="Name (e.g. Work, Uni)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-300 focus:border-violet-300"
            />
            <input
              type="text"
              placeholder="Address or location"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-300 focus:border-violet-300"
            />
            {error && (
              <p className="text-[11px] text-red-500">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !name.trim() || !address.trim()}
              className="w-full py-1.5 text-xs font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Adding..." : "Add pin"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
