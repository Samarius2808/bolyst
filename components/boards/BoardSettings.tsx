"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ThemeSelector } from "@/components/settings/ThemeSelector";
import { toDateInputValue } from "@/lib/date-range";
import { uploadImage, UploadError } from "@/lib/upload-client";
import { CoverPhotoField, DateRangeField, isValidRange } from "./BoardFields";

interface Member {
  id: string;
  userId: string;
  role: string;
  user: { id: string; name: string | null; email: string };
}

// Same order as the board header avatars, so each person keeps their colour
const avatarColors = [
  "bg-sage-100 text-sage-600",
  "bg-blue-100 text-blue-600",
  "bg-emerald-100 text-emerald-600",
  "bg-amber-100 text-amber-600",
  "bg-rose-100 text-rose-600",
];

export function BoardSettings({
  boardId,
  boardName,
  isOwner,
  currentUserId,
  members,
  initialPendingInvites = [],
  initialInviteToken = null,
  coverImageUrl = null,
  startDate = null,
  endDate = null,
  onClose,
}: {
  boardId: string;
  boardName: string;
  isOwner: boolean;
  currentUserId: string;
  members: Member[];
  initialPendingInvites?: string[];
  initialInviteToken?: string | null;
  coverImageUrl?: string | null;
  startDate?: string | null;
  endDate?: string | null;
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
  const t = useTranslations("boardSettings");
  const tp = useTranslations("photoEditor");
  const [cover, setCover] = useState(coverImageUrl);
  const [coverBusy, setCoverBusy] = useState(false);
  const [coverError, setCoverError] = useState("");
  const [start, setStart] = useState(toDateInputValue(startDate));
  const [end, setEnd] = useState(toDateInputValue(endDate));
  const [datesSaving, setDatesSaving] = useState(false);
  const [datesSaved, setDatesSaved] = useState(false);
  const datesChanged = start !== toDateInputValue(startDate) || end !== toDateInputValue(endDate);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [busyMember, setBusyMember] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const ownerCount = memberList.filter((m) => m.role === "OWNER").length;
  const [inviteToken, setInviteToken] = useState(initialInviteToken);
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [copied, setCopied] = useState(false);
  // This modal only renders client-side, after a click
  const inviteUrl =
    inviteToken && typeof window !== "undefined"
      ? `${window.location.origin}/join/${inviteToken}`
      : null;
  const canShare =
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    window.matchMedia("(pointer: coarse)").matches;

  // Close the member menu on outside click / Escape
  useEffect(() => {
    if (!menuFor) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuFor(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        setMenuFor(null);
      }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuFor]);

  async function handleCreateLink() {
    setLinkBusy(true);
    setLinkError("");
    const res = await fetch(`/api/boards/${boardId}/invite-link`, { method: "POST" }).catch(
      () => null,
    );
    if (res?.ok) {
      const data = (await res.json()) as { token: string };
      setInviteToken(data.token);
      setCopied(false);
      router.refresh();
    } else {
      setLinkError(t("linkError"));
    }
    setLinkBusy(false);
  }

  async function handleDisableLink() {
    setLinkBusy(true);
    setLinkError("");
    const res = await fetch(`/api/boards/${boardId}/invite-link`, { method: "DELETE" }).catch(
      () => null,
    );
    if (res?.ok) {
      setInviteToken(null);
      router.refresh();
    } else {
      setLinkError(t("linkError"));
    }
    setLinkBusy(false);
  }

  async function handleShareLink() {
    if (!inviteUrl) return;
    if (canShare) {
      try {
        await navigator.share({
          title: boardName,
          text: t("shareText", { board: boardName }),
          url: inviteUrl,
        });
        return;
      } catch {
        // Share sheet dismissed or unavailable: fall back to copying
      }
    }
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setLinkError(t("copyFailed"));
    }
  }

  async function patchBoard(data: Record<string, unknown>) {
    return fetch(`/api/boards/${boardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async function handleCoverFile(file: File) {
    setCoverBusy(true);
    setCoverError("");
    try {
      const url = await uploadImage(boardId, file);
      const res = await patchBoard({ coverImageUrl: url });
      if (!res.ok) throw new UploadError("upload_failed");
      setCover(url);
      router.refresh();
    } catch (e) {
      const code = e instanceof UploadError ? e.code : "upload_failed";
      const known = ["unsupported_type", "too_large", "storage_not_configured"];
      setCoverError(tp(`errors.${known.includes(code) ? code : "upload_failed"}`));
    }
    setCoverBusy(false);
  }

  async function handleRemoveCover() {
    setCoverBusy(true);
    const res = await patchBoard({ coverImageUrl: null });
    if (res.ok) {
      setCover(null);
      router.refresh();
    }
    setCoverBusy(false);
  }

  async function handleSaveDates(e: React.FormEvent) {
    e.preventDefault();
    setDatesSaving(true);
    const res = await patchBoard({ startDate: start || null, endDate: end || null });
    if (res.ok) {
      setDatesSaved(true);
      router.refresh();
    }
    setDatesSaving(false);
  }

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
      setError(data.error || t("inviteError"));
    }
    setInviting(false);
  }

  async function handleRemove(userId: string) {
    const index = memberList.findIndex((m) => m.userId === userId);
    const removed = memberList[index];
    if (!removed || busyMember) return;
    // Gone right away; put back in the same spot if the server refuses
    setMemberList((prev) => prev.filter((m) => m.userId !== userId));
    setConfirmRemove(null);
    setBusyMember(userId);
    setError("");
    const res = await fetch(`/api/boards/${boardId}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    }).catch(() => null);
    if (res?.ok) {
      router.refresh();
    } else {
      setMemberList((prev) => [...prev.slice(0, index), removed, ...prev.slice(index)]);
      setError(t("removeError"));
    }
    setBusyMember(null);
  }

  async function handleRoleChange(userId: string, role: "OWNER" | "COLLABORATOR") {
    const previous = memberList.find((m) => m.userId === userId)?.role;
    if (!previous || busyMember) return;
    const setRole = (r: string) =>
      setMemberList((prev) => prev.map((m) => (m.userId === userId ? { ...m, role: r } : m)));
    // Show the new role right away; revert if the server refuses
    setRole(role);
    setError("");
    setBusyMember(userId);
    const res = await fetch(`/api/boards/${boardId}/members`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    }).catch(() => null);
    if (res?.ok) {
      router.refresh();
    } else {
      setRole(previous);
      const data: { error?: string } = res ? await res.json().catch(() => ({})) : {};
      setError(data.error === "A board needs at least one owner" ? t("lastOwner") : t("roleError"));
    }
    setBusyMember(null);
  }

  async function handleDelete() {
    if (!confirm(t("deleteConfirm"))) return;
    await fetch(`/api/boards/${boardId}`, { method: "DELETE" });
    router.push("/boards");
  }

  const inputClass =
    "flex-1 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-colors";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm modal-backdrop"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl shadow-black/10 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto modal-content modal-scroll"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t("title")}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition-colors"
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
          </div>

          {/* Rename */}
          {isOwner && (
            <form onSubmit={handleRename} className="mb-6">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                {t("boardName")}
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
                  className="px-4 py-2.5 text-sm font-semibold bg-sage-600 text-white rounded-xl hover:bg-sage-700 disabled:opacity-40 active:scale-[0.98] transition-all shadow-md shadow-sage-600/20"
                >
                  {saving ? t("saving") : t("rename")}
                </button>
              </div>
            </form>
          )}

          {/* Cover photo */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-5 mb-6">
            <CoverPhotoField
              previewUrl={cover}
              busy={coverBusy}
              error={coverError}
              onFile={handleCoverFile}
              onRemove={handleRemoveCover}
            />
          </div>

          {/* Dates */}
          <form
            onSubmit={handleSaveDates}
            className="border-t border-zinc-100 dark:border-zinc-800 pt-5 mb-6"
          >
            <DateRangeField
              start={start}
              end={end}
              onChange={(r) => {
                setStart(r.start);
                setEnd(r.end);
                setDatesSaved(false);
              }}
            />
            <div className="flex items-center gap-3 mt-3">
              <button
                type="submit"
                disabled={datesSaving || !datesChanged || !isValidRange(start, end)}
                className="px-4 py-2 text-sm font-semibold bg-sage-600 text-white rounded-xl hover:bg-sage-700 disabled:opacity-40 active:scale-[0.98] transition-all shadow-md shadow-sage-600/20"
              >
                {datesSaving ? t("saving") : t("saveDates")}
              </button>
              {datesSaved && !datesChanged && (
                <span className="text-xs text-sage-600">{t("saved")}</span>
              )}
            </div>
          </form>

          {/* Appearance */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 mb-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Appearance
              </span>
              <ThemeSelector />
            </div>
          </div>

          {/* Members */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-5 mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">
              {t("members")} ({memberList.length})
            </h3>
            <div className="space-y-1.5 mb-3" ref={menuRef}>
              {memberList.map((m, i) => {
                const displayName = m.user.name || m.user.email;
                const initial = (displayName[0] || "?").toUpperCase();
                const isSelf = m.userId === currentUserId;
                const isRowOwner = m.role === "OWNER";
                const menuOpen = menuFor === m.userId;
                const confirming = confirmRemove === m.userId;
                // The only owner can't step down; someone has to run the board
                const soleOwner = isRowOwner && ownerCount <= 1;
                return (
                  <div
                    key={m.id}
                    className={`rounded-xl transition-colors ${
                      confirming
                        ? "bg-red-50/70 dark:bg-red-950/20"
                        : "bg-zinc-50/50 dark:bg-zinc-800/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 py-2.5 px-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-full ${avatarColors[i % avatarColors.length]} text-xs font-semibold flex items-center justify-center flex-shrink-0`}
                        >
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                            {displayName}
                            {isSelf && (
                              <span className="ml-1.5 text-xs font-normal text-zinc-400">
                                {t("you")}
                              </span>
                            )}
                          </p>
                          {m.user.name && (
                            <p className="text-xs text-zinc-400 truncate">{m.user.email}</p>
                          )}
                        </div>
                      </div>

                      <div className="relative shrink-0">
                        {isOwner ? (
                          <button
                            onClick={() => {
                              setMenuFor(menuOpen ? null : m.userId);
                              setConfirmRemove(null);
                              setError("");
                            }}
                            aria-haspopup="menu"
                            aria-expanded={menuOpen}
                            className={`inline-flex items-center gap-1 pl-2.5 pr-2 py-1 text-xs font-medium rounded-full border transition-colors ${
                              isRowOwner
                                ? "bg-sage-100 dark:bg-sage-950/50 border-sage-200 dark:border-sage-800 text-sage-700 dark:text-sage-400 hover:border-sage-300"
                                : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600"
                            }`}
                          >
                            {isRowOwner ? t("owner") : t("member")}
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 16 16"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className={`transition-transform ${menuOpen ? "rotate-180" : ""}`}
                            >
                              <path d="M4 6l4 4 4-4" />
                            </svg>
                          </button>
                        ) : (
                          <span
                            className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                              isRowOwner
                                ? "bg-sage-100 dark:bg-sage-950/50 text-sage-700 dark:text-sage-400"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                            }`}
                          >
                            {isRowOwner ? t("owner") : t("member")}
                          </span>
                        )}

                        {menuOpen && (
                          <div
                            role="menu"
                            className="absolute right-0 top-full mt-1.5 z-10 w-64 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-lg shadow-black/10 py-1.5 modal-content"
                          >
                            {(["OWNER", "COLLABORATOR"] as const).map((role) => {
                              const current = m.role === role;
                              const blocked = role === "COLLABORATOR" && soleOwner;
                              return (
                                <button
                                  key={role}
                                  role="menuitemradio"
                                  aria-checked={current}
                                  disabled={blocked}
                                  onClick={() => {
                                    setMenuFor(null);
                                    if (!current) handleRoleChange(m.userId, role);
                                  }}
                                  className="w-full text-left px-3.5 py-2 flex gap-2.5 items-start hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
                                >
                                  <span className="w-3.5 mt-0.5 text-sage-600 dark:text-sage-400 shrink-0">
                                    {current && (
                                      <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                      >
                                        <path d="M3 8.5l3 3 7-7" />
                                      </svg>
                                    )}
                                  </span>
                                  <span>
                                    <span className="block text-sm font-medium text-zinc-800 dark:text-zinc-100">
                                      {role === "OWNER" ? t("owner") : t("member")}
                                    </span>
                                    <span className="block text-xs text-zinc-400 dark:text-zinc-500">
                                      {blocked
                                        ? t("lastOwner")
                                        : role === "OWNER"
                                          ? t("ownerHint")
                                          : t("memberHint")}
                                    </span>
                                  </span>
                                </button>
                              );
                            })}
                            {!isSelf && (
                              <>
                                <div className="my-1.5 border-t border-zinc-100 dark:border-zinc-800" />
                                <button
                                  role="menuitem"
                                  onClick={() => {
                                    setMenuFor(null);
                                    setConfirmRemove(m.userId);
                                  }}
                                  className="w-full text-left px-3.5 py-2 pl-[38px] text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                >
                                  {t("removeFromBoard")}
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {confirming && (
                      <div className="px-3.5 pb-3 -mt-0.5">
                        <p className="text-xs text-red-600 dark:text-red-400 mb-2">
                          {t("removeConfirm", { name: m.user.name?.split(" ")[0] || displayName })}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setConfirmRemove(null)}
                            autoFocus
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 transition-colors"
                          >
                            {t("cancel")}
                          </button>
                          <button
                            onClick={() => handleRemove(m.userId)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                          >
                            {t("remove")}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pending invites */}
            {pendingInvites.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {pendingInvites.map((inviteEmail) => (
                  <div
                    key={inviteEmail}
                    className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                      <p className="text-sm text-amber-700 dark:text-amber-400 truncate">
                        {inviteEmail}
                      </p>
                    </div>
                    <span className="text-[11px] font-medium text-amber-500 ml-3 shrink-0 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 rounded-full">
                      {t("pending")}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Invite */}
            {isOwner && (
              <>
                {/* Shareable link: send it in any chat, no email needed */}
                <div className="mt-4 mb-3">
                  {inviteUrl ? (
                    <div className="rounded-xl border border-sage-200 dark:border-sage-800 bg-sage-50/50 dark:bg-sage-950/20 p-3">
                      <div className="flex items-center gap-2">
                        <input
                          readOnly
                          value={inviteUrl}
                          onFocus={(e) => e.currentTarget.select()}
                          aria-label={t("inviteLink")}
                          className="flex-1 min-w-0 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-2 text-xs text-zinc-600 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-sage-500"
                        />
                        <button
                          onClick={handleShareLink}
                          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-sage-600 text-white rounded-lg hover:bg-sage-700 active:scale-[0.98] transition-all"
                        >
                          {copied ? t("copied") : canShare ? t("shareLink") : t("copyLink")}
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-2">
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {t("inviteLinkHint")}
                        </p>
                        <div className="flex gap-3 shrink-0">
                          <button
                            onClick={() => handleCreateLink()}
                            disabled={linkBusy}
                            className="text-[11px] font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-50 transition-colors"
                          >
                            {t("resetLink")}
                          </button>
                          <button
                            onClick={handleDisableLink}
                            disabled={linkBusy}
                            className="text-[11px] font-medium text-zinc-500 hover:text-red-500 disabled:opacity-50 transition-colors"
                          >
                            {t("disableLink")}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCreateLink()}
                      disabled={linkBusy}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 text-left hover:border-sage-300 hover:bg-sage-50/40 dark:hover:bg-sage-950/20 disabled:opacity-60 transition-colors"
                    >
                      <span className="w-8 h-8 rounded-full bg-sage-100 dark:bg-sage-950/50 text-sage-600 dark:text-sage-400 flex items-center justify-center shrink-0">
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        >
                          <path d="M6.5 9.5a3 3 0 004.24 0l2.12-2.12a3 3 0 00-4.24-4.24l-.7.7M9.5 6.5a3 3 0 00-4.24 0L3.14 8.62a3 3 0 004.24 4.24l.7-.7" />
                        </svg>
                      </span>
                      <span>
                        <span className="block text-sm font-medium text-zinc-800 dark:text-zinc-100">
                          {linkBusy ? t("creatingLink") : t("createLink")}
                        </span>
                        <span className="block text-xs text-zinc-400 dark:text-zinc-500">
                          {t("createLinkHint")}
                        </span>
                      </span>
                    </button>
                  )}
                  {linkError && <p className="text-xs text-red-500 mt-2">{linkError}</p>}
                </div>

                <form onSubmit={handleInvite} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder={t("invitePlaceholder")}
                    className={inputClass}
                  />
                  <button
                    type="submit"
                    disabled={inviting || !email.trim()}
                    className="px-4 py-2.5 text-sm font-semibold bg-sage-600 text-white rounded-xl hover:bg-sage-700 disabled:opacity-40 active:scale-[0.98] transition-all shadow-md shadow-sage-600/20"
                  >
                    {inviting ? "…" : t("invite")}
                  </button>
                </form>
              </>
            )}
            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
          </div>

          {/* Danger zone */}
          {isOwner && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-2">
                {t("dangerZone")}
              </h3>
              <button
                onClick={handleDelete}
                className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
              >
                {t("deleteBoard")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
