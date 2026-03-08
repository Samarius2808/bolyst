"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

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

interface ListingData {
  id: string;
  title: string;
  sourceUrl: string | null;
  price: number | null;
  size: number | null;
  location: string | null;
  description: string | null;
  imageUrls: string[];
  tags: { tag: Tag }[];
  _count: { comments: number };
}

const inputClass =
  "w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors";

const avatarColors = [
  "bg-violet-100 text-violet-600",
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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function ListingDetail({
  listingId,
  boardId,
  onClose,
}: {
  listingId: string;
  boardId: string;
  onClose: () => void;
}) {
  const [listing, setListing] = useState<ListingData | null>(null);
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
    loadData();
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
    if (!confirm("Delete this listing?")) return;
    await fetch(`/api/listings/${listingId}`, { method: "DELETE" });
    router.refresh();
    onClose();
  }

  if (!listing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm modal-backdrop">
        <div className="bg-white rounded-2xl p-8 w-full max-w-3xl mx-4 modal-content">
          <div className="space-y-4 animate-pulse">
            <div className="h-48 bg-zinc-100 rounded-xl" />
            <div className="h-6 bg-zinc-100 rounded-lg w-2/3" />
            <div className="flex gap-3">
              <div className="h-16 bg-zinc-100 rounded-xl flex-1" />
              <div className="h-16 bg-zinc-100 rounded-xl flex-1" />
              <div className="h-16 bg-zinc-100 rounded-xl flex-1" />
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
        className="bg-white rounded-2xl shadow-2xl shadow-black/10 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto modal-content modal-scroll"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors shadow-sm"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>

        {/* Image gallery */}
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
                      i === heroImage
                        ? "ring-violet-400"
                        : "ring-transparent hover:ring-zinc-300"
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
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex-1 mr-4">
              {editing ? (
                <form onSubmit={handleSave}>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, title: e.target.value }))
                      }
                      placeholder="Title *"
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
                      placeholder="URL"
                      className={inputClass}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        value={editForm.price}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, price: e.target.value }))
                        }
                        placeholder="Price (€/month)"
                        className={inputClass}
                      />
                      <input
                        type="number"
                        value={editForm.size}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, size: e.target.value }))
                        }
                        placeholder="Size (m²)"
                        step="0.1"
                        className={inputClass}
                      />
                    </div>
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          location: e.target.value,
                        }))
                      }
                      placeholder="Location"
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
                      placeholder="Notes or description"
                      rows={3}
                      className={inputClass}
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={saving || !editForm.title.trim()}
                        className="px-4 py-2 text-sm font-semibold bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-40 active:scale-[0.98] transition-all shadow-md shadow-violet-600/20"
                      >
                        {saving ? "Saving…" : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(false)}
                        className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <>
                  <h2 className="text-xl font-bold tracking-tight text-zinc-900">
                    {listing.title}
                  </h2>
                  {listing.sourceUrl && (
                    <a
                      href={listing.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-violet-500 hover:text-violet-600 transition-colors mt-0.5"
                    >
                      View original
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M6 10l4-4M7 4h-3a2 2 0 00-2 2v3M9 12h3a2 2 0 002-2V7" />
                      </svg>
                    </a>
                  )}
                </>
              )}
            </div>
            {!editing && (
              <button
                onClick={startEditing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-400 hover:text-violet-600 border border-zinc-200 rounded-lg hover:border-violet-200 transition-all"
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M11.5 2.5l2 2L5 13H3v-2l8.5-8.5z" />
                </svg>
                Edit
              </button>
            )}
          </div>

          {/* Stat cards */}
          {!editing && (listing.price != null || listing.size != null || listing.location) && (
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-zinc-50 rounded-xl px-4 py-3 text-center">
                <p className="text-[11px] uppercase tracking-wider text-zinc-400 mb-0.5">Price</p>
                <p className="text-lg font-bold text-zinc-900">
                  {listing.price != null ? `€${listing.price.toLocaleString()}` : "—"}
                </p>
              </div>
              <div className="bg-zinc-50 rounded-xl px-4 py-3 text-center">
                <p className="text-[11px] uppercase tracking-wider text-zinc-400 mb-0.5">Size</p>
                <p className="text-lg font-bold text-zinc-900">
                  {listing.size != null ? `${listing.size} m²` : "—"}
                </p>
              </div>
              <div className="bg-zinc-50 rounded-xl px-4 py-3 text-center">
                <p className="text-[11px] uppercase tracking-wider text-zinc-400 mb-0.5">Location</p>
                <p className="text-sm font-semibold text-zinc-900 truncate">
                  {listing.location || "—"}
                </p>
              </div>
            </div>
          )}

          {!editing && listing.description && (
            <p className="text-sm text-zinc-600 mb-5 whitespace-pre-wrap leading-relaxed">
              {listing.description}
            </p>
          )}

          {/* Tags */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2.5">
              Tags
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
                        ? "bg-violet-100 border-violet-200 text-violet-700"
                        : "bg-zinc-50 border-zinc-100 text-zinc-400 hover:border-zinc-200 hover:text-zinc-500"
                    }`}
                  >
                    {active && (
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
                placeholder="New tag…"
                className="border border-zinc-200 rounded-xl px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!newTagName.trim()}
                className="text-xs font-medium text-violet-600 hover:text-violet-700 disabled:opacity-40 transition-colors"
              >
                Add
              </button>
            </form>
          </div>

          {/* Comments */}
          <div className="border-t border-zinc-100 pt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
              Comments ({comments.length})
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
                      <div className="bg-zinc-50 rounded-2xl rounded-tl-md px-4 py-3">
                        <div className="flex items-baseline gap-2">
                          <span className="font-medium text-sm text-zinc-700">
                            {displayName}
                          </span>
                          <span className="text-[11px] text-zinc-300">
                            {timeAgo(c.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-500 mt-0.5">{c.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {comments.length === 0 && (
                <p className="text-xs text-zinc-300">No comments yet.</p>
              )}
            </div>

            <form onSubmit={handleAddComment} className="relative">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment…"
                className="w-full bg-zinc-50 border-0 rounded-2xl px-4 py-3 pr-12 text-sm text-zinc-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-violet-500 transition-colors"
              />
              <button
                type="submit"
                disabled={posting || !newComment.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-violet-600 hover:bg-violet-50 disabled:opacity-30 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M2.5 2L14 8l-11.5 6V9.5L9 8 2.5 6.5V2z" />
                </svg>
              </button>
            </form>
          </div>

          {/* Delete */}
          <div className="border-t border-zinc-100 mt-6 pt-4">
            <button
              onClick={handleDelete}
              className="text-xs text-red-400 hover:text-red-600 transition-colors"
            >
              Delete listing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
