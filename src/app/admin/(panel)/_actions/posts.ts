"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { done, fail, type ActionState } from "@/lib/admin/result";
import { refreshSite } from "@/lib/admin/revalidate";
import { fromNairobiInput } from "@/lib/admin/time";
import { sanitizePostHtml, plainText, readingMinutes } from "@/lib/admin/sanitize";
import { slugify } from "@/lib/admin/slug";

const schema = z.object({
  id: z.string(),
  title: z.string().trim().min(3, "Please enter a title (at least 3 characters).").max(160, "The title is too long."),
  slug: z
    .string()
    .trim()
    .min(1, "The web address cannot be empty.")
    .max(100)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "The web address may only use lowercase letters, numbers and hyphens."),
  excerpt: z.string().trim().max(300, "The summary is too long (300 characters at most)."),
  category_id: z.string().refine((v) => v === "" || z.uuid().safeParse(v).success, "Invalid category."),
  status: z.enum(["draft", "scheduled", "published"]),
  publish_at: z.string(),
  cover_image: z.string().max(200).regex(/^([a-z0-9_-]+\/)*[a-z0-9_-]+\.(webp|jpe?g|png)$/i, "Invalid cover image.").or(z.literal("")),
  cover_alt: z.string().trim().max(200),
  content_html: z.string().max(300_000, "The article is too long."),
  seo_title: z.string().trim().max(70, "The search title is too long (70 characters at most)."),
  seo_description: z.string().trim().max(170, "The search description is too long (170 characters at most)."),
});

export async function savePost(_p: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireAdmin();
  const get = (k: string) => String(fd.get(k) ?? "");
  const parsed = schema.safeParse(Object.fromEntries(["id", "title", "slug", "excerpt", "category_id", "status", "publish_at", "cover_image", "cover_alt", "content_html", "seo_title", "seo_description"].map((k) => [k, get(k)])));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const v = parsed.data;

  const html = sanitizePostHtml(v.content_html);
  if (v.status !== "draft" && plainText(html).trim().length < 20) return fail("Write the article before publishing it (or save it as a draft).");

  let publishedAt = fromNairobiInput(v.publish_at);
  let status = v.status;
  if (status === "scheduled" && !publishedAt) return fail("Choose a publish date and time for a scheduled article.");
  if (status === "published" && !publishedAt) publishedAt = new Date().toISOString();
  if (status === "published" && publishedAt && new Date(publishedAt).getTime() > Date.now() + 60_000) status = "scheduled";

  const row = {
    slug: v.slug,
    title: v.title,
    excerpt: v.excerpt || null,
    content_html: html,
    cover_image: v.cover_image || null,
    cover_alt: v.cover_alt || null,
    category_id: v.category_id || null,
    status,
    published_at: publishedAt,
    reading_minutes: readingMinutes(html),
    seo_title: v.seo_title || null,
    seo_description: v.seo_description || null,
  };

  const supabase = await createClient();
  if (!v.id) {
    const id = crypto.randomUUID();
    const { error } = await supabase.from("posts").insert({ id, ...row, author_id: me.id });
    if (error) return fail(error.code === "23505" ? "Another article already uses that web address." : "Could not save. Please try again.");
    refreshSite();
    redirect(`/admin/posts/${id}?saved=1`);
  }

  if (!z.uuid().safeParse(v.id).success) return fail("Invalid article.");
  const { error } = await supabase.from("posts").update(row).eq("id", v.id);
  if (error) return fail(error.code === "23505" ? "Another article already uses that web address." : "Could not save. Please try again.");
  refreshSite();
  return done(status === "published" ? "Saved. The article is live." : status === "scheduled" ? "Saved. It will go live at the scheduled time." : "Saved as a draft.");
}

export async function deletePost(fd: FormData) {
  await requireAdmin();
  const id = z.uuid().safeParse(fd.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from("posts").delete().eq("id", id.data);
  refreshSite();
  redirect("/admin/posts");
}

export async function addCategory(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const name = z.string().trim().min(2, "Enter a category name.").max(40, "Name is too long.").safeParse(fd.get("name"));
  if (!name.success) return fail(name.error.issues[0].message);
  const slug = slugify(name.data);
  if (!slug) return fail("Use letters or numbers in the name.");
  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert({ name: name.data, slug });
  if (error) return fail(error.code === "23505" ? "That category already exists." : "Could not add the category.");
  refreshSite();
  return done("Category added.");
}

export async function deleteCategory(fd: FormData) {
  await requireAdmin();
  const id = z.uuid().safeParse(fd.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from("categories").delete().eq("id", id.data); // posts keep existing, just uncategorised
  refreshSite();
  redirect("/admin/posts");
}
