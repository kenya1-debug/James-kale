import Image from "next/image";
import Link from "next/link";
import { formatDate, storageUrl, type PostSummary } from "@/lib/data";
import { localePath, type Locale } from "@/lib/i18n/config";

export function PostCard({ post, locale, minLabel }: { post: PostSummary; locale: Locale; minLabel: string }) {
  const cover = storageUrl(post.cover_image);
  return (
    <article className="group flex h-full flex-col">
      <Link href={localePath(locale, `/insights/${post.slug}`)} className="block overflow-hidden bg-forest">
        {cover ? (
          <Image
            src={cover}
            alt={post.cover_alt ?? ""}
            width={800}
            height={500}
            sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
            className="aspect-[8/5] w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid aspect-[8/5] place-items-center bg-gradient-to-br from-forest to-ink" aria-hidden="true">
            <span className="font-serif text-6xl text-brass/60">&amp;</span>
          </div>
        )}
      </Link>
      <div className="mt-5 flex flex-1 flex-col">
        <p className="text-sm text-charcoal/65">
          {post.category && <span className="font-medium text-brass-text">{post.category.name}</span>}
          {post.category && " · "}
          <time dateTime={post.published_at}>{formatDate(post.published_at, locale)}</time>
          {" · "}
          {post.reading_minutes} {minLabel}
        </p>
        <h3 className="mt-2 font-serif text-h3 text-forest">
          <Link href={localePath(locale, `/insights/${post.slug}`)} className="hover:underline">
            {post.title}
          </Link>
        </h3>
        {post.excerpt && <p className="mt-2 text-charcoal/75">{post.excerpt}</p>}
      </div>
    </article>
  );
}
