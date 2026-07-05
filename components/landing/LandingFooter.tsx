import Link from "next/link";
import { getTranslations } from "next-intl/server";

/**
 * Shared footer for the public marketing pages (landing + about).
 * Logo links to `/?browse` so signed-in users still reach the landing page.
 */
export async function LandingFooter() {
  const t = await getTranslations("landing");

  return (
    <footer className="border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-[#1c1c1a]">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <Link href="/?browse" className="flex items-center gap-2.5 mb-4">
              <span className="w-7 h-7 bg-sage-600 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                B
              </span>
              <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">Bolyst</span>
            </Link>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {t("footer.description")}{" "}
              <span className="text-sage-600 dark:text-sage-400 font-medium">
                {t("footer.descriptionAccent")}
              </span>
              .
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-4">
              {t("footer.product")}
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/sign-up"
                  className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-sage-600 dark:hover:text-sage-400 transition-colors"
                >
                  {t("footer.getStarted")}
                </Link>
              </li>
              <li>
                <Link
                  href="/?browse#features"
                  className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-sage-600 dark:hover:text-sage-400 transition-colors"
                >
                  {t("footer.features")}
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-sage-600 dark:hover:text-sage-400 transition-colors"
                >
                  {t("nav.about")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-4">
              {t("footer.company")}
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="mailto:hello@bolyst.eu"
                  className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-sage-600 dark:hover:text-sage-400 transition-colors"
                >
                  {t("footer.contact")}
                </a>
              </li>
              <li>
                <Link
                  href="/impressum"
                  className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-sage-600 dark:hover:text-sage-400 transition-colors"
                >
                  {t("footer.impressum")}
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-sage-600 dark:hover:text-sage-400 transition-colors"
                >
                  {t("footer.privacy")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            &copy; {new Date().getFullYear()} Bolyst
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            {t("footer.tagline")}{" "}
            <span className="text-sage-500 dark:text-sage-400">{t("footer.taglineAccent")}</span>.
          </p>
        </div>
      </div>
    </footer>
  );
}
