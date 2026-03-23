"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";

interface Pin {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface GeoCenter {
  lat: number;
  lng: number;
}

export function PinManager({
  boardId,
  pins,
  onPinsChange,
  geoCenter,
}: {
  boardId: string;
  pins: Pin[];
  onPinsChange: (pins: Pin[]) => void;
  geoCenter?: GeoCenter | null;
}) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [suggestions, setSuggestions] = useState<
    {
      display_name: string;
      lat: string;
      lon: string;
      type?: string;
      address?: Record<string, string>;
    }[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const t = useTranslations("pinManager");

  const searchAddress = useCallback(
    async (query: string) => {
      if (query.length < 3) {
        setSuggestions([]);
        return;
      }
      try {
        const params = new URLSearchParams({
          q: query,
          format: "json",
          limit: "5",
          addressdetails: "1",
        });
        // Bias results toward the board's geographic center (±0.5° ≈ ~50 km box)
        if (geoCenter) {
          const d = 0.5;
          params.set(
            "viewbox",
            `${geoCenter.lng - d},${geoCenter.lat + d},${geoCenter.lng + d},${geoCenter.lat - d}`,
          );
        }
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
          headers: { "User-Agent": "Bolyst/1.0 (https://bolyst.eu)" },
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) return;
        const data = await res.json();
        setSuggestions(data);
        if (data.length > 0 && inputRef.current) {
          const rect = inputRef.current.getBoundingClientRect();
          setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
        }
        setShowSuggestions(data.length > 0);
      } catch {
        // ignore
      }
    },
    [geoCenter],
  );

  function handleAddressChange(value: string) {
    setAddress(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchAddress(value), 300);
  }

  function selectSuggestion(s: { display_name: string; lat: string; lon: string }) {
    setAddress(s.display_name);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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
        setError(data.error || t("failedToAdd"));
        return;
      }
      const pin = await res.json();
      onPinsChange([...pins, pin]);
      setName("");
      setAddress("");
      setSuggestions([]);
      setShowSuggestions(false);
    } catch {
      setError(t("failedToAdd"));
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
    <div className="relative bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${expanded ? "rounded-t-2xl" : "rounded-2xl"}`}
      >
        <span className="flex items-center gap-1.5">
          <span className="text-sage-500">★</span>
          {t("referencePoints")}
          {pins.length > 0 && (
            <span className="bg-sage-100 text-sage-600 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
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
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-lg px-4 py-3 space-y-1 z-20">
          {pins.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-0.5 group">
              <span className="text-xs text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <span className="text-sage-500 text-[10px]">★</span>
                {p.name}
              </span>
              <button
                onClick={() => handleDelete(p.id)}
                className="text-zinc-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>
          ))}

          <form onSubmit={handleAdd} className="space-y-2 pt-1">
            <input
              type="text"
              placeholder={t("namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-sage-300 focus:border-sage-300"
            />
            <div className="relative" ref={suggestionsRef}>
              <input
                type="text"
                placeholder={t("addressPlaceholder")}
                value={address}
                onChange={(e) => handleAddressChange(e.target.value)}
                ref={inputRef}
                onFocus={() => {
                  if (suggestions.length > 0 && inputRef.current) {
                    const rect = inputRef.current.getBoundingClientRect();
                    setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
                    setShowSuggestions(true);
                  }
                }}
                className="w-full px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-sage-300 focus:border-sage-300"
              />
              {showSuggestions &&
                suggestions.length > 0 &&
                dropdownPos &&
                createPortal(
                  <div
                    ref={suggestionsRef}
                    style={{
                      position: "fixed",
                      top: dropdownPos.top,
                      left: dropdownPos.left,
                      width: dropdownPos.width,
                      zIndex: 9999,
                    }}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg overflow-hidden"
                  >
                    {suggestions.map((s, i) => {
                      const parts = s.display_name.split(", ");
                      const primary = parts[0];
                      const secondary = parts.slice(1).join(", ");
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => selectSuggestion(s)}
                          className="w-full text-left px-3 py-2 hover:bg-sage-50 dark:hover:bg-zinc-800 transition-colors border-b border-zinc-50 dark:border-zinc-800 last:border-b-0 flex items-start gap-2"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            className="text-zinc-300 mt-0.5 flex-shrink-0"
                          >
                            <path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6C3.5 9.5 8 14.5 8 14.5C8 14.5 12.5 9.5 12.5 6C12.5 3.5 10.5 1.5 8 1.5Z" />
                          </svg>
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                              {primary}
                            </div>
                            {secondary && (
                              <div className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
                                {secondary}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>,
                  document.body,
                )}
            </div>
            {error && <p className="text-[11px] text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading || !name.trim() || !address.trim()}
              className="w-full py-1.5 text-xs font-semibold bg-sage-600 text-white rounded-lg hover:bg-sage-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t("adding") : t("addPin")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
