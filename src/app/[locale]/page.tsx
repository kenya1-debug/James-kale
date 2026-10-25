import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { isLocale, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getContact } from "@/lib/contact";
import { getFaqs, getPosts, getPracticeAreas, getSettings, getTestimonials, loc, storageUrl } from "@/lib/data";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { Container, Eyebrow, SectionHeading } from "@/components/site/section";
import { PracticeCard } from "@/components/site/practice-card";
import { FaqList } from "@/components/site/faq-list";
import { PostCard } from "@/components/site/post-card";
import { CtaBand } from "@/components/site/cta-band";
import { JsonLd } from "@/components/site/json-ld";
import { faqJsonLd, withSeo } from "@/lib/seo";

export const revalidate = 3600;

const HOME_TITLE = "James Kale & Co. Advocates | Kabarnet, Baringo County";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getDictionary(locale);
  return {
    ...withSeo(locale, "/", { title: HOME_TITLE, description: t.hero.subtitle }),
    title: { absolute: HOME_TITLE },
  };
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [t, s, areas, faqs, posts, testimonials] = await Promise.all([
    getDictionary(locale),
    getSettings(),
    getPracticeAreas(),
    getFaqs(null),
    getPosts({ limit: 3 }),
    getTestimonials(),
  ]);
  const c = getContact(s);
  const book = localePath(locale, "/book-a-consultation");

  const trust = [
    { value: s.advocate.title, label: s.advocate.name },
    s.stats.years != null ? { value: `${s.stats.years}+`, label: t.trust.years } : null,
    s.stats.matters != null ? { value: `${s.stats.matters}+`, label: t.trust.matters } : null,
    { value: s.stats.areas_served, label: t.trust.areas },
  ].filter((x): x is { value: string; label: string } => x !== null);

  const photo = storageUrl(s.advocate.photo_path);
  const initials = s.advocate.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const showTestimonials = s.features.show_testimonials && testimonials.length > 0;

  return (
    <main id="main">
      {faqs.length > 0 && <JsonLd data={faqJsonLd(faqs.map((f) => ({ q: loc(locale, f.question, f.question_sw), a: loc(locale, f.answer, f.answer_sw) })))} />}
      {/* HERO */}
      <section className="relative overflow-hidden bg-ink text-ivory">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-24 select-none font-serif text-[28rem] leading-none text-brass/[0.06] sm:text-[40rem]"
        >
          &amp;
        </span>
        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_20%_30%,rgba(184,146,74,0.14),transparent)]" aria-hidden="true" />
        <Container className="relative flex min-h-[82svh] flex-col justify-center py-24">
          <p className="fade-up mb-5 text-sm font-medium uppercase tracking-[0.2em] text-brass">{t.hero.eyebrow}</p>
          <h1 className="fade-up max-w-4xl font-serif text-display" style={{ animationDelay: "80ms" }}>
            {t.hero.title}
          </h1>
          <p className="fade-up mt-6 max-w-2xl text-lg text-ivory/80 sm:text-xl" style={{ animationDelay: "160ms" }}>
            {t.hero.subtitle}
          </p>
          <div className="fade-up mt-10 flex flex-wrap gap-4" style={{ animationDelay: "240ms" }}>
            <ButtonLink href={book}>{t.cta.book}</ButtonLink>
            {c.wa && (
              <ButtonLink href={c.wa} variant="outline" data-track="whatsapp">
                {t.cta.whatsapp}
              </ButtonLink>
            )}
          </div>
        </Container>
      </section>

      {/* TRUST BAR */}
      <section aria-label="Credentials" className="border-b border-stone bg-white/50">
        <Container className="grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {trust.map((item) => (
            <div key={item.label} className="border-l-2 border-brass pl-5">
              <p className="font-serif text-xl leading-snug text-forest">{item.value}</p>
              <p className="mt-1 text-sm text-charcoal/65">{item.label}</p>
            </div>
          ))}
        </Container>
      </section>

      {/* PRACTICE AREAS */}
      <section className="py-20 sm:py-28">
        <Container>
          <Reveal>
            <SectionHeading eyebrow={t.home.practiceEyebrow} title={t.home.practiceTitle} intro={t.home.practiceIntro} />
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
          </div>
        </Container>
      </section>

      {/* ABOUT TEASER */}
      <section className="bg-forest py-20 text-ivory sm:py-28">
        <Container className="grid items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
          <Reveal>
            {photo ? (
              <Image src={photo} alt={s.advocate.name} width={640} height={800} sizes="(min-width:1024px) 40vw, 90vw" className="aspect-[4/5] w-full max-w-md object-cover" />
            ) : (
              <div className="relative grid aspect-[4/5] w-full max-w-md place-items-center border border-brass/50" aria-hidden="true">
                <div className="absolute inset-3 border border-brass/20" />
                <span className="font-serif text-8xl text-brass">{initials}</span>
              </div>
            )}
          </Reveal>
          <Reveal delay={0.1}>
            <Eyebrow tone="dark">{t.home.aboutEyebrow}</Eyebrow>
            <h2 className="font-serif text-h2">{t.home.aboutTitle}</h2>
            <p className="mt-5 text-lg text-ivory/80">{s.advocate.bio || t.home.aboutBody}</p>
            <p className="mt-6 font-serif text-xl text-brass">
              {s.advocate.name}, {s.advocate.title}
            </p>
            <div className="mt-8">
              <ButtonLink href={localePath(locale, "/about")} variant="outline">
                {t.home.aboutCta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </ButtonLink>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 sm:py-28">
        <Container>
          <Reveal>
            <SectionHeading eyebrow={t.home.stepsEyebrow} title={t.home.stepsTitle} />
          </Reveal>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {t.home.steps.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.1}>
                <div className="border-t-2 border-brass pt-6">
                  <span className="font-serif text-5xl text-brass-text/80">0{i + 1}</span>
                  <h3 className="mt-2 font-serif text-h3 text-forest">{step.title}</h3>
                  <p className="mt-2 text-charcoal/75">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* TESTIMONIALS (hidden until the advocate publishes some) */}
      {showTestimonials && (
        <section className="bg-stone/50 py-20 sm:py-28">
          <Container>
            <Reveal>
              <SectionHeading eyebrow={t.home.testimonialsEyebrow} title={t.home.testimonialsTitle} />
            </Reveal>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {testimonials.map((q, i) => (
                <Reveal key={q.id} delay={i * 0.08} className="h-full">
                  <figure className="flex h-full flex-col bg-white p-8">
                    <blockquote className="flex-1 font-serif text-xl text-forest">“{loc(locale, q.quote, q.quote_sw)}”</blockquote>
                    <figcaption className="mt-6 text-sm text-charcoal/70">
                      <span className="font-medium text-charcoal">{q.author_name}</span>
                      {q.author_role && <> · {q.author_role}</>}
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* LATEST INSIGHTS */}
      {posts.length > 0 && (
        <section className="py-20 sm:py-28">
          <Container>
            <Reveal className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeading eyebrow={t.home.insightsEyebrow} title={t.home.insightsTitle} intro={t.home.insightsIntro} />
              <Link href={localePath(locale, "/insights")} className="inline-flex items-center gap-2 font-medium text-forest hover:underline">
                {t.cta.viewAll} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Reveal>
            <div className="mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((p, i) => (
                <Reveal key={p.id} delay={i * 0.08} className="h-full">
                  <PostCard post={p} locale={locale} minLabel={t.insights.min} />
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* FAQ */}
      {faqs.length > 0 && (
        <section className="bg-white/50 py-20 sm:py-28">
          <Container className="grid gap-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
            <Reveal>
              <SectionHeading eyebrow={t.home.faqEyebrow} title={t.home.faqTitle} />
            </Reveal>
            <Reveal delay={0.1}>
              <FaqList items={faqs.map((f) => ({ id: f.id, q: loc(locale, f.question, f.question_sw), a: loc(locale, f.answer, f.answer_sw) }))} />
            </Reveal>
          </Container>
        </section>
      )}

      <CtaBand title={t.home.ctaTitle} text={t.home.ctaText} bookHref={book} bookLabel={t.cta.book} waHref={c.wa} waLabel={t.cta.whatsapp} />
    </main>
  );
}
