import "server-only";
import type { Metadata } from "next";
import { publicEnv } from "@/lib/env";
import { normalizeNumber } from "@/lib/contact";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { AvailabilityRow, PracticeArea, Post, Settings } from "@/lib/data";

const base = () => publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
export const absoluteUrl = (path: string) => `${base()}${path}`;

const SITE_NAME = "James Kale & Co. Advocates";
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Canonical + hreflang + Open Graph + Twitter for one page. `path` is the English path, e.g. "/about". */
export function withSeo(
  locale: Locale,
  path: string,
  m: { title: string; description?: string; type?: "website" | "article"; publishedTime?: string; modifiedTime?: string; image?: string | null },
): Metadata {
  const url = localePath(locale, path);
  const openGraph = {
    type: m.type ?? "website",
    title: m.title,
    description: m.description,
    url,
    siteName: SITE_NAME,
    locale: locale === "sw" ? "sw_KE" : "en_KE",
    alternateLocale: locale === "sw" ? ["en_KE"] : ["sw_KE"],
    ...(m.type === "article" ? { publishedTime: m.publishedTime, modifiedTime: m.modifiedTime } : {}),
    ...(m.image ? { images: [{ url: m.image }] } : {}),
  } as Metadata["openGraph"];

  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: url,
      languages: { en: localePath("en", path), sw: localePath("sw", path), "x-default": localePath("en", path) },
    },
    openGraph,
    twitter: { card: "summary_large_image", title: m.title, description: m.description, ...(m.image ? { images: [m.image] } : {}) },
  };
}

/* ───────────── JSON-LD builders ───────────── */

export function firmJsonLd(s: Settings, areas: PracticeArea[], hours: AvailabilityRow[]) {
  const url = absoluteUrl("/");

  const openingHoursSpecification = hours
    .filter((h) => h.is_open && h.open_time && h.close_time)
    .flatMap((h) => {
      const day = DAYS[h.day_of_week];
      const spec = (opens: string, closes: string) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: day, opens: opens.slice(0, 5), closes: closes.slice(0, 5) });
      return h.break_start && h.break_end
        ? [spec(h.open_time!, h.break_start), spec(h.break_end, h.close_time!)]
        : [spec(h.open_time!, h.close_time!)];
    });

  return {
    "@context": "https://schema.org",
    "@type": ["LegalService", "Attorney"],
    "@id": `${url}#firm`,
    name: s.firm.name,
    url,
    image: absoluteUrl("/opengraph-image"),
    slogan: s.firm.tagline,
    description: `Advocates in Kabarnet, Baringo County: ${areas.map((a) => a.title.toLowerCase()).join(", ")}.`,
    ...(s.firm.phone ? { telephone: `+${normalizeNumber(s.firm.phone)}` } : {}),
    ...(s.firm.email ? { email: s.firm.email } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: s.firm.address,
      addressLocality: "Kabarnet",
      addressRegion: "Baringo County",
      addressCountry: "KE",
    },
    geo: { "@type": "GeoCoordinates", latitude: s.firm.lat, longitude: s.firm.lng },
    areaServed: ["Kabarnet", "Baringo County", "Rift Valley"].map((name) => ({ "@type": "AdministrativeArea", name })),
    openingHoursSpecification,
    knowsLanguage: ["en", "sw"],
    knowsAbout: areas.map((a) => a.title),
    founder: { "@type": "Person", name: s.advocate.name, jobTitle: s.advocate.title },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Legal services",
      itemListElement: areas.map((a) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: a.title, url: absoluteUrl(localePath("en", `/practice-areas/${a.slug}`)) },
      })),
    },
  };
}

export function personJsonLd(s: Settings, photoUrl: string | null) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: s.advocate.name,
    jobTitle: s.advocate.title,
    worksFor: { "@id": `${absoluteUrl("/")}#firm` },
    url: absoluteUrl("/about"),
    ...(photoUrl ? { image: photoUrl } : {}),
    ...(s.advocate.bio ? { description: s.advocate.bio } : {}),
    ...(s.memberships.length ? { memberOf: s.memberships.map((name) => ({ "@type": "Organization", name })) } : {}),
  };
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absoluteUrl(it.path) })),
  };
}

export function articleJsonLd(p: { post: Post; settings: Settings; path: string; locale: Locale; image: string | null }) {
  const url = absoluteUrl(p.path);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: p.post.title,
    ...(p.post.excerpt ? { description: p.post.excerpt } : {}),
    ...(p.image ? { image: [p.image] } : {}),
    datePublished: p.post.published_at,
    dateModified: p.post.updated_at,
    inLanguage: "en",
    ...(p.post.category ? { articleSection: p.post.category.name } : {}),
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: { "@type": "Person", name: p.settings.advocate.name },
    publisher: { "@type": "Organization", name: p.settings.firm.name, url: absoluteUrl("/") },
  };
}
