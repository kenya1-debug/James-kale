import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { isLocale, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getContact } from "@/lib/contact";
import { getSettings, storageUrl } from "@/lib/data";
import { Reveal } from "@/components/reveal";
import { Container, PageHeader } from "@/components/site/section";
import { CtaBand } from "@/components/site/cta-band";
import { JsonLd } from "@/components/site/json-ld";
import { breadcrumbJsonLd, personJsonLd, withSeo } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const [t, s] = await Promise.all([getDictionary(locale), getSettings()]);
  return withSeo(locale, "/about", {
    title: `${t.about.title}: ${s.advocate.name}`,
    description: `${s.advocate.name}, ${s.advocate.title}, practising in Kabarnet, Baringo County.`,
  });
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [t, s] = await Promise.all([getDictionary(locale), getSettings()]);
  const c = getContact(s);
  const a = s.advocate;
  const photo = storageUrl(a.photo_path);

  const credentials = [
    a.qualifications && { label: t.about.qualifications, value: a.qualifications },
    a.admission_year != null && { label: t.about.admitted, value: String(a.admission_year) },
    a.years_experience != null && { label: t.about.experience, value: `${a.years_experience}+` },
  ].filter((x): x is { label: string; value: string } => Boolean(x));

  return (
    <main id="main">
      <JsonLd data={breadcrumbJsonLd([{ name: t.nav.home, path: localePath(locale, "/") }, { name: t.nav.about, path: localePath(locale, "/about") }])} />
      <JsonLd data={personJsonLd(s, photo)} />
      <PageHeader eyebrow={t.about.eyebrow} title={a.name} intro={a.title} />

      <section className="py-20 sm:py-24">
        <Container className="grid gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
          <Reveal>
            {photo ? (
              <Image src={photo} alt={a.name} width={640} height={800} sizes="(min-width:1024px) 40vw, 90vw" className="aspect-[4/5] w-full max-w-md object-cover" />
            ) : (
              <div className="relative grid aspect-[4/5] w-full max-w-md place-items-center bg-forest" aria-hidden="true">
                <div className="absolute inset-3 border border-brass/40" />
                <span className="font-serif text-8xl text-brass">
                  {a.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </Reveal>

          <Reveal delay={0.1}>
            <div className="prose prose-lg max-w-none prose-p:text-charcoal/85">
              <p>{a.bio || t.home.aboutBody}</p>
            </div>

            {credentials.length > 0 && (
              <>
                <h2 className="mt-12 font-serif text-h3 text-forest">{t.about.credentials}</h2>
                <dl className="mt-4 divide-y divide-stone border-y border-stone">
                  {credentials.map((cr) => (
                    <div key={cr.label} className="flex flex-col gap-1 py-4 sm:flex-row sm:gap-8">
                      <dt className="w-56 shrink-0 text-sm font-medium uppercase tracking-wide text-brass-text">{cr.label}</dt>
                      <dd>{cr.value}</dd>
                    </div>
                  ))}
                </dl>
              </>
            )}

            {s.memberships.length > 0 && (
              <>
                <h2 className="mt-12 font-serif text-h3 text-forest">{t.about.memberships}</h2>
                <ul className="mt-4 list-disc space-y-1 pl-5">
                  {s.memberships.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </>
            )}

            {s.courts.length > 0 && (
              <>
                <h2 className="mt-12 font-serif text-h3 text-forest">{t.about.courts}</h2>
                <ul className="mt-4 list-disc space-y-1 pl-5">
                  {s.courts.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </>
            )}
          </Reveal>
        </Container>
      </section>

      <section className="bg-white/50 py-20 sm:py-24">
        <Container>
          <Reveal>
            <h2 className="font-serif text-h2 text-forest">{t.about.valuesTitle}</h2>
          </Reveal>
          <div className="mt-10 grid gap-10 md:grid-cols-3">
            {t.about.values.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.1}>
                <div className="border-t-2 border-brass pt-6">
                  <h3 className="font-serif text-h3 text-forest">{v.title}</h3>
                  <p className="mt-2 text-charcoal/75">{v.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <CtaBand title={t.about.ctaTitle} text={t.about.ctaText} bookHref={localePath(locale, "/book-a-consultation")} bookLabel={t.cta.book} waHref={c.wa} waLabel={t.cta.whatsapp} />
    </main>
  );
}
