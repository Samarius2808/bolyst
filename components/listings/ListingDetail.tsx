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
  "w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent";

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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-2xl p-8 text-sm text-zinc-400">
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
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
                        className="px-4 py-2 text-sm font-medium bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-40 transition-colors"
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
                      className="text-sm text-violet-500 hover:text-violet-600 transition-colors"
                    >
                      View original &rarr;
                    </a>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!editing && (
                <button
                  onClick={startEditing}
                  className="px-3 py-1.5 text-sm text-zinc-400 hover:text-violet-600 border border-zinc-200 rounded-lg hover:border-violet-200 transition-colors"
                >
                  Edit
                </button>
              )}
              <button
                onClick={onClose}
                className="text-zinc-300 hover:text-zinc-500 text-xl leading-none transition-colors"
              >
                &times;
              </button>
            </div>
          </div>

          {/* Images */}
          {!editing && listing.imageUrls?.length > 0 && (
            <div className="flex gap-2 overflow-x-auto mb-5 -mx-6 px-6 pb-1">
              {listing.imageUrls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`${listing.title} ${i + 1}`}
                  className="h-40 rounded-xl object-cover flex-shrink-0"
                />
              ))}
            </div>
          )}

          {/* Details (view mode) */}
          {!editing && (
            <>
              <div className="flex items-baseline gap-4 mb-5">
                {listing.price != null && (
                  <span className="text-lg font-bold text-zinc-900">
                    &euro;{listing.price.toLocaleString()}/mo
                  </span>
                )}
                {listing.size != null && (
                  <span className="text-sm text-zinc-400">
                    {listing.size} m&sup2;
                  </span>
                )}
                {listing.location && (
                  <span className="text-sm text-zinc-400">
                    {listing.location}
                  </span>
                )}
              </div>

              {listing.description && (
                <p className="text-sm text-zinc-500 mb-5 whitespace-pre-wrap leading-relaxed">
                  {listing.description}
                </p>
              )}
            </>
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
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-150 ${
                      active
                        ? "bg-violet-100 border-violet-200 text-violet-700"
                        : "bg-zinc-50 border-zinc-100 text-zinc-400 hover:border-zinc-200 hover:text-zinc-500"
                    }`}
                  >
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

            <div className="space-y-2.5 mb-4">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="text-sm bg-zinc-50 rounded-xl px-4 py-3"
                >
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-zinc-700">
                      {c.user.name || c.user.email}
                    </span>
                    <span className="text-xs text-zinc-300">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-zinc-500 mt-0.5">{c.content}</p>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-xs text-zinc-300">No comments yet.</p>
              )}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment…"
                className="flex-1 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={posting || !newComment.trim()}
                className="px-4 py-2.5 text-sm font-medium bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-40 transition-colors"
              >
                Post
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
