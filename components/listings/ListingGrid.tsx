"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ListingCard } from "./ListingCard";
import { AddListingModal } from "./AddListingModal";
import { ListingDetail } from "./ListingDetail";
import { ListingMapWrapper } from "./ListingMapWrapper";
import { PinManager } from "./PinManager";
import { SortControls, type SortKey } from "./SortControls";
import { nearestPinDistance } from "@/lib/haversine";

type ListingStatus = "NEW" | "VIEWING" | "APPLIED" | "REJECTED" | "ACCEPTED" | "DELISTED";

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
  createdAt: Date | string;
  addedBy: { id: string; name: string | null; email: string } | null;
  tags: { tag: { id: string; name: string } }[];
  _count: { comments: number };
}

export interface BoardPin {
  id: string;
  name: string;
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
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set(favoritedIds));
  const [compareMode, setCompareMode] = useState(false);
  const [compareSet, setCompareSet] = useState<Set<string>>(new Set());
  const [commuteListingId, setCommuteListingId] = useState<string | null>(null);
  const [showMobileMap, setShowMobileMap] = useState(false);

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

  const distanceMap = useMemo(() => {
    const map = new Map<string, number | null>();
    let activePins = boardPins;
    if (sortKey.startsWith("distance:")) {
      const pinId = sortKey.slice(9);
      const specific = boardPins.find((p) => p.id === pinId);
      if (specific) activePins = [specific];
    }
    for (const l of listings) {
      map.set(
        l.id,
        l.latitude != null && l.longitude != null
          ? nearestPinDistance(l.latitude, l.longitude, activePins)
          : null,
      );
    }
    return map;
  }, [listings, boardPins, sortKey]);

  const sortedListings = useMemo(() => {
    const filtered = showFavoritesOnly ? listings.filter((l) => favorites.has(l.id)) : listings;

    const sorted = [...filtered];
    switch (sortKey) {
      case "newest":
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "price-asc":
        sorted.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
        break;
      case "price-desc":
        sorted.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
        break;
      case "ppm2-asc": {
        const ppm2 = (l: Listing) => (l.price != null && l.size ? l.price / l.size : Infinity);
        sorted.sort((a, b) => ppm2(a) - ppm2(b));
        break;
      }
      case "ppm2-desc": {
        const ppm2d = (l: Listing) => (l.price != null && l.size ? l.price / l.size : -1);
        sorted.sort((a, b) => ppm2d(b) - ppm2d(a));
        break;
      }
      case "size-asc":
        sorted.sort((a, b) => (a.size ?? Infinity) - (b.size ?? Infinity));
        break;
      case "size-desc":
        sorted.sort((a, b) => (b.size ?? -1) - (a.size ?? -1));
        break;
      case "distance-asc":
        sorted.sort(
          (a, b) => (distanceMap.get(a.id) ?? Infinity) - (distanceMap.get(b.id) ?? Infinity),
        );
        break;
      case "status": {
        const statusOrder: Record<string, number> = {
          NEW: 0,
          VIEWING: 1,
          APPLIED: 2,
          ACCEPTED: 3,
          REJECTED: 4,
          DELISTED: 5,
        };
        sorted.sort((a, b) => (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99));
        break;
      }
      default:
        if (sortKey.startsWith("distance:")) {
          sorted.sort(
            (a, b) => (distanceMap.get(a.id) ?? Infinity) - (distanceMap.get(b.id) ?? Infinity),
          );
        } else if (sortKey.startsWith("addedby:")) {
          const userId = sortKey.slice(8);
          sorted.sort((a, b) => {
            const aMatch = a.addedBy?.id === userId ? 0 : 1;
            const bMatch = b.addedBy?.id === userId ? 0 : 1;
            return aMatch - bMatch;
          });
        } else if (sortKey.startsWith("tag:")) {
          const tagId = sortKey.slice(4);
          sorted.sort((a, b) => {
            const aHas = a.tags.some((t) => t.tag.id === tagId) ? 0 : 1;
            const bHas = b.tags.some((t) => t.tag.id === tagId) ? 0 : 1;
            return aHas - bHas;
          });
        }
    }
    return sorted;
  }, [listings, sortKey, showFavoritesOnly, favorites, distanceMap]);

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
                value={sortKey}
                onChange={setSortKey}
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
            </div>

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
                  nearestPinKm={distanceMap.get(l.id) ?? null}
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
              {sortedListings.length === 0 && showFavoritesOnly && (
                <div className="text-center py-12 col-span-full">
                  <p className="text-sm text-zinc-400">{t("noFavorites")}</p>
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
                    onListingClick={(id) => setSelectedId(id)}
                    onCommuteClose={() => setCommuteListingId(null)}
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
              onClick={() => setShowMobileMap(false)}
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
          <div className="flex-1">
            <ListingMapWrapper
              listings={sortedListings}
              pins={boardPins}
              favoritedIds={favorites}
              members={members}
              hoveredId={hoveredId}
              commuteListingId={commuteListingId}
              onListingClick={(id) => {
                setSelectedId(id);
                setShowMobileMap(false);
              }}
              onCommuteClose={() => setCommuteListingId(null)}
            />
          </div>
        </div>
      )}

      {/* Compare floating bar */}
      {compareMode && compareSet.size >= 2 && (
        <div className="fixed bottom-6 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-40 bg-sage-600 text-white px-4 sm:px-6 py-3 rounded-2xl shadow-xl shadow-sage-600/30 flex items-center justify-between sm:justify-start gap-4">
          <span className="text-sm font-medium">{t("selected", { count: compareSet.size })}</span>
          <button
            onClick={openCompare}
            className="px-4 py-1.5 bg-white text-sage-700 text-sm font-semibold rounded-xl hover:bg-sage-50 transition-colors"
          >
            {t("compareArrow")}
          </button>
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
