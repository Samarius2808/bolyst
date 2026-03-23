import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AuthMapBackground } from "@/components/auth/AuthMapBackground";

export default async function SignUpPage() {
  const t = await getTranslations("auth");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <AuthMapBackground />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center animate-[authFadeIn_1.2s_ease-in_1.5s_both]">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-3">
            <span className="w-9 h-9 bg-sage-600 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-md shadow-sage-600/20">
              B
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">Bolyst</h1>
          </Link>
          <p className="text-sm text-zinc-500">
            {t("tagline")} <span className="text-sage-600">{t("taglineAccent")}</span>.
          </p>
        </div>

        <SignUp />
      </div>
    </div>
  );
}
