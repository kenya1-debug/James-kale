"use client";

import { useActionState, useRef, useState } from "react";
import { slugify } from "@/lib/admin/slug";
import { savePost } from "@/app/admin/(panel)/_actions/posts";
import { FormMessage, SubmitButton } from "./action-form";
import { ImageUpload } from "./image-upload";
import { RichTextEditor } from "./rich-text-editor";
import { AField, Card, inputCls } from "./ui";

export type PostFormData = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category_id: string;
  status: "draft" | "scheduled" | "published";
  publish_at: string; // Kenya-time value for <input type="datetime-local">
  cover_image: string;
  cover_url: string;
  cover_alt: string;
  content_html: string;
  seo_title: string;
  seo_description: string;
};

export function PostForm({ post, categories }: { post: PostFormData; categories: { id: string; name: string }[] }) {
  const [state, action] = useActionState(savePost, {});
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [excerpt, setExcerpt] = useState(post.excerpt);
  const [categoryId, setCategoryId] = useState(post.category_id);
  const [status, setStatus] = useState(post.status);
  const [publishAt, setPublishAt] = useState(post.publish_at);
  const [coverAlt, setCoverAlt] = useState(post.cover_alt);
  const [seoTitle, setSeoTitle] = useState(post.seo_title);
  const [seoDesc, setSeoDesc] = useState(post.seo_description);
  const slugTouched = useRef(Boolean(post.id));

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <input type="hidden" name="id" value={post.id} />

      <div className="space-y-6">
        <Card className="space-y-5">
          <AField label="Title">
            <input
              name="title" value={title} maxLength={160} required className={inputCls}
              onChange={(e) => { setTitle(e.target.value); if (!slugTouched.current) setSlug(slugify(e.target.value)); }}
            />
          </AField>
          <AField label="Web address" hint={post.id ? "Changing this breaks existing links to the article." : "Created from the title. You can edit it."}>
            <div className="flex items-center gap-2">
              <span className="text-sm text-charcoal/70">/insights/</span>
              <input name="slug" value={slug} maxLength={100} required className={inputCls} onChange={(e) => { slugTouched.current = true; setSlug(e.target.value); }} />
            </div>
          </AField>
          <AField label="Short summary" hint={`${excerpt.length}/300. Shown on cards and in search results.`}>
            <textarea name="excerpt" rows={3} maxLength={300} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className={inputCls} />
          </AField>
        </Card>

        <Card>
          <span className="mb-2 block text-sm font-medium text-charcoal">Article</span>
          <RichTextEditor name="content_html" initialHtml={post.content_html} />
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="space-y-5">
          <AField label="Status">
            <select name="status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={inputCls}>
              <option value="draft">Draft (not visible)</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </AField>
          {status !== "draft" && (
            <AField label={status === "scheduled" ? "Go live at (Kenya time)" : "Publish date (Kenya time)"} hint={status === "published" ? "Leave empty to publish now." : undefined}>
              <input type="datetime-local" name="publish_at" value={publishAt} onChange={(e) => setPublishAt(e.target.value)} required={status === "scheduled"} className={inputCls} />
            </AField>
          )}
          {status === "draft" && <input type="hidden" name="publish_at" value="" />}
          <AField label="Category">
            <select name="category_id" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
              <option value="">No category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </AField>
          <SubmitButton className="w-full">Save article</SubmitButton>
          <FormMessage state={state} />
        </Card>

        <Card className="space-y-4">
          <ImageUpload name="cover_image" folder="covers" initialPath={post.cover_image || null} initialUrl={post.cover_url || null} label="Cover image" />
          <AField label="Cover image description" hint="Describe the picture for visitors who cannot see it.">
            <input name="cover_alt" value={coverAlt} maxLength={200} onChange={(e) => setCoverAlt(e.target.value)} className={inputCls} />
          </AField>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-serif text-h3 text-forest">Search engines</h2>
          <AField label="Search title" hint={`${seoTitle.length}/70. Leave empty to use the article title.`}>
            <input name="seo_title" value={seoTitle} maxLength={70} onChange={(e) => setSeoTitle(e.target.value)} className={inputCls} />
          </AField>
          <AField label="Search description" hint={`${seoDesc.length}/170. Leave empty to use the summary.`}>
            <textarea name="seo_description" rows={3} maxLength={170} value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} className={inputCls} />
          </AField>
        </Card>
      </div>
    </form>
  );
}
