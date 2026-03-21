"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function CreateBoardModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations("createBoard");

  function addEmail() {
    const trimmed = emailInput.trim().toLowerCase();
    if (trimmed && trimmed.includes("@") && !emails.includes(trimmed)) {
      setEmails([...emails, trimmed]);
      setEmailInput("");
    }
  }

  function removeEmail(email: string) {
    setEmails(emails.filter((e) => e !== email));
  }

  function handleEmailKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addEmail();
    }
  }

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
      const board = await res.json();

      if (emails.length > 0) {
        await Promise.allSettled(
          emails.map((email) =>
            fetch(`/api/boards/${board.id}/members`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email }),
            })
          )
        );
      }

      router.refresh();
      onClose();
    }
    setLoading(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm modal-backdrop"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl shadow-black/10 p-6 w-full max-w-md mx-4 modal-content"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">
              {t("title")}
            </h2>
            <p className="text-sm text-zinc-400 mt-0.5">
              {t("subtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("placeholder")}
          autoFocus
          className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent"
        />

        {/* Invite collaborators */}
        <div className="mt-4">
          <label className="text-sm font-medium text-zinc-700">
            {t("invitePeople")}
          </label>
          <p className="text-xs text-zinc-400 mt-0.5 mb-2">
            {t("inviteDescription")}
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={handleEmailKeyDown}
              onBlur={addEmail}
              placeholder={t("emailPlaceholder")}
              className="flex-1 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={addEmail}
              className="px-3 py-2.5 text-sm font-medium text-sage-600 hover:bg-sage-50 rounded-xl transition-colors"
            >
              {t("add")}
            </button>
          </div>
          <p className="text-xs text-zinc-400 mt-1.5">
            {t("inviteLater")}
          </p>
          {emails.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {emails.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-sage-50 text-sage-700 border border-sage-200"
                >
                  {email}
                  <button
                    type="button"
                    onClick={() => removeEmail(email)}
                    className="hover:text-sage-900 transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M4 4l8 8M12 4l-8 8" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="px-5 py-2.5 text-sm font-semibold bg-sage-600 text-white rounded-xl hover:bg-sage-700 disabled:opacity-40 active:scale-[0.98] transition-all shadow-md shadow-sage-600/20"
          >
            {loading ? t("creating") : t("createBoard")}
          </button>
        </div>
      </form>
    </div>
  );
}
