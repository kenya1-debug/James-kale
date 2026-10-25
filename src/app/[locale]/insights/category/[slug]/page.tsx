import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, locales, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getCategories, getPosts } from "@/lib/data";
import { PageHeader } from "@/components/site/section";
import { InsightsList } from "@/components/site/insights-list";
import { JsonLd } from "@/components/site/json-ld";
import { breadcrumbJsonLd, withSeo } from "@/lib/seo";

export const revalidate = 3600;

export async function generateStaticParams() {
  const cats = await getCategories();
  return locales.flatMap((locale) => cats.map((c) => ({ locale, slug: c.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const cat = (await getCategories()).find((c) => c.slug === slug);
  if (!cat) return {};
  return withSeo(locale, `/insights/category/${slug}`, {
    title: `${cat.name}: Insights`,
    description: `Articles on ${cat.name.toLowerCase()} for Kenyans from James Kale & Co. Advocates.`,
  });
}

export default async function CategoryPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const [t, categories] = await Promise.all([getDictionary(locale), getCategories()]);
  const cat = categories.find((c) => c.slug === slug);
  if (!cat) notFound();
  const posts = await getPosts({ categorySlug: slug });

  return (
    <main id="main">
      <JsonLd data={breadcrumbJsonLd([{ name: t.nav.home, path: localePath(locale, "/") }, { name: t.nav.insights, path: localePath(locale, "/insights") }, { name: cat.name, path: localePath(locale, `/insights/category/${slug}`) }])} />
      <PageHeader eyebrow={t.insights.eyebrow} title={cat.name} intro={t.insights.intro} />
      <InsightsList locale={locale} posts={posts} categories={categories} activeSlug={slug} t={t.insights} />
    </main>
  );
}
