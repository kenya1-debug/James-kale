import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, locales, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getContact } from "@/lib/contact";
import { getFaqs, getPracticeArea, getPracticeAreas, getSettings, loc } from "@/lib/data";
import { Reveal } from "@/components/reveal";
import { Container, Eyebrow, PageHeader } from "@/components/site/section";
import { PracticeCard } from "@/components/site/practice-card";
import { PracticeIcon } from "@/components/site/practice-icon";
import { FaqList } from "@/components/site/faq-list";
import { CtaBand } from "@/components/site/cta-band";
import { JsonLd } from "@/components/site/json-ld";
import { breadcrumbJsonLd, faqJsonLd, withSeo } from "@/lib/seo";

export const revalidate = 3600;

export async function generateStaticParams() {
  const areas = await getPracticeAreas();
  return locales.flatMap((locale) => areas.map((a) => ({ locale, slug: a.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const a = await getPracticeArea(slug);
  if (!a) return {};
  return withSeo(locale, `/practice-areas/${a.slug}`, {
    title: a.seo_title || loc(locale, a.title, a.title_sw),
    description: a.seo_description || loc(locale, a.summary, a.summary_sw),
  });
}

export default async function PracticeAreaPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const [t, s, area, all] = await Promise.all([getDictionary(locale), getSettings(), getPracticeArea(slug), getPracticeAreas()]);
  if (!area) notFound();

  const faqs = await getFaqs(area.id);
  const c = getContact(s);
  const others = all.filter((a) => a.id !== area.id).slice(0, 3);
  const paragraphs = loc(locale, area.body_md, area.body_md_sw)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <main id="main">
      <JsonLd data={breadcrumbJsonLd([{ name: t.nav.home, path: localePath(locale, "/") }, { name: t.nav.practice, path: localePath(locale, "/practice-areas") }, { name: loc(locale, area.title, area.title_sw), path: localePath(locale, `/practice-areas/${area.slug}`) }])} />
      {faqs.length > 0 && <JsonLd data={faqJsonLd(faqs.map((f) => ({ q: loc(locale, f.question, f.question_sw), a: loc(locale, f.answer, f.answer_sw) })))} />}
      <PageHeader eyebrow={t.practice.eyebrow} title={loc(locale, area.title, area.title_sw)} intro={loc(locale, area.summary, area.summary_sw)} />

      <section className="py-20 sm:py-24">
        <Container className="grid gap-14 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-20">
          <Reveal>
            <PracticeIcon name={area.icon} className="mb-6 h-10 w-10 text-brass-text" />
            <div className="space-y-5 text-lg text-charcoal/85">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </Reveal>

          {area.how_we_help.length > 0 && (
            <Reveal delay={0.1}>
              <div className="bg-forest p-8 text-ivory sm:p-10">
                <Eyebrow tone="dark">{t.practice.how}</Eyebrow>
                <ol className="mt-4 space-y-7">
                  {area.how_we_help.map((step, i) => (
                    <li key={step.title} className="flex gap-5">
                      <span className="font-serif text-3xl text-brass">0{i + 1}</span>
                      <div>
                        <h2 className="font-serif text-xl">{step.title}</h2>
                        <p className="mt-1 text-ivory/75">{step.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>
          )}
        </Container>
      </section>

      {faqs.length > 0 && (
        <section className="bg-white/50 py-20 sm:py-24">
          <Container className="max-w-4xl">
            <Reveal>
              <h2 className="mb-8 font-serif text-h2 text-forest">{t.practice.faq}</h2>
              <FaqList items={faqs.map((f) => ({ id: f.id, q: loc(locale, f.question, f.question_sw), a: loc(locale, f.answer, f.answer_sw) }))} />
            </Reveal>
          </Container>
        </section>
      )}

      {others.length > 0 && (
        <section className="py-20 sm:py-24">
          <Container>
            <h2 className="mb-10 font-serif text-h2 text-forest">{t.practice.other}</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {others.map((a) => (
                <PracticeCard
                  key={a.id}
                  href={localePath(locale, `/practice-areas/${a.slug}`)}
                  icon={a.icon}
                  title={loc(locale, a.title, a.title_sw)}
                  summary={loc(locale, a.summary, a.summary_sw)}
                  cta={t.cta.learnMore}
                />
              ))}
            </div>
          </Container>
        </section>
      )}

      <CtaBand title={t.practice.ctaTitle} text={t.practice.ctaText} bookHref={`${localePath(locale, "/book-a-consultation")}?area=${area.slug}`} bookLabel={t.cta.book} waHref={c.wa} waLabel={t.cta.whatsapp} />
    </main>
  );
}
