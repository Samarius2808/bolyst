"use client";

import { useState } from "react";
import { ListingCard } from "./ListingCard";
import { AddListingModal } from "./AddListingModal";
import { ListingDetail } from "./ListingDetail";

interface Listing {
  id: string;
  title: string;
  price: number | null;
  size: number | null;
  location: string | null;
  sourceUrl: string | null;
  imageUrls: string[];
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

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          {listings.length > 0
            ? `${listings.length} listing${listings.length !== 1 ? "s" : ""}`
            : "No listings yet"}
        </h2>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2.5 text-sm font-medium bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors shadow-sm"
        >
          + Add listing
        </button>
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
      ) : (
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
