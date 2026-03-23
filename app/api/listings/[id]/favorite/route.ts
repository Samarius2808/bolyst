import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: listingId } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { boardId: true },
  });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId: listing.boardId, userId: user.id } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existing = await prisma.favorite.findUnique({
    where: { userId_listingId: { userId: user.id, listingId } },
  });

  if (existing) {
    await prisma.favorite.delete({
      where: { userId_listingId: { userId: user.id, listingId } },
    });
    return NextResponse.json({ favorited: false });
  } else {
    await prisma.favorite.create({
      data: { userId: user.id, listingId },
    });
    return NextResponse.json({ favorited: true });
  }
}
