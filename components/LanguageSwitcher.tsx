"use client";

import { useTransition } from "react";

function setLocaleCookie(locale: string) {
  document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
}

export function LanguageSwitcher({
  locale,
  variant = "default",
}: {
  locale: string;
  variant?: "default" | "landing";
}) {
  const [, startTransition] = useTransition();

  function switchTo(newLocale: string) {
    if (newLocale === locale) return;
    setLocaleCookie(newLocale);
    startTransition(() => {
      window.location.reload();
    });
  }

  const base =
    variant === "landing"
      ? "text-xs font-medium transition-colors"
      : "text-xs font-medium transition-colors";

  return (
    <div className="inline-flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
      <button
        onClick={() => switchTo("en")}
        className={`px-2 py-1 rounded-md ${base} ${
          locale === "en"
            ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
            : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => switchTo("de")}
        className={`px-2 py-1 rounded-md ${base} ${
          locale === "de"
            ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
            : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
        }`}
      >
        DE
      </button>
    </div>
  );
}
