import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlausibleInviteToken } from "@/lib/invite-link";
import { AuthMapBackground } from "@/components/auth/AuthMapBackground";
import { JoinBoardButton } from "@/components/boards/JoinBoardButton";

// Link previews in chat apps shouldn't index or cache someone's board invite
export const metadata: Metadata = { robots: { index: false, follow: false } };

const avatarColors = [
  "bg-sage-100 text-sage-600",
  "bg-blue-100 text-blue-600",
  "bg-emerald-100 text-emerald-600",
  "bg-amber-100 text-amber-600",
  "bg-rose-100 text-rose-600",
];

function firstName(user: { name: string | null; email: string }) {
  return (user.name || user.email.split("@")[0]).split(" ")[0];
}

export default async function JoinBoardPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const t = await getTranslations("join");

  const board = isPlausibleInviteToken(token)
    ? await prisma.board.findUnique({
        where: { inviteToken: token },
        select: {
          id: true,
          name: true,
          coverImageUrl: true,
          members: {
            select: { userId: true, user: { select: { name: true, email: true } } },
            orderBy: { role: "asc" }, // OWNER first
          },
          _count: { select: { listings: { where: { archivedAt: null } } } },
        },
      })
    : null;

  const user = await getOrCreateUser();
  if (board && user && board.members.some((m) => m.userId === user.id)) {
    redirect(`/boards/${board.id}`);
  }

  const joinPath = `/join/${encodeURIComponent(token)}`;
  const names = board?.members.map((m) => firstName(m.user)) ?? [];
  const who =
    names.length === 0
      ? null
      : names.length === 1
        ? t("whoOne", { a: names[0] })
        : names.length === 2
          ? t("whoTwo", { a: names[0], b: names[1] })
          : t("whoMany", { a: names[0], b: names[1], count: names.length - 2 });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <AuthMapBackground />
      <div className="relative z-10 w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-6">
          <span className="w-9 h-9 bg-sage-600 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-md shadow-sage-600/20">
            B
          </span>
          <span className="text-3xl font-extrabold tracking-tight text-zinc-900">Bolyst</span>
        </Link>

        <div className="bg-white rounded-3xl shadow-2xl shadow-black/10 overflow-hidden">
          {!board ? (
            <div className="p-7 text-center">
              <div className="text-4xl mb-3" aria-hidden>
                🔑
              </div>
              <h1 className="text-lg font-semibold text-zinc-900 mb-1.5">{t("invalidTitle")}</h1>
              <p className="text-sm text-zinc-500 mb-6">{t("invalidBody")}</p>
              <Link
                href={user ? "/boards" : "/"}
                className="inline-flex px-5 py-2.5 text-sm font-semibold bg-sage-600 text-white rounded-xl hover:bg-sage-700 transition-colors"
              >
                {user ? t("toBoards") : t("toHome")}
              </Link>
            </div>
          ) : (
            <>
              {board.coverImageUrl ? (
                <img src={board.coverImageUrl} alt="" className="w-full h-36 object-cover" />
              ) : (
                <div className="h-24 bg-gradient-to-br from-sage-100 via-sage-50 to-white" />
              )}
              <div className="p-7 pt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-sage-600 mb-1.5">
                  {t("eyebrow")}
                </p>
                <h1 className="text-xl font-bold text-zinc-900 break-words mb-3">{board.name}</h1>

                <div className="flex items-center gap-3 mb-6">
                  <div className="flex -space-x-2">
                    {board.members.slice(0, 4).map((m, i) => (
                      <span
                        key={m.userId}
                        className={`w-8 h-8 rounded-full ring-2 ring-white ${avatarColors[i % avatarColors.length]} text-xs font-semibold flex items-center justify-center`}
                      >
                        {firstName(m.user)[0]?.toUpperCase() ?? "?"}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-zinc-500 leading-snug">
                    {who}
                    {who && <br />}
                    <span className="text-zinc-400">
                      {t("listingCount", { count: board._count.listings })}
                    </span>
                  </p>
                </div>

                {user ? (
                  <JoinBoardButton token={token} />
                ) : (
                  <div className="space-y-2.5">
                    <Link
                      href={`/sign-up?redirect_url=${encodeURIComponent(joinPath)}`}
                      className="block w-full text-center px-5 py-3 text-sm font-semibold bg-sage-600 text-white rounded-xl hover:bg-sage-700 shadow-md shadow-sage-600/20 transition-colors"
                    >
                      {t("signUpToJoin")}
                    </Link>
                    <Link
                      href={`/sign-in?redirect_url=${encodeURIComponent(joinPath)}`}
                      className="block w-full text-center px-5 py-2.5 text-sm font-medium text-zinc-500 hover:text-zinc-800 transition-colors"
                    >
                      {t("haveAccount")}
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
