import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlausibleInviteToken } from "@/lib/invite-link";
import { rateLimit } from "@/lib/ratelimit";

/** Join a board through its shareable invite link. */
export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // The token is the permission here, so slow down anyone guessing tokens
  if (!rateLimit(`join:${user.id}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { token } = await params;
  if (!isPlausibleInviteToken(token)) {
    return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  }

  const board = await prisma.board.findUnique({
    where: { inviteToken: token },
    select: { id: true },
  });
  if (!board) return NextResponse.json({ error: "Invalid link" }, { status: 404 });

  // Upsert: already being a member (or double-clicking) just takes you to the board
  await prisma.boardMember.upsert({
    where: { boardId_userId: { boardId: board.id, userId: user.id } },
    create: { boardId: board.id, userId: user.id, role: "COLLABORATOR" },
    update: {},
  });
  // An email invite for the same person is now redundant
  await prisma.boardInvite.deleteMany({
    where: { boardId: board.id, email: user.email.toLowerCase() },
  });

  return NextResponse.json({ boardId: board.id });
}
