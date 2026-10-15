"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type ListingStatus =
  | "NEW"
  | "VIEWING"
  | "APPLIED"
  | "REJECTED"
  | "ACCEPTED"
  | "UNAVAILABLE_TIMEFRAME"
  | "DELISTED";

interface ListingCardProps {
  id: string;
  title: string;
  price: number | null;
  size: number | null;
  location: string | null;
  sourceUrl: string | null;
  imageUrls: string[];
  status?: ListingStatus;
  commentCount: number;
  tags: { tag: { id: string; name: string } }[];
  nearestPinKm?: number | null;
  addedBy?: { id: string; name: string | null; email: string } | null;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
  favoritedBy?: { id: string; name: string | null; email: string }[];
  boardMembers?: { id: string; name: string | null; email: string }[];
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  showCommute?: boolean;
  onCommute?: () => void;
  onClick: () => void;
  onHover?: () => void;
  onHoverEnd?: () => void;
}

const statusColors: Record<ListingStatus, string> = {
  NEW: "bg-zinc-100 text-zinc-500",
  VIEWING: "bg-blue-50 text-blue-600",
  APPLIED: "bg-amber-50 text-amber-600",
  REJECTED: "bg-red-50 text-red-500",
  ACCEPTED: "bg-emerald-50 text-emerald-600",
  UNAVAILABLE_TIMEFRAME: "bg-zinc-200 text-zinc-500",
  DELISTED: "bg-zinc-200 text-zinc-500",
};

const tagColors = [
  "bg-sage-50 text-sage-600",
  "bg-blue-50 text-blue-600",
  "bg-emerald-50 text-emerald-600",
  "bg-amber-50 text-amber-700",
  "bg-rose-50 text-rose-600",
];

// Must match avatarColors in BoardHeader.tsx
const memberColors = [
  { bg: "bg-sage-100", text: "text-sage-600" },
  { bg: "bg-blue-100", text: "text-blue-600" },
  { bg: "bg-emerald-100", text: "text-emerald-600" },
  { bg: "bg-amber-100", text: "text-amber-600" },
  { bg: "bg-rose-100", text: "text-rose-600" },
];

function hashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return tagColors[Math.abs(hash) % tagColors.length];
}

export function ListingCard({
  title,
  price,
  size,
  location,
  sourceUrl,
  imageUrls,
  status = "NEW",
  commentCount,
  tags,
  nearestPinKm,
  addedBy,
  isFavorited = false,
  onToggleFavorite,
  favoritedBy = [],
  boardMembers = [],
  selectable = false,
  selected = false,
  onToggleSelect,
  showCommute = false,
  onCommute,
  onClick,
  onHover,
  onHoverEnd,
}: ListingCardProps) {
  const [imgIndex, setImgIndex] = useState(0);
  const t = useTranslations("listingCard");

  function handlePrev(e: React.MouseEvent) {
    e.stopPropagation();
    setImgIndex((i) => (i - 1 + imageUrls.length) % imageUrls.length);
  }

  function handleNext(e: React.MouseEvent) {
    e.stopPropagation();
    setImgIndex((i) => (i + 1) % imageUrls.length);
  }

  function handleFavorite(e: React.MouseEvent) {
    e.stopPropagation();
    onToggleFavorite?.();
  }

  function handleSelect(e: React.MouseEvent) {
    e.stopPropagation();
    onToggleSelect?.();
  }

  const displayName = addedBy?.name || addedBy?.email?.split("@")[0];

  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
      className={`group bg-white dark:bg-zinc-900 border rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 text-left w-full ${
        selected
          ? "border-sage-400 ring-2 ring-sage-400/30"
          : "border-zinc-100/80 dark:border-zinc-800 hover:border-sage-200/60 dark:hover:border-sage-800/60"
      }`}
    >
      {/* Image carousel */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-sage-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 overflow-hidden">
        {imageUrls.length > 0 ? (
          <img
            src={imageUrls[imgIndex]}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              className="text-sage-200"
            >
              <path d="M8 32V12a2 2 0 012-2h20a2 2 0 012 2v20a2 2 0 01-2 2H10a2 2 0 01-2-2z" />
              <path d="M14 20l4-4 8 8M24 18a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          </div>
        )}

        {/* Compare checkbox */}
        {selectable && (
          <div
            role="button"
            onClick={handleSelect}
            className={`absolute top-3 left-3 w-6 h-6 rounded-md flex items-center justify-center transition-all ${
              selected
                ? "bg-sage-600 text-white"
                : "bg-white/80 backdrop-blur-sm text-transparent hover:bg-white"
            }`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M3 8.5l3 3 7-7" />
            </svg>
          </div>
        )}

        {/* Favorite heart */}
        {onToggleFavorite && (
          <div
            role="button"
            onClick={handleFavorite}
            className={`absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
              isFavorited
                ? "bg-rose-500 text-white"
                : "bg-white/80 backdrop-blur-sm text-zinc-400 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 hover:text-rose-500 hover:bg-white"
            }`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill={isFavorited ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M8 14s-5.5-3.5-5.5-7.5C2.5 4 4.5 2 6.5 2c1.1 0 2.1.5 2.5 1.5C9.4 2.5 10.4 2 11.5 2c2 0 3.5 1.5 3.5 3.5S13.5 10.5 8 14z" />
            </svg>
          </div>
        )}

        {/* Carousel arrows */}
        {imageUrls.length > 1 && (
          <>
            <div
              role="button"
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 lg:w-7 lg:h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity hover:bg-white shadow-md text-zinc-700"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M10 4l-4 4 4 4" />
              </svg>
            </div>
            <div
              role="button"
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 lg:w-7 lg:h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity hover:bg-white shadow-md text-zinc-700"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M6 4l4 4-4 4" />
              </svg>
            </div>
            {/* Dots */}
            <div className="absolute bottom-3 right-3 flex gap-1">
              {imageUrls.map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === imgIndex ? "bg-white" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Inactive overlay (delisted / unavailable in time frame) */}
        {(status === "DELISTED" || status === "UNAVAILABLE_TIMEFRAME") && (
          <div className="absolute inset-0 bg-zinc-900/40 flex items-center justify-center">
            <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-bold text-zinc-600 uppercase tracking-wide text-center">
              {t(`status.${status}`)}
            </span>
          </div>
        )}

        {/* Price overlay */}
        {price != null && (
          <span className="absolute bottom-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-sm font-bold text-zinc-900 shadow-sm">
            &euro;{price.toLocaleString()}/mo
          </span>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <h3
            className="font-semibold text-[13px] text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-1 group-hover:text-sage-600 transition-colors flex-1 min-w-0"
            title={title}
          >
            {title}
          </h3>
          {status && status !== "NEW" && (
            <span
              className={`px-2 py-0.5 text-[10px] font-semibold rounded-full flex-shrink-0 ${statusColors[status]}`}
            >
              {t(`status.${status}`)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5 mt-1.5 text-xs text-zinc-400 dark:text-zinc-500">
          {size != null && <span>{size} m&sup2;</span>}
          {location && (
            <span className="truncate flex items-center gap-1">
              <svg
                width="11"
                height="11"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6C3.5 9.5 8 14.5 8 14.5C8 14.5 12.5 9.5 12.5 6C12.5 3.5 10.5 1.5 8 1.5Z" />
              </svg>
              {location}
            </span>
          )}
          {nearestPinKm != null && (
            <span className="flex items-center gap-1 text-sage-500 font-medium">
              <span className="text-[10px]">★</span>
              {nearestPinKm < 1 ? `${Math.round(nearestPinKm * 1000)}m` : `${nearestPinKm} km`}
            </span>
          )}
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {tags.slice(0, 2).map((t) => (
              <span
                key={t.tag.id}
                className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${hashColor(t.tag.name)}`}
              >
                {t.tag.name}
              </span>
            ))}
            {tags.length > 2 && (
              <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                +{tags.length - 2}
              </span>
            )}
          </div>
        )}

        {favoritedBy.length > 0 && (
          <div className="flex items-center gap-1 mt-2">
            {favoritedBy.map((u) => {
              const name = u.name || u.email.split("@")[0];
              const memberIdx = boardMembers.findIndex((m) => m.id === u.id);
              const color = memberColors[memberIdx !== -1 ? memberIdx % memberColors.length : 0];
              return (
                <span
                  key={u.id}
                  title={t("likedThis", { name })}
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${color.bg} ${color.text}`}
                >
                  <svg width="8" height="8" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 14s-5.5-3.5-5.5-7.5C2.5 4 4.5 2 6.5 2c1.1 0 2.1.5 2.5 1.5C9.4 2.5 10.4 2 11.5 2c2 0 3.5 1.5 3.5 3.5S13.5 10.5 8 14z" />
                  </svg>
                  {name.split(" ")[0]}
                </span>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-zinc-50 dark:border-zinc-800 text-xs text-zinc-300 dark:text-zinc-600">
          <div className="flex items-center gap-1.5">
            {sourceUrl ? (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-sage-400 hover:bg-sage-50 hover:text-sage-600 transition-colors text-[11px] font-medium"
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M6 10l4-4M7 4h-3a2 2 0 00-2 2v3M9 12h3a2 2 0 002-2V7" />
                </svg>
                {t("link")}
              </a>
            ) : (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-medium text-zinc-300">
                {t("manual")}
              </span>
            )}
            {showCommute && (
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCommute?.();
                }}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-sage-400 hover:bg-sage-50 hover:text-sage-600 transition-colors text-[11px] font-medium"
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="6" cy="19" r="3" />
                  <circle cx="18" cy="5" r="3" />
                  <path d="M12 19h4.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H12" />
                </svg>
                {t("commute")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {displayName && (
              <span
                className="text-zinc-300 truncate max-w-[80px] text-[11px]"
                title={addedBy?.name || addedBy?.email || ""}
              >
                {displayName}
              </span>
            )}
            {commentCount > 0 && (
              <span className="inline-flex items-center gap-1 text-zinc-400">
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M2 4a2 2 0 012-2h8a2 2 0 012 2v5a2 2 0 01-2 2H6l-3 3V4z" />
                </svg>
                {commentCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
