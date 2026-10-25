import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import type { PracticeArea, Settings } from "@/lib/data";
import { loc } from "@/lib/data";
import { getContact } from "@/lib/contact";
import { localePath, type Locale } from "@/lib/i18n/config";
import { CookieSettingsButton } from "@/components/analytics/cookie-banner";
import { Container } from "./section";
import { Wordmark } from "./wordmark";

type T = {
  nav: { home: string; about: string; practice: string; insights: string; contact: string };
  cta: { book: string };
  footer: { cookieSettings?: string; practice: string; explore: string; visit: string; legal: string; privacy: string; terms: string; disclaimer: string; note: string; rights: string };
};

export function Footer({ locale, t, settings, areas, cookieLabel }: { locale: Locale; t: T; settings: Settings; areas: PracticeArea[]; cookieLabel?: string }) {
  const c = getContact(settings);
  const h = "mb-4 text-sm font-medium uppercase tracking-[0.2em] text-brass";
  const a = "text-ivory/75 transition hover:text-brass";

  return (
    <footer className="bg-ink pb-24 pt-16 text-ivory md:pb-10">
      <Container>
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Wordmark />
            <p className="mt-5 max-w-xs text-ivory/70">{settings.firm.tagline}</p>
          </div>

          <div>
            <h2 className={h}>{t.footer.practice}</h2>
            <ul className="space-y-2">
              {areas.map((p) => (
                <li key={p.id}>
                  <Link className={a} href={localePath(locale, `/practice-areas/${p.slug}`)}>
                    {loc(locale, p.title, p.title_sw)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className={h}>{t.footer.explore}</h2>
            <ul className="space-y-2">
              <li><Link className={a} href={localePath(locale, "/about")}>{t.nav.about}</Link></li>
              <li><Link className={a} href={localePath(locale, "/insights")}>{t.nav.insights}</Link></li>
              <li><Link className={a} href={localePath(locale, "/contact")}>{t.nav.contact}</Link></li>
              <li><Link className={a} href={localePath(locale, "/book-a-consultation")}>{t.cta.book}</Link></li>
            </ul>
          </div>

          <div>
            <h2 className={h}>{t.footer.visit}</h2>
            <ul className="space-y-3 text-ivory/75">
              <li className="flex gap-3"><MapPin className="mt-1 h-4 w-4 shrink-0 text-brass" aria-hidden="true" /><span>{settings.firm.address}</span></li>
              {c.phone && c.tel && (
                <li className="flex gap-3"><Phone className="mt-1 h-4 w-4 shrink-0 text-brass" aria-hidden="true" /><a className={a} href={c.tel}>{c.phone}</a></li>
              )}
              {c.email && (
                <li className="flex gap-3"><Mail className="mt-1 h-4 w-4 shrink-0 text-brass" aria-hidden="true" /><a className={a} href={`mailto:${c.email}`}>{c.email}</a></li>
              )}
              <li className="flex gap-3"><Clock className="mt-1 h-4 w-4 shrink-0 text-brass" aria-hidden="true" /><span>{settings.hours.summary}</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-8">
          <p className="max-w-3xl text-sm text-ivory/60">{t.footer.note}</p>
          <div className="mt-6 flex flex-col gap-4 text-sm text-ivory/60 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} {settings.firm.name}. {t.footer.rights}
            </p>
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              <li><Link className={a} href={localePath(locale, "/privacy")}>{t.footer.privacy}</Link></li>
              <li><Link className={a} href={localePath(locale, "/terms")}>{t.footer.terms}</Link></li>
              <li><Link className={a} href={localePath(locale, "/disclaimer")}>{t.footer.disclaimer}</Link></li>
              {cookieLabel && <li><CookieSettingsButton label={cookieLabel} /></li>}
            </ul>
          </div>
        </div>
      </Container>
    </footer>
  );
}
