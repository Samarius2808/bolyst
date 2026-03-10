"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
  const [showAdd, setShowAdd] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [boardPins, setBoardPins] = useState<BoardPin[]>(pins);
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set(favoritedIds));
  const [compareMode, setCompareMode] = useState(false);
  const [compareSet, setCompareSet] = useState<Set<string>>(new Set());

  const hasGeocodedListings = listings.some(
    (l) => l.latitude != null && l.longitude != null
  );

  // Compute distances once
  const distanceMap = useMemo(() => {
    const map = new Map<string, number | null>();
    for (const l of listings) {
      map.set(
        l.id,
        l.latitude != null && l.longitude != null
          ? nearestPinDistance(l.latitude, l.longitude, boardPins)
          : null
      );
    }
    return map;
  }, [listings, boardPins]);

  // Filter + sort
  const sortedListings = useMemo(() => {
    let filtered = showFavoritesOnly
      ? listings.filter((l) => favorites.has(l.id))
      : listings;

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
        const ppm2 = (l: Listing) =>
          l.price != null && l.size ? l.price / l.size : Infinity;
        sorted.sort((a, b) => ppm2(a) - ppm2(b));
        break;
      }
      case "ppm2-desc": {
        const ppm2d = (l: Listing) =>
          l.price != null && l.size ? l.price / l.size : -1;
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
          (a, b) => (distanceMap.get(a.id) ?? Infinity) - (distanceMap.get(b.id) ?? Infinity)
        );
        break;
      case "status": {
        const statusOrder: Record<string, number> = {
          NEW: 0, VIEWING: 1, APPLIED: 2, ACCEPTED: 3, REJECTED: 4, DELISTED: 5,
        };
        sorted.sort((a, b) => (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99));
        break;
      }
      default:
        if (sortKey.startsWith("addedby:")) {
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
    // Optimistic update
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
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {listings.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 text-zinc-500 rounded-full text-xs font-medium">
              {showFavoritesOnly
                ? `${sortedListings.length} favorite${sortedListings.length !== 1 ? "s" : ""}`
                : `${listings.length} listing${listings.length !== 1 ? "s" : ""}`}
            </span>
          )}
          {listings.length > 0 && (
            <>
              <SortControls
                value={sortKey}
                onChange={setSortKey}
                hasPins={boardPins.length > 0}
                boardTags={boardTags}
                members={members}
              />
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  showFavoritesOnly
                    ? "bg-rose-50 border-rose-200 text-rose-600"
                    : "bg-white border-zinc-200 text-zinc-400 hover:text-zinc-600"
                }`}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill={showFavoritesOnly ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 14s-5.5-3.5-5.5-7.5C2.5 4 4.5 2 6.5 2c1.1 0 2.1.5 2.5 1.5C9.4 2.5 10.4 2 11.5 2c2 0 3.5 1.5 3.5 3.5S13.5 10.5 8 14z" />
                </svg>
                Favorites
              </button>
              <button
                onClick={() => {
                  setCompareMode(!compareMode);
                  if (compareMode) setCompareSet(new Set());
                }}
                className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  compareMode
                    ? "bg-sage-50 border-sage-200 text-sage-600"
                    : "bg-white border-zinc-200 text-zinc-400 hover:text-zinc-600"
                }`}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="1" y="3" width="5" height="10" rx="1" />
                  <rect x="10" y="3" width="5" height="10" rx="1" />
                </svg>
                Compare
              </button>
            </>
          )}
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold bg-sage-600 text-white rounded-xl hover:bg-sage-700 active:scale-[0.98] transition-all duration-150 shadow-md shadow-sage-600/20"
        >
          + Add listing
        </button>
      </div>

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
          <h3 className="text-lg font-semibold text-zinc-700 mb-2">
            No listings yet
          </h3>
          <p className="text-sm text-zinc-400 mb-6 max-w-xs mx-auto">
            Paste a URL or add details manually to save your first apartment.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold bg-sage-600 text-white rounded-xl hover:bg-sage-700 active:scale-[0.98] transition-all duration-150 shadow-md shadow-sage-600/20"
          >
            + Add listing
          </button>
        </div>
      ) : (
        <div
          className={
            hasGeocodedListings ? "flex gap-6 items-start" : ""
          }
        >
          {/* Listing cards */}
          <div
            className={
              hasGeocodedListings
                ? "flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-5 items-start"
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
                selectable={compareMode}
                selected={compareSet.has(l.id)}
                onToggleSelect={() => toggleCompare(l.id)}
                onClick={() => setSelectedId(l.id)}
              />
            ))}
            {sortedListings.length === 0 && showFavoritesOnly && (
              <div className="text-center py-12 col-span-full">
                <p className="text-sm text-zinc-400">No favorites yet. Click the heart on a listing to save it.</p>
              </div>
            )}
          </div>

          {/* Sticky map on the right (desktop only) */}
          {hasGeocodedListings && (
            <div className="hidden lg:block w-[480px] flex-shrink-0 sticky top-6 space-y-3">
              <PinManager
                boardId={boardId}
                pins={boardPins}
                onPinsChange={setBoardPins}
              />
              <div className="h-[calc(100vh-14rem)]">
                <ListingMapWrapper
                  listings={sortedListings}
                  pins={boardPins}
                  favoritedIds={favorites}
                  members={members}
                  onListingClick={(id) => setSelectedId(id)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Compare floating bar */}
      {compareMode && compareSet.size >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-sage-600 text-white px-6 py-3 rounded-2xl shadow-xl shadow-sage-600/30 flex items-center gap-4">
          <span className="text-sm font-medium">
            {compareSet.size} selected
          </span>
          <button
            onClick={openCompare}
            className="px-4 py-1.5 bg-white text-sage-700 text-sm font-semibold rounded-xl hover:bg-sage-50 transition-colors"
          >
            Compare →
          </button>
        </div>
      )}

      {showAdd && (
        <AddListingModal boardId={boardId} boardTags={boardTags} onClose={() => setShowAdd(false)} />
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
