import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: listingId } = await params;
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId: listing.boardId, userId: user.id } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const comments = await prisma.comment.findMany({
    where: { listingId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(comments);
}

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

  const { content } = await req.json();
  if (!content?.trim()) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      listingId,
      userId: user.id,
      content: content.trim(),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
