import Link from "next/link";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BoardList } from "@/components/boards/BoardList";
import { UserButton } from "@clerk/nextjs";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AuthGate } from "@/components/auth/AuthGate";

import { getLocale, getTranslations } from "next-intl/server";
import { EasterEgg } from "@/components/EasterEgg";
import { FeedbackButton } from "@/components/FeedbackModal";

export default async function BoardsPage() {
  const user = await getOrCreateUser();
  if (!user) return <AuthGate />;

  const t = await getTranslations("boards");
  const locale = await getLocale();

  const boards = await prisma.board.findMany({
    where: {
      OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
    },
    include: {
      _count: { select: { listings: true, members: true } },
      members: {
        include: { user: { select: { name: true, email: true } } },
        take: 4,
      },
      listings: {
        take: 4,
        select: { imageUrls: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalListings = boards.reduce((sum, b) => sum + b._count.listings, 0);
  const firstName = user.name?.split(" ")[0] || user.email.split("@")[0];

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
      <header className="flex items-center justify-between mb-6">
        <div>
          <Link href="/?browse=1" className="inline-flex items-center gap-2.5">
            <span className="w-8 h-8 bg-sage-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md shadow-sage-600/20">
              B
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              Bolyst
            </h1>
          </Link>
          <p className="text-base text-zinc-500 dark:text-zinc-400 mt-1">
            {boards.length > 0
              ? t("greeting", { name: firstName, boards: boards.length, listings: totalListings })
              : t("subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FeedbackButton />
          <LanguageSwitcher locale={locale} />
          <UserButton />
        </div>
      </header>
      <BoardList boards={boards} />
      <EasterEgg />
    </main>
  );
}
