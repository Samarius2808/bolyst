"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function ImpressumPage() {
  const t = useTranslations("impressum");

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <nav className="border-b border-zinc-100 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-7 h-7 bg-sage-600 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
              B
            </span>
            <span className="text-base font-bold text-zinc-900">Bolyst</span>
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-zinc-900 mb-8">{t("title")}</h1>

        <div className="prose prose-zinc prose-sm max-w-none space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">
              {t("infoTitle")}
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-line">
              {t("infoBody")}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">
              {t("contactTitle")}
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-line">
              {t("contactBody")}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">
              {t("disclaimerTitle")}
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              {t("disclaimerBody")}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">
              {t("linksTitle")}
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              {t("linksBody")}
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
