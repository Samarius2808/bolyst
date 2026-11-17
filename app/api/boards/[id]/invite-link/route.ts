import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isBoardOwner } from "@/lib/board-access";
import { generateInviteToken } from "@/lib/invite-link";

/** Create the board's invite link, or replace it (old link stops working). Owners only. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: boardId } = await params;
  if (!(await isBoardOwner(boardId, user.id))) {
    return NextResponse.json({ error: "Only owners can manage the invite link" }, { status: 403 });
  }

  const board = await prisma.board.update({
    where: { id: boardId },
    data: { inviteToken: generateInviteToken() },
    select: { inviteToken: true },
  });

  return NextResponse.json({ token: board.inviteToken }, { status: 201 });
}

/** Turn the invite link off. Owners only. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: boardId } = await params;
  if (!(await isBoardOwner(boardId, user.id))) {
    return NextResponse.json({ error: "Only owners can manage the invite link" }, { status: 403 });
  }

  await prisma.board.update({ where: { id: boardId }, data: { inviteToken: null } });
  return NextResponse.json({ success: true });
}
