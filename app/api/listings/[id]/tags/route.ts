import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: listingId } = await params;
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId: listing.boardId, userId: user.id } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body: unknown = await req.json().catch(() => null);
  const tagId = (body as { tagId?: unknown } | null)?.tagId;
  if (typeof tagId !== "string") {
    return NextResponse.json({ error: "tagId required" }, { status: 400 });
  }

  // The tag must belong to the same board as the listing
  const tag = await prisma.tag.findUnique({ where: { id: tagId }, select: { boardId: true } });
  if (!tag || tag.boardId !== listing.boardId) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  // Upsert: a double-click or a collaborator tagging at the same time isn't an error
  const listingTag = await prisma.listingTag.upsert({
    where: { listingId_tagId: { listingId, tagId } },
    create: { listingId, tagId },
    update: {},
  });

  return NextResponse.json(listingTag, { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: listingId } = await params;
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId: listing.boardId, userId: user.id } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body: unknown = await req.json().catch(() => null);
  const tagId = (body as { tagId?: unknown } | null)?.tagId;
  if (typeof tagId !== "string") {
    return NextResponse.json({ error: "tagId required" }, { status: 400 });
  }

  await prisma.listingTag.deleteMany({ where: { listingId, tagId } });

  return NextResponse.json({ success: true });
}
