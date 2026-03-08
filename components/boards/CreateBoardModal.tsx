"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateBoardModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    const res = await fetch("/api/boards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (res.ok) {
      router.refresh();
      onClose();
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4"
      >
        <h2 className="text-lg font-semibold text-zinc-900 mb-1">
          Create a board
        </h2>
        <p className="text-sm text-zinc-400 mb-5">
          A shared space for saving and comparing apartments.
        </p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Berlin Apartments Q2"
          autoFocus
          className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />
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
            disabled={loading || !name.trim()}
            className="px-5 py-2.5 text-sm font-medium bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-40 transition-colors"
          >
            {loading ? "Creating…" : "Create board"}
          </button>
        </div>
      </form>
    </div>
  );
}
