import Link from "next/link";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { Category, PostSummary } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/reveal";
import { Container } from "./section";
import { PostCard } from "./post-card";

export function InsightsList({
  locale,
  posts,
  categories,
  activeSlug,
  t,
}: {
  locale: Locale;
  posts: PostSummary[];
  categories: Category[];
  activeSlug?: string;
  t: { all: string; empty: string; min: string };
}) {
  const pill = "rounded-full border px-4 py-1.5 text-sm transition";
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <nav aria-label="Categories" className="mb-12 flex flex-wrap gap-3">
          <Link
            href={localePath(locale, "/insights")}
            aria-current={!activeSlug ? "page" : undefined}
            className={cn(pill, !activeSlug ? "border-forest bg-forest text-ivory" : "border-forest/30 text-forest hover:border-forest")}
          >
            {t.all}
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={localePath(locale, `/insights/category/${c.slug}`)}
              aria-current={activeSlug === c.slug ? "page" : undefined}
              className={cn(pill, activeSlug === c.slug ? "border-forest bg-forest text-ivory" : "border-forest/30 text-forest hover:border-forest")}
            >
              {c.name}
            </Link>
          ))}
        </nav>

        {posts.length === 0 ? (
          <p className="py-16 text-center text-lg text-charcoal/70">{t.empty}</p>
        ) : (
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((p, i) => (
              <Reveal key={p.id} delay={(i % 3) * 0.08} className="h-full">
                <PostCard post={p} locale={locale} minLabel={t.min} />
              </Reveal>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
