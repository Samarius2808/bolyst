"use client";

interface ListingCardProps {
  id: string;
  title: string;
  price: number | null;
  size: number | null;
  location: string | null;
  sourceUrl: string | null;
  imageUrls: string[];
  commentCount: number;
  tags: { tag: { id: string; name: string } }[];
  onClick: () => void;
}

export function ListingCard({
  title,
  price,
  size,
  location,
  sourceUrl,
  imageUrls,
  commentCount,
  tags,
  onClick,
}: ListingCardProps) {
  return (
    <button
      onClick={onClick}
      className="group bg-white border border-zinc-100 rounded-2xl overflow-hidden hover:shadow-lg hover:border-zinc-200 transition-all duration-200 text-left w-full"
    >
      {imageUrls.length > 0 && (
        <div className="w-full h-40 bg-zinc-100 overflow-hidden">
          <img
            src={imageUrls[0]}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-5">
      <h3 className="font-semibold text-sm text-zinc-900 truncate group-hover:text-violet-600 transition-colors">
        {title}
      </h3>

      <div className="mt-2.5 space-y-1">
        {price != null && (
          <p className="text-base font-bold text-zinc-900">
            &euro;{price.toLocaleString()}/mo
          </p>
        )}
        <div className="flex gap-3 text-sm text-zinc-400">
          {size != null && <span>{size} m&sup2;</span>}
          {location && <span className="truncate">{location}</span>}
        </div>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {tags.map((t) => (
            <span
              key={t.tag.id}
              className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-violet-50 text-violet-600"
            >
              {t.tag.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-50 text-xs text-zinc-300">
        {sourceUrl ? (
          <span className="text-violet-400">Has link</span>
        ) : (
          <span>Manual</span>
        )}
        {commentCount > 0 && (
          <span>
            {commentCount} comment{commentCount !== 1 && "s"}
          </span>
        )}
      </div>
      </div>
    </button>
  );
}
