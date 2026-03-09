import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { geocodeLocation } from "@/lib/geocode";

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { boardId, title, sourceUrl, price, size, location, description, imageUrls, tagIds } = body;

  if (!boardId || !title) {
    return NextResponse.json({ error: "boardId and title are required" }, { status: 400 });
  }

  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId: user.id } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const coords = location ? await geocodeLocation(location) : null;

  const listing = await prisma.listing.create({
    data: {
      boardId,
      addedById: user.id,
      title: title.trim(),
      sourceUrl: sourceUrl || null,
      price: price ? parseInt(price) : null,
      size: size ? parseFloat(size) : null,
      location: location || null,
      description: description || null,
      imageUrls: imageUrls || [],
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      tags: tagIds?.length
        ? { create: tagIds.map((tagId: string) => ({ tagId })) }
        : undefined,
    },
  });

  return NextResponse.json(listing, { status: 201 });
}
