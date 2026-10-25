import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { isLocale, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getContact } from "@/lib/contact";
import { getPracticeAreas, getSettings, loc } from "@/lib/data";
import { Container, PageHeader } from "@/components/site/section";
import { BookingForm } from "./booking-form";
import { JsonLd } from "@/components/site/json-ld";
import { breadcrumbJsonLd, withSeo } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getDictionary(locale);
  return withSeo(locale, "/book-a-consultation", {
    title: t.book.title,
    description: "Book a consultation with James Kale & Co. Advocates in Kabarnet, Baringo County.",
  });
}

export default async function BookPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [t, s, areas] = await Promise.all([getDictionary(locale), getSettings(), getPracticeAreas()]);
  const c = getContact(s);

  return (
    <main id="main">
      <JsonLd data={breadcrumbJsonLd([{ name: t.nav.home, path: localePath(locale, "/") }, { name: t.cta.book, path: localePath(locale, "/book-a-consultation") }])} />
      <PageHeader eyebrow={t.book.eyebrow} title={t.book.title} intro={t.book.intro} />
      <section className="py-14 sm:py-20">
        <Container className="max-w-3xl">
          {/* useSearchParams (to preselect ?area=) needs a Suspense boundary so the page can stay static */}
          <Suspense fallback={null}>
            <BookingForm
              locale={locale}
              t={t.form}
              areas={areas.map((a) => ({ id: a.id, slug: a.slug, title: loc(locale, a.title, a.title_sw) }))}
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null}
              tel={c.tel}
              wa={c.wa}
            />
          </Suspense>
        </Container>
      </section>
    </main>
  );
}
