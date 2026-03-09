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
      members: {
        include: { user: { select: { name: true, email: true } } },
        take: 4,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
      <header className="flex items-center justify-between mb-10">
        <div>
          <div className="inline-flex items-center gap-2.5">
            <span className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md shadow-violet-600/20">
              B
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
              Bolyst
            </h1>
          </div>
          <p className="text-base text-zinc-500 mt-1">
            Your apartment search boards
          </p>
        </div>
        <UserButton />
      </header>
      <BoardList boards={boards} />
    </main>
  );
}
