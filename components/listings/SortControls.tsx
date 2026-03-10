"use client";

import { useState, useRef, useEffect } from "react";

interface BoardTag {
  id: string;
  name: string;
}

interface BoardMember {
  id: string;
  name: string | null;
  email: string;
}

export type SortKey =
  | "newest"
  | "price-asc"
  | "price-desc"
  | "ppm2-asc"
  | "ppm2-desc"
  | "size-asc"
  | "size-desc"
  | "distance-asc"
  | "status"
  | `addedby:${string}`
  | `tag:${string}`;

interface SortGroup {
  label: string;
  icon: React.ReactNode;
  options: { key: SortKey; label: string }[];
  hidden?: boolean;
}

function getLabelForKey(key: SortKey, boardTags: BoardTag[], members: BoardMember[]): string {
  if (key === "newest") return "Newest";
  if (key === "price-asc") return "Price: Low → High";
  if (key === "price-desc") return "Price: High → Low";
  if (key === "ppm2-asc") return "Price/m²: Low → High";
  if (key === "ppm2-desc") return "Price/m²: High → Low";
  if (key === "size-asc") return "Size: Smallest";
  if (key === "size-desc") return "Size: Largest";
  if (key === "distance-asc") return "Distance: Nearest";
  if (key === "status") return "Status";
  if (key.startsWith("addedby:")) {
    const userId = key.slice(8);
    const m = members.find((u) => u.id === userId);
    return m ? `By: ${m.name || m.email.split("@")[0]}` : "Added by";
  }
  if (key.startsWith("tag:")) {
    const tag = boardTags.find((t) => t.id === key.slice(4));
    return tag ? `Tag: ${tag.name}` : "Tag";
  }
  return "Sort";
}

// Simple SVG icons as components
const icons = {
  clock: (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="6.5" /><path d="M8 4.5V8l2.5 1.5" />
    </svg>
  ),
  price: (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M8 1v14M11 3.5H6.5a2.5 2.5 0 000 5h3a2.5 2.5 0 010 5H5" />
    </svg>
  ),
  ruler: (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="1" y="6" width="14" height="4" rx="1" /><path d="M4 6v2M7 6v2M10 6v2M13 6v2" />
    </svg>
  ),
  pin: (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6c0 3.5 4.5 8.5 4.5 8.5s4.5-5 4.5-8.5c0-2.5-2-4.5-4.5-4.5z" /><circle cx="8" cy="6" r="1.5" />
    </svg>
  ),
  status: (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="6.5" /><path d="M5.5 8h5" /><path d="M8 5.5v5" />
    </svg>
  ),
  person: (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="5" r="3" /><path d="M2.5 14.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
    </svg>
  ),
  tag: (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M1.5 9.2V2.5a1 1 0 011-1h6.7a1 1 0 01.7.3l5.3 5.3a1 1 0 010 1.4l-5.6 5.6a1 1 0 01-1.4 0L1.8 9.9a1 1 0 01-.3-.7z" /><circle cx="5" cy="5" r="1" fill="currentColor" />
    </svg>
  ),
  check: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 8.5l3 3 7-7" />
    </svg>
  ),
  chevron: (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 4l4 4-4 4" />
    </svg>
  ),
};

export function SortControls({
  value,
  onChange,
  hasPins,
  boardTags,
  members = [],
}: {
  value: SortKey;
  onChange: (key: SortKey) => void;
  hasPins: boolean;
  boardTags: BoardTag[];
  members?: BoardMember[];
}) {
  const [open, setOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setExpandedGroup(null);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const activeLabel = getLabelForKey(value, boardTags, members);
  const isActive = value !== "newest";

  function select(key: SortKey) {
    onChange(key);
    setOpen(false);
    setExpandedGroup(null);
  }

  const groups: SortGroup[] = [
    {
      label: "Newest",
      icon: icons.clock,
      options: [{ key: "newest", label: "Newest first" }],
    },
    {
      label: "Price",
      icon: icons.price,
      options: [
        { key: "price-asc", label: "Low → High" },
        { key: "price-desc", label: "High → Low" },
      ],
    },
    {
      label: "Price/m²",
      icon: icons.price,
      options: [
        { key: "ppm2-asc", label: "Low → High" },
        { key: "ppm2-desc", label: "High → Low" },
      ],
    },
    {
      label: "Size",
      icon: icons.ruler,
      options: [
        { key: "size-desc", label: "Largest first" },
        { key: "size-asc", label: "Smallest first" },
      ],
    },
    {
      label: "Distance",
      icon: icons.pin,
      options: [{ key: "distance-asc", label: "Nearest first" }],
      hidden: !hasPins,
    },
    {
      label: "Status",
      icon: icons.status,
      options: [{ key: "status", label: "By workflow stage" }],
    },
  ];

  // Dynamic groups
  const memberGroup: SortGroup | null =
    members.length > 1
      ? {
          label: "Added by",
          icon: icons.person,
          options: members.map((m) => ({
            key: `addedby:${m.id}` as SortKey,
            label: m.name || m.email.split("@")[0],
          })),
        }
      : null;

  const tagGroup: SortGroup | null =
    boardTags.length > 0
      ? {
          label: "Has tag",
          icon: icons.tag,
          options: boardTags.map((t) => ({
            key: `tag:${t.id}` as SortKey,
            label: t.name,
          })),
        }
      : null;

  const allGroups = [
    ...groups.filter((g) => !g.hidden),
    ...(memberGroup ? [memberGroup] : []),
    ...(tagGroup ? [tagGroup] : []),
  ];

  function isGroupActive(group: SortGroup) {
    return group.options.some((o) => o.key === value);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen(!open);
          setExpandedGroup(null);
        }}
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
        <div className="absolute top-full left-0 mt-1.5 z-50 w-56 bg-white border border-zinc-100 rounded-xl shadow-lg shadow-black/5 py-1 modal-content">
          {allGroups.map((group) => {
            const groupActive = isGroupActive(group);
            const isExpanded = expandedGroup === group.label;
            const hasSub = group.options.length > 1;

            if (!hasSub) {
              // Single option — direct click
              const opt = group.options[0];
              return (
                <button
                  key={group.label}
                  onClick={() => select(opt.key)}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 transition-colors ${
                    value === opt.key
                      ? "bg-violet-50 text-violet-600 font-medium"
                      : "text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  <span className="w-4 flex justify-center text-zinc-400">{group.icon}</span>
                  {group.label}
                  {value === opt.key && <span className="ml-auto">{icons.check}</span>}
                </button>
              );
            }

            // Multi-option group — expandable
            return (
              <div key={group.label}>
                <button
                  onClick={() => setExpandedGroup(isExpanded ? null : group.label)}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 transition-colors ${
                    groupActive
                      ? "bg-violet-50 text-violet-600 font-medium"
                      : "text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  <span className="w-4 flex justify-center text-zinc-400">{group.icon}</span>
                  {group.label}
                  <span className={`ml-auto transition-transform ${isExpanded ? "rotate-90" : ""}`}>
                    {icons.chevron}
                  </span>
                </button>
                {isExpanded && (
                  <div className="bg-zinc-50/50">
                    {group.options.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => select(opt.key)}
                        className={`w-full text-left pl-10 pr-3.5 py-1.5 text-xs flex items-center gap-2 transition-colors ${
                          value === opt.key
                            ? "text-violet-600 font-medium"
                            : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100/50"
                        }`}
                      >
                        {opt.label}
                        {value === opt.key && <span className="ml-auto">{icons.check}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
