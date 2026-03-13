import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BoardList } from "@/components/boards/BoardList";
import { UserButton } from "@clerk/nextjs";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

export default async function BoardsPage() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const t = await getTranslations("boards");
  const locale = await getLocale();

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
          <Link href="/?browse" className="inline-flex items-center gap-2.5">
            <span className="w-8 h-8 bg-sage-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md shadow-sage-600/20">
              B
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
              Bolyst
            </h1>
          </Link>
          <p className="text-base text-zinc-500 mt-1">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher locale={locale} />
          <UserButton />
        </div>
      </header>
      <BoardList boards={boards} />
    </main>
  );
}
