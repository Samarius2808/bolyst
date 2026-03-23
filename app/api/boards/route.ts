import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const boards = await prisma.board.findMany({
    where: {
      OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
    },
    include: {
      _count: { select: { listings: true, members: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(boards);
}

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const board = await prisma.board.create({
    data: {
      name: name.trim(),
      ownerId: user.id,
      members: {
        create: { userId: user.id, role: "OWNER" },
      },
    },
  });

  return NextResponse.json(board, { status: 201 });
}
