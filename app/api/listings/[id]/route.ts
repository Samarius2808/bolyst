import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { geocodeLocation } from "@/lib/geocode";

async function getListingWithAccess(listingId: string, userId: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { board: { select: { id: true } } },
  });
  if (!listing) return null;

  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId: listing.boardId, userId } },
  });
  if (!membership) return null;

  return { listing, membership };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await getListingWithAccess(id, user.id);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      tags: { include: { tag: true } },
      _count: { select: { comments: true } },
    },
  });

  return NextResponse.json(listing);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await getListingWithAccess(id, user.id);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { title, sourceUrl, price, size, location, description, imageUrls } = body;

  let coordsUpdate = {};
  if (location !== undefined) {
    if (location) {
      const coords = await geocodeLocation(location);
      coordsUpdate = { latitude: coords?.lat ?? null, longitude: coords?.lng ?? null };
    } else {
      coordsUpdate = { latitude: null, longitude: null };
    }
  }

  const updated = await prisma.listing.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(sourceUrl !== undefined && { sourceUrl }),
      ...(price !== undefined && { price: price ? parseInt(price) : null }),
      ...(size !== undefined && { size: size ? parseFloat(size) : null }),
      ...(location !== undefined && { location }),
      ...(description !== undefined && { description }),
      ...(imageUrls !== undefined && { imageUrls }),
      ...coordsUpdate,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await getListingWithAccess(id, user.id);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.listing.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
