import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: boardId } = await params;
  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId: user.id } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const members = await prisma.boardMember.findMany({
    where: { boardId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(members);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: boardId } = await params;
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board || board.ownerId !== user.id) {
    return NextResponse.json({ error: "Only the owner can invite members" }, { status: 403 });
  }

  const { email } = await req.json();
  if (!email?.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const invitee = await prisma.user.findUnique({ where: { email: email.trim() } });
  if (!invitee) {
    return NextResponse.json(
      { error: "No user found with that email. They need to sign up first." },
      { status: 404 }
    );
  }

  const existing = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId: invitee.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already a member" }, { status: 409 });
  }

  const member = await prisma.boardMember.create({
    data: { boardId, userId: invitee.id, role: "COLLABORATOR" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(member, { status: 201 });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: boardId } = await params;
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board || board.ownerId !== user.id) {
    return NextResponse.json({ error: "Only the owner can remove members" }, { status: 403 });
  }

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
  if (userId === user.id) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
  }

  await prisma.boardMember.delete({
    where: { boardId_userId: { boardId, userId } },
  });

  return NextResponse.json({ success: true });
}
