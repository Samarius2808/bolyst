import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { CompareTable } from "@/components/listings/CompareTable";
import { getTranslations } from "next-intl/server";

export default async function ComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ids?: string }>;
}) {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const { id } = await params;
  const { ids } = await searchParams;
  const t = await getTranslations("compareTable");

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
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!board) notFound();

  const selectedIds = ids ? ids.split(",").filter(Boolean) : null;
  const listings = selectedIds
    ? board.listings.filter((l) => selectedIds.includes(l.id))
    : board.listings;

  return (
    <main className="max-w-full mx-auto px-4 sm:px-8 py-6 sm:py-10">
      <div className="mb-8">
        <Link
          href={`/boards/${id}`}
          className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-600 transition-colors mb-1"
        >
          <span>&larr;</span> {board.name}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("title")}
          {selectedIds && (
            <span className="text-base font-normal text-zinc-400 ml-2">
              ({listings.length} of {board.listings.length})
            </span>
          )}
        </h1>
      </div>

      {listings.length === 0 ? (
        <p className="text-zinc-400">{t("noListings")}</p>
      ) : (
        <CompareTable listings={listings} />
      )}
    </main>
  );
}
