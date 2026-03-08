import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const boardId = req.nextUrl.searchParams.get("boardId");
  if (!boardId) return NextResponse.json({ error: "boardId required" }, { status: 400 });

  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId: user.id } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tags = await prisma.tag.findMany({
    where: { boardId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(tags);
}

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId, name } = await req.json();
  if (!boardId || !name?.trim()) {
    return NextResponse.json({ error: "boardId and name required" }, { status: 400 });
  }

  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId: user.id } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tag = await prisma.tag.create({
    data: { boardId, name: name.trim() },
  });

  return NextResponse.json(tag, { status: 201 });
}
