import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/ratelimit";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  isStorageConfigured,
  uploadBoardImage,
} from "@/lib/storage";

// POST multipart/form-data { boardId, file } → { url }
export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!rateLimit(`upload:${user.id}`, 60, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many uploads" }, { status: 429 });
  }

  const form = await req.formData().catch(() => null);
  const boardId = form?.get("boardId");
  const file = form?.get("file");
  if (typeof boardId !== "string" || !(file instanceof File)) {
    return NextResponse.json({ error: "boardId and file required" }, { status: 400 });
  }

  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId: user.id } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!ALLOWED_IMAGE_TYPES[file.type]) {
    return NextResponse.json({ error: "unsupported_type" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "too_large" }, { status: 400 });
  }
  if (!isStorageConfigured()) {
    return NextResponse.json({ error: "storage_not_configured" }, { status: 503 });
  }

  try {
    const url = await uploadBoardImage(boardId, file);
    return NextResponse.json({ url }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "upload_failed" }, { status: 502 });
  }
}
