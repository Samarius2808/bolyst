import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { HeroVideo } from "@/components/landing/HeroVideo";
import { ContainerScroll, ContainerInset } from "@/components/landing/VideoScroll";
import { FeatureCard } from "@/components/landing/FeatureCard";
import { IsometricCity } from "@/components/landing/IsometricCity";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";

const CDN = "https://bolyst-cdn.bolyst-team.workers.dev";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const isBrowsing = params.browse !== undefined;
  const { userId } = await auth();
  if (userId && !isBrowsing) redirect("/boards");

  const isLoggedIn = !!userId;

  const t = await getTranslations("landing");
  const tStatus = await getTranslations("statusLabels");

  return (
    <div className="min-h-screen bg-[#faf9f7] dark:bg-[#1c1c1a]">
      <LandingNav isLoggedIn={isLoggedIn} />

      {/* Hero tagline */}
      <section className="min-h-screen relative flex items-center justify-center px-6 overflow-hidden">
        {/* Isometric city illustration — right-side background */}
        <IsometricCity className="absolute inset-0 w-full h-full pointer-events-none select-none opacity-40" />
        {/* Fade center so hero text stays readable, both sides even */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_#faf9f7cc_0%,_#faf9f700_70%)] dark:bg-[radial-gradient(ellipse_at_center,_#1c1c1acc_0%,_#1c1c1a00_70%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sage-600 mb-8 [animation:slideUp_0.6s_ease-out_both]">
            {t("hero.subtitle")}
          </p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 leading-[1.08] [animation:slideUp_0.6s_ease-out_both] [animation-delay:120ms]">
            {t("hero.titleLine1")}
            <br />
            <span className="text-sage-600">{t("hero.titleLine2")}</span>.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-zinc-700 dark:text-zinc-200 max-w-2xl mx-auto leading-relaxed font-medium text-balance [animation:slideUp_0.6s_ease-out_both] [animation-delay:240ms]">
            {t("hero.description")}
          </p>
          <div className="mt-10 flex items-center justify-center gap-4 [animation:slideUp_0.6s_ease-out_both] [animation-delay:360ms]">
            <Link
              href="/sign-up"
              className="px-8 py-3.5 text-sm font-semibold bg-sage-600 text-white rounded-2xl hover:bg-sage-700 active:scale-[0.98] transition-all shadow-lg shadow-sage-600/25"
            >
              {t("hero.cta")}
            </Link>
          </div>
        </div>

        {/* scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-zinc-300 dark:text-zinc-600 [animation:slideUp_0.6s_ease-out_both] [animation-delay:600ms]">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-bounce [animation-duration:2.5s]"
            aria-hidden
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </section>

      {/* Hero video — scroll-locked reveal */}
      <ContainerScroll className="bg-[#faf9f7] dark:bg-[#1c1c1a]">
        <ContainerInset
          roundednessRange={[24, 0]}
          className="shadow-2xl shadow-sage-900/10 border border-sage-200/60 dark:border-zinc-700/60 bg-white dark:bg-zinc-900"
        >
          <HeroVideo src={`${CDN}/videos/hero.mp4`} poster={`${CDN}/images/hero-screenshot.png`} />
        </ContainerInset>
      </ContainerScroll>

      {/* Features */}
      <section className="py-24 sm:py-32 px-6" id="features">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sage-600 mb-4">
              {t("footer.features")}
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 text-balance">
              {t("features.heading")}{" "}
              <span className="text-sage-600">{t("features.headingAccent")}</span>.
            </h2>
            <p className="mt-4 text-base text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto text-balance">
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
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="text-sage-600"
                >
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
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="text-sage-600"
                >
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
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="text-sage-600"
                >
                  <rect x="2" y="4" width="7" height="16" rx="1.5" />
                  <rect x="15" y="4" width="7" height="16" rx="1.5" />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 sm:py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sage-600 mb-4">
              {t("howItWorks.eyebrow")}
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 text-balance">
              {t("howItWorks.heading")}
            </h2>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* hairline connecting the steps */}
            <div
              className="hidden md:block absolute top-6 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-sage-300/70 dark:via-zinc-700 to-transparent"
              aria-hidden
            />
            <div className="text-center">
              <div className="relative w-12 h-12 rounded-2xl bg-sage-600 text-white text-lg font-bold flex items-center justify-center mx-auto mb-5 shadow-md shadow-sage-600/20">
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
              <div className="relative w-12 h-12 rounded-2xl bg-sage-600 text-white text-lg font-bold flex items-center justify-center mx-auto mb-5 shadow-md shadow-sage-600/20">
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
              <div className="relative w-12 h-12 rounded-2xl bg-sage-600 text-white text-lg font-bold flex items-center justify-center mx-auto mb-5 shadow-md shadow-sage-600/20">
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
      <section className="py-24 sm:py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sage-600">
              {t("details.eyebrow")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-8 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3">
                {t("details.pasteUrl.title")}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
                {t("details.pasteUrl.description")}
              </p>
              <div className="flex items-center gap-2 text-xs text-sage-600 dark:text-sage-400 font-medium">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <path d="M3 8.5l3 3 7-7" />
                </svg>
                {t("details.pasteUrl.check")}
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-8 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
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
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-8 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
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
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-8 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
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
      <section className="relative py-28 sm:py-36 px-6 overflow-hidden">
        {/* soft sage glow */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[420px] w-[640px] max-w-full pointer-events-none bg-[radial-gradient(ellipse_at_center,_#55704a1f_0%,_transparent_65%)]" />
        <div className="max-w-2xl mx-auto text-center relative">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 text-balance">
            {t("cta.titleLine1")}
            <br />
            {t("cta.titleLine2")} <span className="text-sage-600">{t("cta.titleAccent")}</span>.
          </h2>
          <p className="mt-5 text-base text-zinc-500 dark:text-zinc-400 text-balance">
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

      <LandingFooter />
    </div>
  );
}
