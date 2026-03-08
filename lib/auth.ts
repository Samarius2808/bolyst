import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export async function getOrCreateUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const name = [clerkUser.firstName, clerkUser.lastName]
    .filter(Boolean)
    .join(" ") || null;

  const existing = await prisma.user.findUnique({ where: { clerkId: userId } });

  const user = await prisma.user.upsert({
    where: { clerkId: userId },
    update: { email, name },
    create: { clerkId: userId, email, name },
  });

  // On first login, process any pending board invites
  if (!existing) {
    const pendingInvites = await prisma.boardInvite.findMany({
      where: { email: email.toLowerCase() },
    });

    for (const invite of pendingInvites) {
      const alreadyMember = await prisma.boardMember.findUnique({
        where: { boardId_userId: { boardId: invite.boardId, userId: user.id } },
      });
      if (!alreadyMember) {
        await prisma.boardMember.create({
          data: { boardId: invite.boardId, userId: user.id, role: "COLLABORATOR" },
        });
      }
    }

    if (pendingInvites.length > 0) {
      await prisma.boardInvite.deleteMany({
        where: { email: email.toLowerCase() },
      });
    }
  }

  return user;
}
