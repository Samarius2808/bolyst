"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function PrivacyPage() {
  const t = useTranslations("privacy");

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
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">{t("title")}</h1>
        <p className="text-sm text-zinc-400 mb-8">{t("lastUpdated")}</p>

        <div className="prose prose-zinc prose-sm max-w-none space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">
              {t("responsibleTitle")}
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-line">
              {t("responsibleBody")}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">
              {t("dataCollectedTitle")}
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed mb-3">
              {t("dataCollectedIntro")}
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-zinc-600">
              <li>{t("dataAccount")}</li>
              <li>{t("dataUsage")}</li>
              <li>{t("dataContent")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">
              {t("purposeTitle")}
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-zinc-600">
              <li>{t("purposeService")}</li>
              <li>{t("purposeAuth")}</li>
              <li>{t("purposeEmail")}</li>
              <li>{t("purposeAnalytics")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">
              {t("thirdPartyTitle")}
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-zinc-600">
              <li>
                <strong>Clerk</strong> — {t("thirdClerk")}
              </li>
              <li>
                <strong>Supabase</strong> — {t("thirdSupabase")}
              </li>
              <li>
                <strong>Vercel</strong> — {t("thirdVercel")}
              </li>
              <li>
                <strong>Brevo</strong> — {t("thirdBrevo")}
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">
              {t("cookiesTitle")}
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              {t("cookiesBody")}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">
              {t("rightsTitle")}
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed mb-3">
              {t("rightsIntro")}
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-zinc-600">
              <li>{t("rightsAccess")}</li>
              <li>{t("rightsCorrection")}</li>
              <li>{t("rightsDeletion")}</li>
              <li>{t("rightsPortability")}</li>
              <li>{t("rightsObjection")}</li>
            </ul>
            <p className="text-sm text-zinc-600 leading-relaxed mt-3">
              {t("rightsContact")}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">
              {t("retentionTitle")}
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              {t("retentionBody")}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">
              {t("authorityTitle")}
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              {t("authorityBody")}
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
