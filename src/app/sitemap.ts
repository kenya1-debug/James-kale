import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";
import { localePath, locales } from "@/lib/i18n/config";
import { getCategories, getPosts, getPracticeAreas } from "@/lib/data";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const [areas, posts, cats] = await Promise.all([getPracticeAreas(), getPosts(), getCategories()]);

  type Item = { path: string; priority: number; changeFrequency: "weekly" | "monthly" | "yearly"; lastModified?: string };
  const items: Item[] = [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/about", priority: 0.7, changeFrequency: "monthly" },
    { path: "/practice-areas", priority: 0.9, changeFrequency: "monthly" },
    ...areas.map((a): Item => ({ path: `/practice-areas/${a.slug}`, priority: 0.8, changeFrequency: "monthly" })),
    { path: "/insights", priority: 0.7, changeFrequency: "weekly" },
    ...cats.map((c): Item => ({ path: `/insights/category/${c.slug}`, priority: 0.4, changeFrequency: "weekly" })),
    ...posts.map((p): Item => ({ path: `/insights/${p.slug}`, priority: 0.6, changeFrequency: "yearly", lastModified: p.published_at })),
    { path: "/book-a-consultation", priority: 0.8, changeFrequency: "yearly" },
    { path: "/contact", priority: 0.7, changeFrequency: "yearly" },
    { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
    { path: "/disclaimer", priority: 0.2, changeFrequency: "yearly" },
  ];

  // One entry per language version, each listing all alternates (hreflang)
  return items.flatMap((it) =>
    locales.map((locale) => ({
      url: `${base}${localePath(locale, it.path)}`,
      ...(it.lastModified ? { lastModified: it.lastModified } : {}),
      changeFrequency: it.changeFrequency,
      priority: it.priority,
      alternates: { languages: Object.fromEntries(locales.map((l) => [l, `${base}${localePath(l, it.path)}`])) },
    })),
  );
}
