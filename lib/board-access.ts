import { prisma } from "@/lib/prisma";

/**
 * A board can have several owners: ownership is the OWNER role on BoardMember,
 * not `board.ownerId` (which only records who created the board).
 */
export async function isBoardOwner(boardId: string, userId: string): Promise<boolean> {
  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId } },
    select: { role: true },
  });
  return membership?.role === "OWNER";
}
