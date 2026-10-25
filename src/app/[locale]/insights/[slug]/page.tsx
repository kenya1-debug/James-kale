import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { isLocale, locales, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getContact } from "@/lib/contact";
import { formatDate, getPost, getPosts, getSettings, storageUrl } from "@/lib/data";
import { publicEnv } from "@/lib/env";
import { Container, Eyebrow } from "@/components/site/section";
import { ShareButtons } from "@/components/site/share-buttons";
import { CtaBand } from "@/components/site/cta-band";
import { JsonLd } from "@/components/site/json-ld";
import { articleJsonLd, breadcrumbJsonLd, withSeo } from "@/lib/seo";

export const revalidate = 3600;

export async function generateStaticParams() {
  const posts = await getPosts();
  return locales.flatMap((locale) => posts.map((p) => ({ locale, slug: p.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const post = await getPost(slug);
  if (!post) return {};
  return withSeo(locale, `/insights/${post.slug}`, {
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt || undefined,
    type: "article",
    publishedTime: post.published_at,
    modifiedTime: post.updated_at,
    image: storageUrl(post.cover_image),
  });
}

export default async function PostPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const [t, s, post] = await Promise.all([getDictionary(locale), getSettings(), getPost(slug)]);
  if (!post) notFound();

  const c = getContact(s);
  const cover = storageUrl(post.cover_image);
  const url = `${publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}${localePath(locale, `/insights/${post.slug}`)}`;

  return (
    <main id="main">
      <JsonLd data={breadcrumbJsonLd([{ name: t.nav.home, path: localePath(locale, "/") }, { name: t.nav.insights, path: localePath(locale, "/insights") }, { name: post.title, path: localePath(locale, `/insights/${post.slug}`) }])} />
      <JsonLd data={articleJsonLd({ post, settings: s, path: localePath(locale, `/insights/${post.slug}`), locale, image: cover })} />
      <header className="bg-ink pb-14 pt-16 text-ivory sm:pb-20 sm:pt-24">
        <Container className="max-w-3xl">
          <Link href={localePath(locale, "/insights")} className="mb-8 inline-flex items-center gap-2 text-sm text-brass hover:underline">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {t.insights.back}
          </Link>
          {post.category && <Eyebrow tone="dark">{post.category.name}</Eyebrow>}
          <h1 className="font-serif text-h1">{post.title}</h1>
          <p className="mt-5 text-ivory/70">
            <time dateTime={post.published_at}>{formatDate(post.published_at, locale)}</time> · {post.reading_minutes} {t.insights.min}
          </p>
        </Container>
      </header>

      <article className="py-14 sm:py-20">
        <Container className="max-w-3xl">
          {cover && (
            <Image
              src={cover}
              alt={post.cover_alt ?? ""}
              width={1200}
              height={750}
              priority
              sizes="(min-width:768px) 768px, 100vw"
              className="mb-12 aspect-[8/5] w-full object-cover"
            />
          )}
          {/* content_html is sanitised on save in the admin CMS (Phase 5) */}
          <div
            className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-forest prose-a:text-brass-text prose-p:text-charcoal/85"
            dangerouslySetInnerHTML={{ __html: post.content_html }}
          />
          <p className="mt-12 border-l-2 border-brass pl-5 text-sm italic text-charcoal/70">{t.insights.notAdvice}</p>
          <div className="mt-10 border-t border-stone pt-8">
            <ShareButtons url={url} title={post.title} label={t.insights.share} />
          </div>
        </Container>
      </article>

      <CtaBand title={t.home.ctaTitle} text={t.home.ctaText} bookHref={localePath(locale, "/book-a-consultation")} bookLabel={t.cta.book} waHref={c.wa} waLabel={t.cta.whatsapp} />
    </main>
  );
}
