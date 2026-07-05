import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeSelector } from "@/components/settings/ThemeSelector";

/**
 * Shared top navigation for the public marketing pages (landing + about).
 *
 * The logo links to `/?browse` — the `browse` param bypasses the landing
 * page's "redirect logged-in users to /boards" behavior, so signed-in users
 * still see the actual landing page when they click it.
 */
export async function LandingNav({ isLoggedIn }: { isLoggedIn: boolean }) {
  const t = await getTranslations("landing");
  const locale = await getLocale();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#faf9f7]/80 dark:bg-[#1c1c1a]/80 backdrop-blur-lg border-b border-sage-100/60 dark:border-zinc-800/60">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/?browse" className="flex items-center gap-2.5">
          <span className="w-8 h-8 bg-sage-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md shadow-sage-600/20">
            B
          </span>
          <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Bolyst
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/about"
            className="inline-flex px-2 sm:px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            {t("nav.about")}
          </Link>
          <LanguageSwitcher locale={locale} variant="landing" />
          <ThemeSelector compact toggleSize={11} />
          {isLoggedIn ? (
            <Link
              href="/boards"
              className="px-4 sm:px-5 py-2 text-sm font-semibold bg-sage-600 text-white rounded-xl hover:bg-sage-700 active:scale-[0.98] transition-all shadow-md shadow-sage-600/20"
            >
              {t("nav.goToBoards")}
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                {t("nav.signIn")}
              </Link>
              <Link
                href="/sign-up"
                className="px-4 sm:px-5 py-2 text-sm font-semibold bg-sage-600 text-white rounded-xl hover:bg-sage-700 active:scale-[0.98] transition-all shadow-md shadow-sage-600/20"
              >
                {t("nav.getStarted")}
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
