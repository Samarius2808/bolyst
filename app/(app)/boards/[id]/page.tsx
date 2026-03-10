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
          addedBy: { select: { id: true, name: true, email: true } },
          _count: { select: { comments: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      tags: true,
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

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id, listing: { boardId: id } },
    select: { listingId: true },
  });
  const favoritedIds = favorites.map((f) => f.listingId);

  // Fetch all board members' favorites for per-member visibility
  const allFavorites = await prisma.favorite.findMany({
    where: { listing: { boardId: id } },
    select: {
      listingId: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });
  // Group by listingId → array of users who favorited
  const memberFavoritesMap: Record<string, { id: string; name: string | null; email: string }[]> = {};
  for (const fav of allFavorites) {
    if (!memberFavoritesMap[fav.listingId]) memberFavoritesMap[fav.listingId] = [];
    memberFavoritesMap[fav.listingId].push(fav.user);
  }

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
      <ListingGrid
        boardId={board.id}
        listings={board.listings}
        pins={board.pins}
        boardTags={board.tags}
        favoritedIds={favoritedIds}
        memberFavorites={memberFavoritesMap}
        currentUserId={user.id}
        members={board.members.map((m) => m.user)}
      />
    </main>
  );
}
