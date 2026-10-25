import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { storageUrl } from "@/lib/data";
import { toNairobiInput } from "@/lib/admin/time";
import { DeleteForm } from "@/components/admin/action-form";
import { Card, PageTitle, btnCls } from "@/components/admin/ui";
import { PostForm } from "@/components/admin/post-form";
import { deletePost } from "../../_actions/posts";

export const metadata: Metadata = { title: "Edit article" };

export default async function EditPostPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { saved } = await searchParams;
  if (!z.uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const [{ data: p }, { data: cats }] = await Promise.all([
    supabase.from("posts").select("*").eq("id", id).maybeSingle(),
    supabase.from("categories").select("id, name").order("name"),
  ]);
  if (!p) notFound();

  const live = p.status !== "draft" && p.published_at && new Date(p.published_at) <= new Date();

  return (
    <>
      <PageTitle
        title={p.title}
        subtitle={saved ? "Article created." : undefined}
        actions={
          <>
            {live && <Link href={`/insights/${p.slug}`} target="_blank" className={btnCls.ghost}>View on site</Link>}
            <Link href="/admin/posts" className={btnCls.ghost}>← All articles</Link>
          </>
        }
      />
      <PostForm
        key={p.updated_at}
        categories={cats ?? []}
        post={{
          id: p.id, title: p.title, slug: p.slug, excerpt: p.excerpt ?? "", category_id: p.category_id ?? "", status: p.status,
          publish_at: toNairobiInput(p.published_at), cover_image: p.cover_image ?? "", cover_url: storageUrl(p.cover_image) ?? "",
          cover_alt: p.cover_alt ?? "", content_html: p.content_html, seo_title: p.seo_title ?? "", seo_description: p.seo_description ?? "",
        }}
      />
      <Card className="mt-8">
        <h2 className="mb-3 font-serif text-h3 text-forest">Delete article</h2>
        <p className="mb-4 text-sm text-charcoal/70">Permanently removes this article. Set it back to Draft instead if you only want to hide it.</p>
        <DeleteForm action={deletePost} id={p.id} label="Delete article" />
      </Card>
    </>
  );
}
