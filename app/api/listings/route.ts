import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { boardId, title, sourceUrl, price, size, location, description, imageUrls } = body;

  if (!boardId || !title) {
    return NextResponse.json({ error: "boardId and title are required" }, { status: 400 });
  }

  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId: user.id } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const listing = await prisma.listing.create({
    data: {
      boardId,
      title: title.trim(),
      sourceUrl: sourceUrl || null,
      price: price ? parseInt(price) : null,
      size: size ? parseFloat(size) : null,
      location: location || null,
      description: description || null,
      imageUrls: imageUrls || [],
    },
  });

  return NextResponse.json(listing, { status: 201 });
}
