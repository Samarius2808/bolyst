"use client";

import { useState, useRef, useEffect } from "react";

interface BoardTag {
  id: string;
  name: string;
}

export type SortKey =
  | "newest"
  | "price-asc"
  | "price-desc"
  | "size-desc"
  | "distance-asc"
  | `tag:${string}`;

const sortOptions: { key: SortKey; label: string; icon: string }[] = [
  { key: "newest", label: "Newest first", icon: "⏱" },
  { key: "price-asc", label: "Price: Low → High", icon: "↑" },
  { key: "price-desc", label: "Price: High → Low", icon: "↓" },
  { key: "size-desc", label: "Size: Largest", icon: "⊞" },
  { key: "distance-asc", label: "Distance: Nearest", icon: "★" },
];

function getLabelForKey(key: SortKey, boardTags: BoardTag[]): string {
  const opt = sortOptions.find((o) => o.key === key);
  if (opt) return opt.label;
  if (key.startsWith("tag:")) {
    const tag = boardTags.find((t) => t.id === key.slice(4));
    return tag ? `Tag: ${tag.name}` : "Tag";
  }
  return "Sort";
}

export function SortControls({
  value,
  onChange,
  hasPins,
  boardTags,
}: {
  value: SortKey;
  onChange: (key: SortKey) => void;
  hasPins: boolean;
  boardTags: BoardTag[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const activeLabel = getLabelForKey(value, boardTags);
  const isActive = value !== "newest";

  function select(key: SortKey) {
    onChange(key);
    setOpen(false);
  }

  const visibleOptions = hasPins
    ? sortOptions
    : sortOptions.filter((o) => o.key !== "distance-asc");

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
          isActive
            ? "bg-violet-50 border-violet-200 text-violet-600"
            : "bg-white border-zinc-200 text-zinc-400 hover:text-zinc-600"
        }`}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 4h12M4 8h8M6 12h4" />
        </svg>
        {activeLabel}
        <svg
          width="10"
          height="10"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 w-52 bg-white border border-zinc-100 rounded-xl shadow-lg shadow-black/5 py-1 modal-content">
          {visibleOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => select(opt.key)}
              className={`w-full text-left px-3.5 py-2 text-xs flex items-center gap-2 transition-colors ${
                value === opt.key
                  ? "bg-violet-50 text-violet-600 font-medium"
                  : "text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              <span className="w-4 text-center text-[11px]">{opt.icon}</span>
              {opt.label}
              {value === opt.key && (
                <svg className="ml-auto" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 8.5l3 3 7-7" />
                </svg>
              )}
            </button>
          ))}

          {boardTags.length > 0 && (
            <>
              <div className="border-t border-zinc-100 my-1" />
              <p className="px-3.5 py-1.5 text-[10px] uppercase tracking-wider text-zinc-300 font-semibold">
                Has tag
              </p>
              {boardTags.map((t) => {
                const key: SortKey = `tag:${t.id}`;
                return (
                  <button
                    key={t.id}
                    onClick={() => select(key)}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center gap-2 transition-colors ${
                      value === key
                        ? "bg-violet-50 text-violet-600 font-medium"
                        : "text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    <span className="w-4 text-center text-[11px]">#</span>
                    {t.name}
                    {value === key && (
                      <svg className="ml-auto" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M3 8.5l3 3 7-7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
