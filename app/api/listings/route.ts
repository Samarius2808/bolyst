import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { geocodeLocation } from "@/lib/geocode";
import { parseImageUrls } from "@/lib/image-urls";

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { boardId, title, sourceUrl, price, size, location, description, imageUrls, tagIds } = body;

  if (!boardId || !title) {
    return NextResponse.json({ error: "boardId and title are required" }, { status: 400 });
  }

  const images = imageUrls === undefined ? [] : parseImageUrls(imageUrls);
  if (!images) return NextResponse.json({ error: "Invalid imageUrls" }, { status: 400 });

  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId: user.id } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (tagIds !== undefined && !Array.isArray(tagIds)) {
    return NextResponse.json({ error: "Invalid tagIds" }, { status: 400 });
  }
  const requestedTagIds = Array.from(
    new Set(((tagIds ?? []) as unknown[]).filter((v): v is string => typeof v === "string")),
  );
  // Only this board's tags; a tag deleted while the add form was open is just skipped
  const validTagIds = requestedTagIds.length
    ? (
        await prisma.tag.findMany({
          where: { id: { in: requestedTagIds }, boardId },
          select: { id: true },
        })
      ).map((t) => t.id)
    : [];

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
      imageUrls: images,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      tags: validTagIds.length ? { create: validTagIds.map((tagId) => ({ tagId })) } : undefined,
    },
  });

  return NextResponse.json(listing, { status: 201 });
}
