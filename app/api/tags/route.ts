import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_TAG_LENGTH, findDuplicateTag, isUniqueViolation, normalizeTagName } from "@/lib/tags";

export async function GET(req: NextRequest) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const boardId = req.nextUrl.searchParams.get("boardId");
  if (!boardId) return NextResponse.json({ error: "boardId required" }, { status: 400 });

  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId: user.id } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tags = await prisma.tag.findMany({
    where: { boardId },
    orderBy: { name: "asc" },
    include: { _count: { select: { listings: true } } },
  });

  return NextResponse.json(
    tags.map(({ _count, ...tag }) => ({ ...tag, listingCount: _count.listings })),
  );
}

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: unknown = await req.json().catch(() => null);
  const {
    boardId,
    name: rawName,
    listingId,
  } = (body ?? {}) as { boardId?: unknown; name?: unknown; listingId?: unknown };
  const name = normalizeTagName(rawName);
  if (typeof boardId !== "string" || !name) {
    return NextResponse.json({ error: "boardId and name required" }, { status: 400 });
  }

  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId: user.id } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (name.length > MAX_TAG_LENGTH) {
    return NextResponse.json({ error: "Tag name too long" }, { status: 400 });
  }

  // Optional: apply the new tag to this listing in the same request
  if (listingId !== undefined && typeof listingId !== "string") {
    return NextResponse.json({ error: "Invalid listingId" }, { status: 400 });
  }
  const [duplicate, listing] = await Promise.all([
    findDuplicateTag(boardId, name),
    listingId
      ? prisma.listing.findUnique({ where: { id: listingId }, select: { boardId: true } })
      : null,
  ]);
  if (duplicate) {
    return NextResponse.json({ error: "Tag already exists" }, { status: 409 });
  }
  if (listingId && listing?.boardId !== boardId) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  try {
    const tag = await prisma.tag.create({
      data: {
        boardId,
        name,
        listings: listingId ? { create: { listingId } } : undefined,
      },
    });
    return NextResponse.json(tag, { status: 201 });
  } catch (e) {
    // Two people created the same tag at the same moment
    if (isUniqueViolation(e)) {
      return NextResponse.json({ error: "Tag already exists" }, { status: 409 });
    }
    throw e;
  }
}
