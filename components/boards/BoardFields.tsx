"use client";

import { useTranslations } from "next-intl";

// Shared by Board settings and Create board, so both look and behave the same.

const sectionTitle =
  "text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1";
const hint = "text-xs text-zinc-400 dark:text-zinc-500 mb-3";
const dateInput =
  "w-full mt-1 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-colors";

export function CoverPhotoField({
  previewUrl,
  busy = false,
  error,
  onFile,
  onRemove,
}: {
  previewUrl: string | null;
  busy?: boolean;
  error?: string;
  onFile: (file: File) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("boardSettings");
  return (
    <div>
      <h3 className={sectionTitle}>{t("coverPhoto")}</h3>
      <p className={hint}>{t("coverPhotoHint")}</p>
      {previewUrl && (
        <img
          src={previewUrl}
          alt=""
          className="w-full h-32 object-cover rounded-xl mb-3 bg-zinc-100 dark:bg-zinc-800"
        />
      )}
      <div className="flex items-center gap-3">
        <label
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-sage-200 hover:text-sage-600 transition-colors ${
            busy ? "opacity-50 pointer-events-none" : "cursor-pointer"
          }`}
        >
          {busy ? t("uploading") : previewUrl ? t("changeCover") : t("uploadCover")}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFile(file);
              e.target.value = "";
            }}
          />
        </label>
        {previewUrl && !busy && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
          >
            {t("removeCover")}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  );
}

/** Values are "YYYY-MM-DD" strings ("" = not set). */
export function DateRangeField({
  start,
  end,
  onChange,
}: {
  start: string;
  end: string;
  onChange: (range: { start: string; end: string }) => void;
}) {
  const t = useTranslations("boardSettings");
  return (
    <div>
      <h3 className={sectionTitle}>{t("dates")}</h3>
      <p className={hint}>{t("datesHint")}</p>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-zinc-500 dark:text-zinc-400">
          {t("startDate")}
          <input
            type="date"
            value={start}
            max={end || undefined}
            onChange={(e) => onChange({ start: e.target.value, end })}
            className={dateInput}
          />
        </label>
        <label className="text-xs text-zinc-500 dark:text-zinc-400">
          {t("endDate")}
          <input
            type="date"
            value={end}
            min={start || undefined}
            onChange={(e) => onChange({ start, end: e.target.value })}
            className={dateInput}
          />
        </label>
      </div>
      {(start || end) && (
        <button
          type="button"
          onClick={() => onChange({ start: "", end: "" })}
          className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors mt-2"
        >
          {t("clearDates")}
        </button>
      )}
    </div>
  );
}

export function isValidRange(start: string, end: string): boolean {
  return !start || !end || end >= start;
}
