"use client";

import { useState } from "react";
import { ListingCard } from "./ListingCard";
import { AddListingModal } from "./AddListingModal";
import { ListingDetail } from "./ListingDetail";
import { ListingMapWrapper } from "./ListingMapWrapper";

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
  tags: { tag: { id: string; name: string } }[];
  _count: { comments: number };
}

export function ListingGrid({
  boardId,
  listings,
}: {
  boardId: string;
  listings: Listing[];
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const hasGeocodedListings = listings.some(
    (l) => l.latitude != null && l.longitude != null
  );

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        {listings.length > 0 ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 text-zinc-500 rounded-full text-xs font-medium">
            {listings.length} listing{listings.length !== 1 ? "s" : ""}
          </span>
        ) : (
          <span />
        )}
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold bg-violet-600 text-white rounded-xl hover:bg-violet-700 active:scale-[0.98] transition-all duration-150 shadow-md shadow-violet-600/20"
        >
          + Add listing
        </button>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-24 bg-white border border-zinc-100/80 rounded-2xl">
          <svg
            className="mx-auto mb-5 text-violet-200"
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
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold bg-violet-600 text-white rounded-xl hover:bg-violet-700 active:scale-[0.98] transition-all duration-150 shadow-md shadow-violet-600/20"
          >
            + Add listing
          </button>
        </div>
      ) : (
        <div
          className={
            hasGeocodedListings
              ? "flex gap-6 items-start"
              : ""
          }
        >
          {/* Listing cards */}
          <div
            className={
              hasGeocodedListings
                ? "flex-1 min-w-0 columns-1 sm:columns-2 gap-5 [&>*]:mb-5 [&>*]:break-inside-avoid"
                : "columns-1 sm:columns-2 lg:columns-3 gap-5 [&>*]:mb-5 [&>*]:break-inside-avoid"
            }
          >
            {listings.map((l) => (
              <ListingCard
                key={l.id}
                id={l.id}
                title={l.title}
                price={l.price}
                size={l.size}
                location={l.location}
                sourceUrl={l.sourceUrl}
                imageUrls={l.imageUrls}
                tags={l.tags}
                commentCount={l._count.comments}
                onClick={() => setSelectedId(l.id)}
              />
            ))}
          </div>

          {/* Sticky map on the right (desktop only) */}
          {hasGeocodedListings && (
            <div className="hidden lg:block w-[480px] flex-shrink-0 sticky top-6 h-[calc(100vh-8rem)]">
              <ListingMapWrapper
                listings={listings}
                onListingClick={(id) => setSelectedId(id)}
              />
            </div>
          )}
        </div>
      )}

      {showAdd && (
        <AddListingModal boardId={boardId} onClose={() => setShowAdd(false)} />
      )}

      {selectedId && (
        <ListingDetail
          listingId={selectedId}
          boardId={boardId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  );
}
