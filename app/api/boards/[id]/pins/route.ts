import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { geocodeLocation } from "@/lib/geocode";

const MAX_NAME = 60;
const MAX_ADDRESS = 300;

async function requireMember(boardId: string) {
  const user = await getOrCreateUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId: user.id } },
  });
  if (!membership) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { user };
}

function optionalText(value: unknown, max: number): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().slice(0, max);
  return trimmed.length > 0 ? trimmed : null;
}

/** Explicit coordinates from a picked suggestion or a tap on the map. */
function parseCoords(lat: unknown, lng: unknown): { lat: number; lng: number } | null {
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

type PinBody = {
  pinId?: unknown;
  name?: unknown;
  address?: unknown;
  latitude?: unknown;
  longitude?: unknown;
};

async function readBody(req: Request): Promise<PinBody> {
  const body: unknown = await req.json().catch(() => null);
  return body && typeof body === "object" ? (body as PinBody) : {};
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: boardId } = await params;
  const auth = await requireMember(boardId);
  if (auth.error) return auth.error;

  const pins = await prisma.boardPin.findMany({ where: { boardId } });
  return NextResponse.json(pins);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: boardId } = await params;
  const auth = await requireMember(boardId);
  if (auth.error) return auth.error;

  const body = await readBody(req);
  const name = optionalText(body.name, MAX_NAME);
  const address = optionalText(body.address, MAX_ADDRESS) ?? null;
  const picked = parseCoords(body.latitude, body.longitude);
  if (!name || (!address && !picked)) {
    return NextResponse.json({ error: "Name and a location are required" }, { status: 400 });
  }

  const coords = picked ?? (address ? await geocodeLocation(address) : null);
  if (!coords) {
    return NextResponse.json({ error: "Could not find that location" }, { status: 422 });
  }

  const pin = await prisma.boardPin.create({
    data: { boardId, name, address, latitude: coords.lat, longitude: coords.lng },
  });

  return NextResponse.json(pin, { status: 201 });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: boardId } = await params;
  const auth = await requireMember(boardId);
  if (auth.error) return auth.error;

  const body = await readBody(req);
  if (typeof body.pinId !== "string") {
    return NextResponse.json({ error: "pinId required" }, { status: 400 });
  }
  const pin = await prisma.boardPin.findUnique({ where: { id: body.pinId } });
  if (!pin || pin.boardId !== boardId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data: { name?: string; address?: string | null; latitude?: number; longitude?: number } =
    {};

  if (body.name !== undefined) {
    const name = optionalText(body.name, MAX_NAME);
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
    data.name = name;
  }

  const picked = parseCoords(body.latitude, body.longitude);
  const address = optionalText(body.address, MAX_ADDRESS);
  if (picked) {
    data.latitude = picked.lat;
    data.longitude = picked.lng;
    if (address !== undefined) data.address = address;
  } else if (address && address !== pin.address) {
    // New text address without coordinates: look it up
    const coords = await geocodeLocation(address);
    if (!coords) {
      return NextResponse.json({ error: "Could not find that location" }, { status: 422 });
    }
    data.address = address;
    data.latitude = coords.lat;
    data.longitude = coords.lng;
  }

  const updated = await prisma.boardPin.update({ where: { id: pin.id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: boardId } = await params;
  const auth = await requireMember(boardId);
  if (auth.error) return auth.error;

  const body = await readBody(req);
  if (typeof body.pinId !== "string") {
    return NextResponse.json({ error: "pinId required" }, { status: 400 });
  }

  // Scoped to this board: membership of one board can't delete another board's pins
  await prisma.boardPin.deleteMany({ where: { id: body.pinId, boardId } });
  return NextResponse.json({ success: true });
}
