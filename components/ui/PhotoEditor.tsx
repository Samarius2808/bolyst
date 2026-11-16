"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { uploadImage, UploadError } from "@/lib/upload-client";

const ERROR_CODES = ["unsupported_type", "too_large", "storage_not_configured"] as const;

/**
 * Edit a listing's photo list: remove photos, pick the main (first) photo,
 * and upload new ones. The parent owns the list and saves it.
 */
export function PhotoEditor({
  boardId,
  images,
  onChange,
  onUploadingChange,
}: {
  boardId: string;
  images: string[];
  onChange: (images: string[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const t = useTranslations("photoEditor");
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError("");
    const list = Array.from(files);
    setUploading(list.length);
    onUploadingChange?.(true);
    const added: string[] = [];
    for (const file of list) {
      try {
        added.push(await uploadImage(boardId, file));
      } catch (e) {
        const code = e instanceof UploadError ? e.code : "upload_failed";
        setError(
          t(`errors.${(ERROR_CODES as readonly string[]).includes(code) ? code : "upload_failed"}`),
        );
      }
      setUploading((n) => n - 1);
    }
    onUploadingChange?.(false);
    if (added.length > 0) onChange([...images, ...added]);
  }

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {images.map((src, i) => (
          <div
            key={`${src}-${i}`}
            className="relative aspect-[4/3] rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 group"
          >
            <img src={src} alt="" className="w-full h-full object-cover" />
            {i === 0 ? (
              <span className="absolute bottom-1 left-1 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-sage-600 text-white">
                {t("main")}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onChange([src, ...images.filter((_, j) => j !== i)])}
                className="absolute bottom-1 left-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-black/55 text-white hover:bg-black/75 transition-colors"
              >
                {t("makeMain")}
              </button>
            )}
            <button
              type="button"
              onClick={() => onChange(images.filter((_, j) => j !== i))}
              aria-label={t("remove")}
              title={t("remove")}
              className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-black/55 text-white hover:bg-red-600 transition-colors"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>
        ))}
        {Array.from({ length: uploading }).map((_, i) => (
          <div
            key={`uploading-${i}`}
            className="aspect-[4/3] rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse"
          />
        ))}
        <label className="aspect-[4/3] rounded-lg border border-dashed border-zinc-300 dark:border-zinc-600 flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-sage-600 hover:border-sage-300 cursor-pointer transition-colors">
          <svg
            width="18"
            height="18"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M8 3v10M3 8h10" />
          </svg>
          <span className="text-[11px] font-medium">{t("addPhotos")}</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  );
}
