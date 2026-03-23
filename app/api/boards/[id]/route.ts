import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
      _count: { select: { listings: true } },
    },
  });

  return NextResponse.json(board);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const board = await prisma.board.findUnique({ where: { id } });
  if (!board || board.ownerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name } = await req.json();
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const updated = await prisma.board.update({
    where: { id },
    data: { name: name.trim() },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const board = await prisma.board.findUnique({ where: { id } });
  if (!board || board.ownerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.board.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
