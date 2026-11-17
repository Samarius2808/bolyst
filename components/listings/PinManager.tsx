"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";

interface Pin {
  id: string;
  name: string;
  address?: string | null;
  latitude: number;
  longitude: number;
}

interface GeoCenter {
  lat: number;
  lng: number;
}

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface PinFormValues {
  name: string;
  address: string;
  /** Exact spot from a suggestion or a map tap; null = geocode the typed address. */
  coords: { lat: number; lng: number } | null;
}

export type StartPick = (onPick: (lat: number, lng: number) => void) => void;

const inputClass =
  "w-full px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-sage-300 focus:border-sage-300";

/** "Street 12, City" from a Nominatim address, falling back to the first parts of display_name. */
function shortAddress(result: { display_name?: string; address?: Record<string, string> }): string {
  const a = result.address ?? {};
  const street = [a.road ?? a.pedestrian ?? a.footway, a.house_number].filter(Boolean).join(" ");
  const place = a.city ?? a.town ?? a.village ?? a.suburb ?? a.municipality;
  const short = [street || a.amenity || a.building, place].filter(Boolean).join(", ");
  if (short) return short;
  return (result.display_name ?? "").split(", ").slice(0, 3).join(", ");
}

const pinIcon = (
  <svg
    width="12"
    height="12"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6c0 3.5 4.5 8.5 4.5 8.5s4.5-5 4.5-8.5c0-2.5-2-4.5-4.5-4.5z" />
    <circle cx="8" cy="6" r="1.5" />
  </svg>
);

function PinForm({
  initial,
  submitLabel,
  busyLabel,
  geoCenter,
  onSubmit,
  onCancel,
  onStartPick,
  autoFocus = false,
}: {
  initial?: { name: string; address: string };
  submitLabel: string;
  busyLabel: string;
  geoCenter?: GeoCenter | null;
  onSubmit: (values: PinFormValues) => Promise<string | null>; // resolves to an error message
  onCancel?: () => void;
  onStartPick?: StartPick;
  autoFocus?: boolean;
}) {
  const t = useTranslations("pinManager");
  const [name, setName] = useState(initial?.name ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [coords, setCoords] = useState<PinFormValues["coords"]>(null);
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isEdit = initial !== undefined;
  const unchanged =
    isEdit && name.trim() === initial.name && address.trim() === initial.address && !coords;
  // Editing an older pin with no stored address: a name-only change is fine
  const hasLocation = coords !== null || address.trim().length > 0 || isEdit;

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
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) return;
        const data: Suggestion[] = await res.json();
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
    setCoords(null); // typed text no longer matches a picked spot
    setError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchAddress(value), 300);
  }

  function selectSuggestion(s: Suggestion) {
    setAddress(s.display_name);
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    setCoords(Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  async function handlePicked(lat: number, lng: number) {
    setCoords({ lat, lng });
    setError(null);
    setLocating(true);
    setAddress(t("droppedPin"));
    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lon: lng.toString(),
        format: "json",
        zoom: "18",
        addressdetails: "1",
      });
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const label = shortAddress(await res.json());
        if (label) setAddress(label);
      }
    } catch {
      // Keep the "Dropped pin" label; the coordinates are what matter
    }
    setLocating(false);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !hasLocation || loading) return;
    if (unchanged) {
      onCancel?.();
      return;
    }
    setLoading(true);
    setError(null);
    const err = await onSubmit({ name: name.trim(), address: address.trim(), coords });
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    if (!isEdit) {
      setName("");
      setAddress("");
      setCoords(null);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        type="text"
        placeholder={t("namePlaceholder")}
        value={name}
        maxLength={60}
        autoFocus={autoFocus}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel?.();
        }}
        className={inputClass}
      />
      <div className="flex gap-1.5">
        <div className="relative flex-1 min-w-0" ref={suggestionsRef}>
          <input
            type="text"
            placeholder={t("addressPlaceholder")}
            value={address}
            maxLength={300}
            onChange={(e) => handleAddressChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onCancel?.();
            }}
            ref={inputRef}
            onFocus={() => {
              if (suggestions.length > 0 && inputRef.current) {
                const rect = inputRef.current.getBoundingClientRect();
                setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
                setShowSuggestions(true);
              }
            }}
            className={`${inputClass} ${coords ? "pl-7" : ""}`}
          />
          {coords && (
            <span
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sage-600 dark:text-sage-400"
              title={t("exactSpot")}
            >
              {pinIcon}
            </span>
          )}
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
                      <span className="text-zinc-300 mt-0.5 flex-shrink-0">{pinIcon}</span>
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
        {onStartPick && (
          <button
            type="button"
            onClick={() => {
              setShowSuggestions(false);
              onStartPick(handlePicked);
            }}
            title={t("pickOnMap")}
            aria-label={t("pickOnMap")}
            className="shrink-0 inline-flex items-center gap-1 px-2.5 text-[11px] font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-sage-300 hover:text-sage-600 dark:hover:text-sage-400 transition-colors"
          >
            {pinIcon}
            <span className="hidden sm:inline">{t("pickOnMapShort")}</span>
          </button>
        )}
      </div>
      {error && <p className="text-[11px] text-red-500">{error}</p>}
      <div className="flex gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            {t("cancel")}
          </button>
        )}
        <button
          type="submit"
          disabled={loading || locating || !name.trim() || !hasLocation}
          className="flex-1 py-1.5 text-xs font-semibold bg-sage-600 text-white rounded-lg hover:bg-sage-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? busyLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}

export function PinManager({
  boardId,
  pins,
  onPinsChange,
  geoCenter,
  onExpandedChange,
  picking = false,
  onStartPick,
  defaultExpanded = false,
}: {
  boardId: string;
  pins: Pin[];
  onPinsChange: (pins: Pin[]) => void;
  geoCenter?: GeoCenter | null;
  onExpandedChange?: (expanded: boolean) => void;
  /** A map pick is in progress: tuck the panel away so the map is clickable. */
  picking?: boolean;
  onStartPick?: StartPick;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [editingId, setEditingId] = useState<string | null>(null);
  const t = useTranslations("pinManager");

  async function savePin(method: "POST" | "PATCH", values: PinFormValues, pinId?: string) {
    try {
      const res = await fetch(`/api/boards/${boardId}/pins`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pinId,
          name: values.name,
          address: values.address || null,
          latitude: values.coords?.lat,
          longitude: values.coords?.lng,
        }),
      });
      if (!res.ok) {
        return res.status === 422
          ? t("notFound")
          : t(method === "POST" ? "failedToAdd" : "failedToSave");
      }
      const pin: Pin = await res.json();
      onPinsChange(
        method === "POST" ? [...pins, pin] : pins.map((p) => (p.id === pin.id ? pin : p)),
      );
      if (method === "PATCH") setEditingId(null);
      return null;
    } catch {
      return t(method === "POST" ? "failedToAdd" : "failedToSave");
    }
  }

  async function handleDelete(pinId: string) {
    const res = await fetch(`/api/boards/${boardId}/pins`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinId }),
    }).catch(() => null);
    if (res?.ok) onPinsChange(pins.filter((p) => p.id !== pinId));
  }

  function toggle() {
    const next = !expanded;
    setExpanded(next);
    setEditingId(null);
    onExpandedChange?.(next);
  }

  const iconButton =
    "w-7 h-7 flex items-center justify-center rounded-full text-zinc-400 transition-colors lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100";

  return (
    <div className="relative bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
      <button
        onClick={toggle}
        aria-expanded={expanded}
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

      {/* Hidden (not unmounted) while picking, so half-filled forms survive the trip to the map */}
      {expanded && (
        <div
          className={`absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-lg px-4 py-3 space-y-1 z-20 max-h-[70vh] overflow-y-auto ${picking ? "hidden" : ""}`}
        >
          {pins.map((p) =>
            editingId === p.id ? (
              <div
                key={p.id}
                className="rounded-xl bg-sage-50/60 dark:bg-zinc-800/60 p-2.5 -mx-1.5 my-1"
              >
                <PinForm
                  initial={{ name: p.name, address: p.address ?? "" }}
                  submitLabel={t("save")}
                  busyLabel={t("saving")}
                  geoCenter={geoCenter}
                  onSubmit={(values) => savePin("PATCH", values, p.id)}
                  onCancel={() => setEditingId(null)}
                  onStartPick={onStartPick}
                  autoFocus
                />
              </div>
            ) : (
              <div key={p.id} className="flex items-center gap-2 py-0.5 group min-h-8">
                <span className="text-sage-500 text-[10px] shrink-0">★</span>
                <button
                  type="button"
                  onClick={() => setEditingId(p.id)}
                  className="flex-1 min-w-0 text-left"
                >
                  <span className="block text-xs text-zinc-700 dark:text-zinc-300 truncate">
                    {p.name}
                  </span>
                  {p.address && (
                    <span className="block text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
                      {p.address}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(p.id)}
                  aria-label={t("editPin", { name: p.name })}
                  title={t("edit")}
                  className={`${iconButton} hover:text-sage-600 hover:bg-sage-50 dark:hover:bg-zinc-800`}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 2.5l2.5 2.5L6 12.5H3.5V10L11 2.5z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
                  aria-label={t("deletePin", { name: p.name })}
                  title={t("delete")}
                  className={`${iconButton} hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40`}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  >
                    <path d="M4 4l8 8M12 4l-8 8" />
                  </svg>
                </button>
              </div>
            ),
          )}

          {editingId === null && (
            <div className={pins.length > 0 ? "pt-2" : ""}>
              <PinForm
                submitLabel={t("addPin")}
                busyLabel={t("adding")}
                geoCenter={geoCenter}
                onSubmit={(values) => savePin("POST", values)}
                onStartPick={onStartPick}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
