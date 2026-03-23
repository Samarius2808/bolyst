"use client";

import { useState } from "react";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:text-zinc-700 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Feedback
      </button>
      {open && <FeedbackModal onClose={() => setOpen(false)} />}
    </>
  );
}

function FeedbackModal({ onClose }: { onClose: () => void }) {
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit() {
    if (!message.trim() || state === "sending") return;
    setState("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      setState(res.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-zinc-100 dark:border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        {state === "sent" ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-sage-50 dark:bg-sage-950/40 flex items-center justify-center mx-auto mb-4">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="text-sage-600"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
              Thanks for the feedback!
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">We read every message.</p>
            <button
              onClick={onClose}
              className="mt-5 px-5 py-2 text-sm font-semibold bg-sage-600 text-white rounded-xl hover:bg-sage-700 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
              Share your thoughts
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              Ideas, bugs, complaints — all welcome.
            </p>

            <textarea
              autoFocus
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What's on your mind?"
              rows={5}
              maxLength={2000}
              className="w-full px-3.5 py-3 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-sage-500/40 focus:border-sage-400 resize-none transition"
            />

            {state === "error" && (
              <p className="text-xs text-red-500 mt-1.5">
                Something went wrong — please try again.
              </p>
            )}

            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-zinc-400 dark:text-zinc-600">
                {message.length}/2000
              </span>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submit}
                  disabled={!message.trim() || state === "sending"}
                  className="px-5 py-2 text-sm font-semibold bg-sage-600 text-white rounded-xl hover:bg-sage-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {state === "sending" ? "Sending…" : "Send"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
