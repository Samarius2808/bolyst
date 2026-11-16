// Browser-side helpers for uploading photos through /api/uploads.

const MAX_DIMENSION = 2000;
// Vercel rejects request bodies over ~4.5 MB, so anything bigger must shrink
const MAX_UNRESIZED_BYTES = 4 * 1024 * 1024;

export class UploadError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

/** Downscales large photos to a JPEG ≤ 2000px on the long side. */
async function shrink(file: File): Promise<Blob> {
  if (file.type === "image/gif") return file; // keep animations
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // Format the browser can't decode (e.g. HEIC in Chrome)
    throw new UploadError("unsupported_type");
  }
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= MAX_UNRESIZED_BYTES && file.type !== "image/heic") {
    bitmap.close();
    return file;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new UploadError("upload_failed"))),
      "image/jpeg",
      0.85,
    ),
  );
}

export async function uploadImage(boardId: string, file: File): Promise<string> {
  const blob = await shrink(file);
  const name = blob === file ? file.name : file.name.replace(/\.\w+$/, "") + ".jpg";
  const form = new FormData();
  form.append("boardId", boardId);
  form.append("file", new File([blob], name, { type: blob.type }));

  const res = await fetch("/api/uploads", { method: "POST", body: form });
  const data: unknown = await res.json().catch(() => ({}));
  const body = (data ?? {}) as { url?: unknown; error?: unknown };
  if (!res.ok || typeof body.url !== "string") {
    throw new UploadError(typeof body.error === "string" ? body.error : "upload_failed");
  }
  return body.url;
}
