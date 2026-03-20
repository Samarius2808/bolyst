import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { HeroVideo } from "@/components/landing/HeroVideo";
import { ContainerScroll, ContainerInset } from "@/components/landing/VideoScroll";
import { FeatureCard } from "@/components/landing/FeatureCard";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeSelector } from "@/components/settings/ThemeSelector";
import { IsometricCity } from "@/components/landing/IsometricCity";

const CDN = "https://bolyst-cdn.bolyst-team.workers.dev";

export default async function Home({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const isBrowsing = params.browse !== undefined;
  const { userId } = await auth();
  if (userId && !isBrowsing) redirect("/boards");

  const isLoggedIn = !!userId;

  const t = await getTranslations("landing");
  const tStatus = await getTranslations("statusLabels");
  const locale = await getLocale();

  return (
    <div className="min-h-screen bg-[#faf9f7] dark:bg-[#1c1c1a]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#faf9f7]/80 dark:bg-[#1c1c1a]/80 backdrop-blur-lg border-b border-sage-100/60 dark:border-zinc-800/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-sage-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md shadow-sage-600/20">
              B
            </span>
            <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Bolyst
            </span>
          </a>
          <div className="flex items-center gap-3">
            <LanguageSwitcher locale={locale} variant="landing" />
            <ThemeSelector compact toggleSize={11} />
            {isLoggedIn ? (
              <Link
                href="/boards"
                className="px-5 py-2 text-sm font-semibold bg-sage-600 text-white rounded-xl hover:bg-sage-700 active:scale-[0.98] transition-all shadow-md shadow-sage-600/20"
              >
                {t("nav.goToBoards")}
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  {t("nav.signIn")}
                </Link>
                <Link
                  href="/sign-up"
                  className="px-5 py-2 text-sm font-semibold bg-sage-600 text-white rounded-xl hover:bg-sage-700 active:scale-[0.98] transition-all shadow-md shadow-sage-600/20"
                >
                  {t("nav.getStarted")}
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero tagline */}
      <section className="min-h-screen relative flex items-center justify-center px-6 overflow-hidden">
        {/* Isometric city illustration — right-side background */}
        <IsometricCity className="absolute inset-0 w-full h-full pointer-events-none select-none opacity-40" />
        {/* Fade center so hero text stays readable, both sides even */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_#faf9f7cc_0%,_#faf9f700_70%)] dark:bg-[radial-gradient(ellipse_at_center,_#1c1c1acc_0%,_#1c1c1a00_70%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <p className="text-sm font-medium text-sage-600 mb-8">
            {t("hero.subtitle")}
          </p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 leading-[1.08]">
            {t("hero.titleLine1")}
            <br />
            <span className="text-sage-600">{t("hero.titleLine2")}</span>.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-zinc-700 dark:text-zinc-200 max-w-2xl mx-auto leading-relaxed font-medium">
            {t("hero.description")}
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="px-8 py-3.5 text-sm font-semibold bg-sage-600 text-white rounded-2xl hover:bg-sage-700 active:scale-[0.98] transition-all shadow-lg shadow-sage-600/25"
            >
              {t("hero.cta")}
            </Link>
          </div>
        </div>
      </section>

      {/* Hero video — scroll-locked reveal */}
      <ContainerScroll className="bg-[#faf9f7] dark:bg-[#1c1c1a]">
        <ContainerInset roundednessRange={[24, 0]} className="shadow-2xl shadow-sage-900/10 border border-sage-200/60 dark:border-zinc-700/60 bg-white dark:bg-zinc-900">
          <HeroVideo
            src={`${CDN}/videos/hero.mp4`}
            poster={`${CDN}/images/hero-screenshot.png`}
          />
        </ContainerInset>
      </ContainerScroll>

      {/* Features */}
      <section className="py-24 px-6" id="features">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              {t("features.heading")}{" "}
              <span className="text-sage-600">{t("features.headingAccent")}</span>.
            </h2>
            <p className="mt-4 text-base text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
              {t("features.subheading")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              title={t("features.share.title")}
              description={t("features.share.description")}
              videoSrc={`${CDN}/videos/feature-share.mp4`}
              videoPoster={`${CDN}/images/feature-share.png`}
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-sage-600">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
                </svg>
              }
            />
            <FeatureCard
              title={t("features.map.title")}
              description={t("features.map.description")}
              videoSrc={`${CDN}/videos/feature-map.mp4`}
              videoPoster={`${CDN}/images/feature-map.png`}
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-sage-600">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
              }
            />
            <FeatureCard
              title={t("features.compare.title")}
              description={t("features.compare.description")}
              videoSrc={`${CDN}/videos/feature-compare.mp4`}
              videoPoster={`${CDN}/images/feature-compare.png`}
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-sage-600">
                  <rect x="2" y="4" width="7" height="16" rx="1.5" />
                  <rect x="15" y="4" width="7" height="16" rx="1.5" />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              {t("howItWorks.heading")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-sage-600 text-white text-lg font-bold flex items-center justify-center mx-auto mb-5 shadow-md shadow-sage-600/20">
                1
              </div>
              <h3 className="text-[15px] font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                {t("howItWorks.step1.title")}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {t("howItWorks.step1.description")}
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-sage-600 text-white text-lg font-bold flex items-center justify-center mx-auto mb-5 shadow-md shadow-sage-600/20">
                2
              </div>
              <h3 className="text-[15px] font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                {t("howItWorks.step2.title")}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {t("howItWorks.step2.description")}
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-sage-600 text-white text-lg font-bold flex items-center justify-center mx-auto mb-5 shadow-md shadow-sage-600/20">
                3
              </div>
              <h3 className="text-[15px] font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                {t("howItWorks.step3.title")}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {t("howItWorks.step3.description")}{" "}
                <span className="text-sage-600 font-semibold">{t("howItWorks.step3.accent")}</span>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Extra details */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-8">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3">
                {t("details.pasteUrl.title")}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
                {t("details.pasteUrl.description")}
              </p>
              <div className="flex items-center gap-2 text-xs text-sage-600 dark:text-sage-400 font-medium">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M3 8.5l3 3 7-7" />
                </svg>
                {t("details.pasteUrl.check")}
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-8">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3">
                {t("details.referencePoints.title")}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
                {t("details.referencePoints.description")}
              </p>
              <div className="flex items-center gap-2 text-xs text-sage-600 dark:text-sage-400 font-medium">
                <span className="text-base">★</span>
                {t("details.referencePoints.check")}
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-8">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3">
                {t("details.trackProgress.title")}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
                {t("details.trackProgress.description")}
              </p>
              <div className="flex flex-wrap gap-2">
                {(["New", "Viewing", "Applied", "Accepted"] as const).map((s) => (
                  <span
                    key={s}
                    className="px-2.5 py-1 text-xs font-medium rounded-full bg-sage-50 dark:bg-sage-950/40 text-sage-700 dark:text-sage-400 border border-sage-200 dark:border-sage-800"
                  >
                    {tStatus(s)}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-8">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3">
                {t("details.tagsFavorites.title")}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
                {t("details.tagsFavorites.description")}
              </p>
              <div className="flex flex-wrap gap-2">
                {(t.raw("details.tagsFavorites.exampleTags") as string[]).map((tag: string) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 text-xs font-medium rounded-full bg-sage-50 dark:bg-sage-950/40 text-sage-700 dark:text-sage-400 border border-sage-200 dark:border-sage-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            {t("cta.titleLine1")}
            <br />
            {t("cta.titleLine2")}{" "}
            <span className="text-sage-600">{t("cta.titleAccent")}</span>.
          </h2>
          <p className="mt-5 text-base text-zinc-500 dark:text-zinc-400">
            {t("cta.description")}
          </p>
          <div className="mt-8">
            <Link
              href="/sign-up"
              className="inline-flex px-8 py-3.5 text-sm font-semibold bg-sage-600 text-white rounded-2xl hover:bg-sage-700 active:scale-[0.98] transition-all shadow-lg shadow-sage-600/25"
            >
              {t("cta.button")}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-[#1c1c1a]">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {/* Brand */}
            <div>
              <a href="#" className="flex items-center gap-2.5 mb-4">
                <span className="w-7 h-7 bg-sage-600 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                  B
                </span>
                <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Bolyst
                </span>
              </a>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {t("footer.description")}{" "}
                <span className="text-sage-600 dark:text-sage-400 font-medium">{t("footer.descriptionAccent")}</span>.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-4">
                {t("footer.product")}
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/sign-up" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-sage-600 dark:hover:text-sage-400 transition-colors">
                    {t("footer.getStarted")}
                  </Link>
                </li>
                <li>
                  <a href="#features" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-sage-600 dark:hover:text-sage-400 transition-colors">
                    {t("footer.features")}
                  </a>
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
                  <a href="mailto:hello@bolyst.eu" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-sage-600 dark:hover:text-sage-400 transition-colors">
                    {t("footer.contact")}
                  </a>
                </li>
                <li>
                  <Link href="/impressum" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-sage-600 dark:hover:text-sage-400 transition-colors">
                    {t("footer.impressum")}
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-sage-600 dark:hover:text-sage-400 transition-colors">
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
              {t("footer.tagline")} <span className="text-sage-500 dark:text-sage-400">{t("footer.taglineAccent")}</span>.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
