import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { isLocale, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getContact } from "@/lib/contact";
import { getSettings } from "@/lib/data";
import { ButtonLink } from "@/components/ui/button";
import { Container, PageHeader } from "@/components/site/section";
import { ContactForm } from "./contact-form";
import { JsonLd } from "@/components/site/json-ld";
import { breadcrumbJsonLd, withSeo } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getDictionary(locale);
  return withSeo(locale, "/contact", {
    title: t.contact.eyebrow,
    description: "Contact James Kale & Co. Advocates in Kabarnet, Baringo County: office address, phone, WhatsApp, email and hours.",
  });
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [t, s] = await Promise.all([getDictionary(locale), getSettings()]);
  const c = getContact(s);
  const row = "flex gap-4 border-b border-stone py-5";
  const icon = "mt-1 h-5 w-5 shrink-0 text-brass-text";
  const label = "text-sm font-medium uppercase tracking-wide text-brass-text";

  return (
    <main id="main">
      <JsonLd data={breadcrumbJsonLd([{ name: t.nav.home, path: localePath(locale, "/") }, { name: t.nav.contact, path: localePath(locale, "/contact") }])} />
      <PageHeader eyebrow={t.contact.eyebrow} title={t.contact.title} intro={t.contact.intro} />

      <section className="py-16 sm:py-20">
        <Container className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <div className={row}>
              <MapPin className={icon} aria-hidden="true" />
              <div>
                <p className={label}>{t.contact.office}</p>
                <p className="mt-1">{s.firm.address}</p>
                <a href={c.mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-forest underline underline-offset-4">
                  {t.contact.map}
                </a>
              </div>
            </div>
            <div className={row}>
              <Phone className={icon} aria-hidden="true" />
              <div>
                <p className={label}>{t.contact.phone}</p>
                {c.phone && c.tel ? (
                  <a href={c.tel} className="mt-1 inline-block text-xl text-forest" data-track="call">{c.phone}</a>
                ) : (
                  <p className="mt-1 text-charcoal/70">{t.contact.notSet}</p>
                )}
              </div>
            </div>
            <div className={row}>
              <MessageCircle className={icon} aria-hidden="true" />
              <div>
                <p className={label}>{t.contact.whatsapp}</p>
                {c.wa ? (
                  <a href={c.wa} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xl text-forest" data-track="whatsapp">
                    {t.cta.whatsapp}
                  </a>
                ) : (
                  <p className="mt-1 text-charcoal/70">{t.contact.notSet}</p>
                )}
              </div>
            </div>
            <div className={row}>
              <Mail className={icon} aria-hidden="true" />
              <div>
                <p className={label}>{t.contact.email}</p>
                {c.email ? (
                  <a href={`mailto:${c.email}`} className="mt-1 inline-block text-xl text-forest">{c.email}</a>
                ) : (
                  <p className="mt-1 text-charcoal/70">{t.contact.notSet}</p>
                )}
              </div>
            </div>
            <div className={row}>
              <Clock className={icon} aria-hidden="true" />
              <div>
                <p className={label}>{t.contact.hours}</p>
                <p className="mt-1">{s.hours.summary}</p>
              </div>
            </div>
            <div className="mt-8">
              <ButtonLink href={localePath(locale, "/book-a-consultation")} variant="dark">
                {t.cta.book}
              </ButtonLink>
            </div>
          </div>

          <div>
            <iframe
              title={t.contact.mapTitle}
              src={c.osmEmbed}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="h-[26rem] w-full border border-stone lg:h-full lg:min-h-[32rem]"
            />
          </div>
        </Container>
      </section>

      <section className="bg-white/50 py-16 sm:py-20">
        <Container className="max-w-3xl">
          <h2 className="mb-8 font-serif text-h2 text-forest">{t.form.contact.title}</h2>
          <ContactForm locale={locale} t={t.form} siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null} />
        </Container>
      </section>
    </main>
  );
}
