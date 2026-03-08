import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: listingId } = await params;
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId: listing.boardId, userId: user.id } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { tagId } = await req.json();
  if (!tagId) return NextResponse.json({ error: "tagId required" }, { status: 400 });

  const listingTag = await prisma.listingTag.create({
    data: { listingId, tagId },
  });

  return NextResponse.json(listingTag, { status: 201 });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: listingId } = await params;
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId: listing.boardId, userId: user.id } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { tagId } = await req.json();
  if (!tagId) return NextResponse.json({ error: "tagId required" }, { status: 400 });

  await prisma.listingTag.delete({
    where: { listingId_tagId: { listingId, tagId } },
  });

  return NextResponse.json({ success: true });
}
