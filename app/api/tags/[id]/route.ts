import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const tag = await prisma.tag.findUnique({ where: { id } });
  if (!tag) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId: tag.boardId, userId: user.id } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const updated = await prisma.tag.update({
    where: { id },
    data: { name: name.trim() },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const tag = await prisma.tag.findUnique({ where: { id } });
  if (!tag) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId: tag.boardId, userId: user.id } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.tag.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
