import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getContact } from "@/lib/contact";
import { getPracticeAreas, getSettings, loc } from "@/lib/data";
import { Reveal } from "@/components/reveal";
import { Container, PageHeader } from "@/components/site/section";
import { PracticeCard } from "@/components/site/practice-card";
import { CtaBand } from "@/components/site/cta-band";
import { JsonLd } from "@/components/site/json-ld";
import { breadcrumbJsonLd, withSeo } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getDictionary(locale);
  return withSeo(locale, "/practice-areas", {
    title: t.practice.eyebrow,
    description: "Conveyancing and land law, family and succession, criminal defence, commercial, employment and debt recovery in Kabarnet, Baringo County.",
  });
}

export default async function PracticeAreasPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [t, s, areas] = await Promise.all([getDictionary(locale), getSettings(), getPracticeAreas()]);
  const c = getContact(s);

  return (
    <main id="main">
      <JsonLd data={breadcrumbJsonLd([{ name: t.nav.home, path: localePath(locale, "/") }, { name: t.nav.practice, path: localePath(locale, "/practice-areas") }])} />
      <PageHeader eyebrow={t.practice.eyebrow} title={t.practice.title} intro={t.practice.intro} />
      <section className="py-20 sm:py-24">
        <Container className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((a, i) => (
            <Reveal key={a.id} delay={(i % 3) * 0.08} className="h-full">
              <PracticeCard
                href={localePath(locale, `/practice-areas/${a.slug}`)}
                icon={a.icon}
                title={loc(locale, a.title, a.title_sw)}
                summary={loc(locale, a.summary, a.summary_sw)}
                cta={t.cta.learnMore}
              />
            </Reveal>
          ))}
        </Container>
      </section>
      <CtaBand title={t.practice.ctaTitle} text={t.practice.ctaText} bookHref={localePath(locale, "/book-a-consultation")} bookLabel={t.cta.book} waHref={c.wa} waLabel={t.cta.whatsapp} />
    </main>
  );
}
