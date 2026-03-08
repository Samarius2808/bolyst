import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { ListingGrid } from "@/components/listings/ListingGrid";
import { BoardHeader } from "@/components/boards/BoardHeader";

export default async function BoardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const { id } = await params;

  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId: id, userId: user.id } },
  });
  if (!membership) notFound();

  const board = await prisma.board.findUnique({
    where: { id },
    include: {
      listings: {
        include: {
          tags: { include: { tag: true } },
          _count: { select: { comments: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      invites: {
        select: { email: true },
      },
      pins: true,
    },
  });
  if (!board) notFound();

  const isOwner = board.ownerId === user.id;

  return (
    <main className="max-w-[1600px] mx-auto px-4 sm:px-8 py-6 sm:py-10">
      <BoardHeader
        board={{
          id: board.id,
          name: board.name,
          members: board.members,
          listingCount: board.listings.length,
          pendingInvites: board.invites.map((i) => i.email),
        }}
        isOwner={isOwner}
      />
      <ListingGrid boardId={board.id} listings={board.listings} pins={board.pins} />
    </main>
  );
}
