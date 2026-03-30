"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

export function LocationInput({
  value,
  onChange,
  placeholder,
  className,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const searchLocation = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const params = new URLSearchParams({
        q: query,
        format: "json",
        limit: "5",
        addressdetails: "1",
      });
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: { "User-Agent": "Bolyst/1.0 (https://bolyst.eu)" },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return;
      const data = await res.json();
      setSuggestions(data);
      if (data.length > 0 && inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        setDropdownPos({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
        });
      }
      setShowSuggestions(data.length > 0);
    } catch {
      // ignore
    }
  }, []);

  function handleChange(val: string) {
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchLocation(val), 300);
  }

  function selectSuggestion(s: LocationSuggestion) {
    onChange(s.display_name);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0 && inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect();
            setDropdownPos({
              top: rect.bottom + 4,
              left: rect.left,
              width: rect.width,
            });
            setShowSuggestions(true);
          }
        }}
        placeholder={placeholder}
        className={className}
        autoFocus={autoFocus}
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
  );
}
