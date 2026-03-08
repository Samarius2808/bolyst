"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddListingModal({
  boardId,
  onClose,
}: {
  boardId: string;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"url" | "manual">("url");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [price, setPrice] = useState("");
  const [size, setSize] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState("");
  const [scraped, setScraped] = useState(false);
  const router = useRouter();

  async function handleScrape(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setScraping(true);
    setScrapeError("");

    const res = await fetch("/api/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (res.ok) {
      const data = await res.json();
      setTitle(data.title || "");
      setSourceUrl(data.sourceUrl || url);
      setPrice(data.price != null ? String(data.price) : "");
      setSize(data.size != null ? String(data.size) : "");
      setLocation(data.location || "");
      setDescription(data.description || "");
      setImageUrls(data.imageUrls || []);
      setScraped(true);
      setMode("manual");
    } else {
      const data = await res.json();
      setScrapeError(data.error || "Could not extract data from this URL.");
    }

    setScraping(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boardId,
        title,
        sourceUrl: sourceUrl || undefined,
        price: price || undefined,
        size: size || undefined,
        location: location || undefined,
        description: description || undefined,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      }),
    });

    if (res.ok) {
      router.refresh();
      onClose();
    }
    setLoading(false);
  }

  const inputClass =
    "w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm modal-backdrop"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl shadow-black/10 p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto modal-content modal-scroll"
      >
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900">
            Add a listing
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex bg-zinc-100 rounded-xl p-1 mb-5">
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              mode === "url"
                ? "bg-white shadow-sm text-zinc-900"
                : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            Paste URL
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              mode === "manual"
                ? "bg-white shadow-sm text-zinc-900"
                : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            Manual entry
          </button>
        </div>

        {mode === "url" ? (
          <form onSubmit={handleScrape}>
            <p className="text-sm text-zinc-400 mb-3">
              Paste a listing URL to auto-fill details.
            </p>
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setScrapeError("");
              }}
              placeholder="https://..."
              autoFocus
              className={inputClass}
            />
            {scrapeError && (
              <p className="text-xs text-red-500 mt-2">{scrapeError}</p>
            )}
            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={scraping || !url.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-40 active:scale-[0.98] transition-all shadow-md shadow-violet-600/20"
              >
                {scraping && (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {scraping ? "Extracting…" : "Extract"}
              </button>
            </div>
          </form>
        ) : (
          <>
            {scraped && (
              <p className="text-xs text-emerald-500 mb-3 inline-flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 8.5l3 3 7-7" />
                </svg>
                Data extracted from URL
              </p>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-3">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title *"
                  autoFocus
                  className={inputClass}
                />
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="URL (optional)"
                  className={inputClass}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Price (€/month)"
                    className={inputClass}
                  />
                  <input
                    type="number"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="Size (m²)"
                    step="0.1"
                    className={inputClass}
                  />
                </div>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location"
                  className={inputClass}
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Notes or description"
                  rows={3}
                  className={inputClass}
                />
              </div>

              <div className="flex justify-end gap-2 mt-5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !title.trim()}
                  className="px-5 py-2.5 text-sm font-semibold bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-40 active:scale-[0.98] transition-all shadow-md shadow-violet-600/20"
                >
                  {loading ? "Adding…" : "Add listing"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
