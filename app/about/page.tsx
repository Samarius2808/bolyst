import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { PronunciationWord } from "@/components/landing/NameOrigin";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";

const CDN = "https://bolyst-cdn.bolyst-team.workers.dev";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return { title: t("aboutTitle") };
}

export default async function AboutPage() {
  const t = await getTranslations("landing");
  const { userId } = await auth();
  const isLoggedIn = !!userId;

  return (
    <div className="min-h-screen bg-[#faf9f7] dark:bg-[#1c1c1a]">
      <LandingNav isLoggedIn={isLoggedIn} />

      <main className="pt-16">
        {/* Act I — the word itself, full stage */}
        <section className="relative min-h-[calc(100svh-4rem)] flex items-center justify-center px-6 overflow-hidden">
          {/* soft sage glow behind the wordmark */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[480px] w-[640px] max-w-full pointer-events-none bg-[radial-gradient(ellipse_at_center,_#55704a1f_0%,_transparent_65%)]" />

          <div className="relative text-center">
            <div className="[animation:slideUp_0.6s_ease-out_both]">
              <PronunciationWord
                src={`${CDN}/audio/bolyst.mp3`}
                listenLabel={t("origin.listen")}
                phonetic={t("origin.phonetic")}
                provenance={t("origin.provenance")}
              />
            </div>
          </div>

          {/* scroll cue */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-zinc-300 dark:text-zinc-600 [animation:slideUp_0.6s_ease-out_both] [animation-delay:300ms]">
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

        {/* Act II — what it means */}
        <section className="px-6 py-24 sm:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-2xl sm:text-3xl font-medium tracking-tight leading-snug text-zinc-800 dark:text-zinc-100 text-balance">
              {t("origin.intro")}
            </p>
            <p className="mt-8 text-base text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xl mx-auto">
              {t("origin.planning")}
            </p>
          </div>
        </section>

        {/* Act III — the two halves, facing each other */}
        <section className="px-6 pb-24 sm:pb-32">
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-5 sm:gap-12">
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">
                  {t("origin.boType")}
                </p>
                <p className="text-4xl sm:text-6xl font-extrabold tracking-tight text-sage-600 lowercase">
                  {t("origin.bo")}
                </p>
                <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {t("origin.boGloss")}
                </p>
              </div>

              <div className="flex flex-col items-center justify-center gap-3">
                <span className="h-8 sm:h-10 w-px bg-zinc-200 dark:bg-zinc-800" aria-hidden />
                <span className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xl font-light text-zinc-400 dark:text-zinc-500 shadow-sm">
                  +
                </span>
                <span className="h-8 sm:h-10 w-px bg-zinc-200 dark:bg-zinc-800" aria-hidden />
              </div>

              <div className="text-left">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">
                  {t("origin.lystType")}
                </p>
                <p className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 lowercase">
                  {t("origin.lyst")}
                </p>
                <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {t("origin.lystGloss")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Act IV — closing */}
        <section className="px-6 pb-28 sm:pb-36">
          <div className="max-w-xl mx-auto text-center">
            <p className="text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed text-balance">
              {t("origin.outro")}{" "}
              <span className="text-sage-600 dark:text-sage-400 font-semibold">
                {t("origin.outroAccent")}
              </span>
              .
            </p>
            <div className="mt-10">
              <Link
                href="/sign-up"
                className="inline-flex px-8 py-3.5 text-sm font-semibold bg-sage-600 text-white rounded-2xl hover:bg-sage-700 active:scale-[0.98] transition-all shadow-lg shadow-sage-600/25"
              >
                {t("cta.button")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
