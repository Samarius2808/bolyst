import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { geocodeLocation } from "@/lib/geocode";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: boardId } = await params;
  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId: user.id } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const pins = await prisma.boardPin.findMany({ where: { boardId } });
  return NextResponse.json(pins);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: boardId } = await params;
  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId: user.id } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, address } = await req.json();
  if (!name?.trim() || !address?.trim()) {
    return NextResponse.json({ error: "Name and address are required" }, { status: 400 });
  }

  const coords = await geocodeLocation(address.trim());
  if (!coords) {
    return NextResponse.json({ error: "Could not find that location" }, { status: 422 });
  }

  const pin = await prisma.boardPin.create({
    data: {
      boardId,
      name: name.trim(),
      latitude: coords.lat,
      longitude: coords.lng,
    },
  });

  return NextResponse.json(pin, { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: boardId } = await params;
  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId: user.id } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { pinId } = await req.json();
  if (!pinId) return NextResponse.json({ error: "pinId required" }, { status: 400 });

  await prisma.boardPin.delete({ where: { id: pinId } });
  return NextResponse.json({ success: true });
}
