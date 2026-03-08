"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Member {
  id: string;
  userId: string;
  role: string;
  user: { id: string; name: string | null; email: string };
}

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

export function BoardSettings({
  boardId,
  boardName,
  isOwner,
  members,
  initialPendingInvites = [],
  onClose,
}: {
  boardId: string;
  boardName: string;
  isOwner: boolean;
  members: Member[];
  initialPendingInvites?: string[];
  onClose: () => void;
}) {
  const [name, setName] = useState(boardName);
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");
  const [memberList, setMemberList] = useState(members);
  const [pendingInvites, setPendingInvites] = useState(initialPendingInvites);
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
      const data = await res.json();
      if (data.pending) {
        setPendingInvites((prev) => [...prev, data.email]);
      } else {
        setMemberList((prev) => [...prev, data]);
      }
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
    if (!confirm("Delete this board and all its listings? This cannot be undone."))
      return;
    await fetch(`/api/boards/${boardId}`, { method: "DELETE" });
    router.push("/boards");
  }

  const inputClass =
    "flex-1 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm modal-backdrop"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl shadow-black/10 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto modal-content modal-scroll"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-zinc-900">
              Board settings
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
                  disabled={saving || !name.trim() || name.trim() === boardName}
                  className="px-4 py-2.5 text-sm font-semibold bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-40 active:scale-[0.98] transition-all shadow-md shadow-violet-600/20"
                >
                  {saving ? "Saving…" : "Rename"}
                </button>
              </div>
            </form>
          )}

          {/* Members */}
          <div className="border-t border-zinc-100 pt-5 mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
              Members ({memberList.length})
            </h3>
            <div className="space-y-2 mb-3">
              {memberList.map((m) => {
                const displayName = m.user.name || m.user.email;
                const initial = (displayName[0] || "?").toUpperCase();
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-zinc-50/50 hover:bg-zinc-100/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full ${getAvatarColor(displayName)} text-[11px] font-semibold flex items-center justify-center flex-shrink-0`}
                      >
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900 truncate">
                          {displayName}
                        </p>
                        {m.user.name && (
                          <p className="text-xs text-zinc-400 truncate">
                            {m.user.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <span
                        className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${
                          m.role === "OWNER"
                            ? "bg-violet-100 text-violet-600"
                            : "bg-zinc-100 text-zinc-500"
                        }`}
                      >
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
                );
              })}
            </div>

            {/* Pending invites */}
            {pendingInvites.length > 0 && (
              <div className="space-y-2 mb-3">
                {pendingInvites.map((inviteEmail) => (
                  <div
                    key={inviteEmail}
                    className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-amber-50/50 border border-amber-100"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      <p className="text-sm text-amber-700 truncate">
                        {inviteEmail}
                      </p>
                    </div>
                    <span className="text-[11px] font-medium text-amber-500 ml-3 shrink-0 px-2 py-0.5 bg-amber-100 rounded-full">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            )}

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
                    className="px-4 py-2.5 text-sm font-semibold bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-40 active:scale-[0.98] transition-all shadow-md shadow-violet-600/20"
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

          {/* Danger zone */}
          {isOwner && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-2">
                Danger zone
              </h3>
              <button
                onClick={handleDelete}
                className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
              >
                Delete this board
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
