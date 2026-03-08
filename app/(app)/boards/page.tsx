import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BoardList } from "@/components/boards/BoardList";
import { UserButton } from "@clerk/nextjs";

export default async function BoardsPage() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const boards = await prisma.board.findMany({
    where: {
      OR: [
        { ownerId: user.id },
        { members: { some: { userId: user.id } } },
      ],
    },
    include: {
      _count: { select: { listings: true, members: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            SVEEN
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Your apartment search boards
          </p>
        </div>
        <UserButton />
      </div>
      <BoardList boards={boards} />
    </main>
  );
}
