import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { joinRedirect } from "@/lib/invite-link";
import { AuthMapBackground } from "@/components/auth/AuthMapBackground";
import { BrandMark } from "@/components/BrandMark";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const joinUrl = joinRedirect((await searchParams).redirect_url);
  const t = await getTranslations("auth");

  return (
    <div
      data-light-only
      className="min-h-screen flex flex-col items-center justify-center [color-scheme:light]"
    >
      <AuthMapBackground />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center animate-[authFadeIn_1.2s_ease-in_1.5s_both]">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-3">
            <span className="w-9 h-9 bg-sage-600 rounded-xl flex items-center justify-center shadow-md shadow-sage-600/20">
              <BrandMark className="w-full h-full" />
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">Bolyst</h1>
          </Link>
          <p className="text-sm text-zinc-500">
            {t("tagline")} <span className="text-sage-600">{t("taglineAccent")}</span>.
          </p>
        </div>

        <SignIn forceRedirectUrl={joinUrl} signUpForceRedirectUrl={joinUrl} />
      </div>
    </div>
  );
}
