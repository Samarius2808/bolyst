import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isBoardOwner } from "@/lib/board-access";
import { parseImageUrls } from "@/lib/image-urls";

async function getBoardMembership(boardId: string, userId: string) {
  return prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId } },
  });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const membership = await getBoardMembership(id, user.id);
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const board = await prisma.board.findUnique({
    where: { id },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      _count: { select: { listings: { where: { archivedAt: null } } } },
    },
  });

  return NextResponse.json(board);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const membership = await getBoardMembership(id, user.id);
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body: unknown = await req.json();
  const { name, coverImageUrl, startDate, endDate } = (body ?? {}) as Record<string, unknown>;
  const data: {
    name?: string;
    coverImageUrl?: string | null;
    startDate?: Date | null;
    endDate?: Date | null;
  } = {};

  // Renaming is owner-only; cover photo and dates can be set by any member
  if (name !== undefined) {
    if (membership.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    data.name = name.trim();
  }

  if (coverImageUrl !== undefined) {
    if (coverImageUrl === null) data.coverImageUrl = null;
    else {
      const parsed = parseImageUrls([coverImageUrl]);
      if (!parsed) return NextResponse.json({ error: "Invalid coverImageUrl" }, { status: 400 });
      data.coverImageUrl = parsed[0];
    }
  }

  for (const [key, value] of [
    ["startDate", startDate],
    ["endDate", endDate],
  ] as const) {
    if (value === undefined) continue;
    if (value === null) {
      data[key] = null;
      continue;
    }
    // Plain calendar dates ("2026-12-01"), stored as DATE
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return NextResponse.json({ error: `Invalid ${key}` }, { status: 400 });
    }
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ error: `Invalid ${key}` }, { status: 400 });
    }
    data[key] = date;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const updated = await prisma.board.update({ where: { id }, data });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const board = await prisma.board.findUnique({ where: { id } });
  if (!board || !(await isBoardOwner(board.id, user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.board.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
