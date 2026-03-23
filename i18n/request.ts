import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

const SUPPORTED_LOCALES = ["en", "de"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

function isSupported(locale: string): locale is Locale {
  return SUPPORTED_LOCALES.includes(locale as Locale);
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;

  const locale: Locale = cookieLocale && isSupported(cookieLocale) ? cookieLocale : "en";

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
