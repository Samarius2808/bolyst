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
        {listings.length > 0 ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 text-zinc-500 rounded-full text-xs font-medium">
            {listings.length} listing{listings.length !== 1 ? "s" : ""}
          </span>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2.5">
          {listings.length > 0 && (
            <div className="flex border border-zinc-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setView("grid")}
                className={`px-3 py-2 transition-all ${
                  view === "grid"
                    ? "bg-violet-100 text-violet-600"
                    : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50"
                }`}
                title="Grid view"
              >
                <svg
                  width="15"
                  height="15"
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
                className={`px-3 py-2 transition-all ${
                  view === "map"
                    ? "bg-violet-100 text-violet-600"
                    : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50"
                }`}
                title="Map view"
              >
                <svg
                  width="15"
                  height="15"
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
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold bg-violet-600 text-white rounded-xl hover:bg-violet-700 active:scale-[0.98] transition-all duration-150 shadow-md shadow-violet-600/20"
          >
            + Add listing
          </button>
        </div>
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
      ) : view === "grid" ? (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 [&>*]:mb-5 [&>*]:break-inside-avoid">
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
