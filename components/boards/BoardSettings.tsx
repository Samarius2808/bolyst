"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Member {
  id: string;
  userId: string;
  role: string;
  user: { id: string; name: string | null; email: string };
}

export function BoardSettings({
  boardId,
  boardName,
  isOwner,
  members,
  onClose,
}: {
  boardId: string;
  boardName: string;
  isOwner: boolean;
  members: Member[];
  onClose: () => void;
}) {
  const [name, setName] = useState(boardName);
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");
  const [memberList, setMemberList] = useState(members);
  const router = useRouter();

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || name.trim() === boardName) return;
    setSaving(true);
    const res = await fetch(`/api/boards/${boardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      router.refresh();
      setSaving(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setInviting(true);
    setError("");
    const res = await fetch(`/api/boards/${boardId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      const member = await res.json();
      setMemberList((prev) => [...prev, member]);
      setEmail("");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to invite");
    }
    setInviting(false);
  }

  async function handleRemove(userId: string) {
    if (!confirm("Remove this member?")) return;
    const res = await fetch(`/api/boards/${boardId}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      setMemberList((prev) => prev.filter((m) => m.userId !== userId));
      router.refresh();
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        "Delete this board and all its listings? This cannot be undone."
      )
    )
      return;
    await fetch(`/api/boards/${boardId}`, { method: "DELETE" });
    router.push("/boards");
  }

  const inputClass =
    "flex-1 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-zinc-900">
              Board settings
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-300 hover:text-zinc-500 text-xl leading-none transition-colors"
            >
              &times;
            </button>
          </div>

          {/* Rename */}
          {isOwner && (
            <form onSubmit={handleRename} className="mb-6">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Board name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
                <button
                  type="submit"
                  disabled={
                    saving || !name.trim() || name.trim() === boardName
                  }
                  className="px-4 py-2.5 text-sm font-medium bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-40 transition-colors"
                >
                  {saving ? "Saving…" : "Rename"}
                </button>
              </div>
            </form>
          )}

          {/* Members */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
              Members ({memberList.length})
            </h3>
            <div className="space-y-2 mb-3">
              {memberList.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-zinc-50"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">
                      {m.user.name || m.user.email}
                    </p>
                    {m.user.name && (
                      <p className="text-xs text-zinc-400 truncate">
                        {m.user.email}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <span className="text-xs text-zinc-400">
                      {m.role === "OWNER" ? "Owner" : "Member"}
                    </span>
                    {isOwner && m.role !== "OWNER" && (
                      <button
                        onClick={() => handleRemove(m.userId)}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Invite */}
            {isOwner && (
              <>
                <form onSubmit={handleInvite} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder="Invite by email…"
                    className={inputClass}
                  />
                  <button
                    type="submit"
                    disabled={inviting || !email.trim()}
                    className="px-4 py-2.5 text-sm font-medium bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-40 transition-colors"
                  >
                    {inviting ? "…" : "Invite"}
                  </button>
                </form>
                {error && (
                  <p className="text-xs text-red-500 mt-2">{error}</p>
                )}
              </>
            )}
          </div>

          {/* Delete */}
          {isOwner && (
            <div className="border-t border-zinc-100 pt-4">
              <button
                onClick={handleDelete}
                className="text-sm text-red-400 hover:text-red-600 transition-colors"
              >
                Delete board
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
