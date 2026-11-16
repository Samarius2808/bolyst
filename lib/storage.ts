import { randomUUID } from "crypto";

// User-uploaded photos live in the public Supabase Storage bucket "uploads".
// Writes go through the Supabase secret key (server only); the bucket has no
// public write policy, so every upload passes our membership check first.
const BUCKET = "uploads";

export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

// New-style secret key (sb_secret_…); the legacy service_role JWT also works
function secretKey(): string | undefined {
  return process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function isStorageConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && secretKey());
}

/** Uploads an image under the board's folder and returns its public URL. */
export async function uploadBoardImage(boardId: string, file: File): Promise<string> {
  const baseUrl = process.env.SUPABASE_URL;
  const key = secretKey();
  if (!baseUrl || !key) throw new Error("Storage is not configured");

  const ext = ALLOWED_IMAGE_TYPES[file.type];
  if (!ext) throw new Error("Unsupported image type");

  const path = `boards/${boardId}/${randomUUID()}.${ext}`;
  const res = await fetch(`${baseUrl}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      apikey: key,
      // Secret keys aren't JWTs and go in `apikey` only; legacy JWT keys also need Bearer
      ...(key.startsWith("eyJ") && { Authorization: `Bearer ${key}` }),
      "Content-Type": file.type,
      "Cache-Control": "31536000",
      "x-upsert": "false",
    },
    body: Buffer.from(await file.arrayBuffer()),
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);

  return `${baseUrl}/storage/v1/object/public/${BUCKET}/${path}`;
}
