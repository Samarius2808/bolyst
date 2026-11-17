import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_TAG_LENGTH, findDuplicateTag, isUniqueViolation, normalizeTagName } from "@/lib/tags";

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

  const body: unknown = await req.json().catch(() => null);
  const name = normalizeTagName((body as { name?: unknown } | null)?.name);
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  if (name.length > MAX_TAG_LENGTH) {
    return NextResponse.json({ error: "Tag name too long" }, { status: 400 });
  }

  if (await findDuplicateTag(tag.boardId, name, id)) {
    return NextResponse.json({ error: "Tag already exists" }, { status: 409 });
  }

  try {
    const updated = await prisma.tag.update({ where: { id }, data: { name } });
    return NextResponse.json(updated);
  } catch (e) {
    if (isUniqueViolation(e)) {
      return NextResponse.json({ error: "Tag already exists" }, { status: 409 });
    }
    throw e;
  }
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

  // deleteMany: a second click / another member deleting it first isn't an error
  await prisma.tag.deleteMany({ where: { id } });

  return NextResponse.json({ success: true });
}
