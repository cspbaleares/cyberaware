import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { defaultLocale, locales, type Locale } from "./config";

export default getRequestConfig(async () => {
  // Try to get locale from cookie
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("locale")?.value as Locale | undefined;

  // Try to get locale from Accept-Language header
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language");
  
  let headerLocale: Locale | undefined;
  if (acceptLanguage) {
    const preferred = acceptLanguage.split(",")[0].split("-")[0];
    if (locales.includes(preferred as Locale)) {
      headerLocale = preferred as Locale;
    }
  }

  // Determine locale (cookie > header > default)
  const locale = cookieLocale || headerLocale || defaultLocale;

  // Load messages
  const messages = (await import(`./messages/${locale}.json`)).default;

  return {
    locale,
    messages,
    timeZone: "Europe/Madrid",
    now: new Date(),
  };
});
