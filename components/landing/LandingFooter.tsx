import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BrandMark } from "@/components/BrandMark";

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
              <span className="w-7 h-7 bg-sage-600 rounded-lg flex items-center justify-center shadow-sm">
                <BrandMark className="w-full h-full" />
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
            <div className="mt-5 flex items-center gap-2">
              <a
                href="https://www.instagram.com/bolyst.eu"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("footer.instagram")}
                title={t("footer.instagram")}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-sage-600 dark:hover:text-sage-400 hover:bg-sage-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/company/bolyst/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("footer.linkedin")}
                title={t("footer.linkedin")}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-sage-600 dark:hover:text-sage-400 hover:bg-sage-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
                </svg>
              </a>
            </div>
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
