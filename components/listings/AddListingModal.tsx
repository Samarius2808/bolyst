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
    "w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-zinc-900 mb-1">
          Add a listing
        </h2>

        {mode === "url" ? (
          <>
            <p className="text-sm text-zinc-400 mb-5">
              Paste a listing URL to auto-fill details.
            </p>

            <form onSubmit={handleScrape}>
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
              <div className="flex items-center justify-between mt-5">
                <button
                  type="button"
                  onClick={() => setMode("manual")}
                  className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  Enter manually instead
                </button>
                <div className="flex gap-2">
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
                    className="px-5 py-2.5 text-sm font-medium bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-40 transition-colors"
                  >
                    {scraping ? "Extracting…" : "Extract"}
                  </button>
                </div>
              </div>
            </form>
          </>
        ) : (
          <>
            <p className="text-sm text-zinc-400 mb-5">
              {sourceUrl
                ? "Review and edit the extracted details."
                : "Enter listing details manually."}
            </p>

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

              <div className="flex items-center justify-between mt-5">
                {!sourceUrl && (
                  <button
                    type="button"
                    onClick={() => setMode("url")}
                    className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    &larr; Paste URL instead
                  </button>
                )}
                <div className="flex gap-2 ml-auto">
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
                    className="px-5 py-2.5 text-sm font-medium bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-40 transition-colors"
                  >
                    {loading ? "Adding…" : "Add listing"}
                  </button>
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
