"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ListingCard } from "./ListingCard";
import { AddListingModal } from "./AddListingModal";
import { ListingDetail } from "./ListingDetail";
import { ListingMapWrapper } from "./ListingMapWrapper";
import { PinManager, type StartPick } from "./PinManager";
import { SortControls, LISTING_STATUSES, validSortKeys, type SortKey } from "./SortControls";
import { nearestPinDistance } from "@/lib/haversine";

// Statuses that usually mean "no longer an option"
const INACTIVE: ListingStatus[] = ["REJECTED", "UNAVAILABLE_TIMEFRAME", "DELISTED"];

const statusDot: Record<ListingStatus, string> = {
  NEW: "bg-zinc-400",
  VIEWING: "bg-blue-500",
  APPLIED: "bg-amber-500",
  ACCEPTED: "bg-emerald-500",
  REJECTED: "bg-red-500",
  UNAVAILABLE_TIMEFRAME: "bg-zinc-300 dark:bg-zinc-600",
  DELISTED: "bg-zinc-300 dark:bg-zinc-600",
};

type ListingStatus =
  | "NEW"
  | "VIEWING"
  | "APPLIED"
  | "REJECTED"
  | "ACCEPTED"
  | "UNAVAILABLE_TIMEFRAME"
  | "DELISTED";

interface Listing {
  id: string;
  title: string;
  price: number | null;
  size: number | null;
  location: string | null;
  sourceUrl: string | null;
  imageUrls: string[];
  latitude: number | null;
  longitude: number | null;
  status: ListingStatus;
  archivedAt: Date | string | null;
  createdAt: Date | string;
  addedBy: { id: string; name: string | null; email: string } | null;
  tags: { tag: { id: string; name: string } }[];
  _count: { comments: number };
}

function statusRank(status: string): number {
  const i = (LISTING_STATUSES as readonly string[]).indexOf(status);
  return i === -1 ? LISTING_STATUSES.length : i;
}

export interface BoardPin {
  id: string;
  name: string;
  address?: string | null;
  latitude: number;
  longitude: number;
}

interface BoardTag {
  id: string;
  name: string;
}

interface MemberFavorite {
  id: string;
  name: string | null;
  email: string;
}

interface BoardMember {
  id: string;
  name: string | null;
  email: string;
}

export function ListingGrid({
  boardId,
  listings,
  pins,
  boardTags = [],
  favoritedIds = [],
  memberFavorites = {},
  currentUserId,
  members = [],
}: {
  boardId: string;
  listings: Listing[];
  pins: BoardPin[];
  boardTags?: BoardTag[];
  favoritedIds?: string[];
  memberFavorites?: Record<string, MemberFavorite[]>;
  currentUserId?: string;
  members?: BoardMember[];
}) {
  const router = useRouter();
  const t = useTranslations("listings");

  const [showAdd, setShowAdd] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [boardPins, setBoardPins] = useState<BoardPin[]>(pins);
  const [rawSortKeys, setRawSortKeys] = useState<SortKey[]>(["newest"]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [hiddenStatuses, setHiddenStatuses] = useState<Set<ListingStatus>>(new Set());
  const tStatus = useTranslations("listingCard.status");
  const hiddenStorageKey = `bolyst:hiddenStatuses:${boardId}`;
  const sortStorageKey = `bolyst:sort:${boardId}`;

  // Remember the sort order per board in this browser
  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(sortStorageKey) ?? "null");
      if (Array.isArray(saved) && saved.every((k) => typeof k === "string") && saved.length) {
        setRawSortKeys(saved as SortKey[]); // eslint-disable-line react-hooks/set-state-in-effect -- restoring a saved preference after hydration
      }
    } catch {
      // storage unavailable — keep defaults
    }
  }, [sortStorageKey]);

  function updateSortKeys(next: SortKey[]) {
    setRawSortKeys(next);
    try {
      localStorage.setItem(sortStorageKey, JSON.stringify(next));
    } catch {
      // storage unavailable — preference just won't persist
    }
  }

  // Remember hidden statuses per board in this browser
  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(hiddenStorageKey) ?? "[]");
      if (Array.isArray(saved)) {
        const valid = saved.filter((v): v is ListingStatus =>
          (LISTING_STATUSES as readonly string[]).includes(v),
        );
        if (valid.length > 0) setHiddenStatuses(new Set(valid)); // eslint-disable-line react-hooks/set-state-in-effect -- restoring a saved preference after hydration
      }
    } catch {
      // storage unavailable — keep defaults
    }
  }, [hiddenStorageKey]);

  function updateHiddenStatuses(next: Set<ListingStatus>) {
    setHiddenStatuses(next);
    try {
      localStorage.setItem(hiddenStorageKey, JSON.stringify(Array.from(next)));
    } catch {
      // storage unavailable — preference just won't persist
    }
  }
  const [favorites, setFavorites] = useState<Set<string>>(new Set(favoritedIds));
  const [compareMode, setCompareMode] = useState(false);
  const [compareSet, setCompareSet] = useState<Set<string>>(new Set());
  const [commuteListingId, setCommuteListingId] = useState<string | null>(null);
  const [showMobileMap, setShowMobileMap] = useState(false);
  const [pinManagerExpanded, setPinManagerExpanded] = useState(false);
  // Placing a reference point by tapping the map
  const [pickingPin, setPickingPin] = useState(false);
  const pickHandlerRef = useRef<((lat: number, lng: number) => void) | null>(null);
  const startPick: StartPick = (onPick) => {
    pickHandlerRef.current = onPick;
    setPickingPin(true);
  };
  function cancelPick() {
    pickHandlerRef.current = null;
    setPickingPin(false);
  }
  function handleMapPick(lat: number, lng: number) {
    pickHandlerRef.current?.(lat, lng);
    cancelPick();
  }

  const hasGeocodedListings = listings.some((l) => l.latitude != null && l.longitude != null);

  const geoCenter = useMemo(() => {
    const coords = listings.filter((l) => l.latitude != null && l.longitude != null);
    if (coords.length === 0 && boardPins.length === 0) return null;
    const all = [
      ...coords.map((l) => ({ lat: l.latitude!, lng: l.longitude! })),
      ...boardPins.map((p) => ({ lat: p.latitude, lng: p.longitude })),
    ];
    const lat = all.reduce((s, c) => s + c.lat, 0) / all.length;
    const lng = all.reduce((s, c) => s + c.lng, 0) / all.length;
    return { lat, lng };
  }, [listings, boardPins]);

  // Keys pointing at a deleted tag / pin / member are ignored rather than breaking the sort
  const sortKeys = useMemo(
    () =>
      validSortKeys(rawSortKeys, {
        tagIds: boardTags.map((tg) => tg.id),
        pinIds: boardPins.map((p) => p.id),
        memberIds: members.map((m) => m.id),
      }),
    [rawSortKeys, boardTags, boardPins, members],
  );

  // Distance to the relevant pin(s), per distance sort key in use
  const distanceMaps = useMemo(() => {
    const maps = new Map<SortKey, Map<string, number | null>>();
    for (const key of sortKeys) {
      if (key !== "distance-asc" && !key.startsWith("distance:")) continue;
      const pinId = key.startsWith("distance:") ? key.slice(9) : null;
      const activePins = pinId ? boardPins.filter((p) => p.id === pinId) : boardPins;
      const map = new Map<string, number | null>();
      for (const l of listings) {
        map.set(
          l.id,
          l.latitude != null && l.longitude != null
            ? nearestPinDistance(l.latitude, l.longitude, activePins)
            : null,
        );
      }
      maps.set(key, map);
    }
    return maps;
  }, [listings, boardPins, sortKeys]);

  // Distance shown on cards: to the pin being sorted by, else the nearest pin
  const cardDistances = useMemo(() => {
    const pinKey = sortKeys.find((k) => k.startsWith("distance:"));
    const activePins = pinKey ? boardPins.filter((p) => p.id === pinKey.slice(9)) : boardPins;
    const map = new Map<string, number | null>();
    for (const l of listings) {
      map.set(
        l.id,
        l.latitude != null && l.longitude != null
          ? nearestPinDistance(l.latitude, l.longitude, activePins)
          : null,
      );
    }
    return map;
  }, [listings, boardPins, sortKeys]);

  const sortedListings = useMemo(() => {
    const pool = listings.filter(
      (l) => (l.archivedAt != null) === showArchived && !hiddenStatuses.has(l.status),
    );
    const filtered = showFavoritesOnly ? pool.filter((l) => favorites.has(l.id)) : pool;

    // Listings missing a value always sink to the bottom, whatever the direction
    const asc = (x: number | null | undefined, y: number | null | undefined) =>
      (x ?? Infinity) - (y ?? Infinity) || 0; // || 0: Infinity - Infinity is NaN
    const desc = (x: number | null | undefined, y: number | null | undefined) =>
      (y ?? -Infinity) - (x ?? -Infinity) || 0;
    const ppm2 = (l: Listing) => (l.price != null && l.size ? l.price / l.size : null);
    const newest = (a: Listing, b: Listing) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

    function comparator(key: SortKey): (a: Listing, b: Listing) => number {
      switch (key) {
        case "newest":
          return newest;
        case "price-asc":
          return (a, b) => asc(a.price, b.price);
        case "price-desc":
          return (a, b) => desc(a.price, b.price);
        case "ppm2-asc":
          return (a, b) => asc(ppm2(a), ppm2(b));
        case "ppm2-desc":
          return (a, b) => desc(ppm2(a), ppm2(b));
        case "size-asc":
          return (a, b) => asc(a.size, b.size);
        case "size-desc":
          return (a, b) => desc(a.size, b.size);
        case "status":
          return (a, b) => statusRank(a.status) - statusRank(b.status);
      }
      if (key === "distance-asc" || key.startsWith("distance:")) {
        const map = distanceMaps.get(key);
        return (a, b) => asc(map?.get(a.id), map?.get(b.id));
      }
      if (key.startsWith("status:")) {
        // Chosen status first, everything else after it in workflow order
        const chosen = key.slice(7);
        const rank = (l: Listing) => (l.status === chosen ? -1 : statusRank(l.status));
        return (a, b) => rank(a) - rank(b);
      }
      if (key.startsWith("addedby:")) {
        const userId = key.slice(8);
        const rank = (l: Listing) => (l.addedBy?.id === userId ? 0 : 1);
        return (a, b) => rank(a) - rank(b);
      }
      if (key.startsWith("tag:")) {
        const tagId = key.slice(4);
        const rank = (l: Listing) => (l.tags.some((lt) => lt.tag.id === tagId) ? 0 : 1);
        return (a, b) => rank(a) - rank(b);
      }
      return () => 0;
    }

    // Each level breaks ties left by the one before; newest-first settles the rest
    const chain = [...sortKeys.map(comparator), newest];
    return [...filtered].sort((a, b) => {
      for (const cmp of chain) {
        const c = cmp(a, b);
        if (c !== 0) return c;
      }
      return 0;
    });
  }, [
    listings,
    sortKeys,
    showFavoritesOnly,
    showArchived,
    hiddenStatuses,
    favorites,
    distanceMaps,
  ]);

  // Per-status counts for the current view (active or archived)
  const statusCounts = useMemo(() => {
    const counts = new Map<ListingStatus, number>();
    for (const l of listings) {
      if ((l.archivedAt != null) !== showArchived) continue;
      counts.set(l.status, (counts.get(l.status) ?? 0) + 1);
    }
    return counts;
  }, [listings, showArchived]);
  const presentInactive = INACTIVE.filter((s) => statusCounts.has(s));
  const inactiveAllHidden =
    presentInactive.length > 0 && presentInactive.every((s) => hiddenStatuses.has(s));

  const archivedCount = listings.filter((l) => l.archivedAt != null).length;

  async function toggleFavorite(listingId: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(listingId)) next.delete(listingId);
      else next.add(listingId);
      return next;
    });
    await fetch(`/api/listings/${listingId}/favorite`, { method: "POST" });
  }

  function toggleCompare(listingId: string) {
    setCompareSet((prev) => {
      const next = new Set(prev);
      if (next.has(listingId)) next.delete(listingId);
      else next.add(listingId);
      return next;
    });
  }

  function openCompare() {
    const ids = Array.from(compareSet).join(",");
    router.push(`/boards/${boardId}/compare?ids=${ids}`);
  }

  return (
    <>
      {listings.length === 0 ? (
        <div className="text-center py-24 bg-white border border-zinc-100/80 rounded-2xl">
          <svg
            className="mx-auto mb-5 text-sage-200"
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            <rect x="6" y="10" width="36" height="28" rx="4" />
            <path d="M14 22l6-6 10 10M30 20a3 3 0 100-6 3 3 0 000 6z" />
          </svg>
          <h3 className="text-lg font-semibold text-zinc-700 mb-2">{t("noListingsTitle")}</h3>
          <p className="text-sm text-zinc-400 mb-6 max-w-xs mx-auto">
            {t("noListingsDescription")}
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold bg-sage-600 text-white rounded-xl hover:bg-sage-700 active:scale-[0.98] transition-all duration-150 shadow-md shadow-sage-600/20"
          >
            {t("addListing")}
          </button>
        </div>
      ) : (
        <div className={hasGeocodedListings ? "flex gap-6 items-start" : ""}>
          <div className={hasGeocodedListings ? "flex-1 min-w-0" : ""}>
            {/* Toolbar */}
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <SortControls
                value={sortKeys}
                onChange={updateSortKeys}
                hasPins={boardPins.length > 0}
                boardTags={boardTags}
                members={members}
                pins={boardPins}
              />
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`inline-flex items-center gap-1 px-3.5 py-2.5 text-xs font-medium rounded-lg border transition-all ${
                  showFavoritesOnly
                    ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
                }`}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 16 16"
                  fill={showFavoritesOnly ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M8 14s-5.5-3.5-5.5-7.5C2.5 4 4.5 2 6.5 2c1.1 0 2.1.5 2.5 1.5C9.4 2.5 10.4 2 11.5 2c2 0 3.5 1.5 3.5 3.5S13.5 10.5 8 14z" />
                </svg>
                {t("favorites")}
              </button>
              <button
                onClick={() => {
                  setCompareMode(!compareMode);
                  if (compareMode) setCompareSet(new Set());
                }}
                className={`inline-flex items-center gap-1 px-3.5 py-2.5 text-xs font-medium rounded-lg border transition-all ${
                  compareMode
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
                  <rect x="1" y="3" width="5" height="10" rx="1" />
                  <rect x="10" y="3" width="5" height="10" rx="1" />
                </svg>
                {t("compare")}
              </button>
              {(archivedCount > 0 || showArchived) && (
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className={`inline-flex items-center gap-1 px-3.5 py-2.5 text-xs font-medium rounded-lg border transition-all ${
                    showArchived
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
                    strokeLinejoin="round"
                  >
                    <rect x="1.5" y="2.5" width="13" height="3" rx="0.75" />
                    <path d="M2.5 5.5v7a1 1 0 001 1h9a1 1 0 001-1v-7M6.5 8.5h3" />
                  </svg>
                  {t("archivedCount", { count: archivedCount })}
                </button>
              )}
            </div>

            {statusCounts.size > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap mb-4">
                {LISTING_STATUSES.filter((s) => statusCounts.has(s)).map((s) => {
                  const hidden = hiddenStatuses.has(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={!hidden}
                      title={hidden ? t("showStatus") : t("hideStatus")}
                      onClick={() => {
                        const next = new Set(hiddenStatuses);
                        if (hidden) next.delete(s);
                        else next.add(s);
                        updateHiddenStatuses(next);
                      }}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border transition-all ${
                        hidden
                          ? "border-dashed border-zinc-200 dark:border-zinc-700 text-zinc-300 dark:text-zinc-600 line-through"
                          : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${hidden ? "bg-zinc-200 dark:bg-zinc-700" : statusDot[s]}`}
                      />
                      {tStatus(s)}
                      <span className="font-semibold tabular-nums">{statusCounts.get(s)}</span>
                    </button>
                  );
                })}
                {presentInactive.length > 0 && !inactiveAllHidden && (
                  <button
                    type="button"
                    onClick={() =>
                      updateHiddenStatuses(new Set([...hiddenStatuses, ...presentInactive]))
                    }
                    className="text-xs font-medium text-sage-600 dark:text-sage-400 hover:text-sage-700 px-1.5 transition-colors"
                  >
                    {t("hideInactive")}
                  </button>
                )}
                {hiddenStatuses.size > 0 && (
                  <button
                    type="button"
                    onClick={() => updateHiddenStatuses(new Set())}
                    className="text-xs font-medium text-sage-600 dark:text-sage-400 hover:text-sage-700 px-1.5 transition-colors"
                  >
                    {t("showAllStatuses")}
                  </button>
                )}
              </div>
            )}

            {showArchived && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 mb-4">
                {t("archivedHint")}
              </p>
            )}

            <div
              className={
                hasGeocodedListings
                  ? "grid grid-cols-1 sm:grid-cols-2 gap-5 items-start"
                  : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-start"
              }
            >
              {sortedListings.map((l) => (
                <ListingCard
                  key={l.id}
                  id={l.id}
                  title={l.title}
                  price={l.price}
                  size={l.size}
                  location={l.location}
                  sourceUrl={l.sourceUrl}
                  imageUrls={l.imageUrls}
                  status={l.status}
                  tags={l.tags}
                  commentCount={l._count.comments}
                  nearestPinKm={cardDistances.get(l.id) ?? null}
                  addedBy={l.addedBy}
                  isFavorited={favorites.has(l.id)}
                  onToggleFavorite={() => toggleFavorite(l.id)}
                  favoritedBy={(memberFavorites[l.id] || []).filter((u) => u.id !== currentUserId)}
                  boardMembers={members}
                  selectable={compareMode}
                  selected={compareSet.has(l.id)}
                  onToggleSelect={() => toggleCompare(l.id)}
                  showCommute={
                    hasGeocodedListings &&
                    boardPins.length > 0 &&
                    l.latitude != null &&
                    l.longitude != null
                  }
                  onCommute={() => {
                    setCommuteListingId(l.id);
                    if (window.innerWidth < 1024) setShowMobileMap(true);
                  }}
                  onClick={() => setSelectedId(l.id)}
                  onHover={() => setHoveredId(l.id)}
                  onHoverEnd={() => setHoveredId(null)}
                />
              ))}
              {sortedListings.length === 0 && (
                <div className="text-center py-12 col-span-full">
                  <p className="text-sm text-zinc-400">
                    {showFavoritesOnly
                      ? t("noFavorites")
                      : hiddenStatuses.size > 0 && statusCounts.size > 0
                        ? t("allStatusesHidden")
                        : showArchived
                          ? t("noArchived")
                          : t("allArchived")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {hasGeocodedListings && (
            <>
              <div className="hidden lg:block w-[480px] flex-shrink-0 sticky top-6">
                <div className="relative z-[500]">
                  <PinManager
                    boardId={boardId}
                    pins={boardPins}
                    onPinsChange={setBoardPins}
                    geoCenter={geoCenter}
                    onExpandedChange={setPinManagerExpanded}
                    picking={pickingPin}
                    onStartPick={startPick}
                  />
                </div>
                <div className="h-[calc(100vh-16rem)] mt-4">
                  <ListingMapWrapper
                    listings={sortedListings}
                    pins={boardPins}
                    favoritedIds={favorites}
                    members={members}
                    hoveredId={hoveredId}
                    commuteListingId={commuteListingId}
                    hidePinNudge={pinManagerExpanded}
                    onListingClick={(id) => setSelectedId(id)}
                    onCommuteClose={() => setCommuteListingId(null)}
                    pickingLocation={pickingPin}
                    onLocationPick={handleMapPick}
                    onCancelPick={cancelPick}
                  />
                </div>
              </div>
              {/* Mobile map toggle */}
              <button
                onClick={() => setShowMobileMap(true)}
                className="lg:hidden fixed bottom-6 right-6 z-40 w-12 h-12 bg-sage-600 text-white rounded-full shadow-lg shadow-sage-600/30 flex items-center justify-center active:scale-95 transition-transform"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6c0 3.5 4.5 8.5 4.5 8.5s4.5-5 4.5-8.5c0-2.5-2-4.5-4.5-4.5z" />
                  <circle cx="8" cy="6" r="1.5" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}

      {/* Mobile map overlay */}
      {showMobileMap && hasGeocodedListings && (
        <div className="lg:hidden fixed inset-0 z-50 bg-[#faf9f7] dark:bg-[#1c1c1a] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t("map")}</h3>
            <button
              onClick={() => {
                cancelPick();
                setShowMobileMap(false);
              }}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            >
              <svg
                width="18"
                height="18"
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
          <div className="relative z-[500] px-3 pt-3">
            <PinManager
              boardId={boardId}
              pins={boardPins}
              onPinsChange={setBoardPins}
              geoCenter={geoCenter}
              onExpandedChange={setPinManagerExpanded}
              picking={pickingPin}
              onStartPick={startPick}
            />
          </div>
          <div className="flex-1 min-h-0 p-3">
            <ListingMapWrapper
              listings={sortedListings}
              pins={boardPins}
              favoritedIds={favorites}
              members={members}
              hoveredId={hoveredId}
              commuteListingId={commuteListingId}
              hidePinNudge={pinManagerExpanded}
              onListingClick={(id) => {
                setSelectedId(id);
                setShowMobileMap(false);
              }}
              onCommuteClose={() => setCommuteListingId(null)}
              pickingLocation={pickingPin}
              onLocationPick={handleMapPick}
              onCancelPick={cancelPick}
            />
          </div>
        </div>
      )}

      {/* Compare floating bar */}
      {compareMode && (
        <div className="fixed bottom-6 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-40 bg-sage-600 text-white px-4 sm:px-6 py-3 rounded-2xl shadow-xl shadow-sage-600/30 flex items-center justify-between sm:justify-start gap-4">
          <span className="text-sm font-medium">
            {compareSet.size >= 2 ? t("selected", { count: compareSet.size }) : t("pickToCompare")}
          </span>
          {compareSet.size >= 2 ? (
            <button
              onClick={openCompare}
              className="px-4 py-1.5 bg-white text-sage-700 text-sm font-semibold rounded-xl hover:bg-sage-50 transition-colors"
            >
              {t("compareArrow")}
            </button>
          ) : (
            listings.length >= 2 && (
              <button
                onClick={() => router.push(`/boards/${boardId}/compare`)}
                className="px-4 py-1.5 bg-white text-sage-700 text-sm font-semibold rounded-xl hover:bg-sage-50 transition-colors whitespace-nowrap"
              >
                {t("compareAll")}
              </button>
            )
          )}
        </div>
      )}

      {showAdd && (
        <AddListingModal
          boardId={boardId}
          boardTags={boardTags}
          onClose={() => setShowAdd(false)}
        />
      )}

      {selectedId && (
        <ListingDetail
          listingId={selectedId}
          boardId={boardId}
          initialData={listings.find((l) => l.id === selectedId) || null}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  );
}
