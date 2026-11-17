import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

/**
 * The signed-in user's DB row, created on first sign-in.
 *
 * `auth()` only verifies the session token locally. `currentUser()` is an HTTP
 * call to Clerk's API (~200 ms), so it is only made when the user isn't in our
 * database yet: known users are served from a single DB lookup. `cache` dedupes
 * repeat calls within one server render.
 */
export const getOrCreateUser = cache(async function getOrCreateUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const known = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (known) return known;

  // First sign-in (or a relink): now we need the email and name from Clerk
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

  // If no user found by clerkId, check if one exists with the same email
  // (handles migration from dev to production Clerk instance)
  let existing: Awaited<ReturnType<typeof prisma.user.findUnique>> = null;
  const byEmail = await prisma.user.findUnique({ where: { email } });
  if (byEmail) {
    existing = await prisma.user.update({
      where: { email },
      data: { clerkId: userId, name },
    });
  }

  const user =
    existing ??
    (await prisma.user.create({
      data: { clerkId: userId, email, name },
    }));

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
});
