"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LocationInput } from "@/components/ui/LocationInput";

interface Tag {
  id: string;
  name: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
}

type ListingStatus = "NEW" | "VIEWING" | "APPLIED" | "REJECTED" | "ACCEPTED" | "DELISTED";

interface ListingData {
  id: string;
  title: string;
  sourceUrl: string | null;
  price: number | null;
  size: number | null;
  location: string | null;
  description: string | null;
  imageUrls: string[];
  status: ListingStatus;
  tags: { tag: Tag }[];
  addedBy: { id: string; name: string | null; email: string } | null;
  _count: { comments: number };
}

const statusColorMap: Record<ListingStatus, string> = {
  NEW: "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
  VIEWING:
    "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  APPLIED:
    "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  REJECTED:
    "bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400 border-red-200 dark:border-red-800",
  ACCEPTED:
    "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  DELISTED:
    "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 border-zinc-300 dark:border-zinc-600",
};

const inputClass =
  "w-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-colors";

const avatarColors = [
  "bg-sage-100 text-sage-600",
  "bg-blue-100 text-blue-600",
  "bg-emerald-100 text-emerald-600",
  "bg-amber-100 text-amber-600",
  "bg-rose-100 text-rose-600",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export function ListingDetail({
  listingId,
  boardId,
  initialData,
  onClose,
}: {
  listingId: string;
  boardId: string;
  initialData?: Partial<ListingData> | null;
  onClose: () => void;
}) {
  const [listing, setListing] = useState<ListingData | null>(
    initialData
      ? {
          id: listingId,
          title: initialData.title || "",
          sourceUrl: initialData.sourceUrl ?? null,
          price: initialData.price ?? null,
          size: initialData.size ?? null,
          location: initialData.location ?? null,
          description: initialData.description ?? null,
          imageUrls: initialData.imageUrls || [],
          status: initialData.status || "NEW",
          tags: initialData.tags || [],
          addedBy: initialData.addedBy ?? null,
          _count: initialData._count || { comments: 0 },
        }
      : null,
  );
  const [comments, setComments] = useState<Comment[]>([]);
  const [boardTags, setBoardTags] = useState<Tag[]>([]);
  const [newComment, setNewComment] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [posting, setPosting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [heroImage, setHeroImage] = useState(0);
  const [editForm, setEditForm] = useState({
    title: "",
    sourceUrl: "",
    price: "",
    size: "",
    location: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const t = useTranslations("listingDetail");
  const ts = useTranslations("listingCard.status");
  const tt = useTranslations("time");

  const timeAgo = useCallback(
    (dateStr: string): string => {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return tt("justNow");
      if (mins < 60) return tt("minutesAgo", { count: mins });
      const hours = Math.floor(mins / 60);
      if (hours < 24) return tt("hoursAgo", { count: hours });
      const days = Math.floor(hours / 24);
      if (days < 7) return tt("daysAgo", { count: days });
      return new Date(dateStr).toLocaleDateString();
    },
    [tt],
  );

  const loadData = useCallback(async () => {
    const [listingRes, commentsRes, tagsRes] = await Promise.all([
      fetch(`/api/listings/${listingId}`),
      fetch(`/api/listings/${listingId}/comments`),
      fetch(`/api/tags?boardId=${boardId}`),
    ]);
    if (listingRes.ok) setListing(await listingRes.json());
    if (commentsRes.ok) setComments(await commentsRes.json());
    if (tagsRes.ok) setBoardTags(await tagsRes.json());
  }, [listingId, boardId]);

  useEffect(() => {
    loadData(); // eslint-disable-line react-hooks/set-state-in-effect -- data fetching is the intended pattern
  }, [loadData]);

  function startEditing() {
    if (!listing) return;
    setEditForm({
      title: listing.title,
      sourceUrl: listing.sourceUrl ?? "",
      price: listing.price != null ? String(listing.price) : "",
      size: listing.size != null ? String(listing.size) : "",
      location: listing.location ?? "",
      description: listing.description ?? "",
    });
    setEditing(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editForm.title.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/listings/${listingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editForm.title,
        sourceUrl: editForm.sourceUrl || null,
        price: editForm.price || null,
        size: editForm.size || null,
        location: editForm.location || null,
        description: editForm.description || null,
      }),
    });
    if (res.ok) {
      setEditing(false);
      await loadData();
      router.refresh();
    }
    setSaving(false);
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setPosting(true);
    const res = await fetch(`/api/listings/${listingId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newComment }),
    });
    if (res.ok) {
      const comment = await res.json();
      setComments((prev) => [...prev, comment]);
      setNewComment("");
      router.refresh();
    }
    setPosting(false);
  }

  async function handleToggleTag(tag: Tag) {
    const hasTag = listing?.tags.some((t) => t.tag.id === tag.id);
    if (hasTag) {
      await fetch(`/api/listings/${listingId}/tags`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId: tag.id }),
      });
    } else {
      await fetch(`/api/listings/${listingId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId: tag.id }),
      });
    }
    await loadData();
    router.refresh();
  }

  async function handleCreateTag(e: React.FormEvent) {
    e.preventDefault();
    if (!newTagName.trim()) return;
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boardId, name: newTagName }),
    });
    if (res.ok) {
      setNewTagName("");
      await loadData();
    }
  }

  async function handleDelete() {
    if (!confirm(t("deleteConfirm"))) return;
    await fetch(`/api/listings/${listingId}`, { method: "DELETE" });
    router.refresh();
    onClose();
  }

  const statusValues: ListingStatus[] = [
    "NEW",
    "VIEWING",
    "APPLIED",
    "REJECTED",
    "ACCEPTED",
    "DELISTED",
  ];

  if (!listing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm modal-backdrop">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 w-full max-w-3xl mx-4 modal-content">
          <div className="space-y-4 animate-pulse">
            <div className="h-48 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
            <div className="h-6 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-2/3" />
            <div className="flex gap-3">
              <div className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex-1" />
              <div className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex-1" />
              <div className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex-1" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm modal-backdrop"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl shadow-black/10 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto modal-content modal-scroll"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors shadow-sm"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>

        {!editing && listing.imageUrls?.length > 0 && (
          <div className="p-4 pb-0">
            <img
              src={listing.imageUrls[heroImage] || listing.imageUrls[0]}
              alt={listing.title}
              className="w-full aspect-[16/9] object-cover rounded-xl"
            />
            {listing.imageUrls.length > 1 && (
              <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                {listing.imageUrls.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setHeroImage(i)}
                    className={`w-16 h-16 rounded-lg object-cover flex-shrink-0 overflow-hidden ring-2 transition-all ${
                      i === heroImage ? "ring-sage-400" : "ring-transparent hover:ring-zinc-300"
                    }`}
                  >
                    <img
                      src={url}
                      alt={`${listing.title} ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div className="flex-1 mr-4">
              {editing ? (
                <form onSubmit={handleSave}>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder={t("titlePlaceholder")}
                      className={inputClass}
                      autoFocus
                    />
                    <input
                      type="url"
                      value={editForm.sourceUrl}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          sourceUrl: e.target.value,
                        }))
                      }
                      placeholder={t("urlPlaceholder")}
                      className={inputClass}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="number"
                        value={editForm.price}
                        onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                        placeholder={t("pricePlaceholder")}
                        className={inputClass}
                      />
                      <input
                        type="number"
                        value={editForm.size}
                        onChange={(e) => setEditForm((f) => ({ ...f, size: e.target.value }))}
                        placeholder={t("sizePlaceholder")}
                        step="0.1"
                        className={inputClass}
                      />
                    </div>
                    <LocationInput
                      value={editForm.location}
                      onChange={(val) =>
                        setEditForm((f) => ({
                          ...f,
                          location: val,
                        }))
                      }
                      placeholder={t("locationPlaceholder")}
                      className={inputClass}
                    />
                    <textarea
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          description: e.target.value,
                        }))
                      }
                      placeholder={t("descriptionPlaceholder")}
                      rows={3}
                      className={inputClass}
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={saving || !editForm.title.trim()}
                        className="px-4 py-2 text-sm font-semibold bg-sage-600 text-white rounded-xl hover:bg-sage-700 disabled:opacity-40 active:scale-[0.98] transition-all shadow-md shadow-sage-600/20"
                      >
                        {saving ? t("saving") : t("save")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(false)}
                        className="px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                      >
                        {t("cancel")}
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <>
                  <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                    {listing.title}
                  </h2>
                  <div className="flex items-center gap-3 mt-1">
                    {listing.sourceUrl && (
                      <a
                        href={listing.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-sage-500 hover:text-sage-600 transition-colors"
                      >
                        {t("viewOriginal")}
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path d="M6 10l4-4M7 4h-3a2 2 0 00-2 2v3M9 12h3a2 2 0 002-2V7" />
                        </svg>
                      </a>
                    )}
                    {listing.addedBy && (
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">
                        {t("addedBy", {
                          name: listing.addedBy.name || listing.addedBy.email.split("@")[0],
                        })}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
            {!editing && (
              <button
                onClick={startEditing}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 sm:py-1.5 text-sm text-zinc-400 dark:text-zinc-500 hover:text-sage-600 dark:hover:text-sage-400 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-sage-200 dark:hover:border-sage-800 transition-all"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M11.5 2.5l2 2L5 13H3v-2l8.5-8.5z" />
                </svg>
                {t("edit")}
              </button>
            )}
          </div>

          {!editing && (listing.price != null || listing.size != null || listing.location) && (
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl px-4 py-3 text-center">
                <p className="text-[11px] uppercase tracking-wider text-zinc-400 mb-0.5">
                  {t("price")}
                </p>
                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {listing.price != null ? `€${listing.price.toLocaleString()}` : "—"}
                </p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl px-4 py-3 text-center">
                <p className="text-[11px] uppercase tracking-wider text-zinc-400 mb-0.5">
                  {t("size")}
                </p>
                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {listing.size != null ? `${listing.size} m²` : "—"}
                </p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl px-4 py-3 text-center">
                <p className="text-[11px] uppercase tracking-wider text-zinc-400 mb-0.5">
                  {t("location")}
                </p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {listing.location || "—"}
                </p>
              </div>
            </div>
          )}

          {!editing && (
            <div className="mb-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2.5">
                {t("status")}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {statusValues.map((val) => (
                  <button
                    key={val}
                    onClick={() => {
                      const prev = listing.status;
                      setListing({ ...listing, status: val });
                      fetch(`/api/listings/${listingId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: val }),
                      }).then((res) => {
                        if (!res.ok) setListing({ ...listing, status: prev });
                        router.refresh();
                      });
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                      listing.status === val
                        ? statusColorMap[val]
                        : "bg-white dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 hover:border-zinc-200 dark:hover:border-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400"
                    }`}
                  >
                    {ts(val)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!editing && listing.description && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-5 whitespace-pre-wrap leading-relaxed">
              {listing.description}
            </p>
          )}

          <div className="mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2.5">
              {t("tags")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {boardTags.map((tag) => {
                const active = listing.tags.some((t) => t.tag.id === tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => handleToggleTag(tag)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-150 ${
                      active
                        ? "bg-sage-100 dark:bg-sage-950/40 border-sage-200 dark:border-sage-800 text-sage-700 dark:text-sage-400"
                        : "bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 hover:border-zinc-200 dark:hover:border-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400"
                    }`}
                  >
                    {active && (
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
                    )}
                    {tag.name}
                  </button>
                );
              })}
            </div>
            <form onSubmit={handleCreateTag} className="flex gap-2 mt-2.5">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder={t("newTagPlaceholder")}
                className="border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!newTagName.trim()}
                className="text-xs font-medium text-sage-600 hover:text-sage-700 disabled:opacity-40 transition-colors"
              >
                {t("add")}
              </button>
            </form>
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">
              {t("comments")} ({comments.length})
            </h3>

            <div className="space-y-3 mb-4">
              {comments.map((c) => {
                const displayName = c.user.name || c.user.email;
                const initial = (displayName[0] || "?").toUpperCase();
                return (
                  <div key={c.id} className="flex gap-3">
                    <div
                      className={`w-8 h-8 rounded-full ${getAvatarColor(displayName)} text-xs font-semibold flex items-center justify-center flex-shrink-0`}
                    >
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl rounded-tl-md px-4 py-3">
                        <div className="flex items-baseline gap-2">
                          <span className="font-medium text-sm text-zinc-700 dark:text-zinc-300">
                            {displayName}
                          </span>
                          <span className="text-[11px] text-zinc-300 dark:text-zinc-600">
                            {timeAgo(c.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {c.content}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {comments.length === 0 && (
                <p className="text-xs text-zinc-300 dark:text-zinc-600">{t("noComments")}</p>
              )}
            </div>

            <form onSubmit={handleAddComment} className="relative">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t("addComment")}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border-0 rounded-2xl px-4 py-3 pr-12 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-2 focus:ring-sage-500 transition-colors"
              />
              <button
                type="submit"
                disabled={posting || !newComment.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-sage-600 hover:bg-sage-50 disabled:opacity-30 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M2.5 2L14 8l-11.5 6V9.5L9 8 2.5 6.5V2z" />
                </svg>
              </button>
            </form>
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800 mt-6 pt-4">
            <button
              onClick={handleDelete}
              className="text-xs text-red-400 hover:text-red-600 transition-colors"
            >
              {t("deleteListing")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
