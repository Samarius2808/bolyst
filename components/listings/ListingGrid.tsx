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
  const [view, setView] = useState<"grid" | "map">("grid");

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          {listings.length > 0
            ? `${listings.length} listing${listings.length !== 1 ? "s" : ""}`
            : "No listings yet"}
        </h2>
        <div className="flex items-center gap-2">
          {listings.length > 0 && (
            <div className="flex border border-zinc-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setView("grid")}
                className={`px-3 py-2 text-sm transition-colors ${
                  view === "grid"
                    ? "bg-violet-600 text-white"
                    : "text-zinc-500 hover:bg-zinc-50"
                }`}
                title="Grid view"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="1" y="1" width="5.5" height="5.5" rx="1" />
                  <rect x="9.5" y="1" width="5.5" height="5.5" rx="1" />
                  <rect x="1" y="9.5" width="5.5" height="5.5" rx="1" />
                  <rect x="9.5" y="9.5" width="5.5" height="5.5" rx="1" />
                </svg>
              </button>
              <button
                onClick={() => setView("map")}
                className={`px-3 py-2 text-sm transition-colors ${
                  view === "map"
                    ? "bg-violet-600 text-white"
                    : "text-zinc-500 hover:bg-zinc-50"
                }`}
                title="Map view"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6C3.5 9.5 8 14.5 8 14.5C8 14.5 12.5 9.5 12.5 6C12.5 3.5 10.5 1.5 8 1.5Z" />
                  <circle cx="8" cy="6" r="2" />
                </svg>
              </button>
            </div>
          )}
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2.5 text-sm font-medium bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors shadow-sm"
          >
            + Add listing
          </button>
        </div>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-20 bg-white border border-zinc-100 rounded-2xl">
          <p className="text-zinc-500 mb-1">
            Add your first listing to start comparing.
          </p>
          <p className="text-sm text-zinc-400">
            Paste a URL or enter details manually.
          </p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
      ) : (
        <ListingMapWrapper
          listings={listings}
          onListingClick={(id) => setSelectedId(id)}
        />
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
