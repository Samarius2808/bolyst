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

export const LISTING_STATUSES = [
  "NEW",
  "VIEWING",
  "APPLIED",
  "ACCEPTED",
  "REJECTED",
  "UNAVAILABLE_TIMEFRAME",
  "DELISTED",
] as const;

export type ListingStatus = (typeof LISTING_STATUSES)[number];

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
  | `status:${ListingStatus}`
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
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 4.5V8l2.5 1.5" />
    </svg>
  ),
  price: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M8 1v14M11 3.5H6.5a2.5 2.5 0 000 5h3a2.5 2.5 0 010 5H5" />
    </svg>
  ),
  ruler: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <rect x="1" y="6" width="14" height="4" rx="1" />
      <path d="M4 6v2M7 6v2M10 6v2M13 6v2" />
    </svg>
  ),
  pin: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6c0 3.5 4.5 8.5 4.5 8.5s4.5-5 4.5-8.5c0-2.5-2-4.5-4.5-4.5z" />
      <circle cx="8" cy="6" r="1.5" />
    </svg>
  ),
  status: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle cx="8" cy="8" r="6.5" />
      <path d="M5.5 8h5" />
      <path d="M8 5.5v5" />
    </svg>
  ),
  person: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle cx="8" cy="5" r="3" />
      <path d="M2.5 14.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
    </svg>
  ),
  tag: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M1.5 9.2V2.5a1 1 0 011-1h6.7a1 1 0 01.7.3l5.3 5.3a1 1 0 010 1.4l-5.6 5.6a1 1 0 01-1.4 0L1.8 9.9a1 1 0 01-.3-.7z" />
      <circle cx="5" cy="5" r="1" fill="currentColor" />
    </svg>
  ),
  check: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M3 8.5l3 3 7-7" />
    </svg>
  ),
  chevron: (
    <svg
      width="10"
      height="10"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M6 4l4 4-4 4" />
    </svg>
  ),
};

export const MAX_SORT_LEVELS = 3;

/** Drop keys that point at a tag / pin / member that no longer exists, and duplicates. */
export function validSortKeys(
  keys: readonly string[],
  ctx: { tagIds: string[]; pinIds: string[]; memberIds: string[] },
): SortKey[] {
  const seen = new Set<string>();
  const out: SortKey[] = [];
  for (const key of keys) {
    if (seen.has(key)) continue;
    const ok =
      [
        "newest",
        "price-asc",
        "price-desc",
        "ppm2-asc",
        "ppm2-desc",
        "size-asc",
        "size-desc",
        "status",
      ].includes(key) ||
      (key === "distance-asc" && ctx.pinIds.length > 0) ||
      (key.startsWith("status:") &&
        (LISTING_STATUSES as readonly string[]).includes(key.slice(7))) ||
      (key.startsWith("addedby:") && ctx.memberIds.includes(key.slice(8))) ||
      (key.startsWith("tag:") && ctx.tagIds.includes(key.slice(4))) ||
      (key.startsWith("distance:") && ctx.pinIds.includes(key.slice(9)));
    if (!ok) continue;
    seen.add(key);
    out.push(key as SortKey);
    if (out.length === MAX_SORT_LEVELS) break;
  }
  // "Newest" is the default order, so it only means something as the sole key
  return out.length > 1 ? out.filter((k) => k !== "newest") : out.length ? out : ["newest"];
}

export function SortControls({
  value,
  onChange,
  hasPins,
  boardTags,
  members = [],
  pins = [],
}: {
  /** Sort levels, most important first. ["newest"] = default order. */
  value: SortKey[];
  onChange: (keys: SortKey[]) => void;
  hasPins: boolean;
  boardTags: BoardTag[];
  members?: BoardMember[];
  pins?: BoardPin[];
}) {
  // Which level the menu edits: 0 = primary, value.length = adding a new level
  const [openLevel, setOpenLevel] = useState<number | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const lastPointerType = useRef<string>("");
  const t = useTranslations("sortControls");
  const tStatus = useTranslations("listingCard.status");
  const open = openLevel !== null;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpenLevel(null);
        setExpandedGroup(null);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenLevel(null);
        setExpandedGroup(null);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      document.addEventListener("keydown", handleKey);
    }
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
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
    if (key.startsWith("status:")) {
      return t("statusPrefix", { status: tStatus(key.slice(7) as ListingStatus) });
    }
    if (key.startsWith("addedby:")) {
      const userId = key.slice(8);
      const m = members.find((u) => u.id === userId);
      return m ? t("byPrefix", { name: m.name || m.email.split("@")[0] }) : t("addedBy");
    }
    if (key.startsWith("tag:")) {
      const tag = boardTags.find((tg) => tg.id === key.slice(4));
      return tag ? t("tagPrefix", { name: tag.name }) : t("hasTag");
    }
    if (key.startsWith("distance:")) {
      const pinId = key.slice(9);
      const pin = pins.find((p) => p.id === pinId);
      return pin ? t("nearPrefix", { name: pin.name }) : t("distance");
    }
    return t("sort");
  }

  const primary = value[0] ?? "newest";
  const isActive = primary !== "newest";
  const canAddLevel = isActive && value.length < MAX_SORT_LEVELS;
  // The key the open menu is editing (undefined while adding a new level)
  const editingKey = openLevel !== null ? value[openLevel] : undefined;

  function toggleMenu(level: number) {
    setOpenLevel(openLevel === level ? null : level);
    setExpandedGroup(null);
  }

  function select(key: SortKey) {
    if (openLevel === null) return;
    let next: SortKey[];
    if (openLevel === 0 && key === "newest") {
      next = ["newest"]; // back to the default clears every level
    } else {
      next = [...value];
      next[openLevel] = key;
    }
    onChange(next.filter((k, i) => next.indexOf(k) === i));
    setOpenLevel(null);
    setExpandedGroup(null);
  }

  function removeLevel(level: number) {
    const next = value.filter((_, i) => i !== level);
    onChange(next.length ? next : ["newest"]);
  }

  // A key already used on another level can't be picked again
  function isTaken(key: SortKey) {
    return value.some((k, i) => k === key && i !== openLevel);
  }

  const groups: SortGroup[] = [
    {
      label: t("newest"),
      icon: icons.clock,
      options: [{ key: "newest", label: t("newestFirst") }],
      hidden: openLevel !== 0, // "newest" is already the final tie-breaker
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
      options: [
        { key: "status", label: t("byWorkflowStage") },
        ...LISTING_STATUSES.map((s) => ({
          key: `status:${s}` as SortKey,
          label: t("statusFirst", { status: tStatus(s) }),
        })),
      ],
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
    return group.options.some((o) => o.key === editingKey);
  }

  const chevronDown = (
    <svg
      width="10"
      height="10"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="transition-transform"
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );

  return (
    <div className="relative flex items-center gap-1.5 flex-wrap" ref={ref}>
      <button
        onClick={() => toggleMenu(0)}
        aria-expanded={openLevel === 0}
        className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium rounded-lg border transition-all ${
          isActive
            ? "bg-sage-50 dark:bg-sage-950/40 border-sage-200 dark:border-sage-800 text-sage-600 dark:text-sage-400"
            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
        }`}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M2 4h12M4 8h8M6 12h4" />
        </svg>
        {getLabelForKey(primary)}
        <span className={openLevel === 0 ? "rotate-180" : ""}>{chevronDown}</span>
      </button>

      {/* Tie-breaker levels: "then by …" */}
      {value.slice(1).map((key, i) => {
        const level = i + 1;
        return (
          <span
            key={key}
            className="inline-flex items-center rounded-lg border border-sage-200 dark:border-sage-800 bg-sage-50/60 dark:bg-sage-950/30 text-sage-600 dark:text-sage-400 text-xs"
          >
            <button
              onClick={() => toggleMenu(level)}
              aria-expanded={openLevel === level}
              className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-2.5 font-medium"
            >
              <span className="text-sage-400 dark:text-sage-600 font-normal">{t("thenBy")}</span>
              {getLabelForKey(key)}
            </button>
            <button
              onClick={() => removeLevel(level)}
              aria-label={t("removeLevel", { label: getLabelForKey(key) })}
              className="w-7 h-full py-2.5 flex items-center justify-center rounded-r-lg text-sage-400 hover:text-sage-700 dark:hover:text-sage-300 hover:bg-sage-100/60 dark:hover:bg-sage-900/40 transition-colors"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </span>
        );
      })}

      {canAddLevel && (
        <button
          onClick={() => toggleMenu(value.length)}
          aria-expanded={openLevel === value.length}
          className="inline-flex items-center gap-1 px-2.5 py-2.5 text-xs font-medium rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 hover:text-sage-600 hover:border-sage-300 dark:hover:text-sage-400 transition-colors"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M8 3v10M3 8h10" />
          </svg>
          {t("addLevel")}
        </button>
      )}

      {open && (
        <div className="absolute top-full left-0 right-0 sm:right-auto mt-1.5 z-50 w-auto sm:w-56 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-lg shadow-black/5 py-1 modal-content">
          {openLevel !== null && openLevel > 0 && (
            <p className="px-3.5 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {t("thenByHeading")}
            </p>
          )}
          {allGroups.map((group) => {
            const groupActive = isGroupActive(group);
            const isExpanded = expandedGroup === group.label;
            const hasSub = group.options.length > 1;

            if (!hasSub) {
              const opt = group.options[0];
              const taken = isTaken(opt.key);
              return (
                <button
                  key={group.label}
                  onClick={() => select(opt.key)}
                  disabled={taken}
                  onPointerEnter={(e) => {
                    if (e.pointerType === "mouse") setExpandedGroup(null);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    editingKey === opt.key
                      ? "bg-sage-50 dark:bg-sage-950/40 text-sage-600 dark:text-sage-400 font-medium"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span className="w-4 flex justify-center text-zinc-400">{group.icon}</span>
                  {group.label}
                  {editingKey === opt.key && <span className="ml-auto">{icons.check}</span>}
                </button>
              );
            }

            return (
              <div
                key={group.label}
                className="relative"
                // Mouse: open the submenu on hover. Touch keeps tap-to-toggle.
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse") setExpandedGroup(group.label);
                }}
                onPointerLeave={(e) => {
                  if (e.pointerType === "mouse") setExpandedGroup(null);
                }}
              >
                <button
                  onPointerDown={(e) => {
                    lastPointerType.current = e.pointerType;
                  }}
                  onClick={() => {
                    // With a mouse, hover already opened it; a click shouldn't close it
                    if (lastPointerType.current === "mouse") setExpandedGroup(group.label);
                    else setExpandedGroup(isExpanded ? null : group.label);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 transition-colors ${
                    groupActive
                      ? "bg-sage-50 dark:bg-sage-950/40 text-sage-600 dark:text-sage-400 font-medium"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span className="w-4 flex justify-center text-zinc-400">{group.icon}</span>
                  {group.label}
                  <span
                    className={`ml-auto transition-transform ${isExpanded ? "rotate-90 sm:rotate-0" : ""}`}
                  >
                    {icons.chevron}
                  </span>
                </button>
                {isExpanded && (
                  // Phone: expands inline. Desktop: flyout to the right; the
                  // transparent left padding bridges the gap so hover isn't lost.
                  <div className="sm:absolute sm:left-full sm:-top-1 sm:pl-1 sm:z-10">
                    <div className="bg-zinc-50/50 dark:bg-zinc-800 sm:bg-white sm:dark:bg-zinc-900 sm:w-52 sm:max-h-80 sm:overflow-y-auto sm:py-1 sm:rounded-xl sm:border sm:border-zinc-100 sm:dark:border-zinc-800 sm:shadow-lg sm:shadow-black/5">
                      {group.options.map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => select(opt.key)}
                          disabled={isTaken(opt.key)}
                          className={`w-full text-left pl-10 sm:pl-3.5 pr-3.5 py-1.5 text-xs flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                            editingKey === opt.key
                              ? "text-sage-600 dark:text-sage-400 font-medium"
                              : "text-zinc-500 dark:text-zinc-300 hover:text-zinc-700 dark:hover:text-zinc-100 hover:bg-zinc-100/50 dark:hover:bg-zinc-700"
                          }`}
                        >
                          {opt.label}
                          {editingKey === opt.key && <span className="ml-auto">{icons.check}</span>}
                        </button>
                      ))}
                    </div>
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
