import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { serif, sans } from "@/lib/fonts";
import { locales, isLocale, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getAvailability, getPracticeAreas, getSettings } from "@/lib/data";
import { getContact } from "@/lib/contact";
import { publicEnv } from "@/lib/env";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { StickyContactBar } from "@/components/site/sticky-contact-bar";
import { JsonLd } from "@/components/site/json-ld";
import { Analytics } from "@/components/analytics/analytics";
import { CookieBanner } from "@/components/analytics/cookie-banner";
import { firmJsonLd } from "@/lib/seo";
import "../globals.css";

export const dynamicParams = false;
export const revalidate = 3600; // refresh public content at most hourly (admin edits will also trigger on-demand revalidation)

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0e241c",
  colorScheme: "light",
};

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.NEXT_PUBLIC_SITE_URL),
  title: {
    default: "James Kale & Co. Advocates | Kabarnet, Baringo County",
    template: "%s | James Kale & Co. Advocates",
  },
  description:
    "Advocates in Kabarnet, Baringo County. Land and conveyancing, family and succession, criminal defence, commercial, employment and debt recovery.",
};

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [t, settings, areas, hours] = await Promise.all([getDictionary(locale), getSettings(), getPracticeAreas(), getAvailability()]);
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || undefined;
  const gaId = process.env.NEXT_PUBLIC_GA_ID || undefined;
  const analyticsOn = Boolean(plausibleDomain || gaId);
  const contact = getContact(settings);

  return (
    <html lang={locale} className={`${serif.variable} ${sans.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-ivory focus:px-4 focus:py-2 focus:text-ink"
        >
          Skip to content
        </a>
        <Header
          locale={locale}
          showLanguageToggle={settings.features.kiswahili}
          labels={{ ...t.nav, book: t.cta.book }}
        />
        <JsonLd data={firmJsonLd(settings, areas, hours)} />
        {children}
        <Footer locale={locale} t={t} settings={settings} areas={areas} cookieLabel={analyticsOn ? t.cookie.settings : undefined} />
        <StickyContactBar
          tel={contact.tel}
          wa={contact.wa}
          bookHref={localePath(locale, "/book-a-consultation")}
          labels={{ call: t.cta.call, whatsapp: "WhatsApp", book: t.cta.book }}
        />
        {analyticsOn && (
          <>
            <Analytics plausibleDomain={plausibleDomain} gaId={gaId} />
            <CookieBanner t={t.cookie} privacyHref={localePath(locale, "/privacy")} />
          </>
        )}
      </body>
    </html>
  );
}
