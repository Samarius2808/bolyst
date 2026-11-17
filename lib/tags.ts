import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const MAX_TAG_LENGTH = 40;

/** Trim and collapse inner whitespace; null if empty or not a string. */
export function normalizeTagName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.trim().replace(/\s+/g, " ");
  return name.length > 0 ? name : null;
}

/** Another tag on the board with the same name, ignoring case ("Balcony" = "balcony"). */
export function findDuplicateTag(boardId: string, name: string, excludeId?: string) {
  return prisma.tag.findFirst({
    where: {
      boardId,
      name: { equals: name, mode: "insensitive" },
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });
}

export function isUniqueViolation(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}
