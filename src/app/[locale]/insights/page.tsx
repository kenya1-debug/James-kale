import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getCategories, getPosts } from "@/lib/data";
import { PageHeader } from "@/components/site/section";
import { InsightsList } from "@/components/site/insights-list";
import { JsonLd } from "@/components/site/json-ld";
import { breadcrumbJsonLd, withSeo } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getDictionary(locale);
  return withSeo(locale, "/insights", { title: t.insights.title, description: t.insights.intro });
}

export default async function InsightsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [t, posts, categories] = await Promise.all([getDictionary(locale), getPosts(), getCategories()]);

  return (
    <main id="main">
      <JsonLd data={breadcrumbJsonLd([{ name: t.nav.home, path: localePath(locale, "/") }, { name: t.nav.insights, path: localePath(locale, "/insights") }])} />
      <PageHeader eyebrow={t.insights.eyebrow} title={t.insights.title} intro={t.insights.intro} />
      <InsightsList locale={locale} posts={posts} categories={categories} t={t.insights} />
    </main>
  );
}
