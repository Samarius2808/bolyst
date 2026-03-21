"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";

interface BoardTag {
  id: string;
  name: string;
}

interface BoardMember {
  id: string;
  name: string | null;
  email: string;
}

interface BoardPin {
  id: string;
  name: string;
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
  | `tag:${string}`
  | `distance:${string}`;

interface SortGroup {
  label: string;
  icon: React.ReactNode;
  options: { key: SortKey; label: string }[];
  hidden?: boolean;
}

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
  pins = [],
}: {
  value: SortKey;
  onChange: (key: SortKey) => void;
  hasPins: boolean;
  boardTags: BoardTag[];
  members?: BoardMember[];
  pins?: BoardPin[];
}) {
  const [open, setOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const t = useTranslations("sortControls");

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

  function getLabelForKey(key: SortKey): string {
    if (key === "newest") return t("newest");
    if (key === "price-asc") return `${t("price")}: ${t("priceLowHigh")}`;
    if (key === "price-desc") return `${t("price")}: ${t("priceHighLow")}`;
    if (key === "ppm2-asc") return `${t("pricePerM2")}: ${t("priceLowHigh")}`;
    if (key === "ppm2-desc") return `${t("pricePerM2")}: ${t("priceHighLow")}`;
    if (key === "size-asc") return `${t("size")}: ${t("smallestFirst")}`;
    if (key === "size-desc") return `${t("size")}: ${t("largestFirst")}`;
    if (key === "distance-asc") return `${t("distance")}: ${t("nearestAnyPin")}`;
    if (key === "status") return t("status");
    if (key.startsWith("addedby:")) {
      const userId = key.slice(8);
      const m = members.find((u) => u.id === userId);
      return m ? t("byPrefix", { name: m.name || m.email.split("@")[0] }) : t("addedBy");
    }
    if (key.startsWith("tag:")) {
      const tag = boardTags.find((tg) => tg.id === key.slice(4));
      return tag ? t("tagPrefix", { name: tag.name }) : "Tag";
    }
    if (key.startsWith("distance:")) {
      const pinId = key.slice(9);
      const pin = pins.find((p) => p.id === pinId);
      return pin ? t("nearPrefix", { name: pin.name }) : t("distance");
    }
    return t("sort");
  }

  const activeLabel = getLabelForKey(value);
  const isActive = value !== "newest";

  function select(key: SortKey) {
    onChange(key);
    setOpen(false);
    setExpandedGroup(null);
  }

  const groups: SortGroup[] = [
    {
      label: t("newest"),
      icon: icons.clock,
      options: [{ key: "newest", label: t("newestFirst") }],
    },
    {
      label: t("price"),
      icon: icons.price,
      options: [
        { key: "price-asc", label: t("priceLowHigh") },
        { key: "price-desc", label: t("priceHighLow") },
      ],
    },
    {
      label: t("pricePerM2"),
      icon: icons.price,
      options: [
        { key: "ppm2-asc", label: t("priceLowHigh") },
        { key: "ppm2-desc", label: t("priceHighLow") },
      ],
    },
    {
      label: t("size"),
      icon: icons.ruler,
      options: [
        { key: "size-desc", label: t("largestFirst") },
        { key: "size-asc", label: t("smallestFirst") },
      ],
    },
    {
      label: t("distance"),
      icon: icons.pin,
      options: [
        { key: "distance-asc", label: t("nearestAnyPin") },
        ...pins.map((p) => ({ key: `distance:${p.id}` as SortKey, label: p.name })),
      ],
      hidden: !hasPins,
    },
    {
      label: t("status"),
      icon: icons.status,
      options: [{ key: "status", label: t("byWorkflowStage") }],
    },
  ];

  const memberGroup: SortGroup | null =
    members.length > 1
      ? {
          label: t("addedBy"),
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
          label: t("hasTag"),
          icon: icons.tag,
          options: boardTags.map((tg) => ({
            key: `tag:${tg.id}` as SortKey,
            label: tg.name,
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
        className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium rounded-lg border transition-all ${
          isActive
            ? "bg-sage-50 dark:bg-sage-950/40 border-sage-200 dark:border-sage-800 text-sage-600 dark:text-sage-400"
            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
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
        <div className="absolute top-full left-0 sm:left-0 right-0 sm:right-auto mt-1.5 z-50 w-auto sm:w-56 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-lg shadow-black/5 py-1 modal-content">
          {allGroups.map((group) => {
            const groupActive = isGroupActive(group);
            const isExpanded = expandedGroup === group.label;
            const hasSub = group.options.length > 1;

            if (!hasSub) {
              const opt = group.options[0];
              return (
                <button
                  key={group.label}
                  onClick={() => select(opt.key)}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 transition-colors ${
                    value === opt.key
                      ? "bg-sage-50 dark:bg-sage-950/40 text-sage-600 dark:text-sage-400 font-medium"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span className="w-4 flex justify-center text-zinc-400">{group.icon}</span>
                  {group.label}
                  {value === opt.key && <span className="ml-auto">{icons.check}</span>}
                </button>
              );
            }

            return (
              <div key={group.label}>
                <button
                  onClick={() => setExpandedGroup(isExpanded ? null : group.label)}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 transition-colors ${
                    groupActive
                      ? "bg-sage-50 dark:bg-sage-950/40 text-sage-600 dark:text-sage-400 font-medium"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span className="w-4 flex justify-center text-zinc-400">{group.icon}</span>
                  {group.label}
                  <span className={`ml-auto transition-transform ${isExpanded ? "rotate-90" : ""}`}>
                    {icons.chevron}
                  </span>
                </button>
                {isExpanded && (
                  <div className="bg-zinc-50/50 dark:bg-zinc-800">
                    {group.options.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => select(opt.key)}
                        className={`w-full text-left pl-10 pr-3.5 py-1.5 text-xs flex items-center gap-2 transition-colors ${
                          value === opt.key
                            ? "text-sage-600 dark:text-sage-400 font-medium"
                            : "text-zinc-500 dark:text-zinc-300 hover:text-zinc-700 dark:hover:text-zinc-100 hover:bg-zinc-100/50 dark:hover:bg-zinc-700"
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
