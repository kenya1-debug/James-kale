"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { done, fail, type ActionState } from "@/lib/admin/result";
import { refreshSite } from "@/lib/admin/revalidate";

const text = (fd: FormData, k: string) => String(fd.get(k) ?? "");
const uuidOrEmpty = z.string().refine((v) => v === "" || z.uuid().safeParse(v).success, "Invalid selection.");
const sort = z.coerce.number().int().min(0).max(9999).catch(0);
const ICONS = ["landmark", "users", "shield", "briefcase", "handshake", "coins", "scale"] as const;

/* ───────── practice areas ───────── */

function parseSteps(src: string) {
  return src
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((l) => {
      const i = l.indexOf("|");
      return i > 0 ? { title: l.slice(0, i).trim().slice(0, 60), text: l.slice(i + 1).trim().slice(0, 300) } : null;
    })
    .filter((s): s is { title: string; text: string } => !!s && !!s.title && !!s.text);
}

const areaSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(2, "Enter a title.").max(100),
  title_sw: z.string().trim().max(100),
  summary: z.string().trim().min(10, "Enter a short summary (at least 10 characters).").max(300, "The summary is too long (300 characters at most)."),
  summary_sw: z.string().trim().max(300),
  icon: z.enum(ICONS),
  body_md: z.string().trim().max(8000),
  body_md_sw: z.string().trim().max(8000),
  seo_title: z.string().trim().max(70),
  seo_description: z.string().trim().max(170),
});

export async function savePracticeArea(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const keys = ["id", "title", "title_sw", "summary", "summary_sw", "icon", "body_md", "body_md_sw", "seo_title", "seo_description"];
  const p = areaSchema.safeParse(Object.fromEntries(keys.map((k) => [k, text(fd, k)])));
  if (!p.success) return fail(p.error.issues[0].message);
  const v = p.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("practice_areas")
    .update({
      title: v.title, title_sw: v.title_sw || null, summary: v.summary, summary_sw: v.summary_sw || null, icon: v.icon,
      body_md: v.body_md, body_md_sw: v.body_md_sw || null, how_we_help: parseSteps(text(fd, "steps")),
      seo_title: v.seo_title || null, seo_description: v.seo_description || null,
      sort_order: sort.parse(fd.get("sort_order")), published: fd.get("published") === "on",
    })
    .eq("id", v.id);
  if (error) return fail("Could not save. Please try again.");
  refreshSite();
  return done();
}

export async function createPracticeArea(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const p = z
    .object({
      slug: z.string().trim().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "The web address may only use lowercase letters, numbers and hyphens.").max(60),
      title: z.string().trim().min(2, "Enter a title.").max(100),
      summary: z.string().trim().min(10, "Enter a short summary (at least 10 characters).").max(300),
    })
    .safeParse({ slug: text(fd, "slug"), title: text(fd, "title"), summary: text(fd, "summary") });
  if (!p.success) return fail(p.error.issues[0].message);
  const supabase = await createClient();
  const { error } = await supabase.from("practice_areas").insert({ ...p.data, icon: "scale", sort_order: 99, published: false });
  if (error) return fail(error.code === "23505" ? "That web address is already used." : "Could not add it.");
  refreshSite();
  return done("Added as unpublished. Open it below to finish and publish.");
}

/* ───────── FAQs ───────── */

const faqSchema = z.object({
  id: z.string().refine((v) => v === "" || z.uuid().safeParse(v).success, "Invalid FAQ."),
  practice_area_id: uuidOrEmpty,
  question: z.string().trim().min(5, "Enter the question.").max(300),
  question_sw: z.string().trim().max(300),
  answer: z.string().trim().min(5, "Enter the answer.").max(2000),
  answer_sw: z.string().trim().max(2000),
});

export async function saveFaq(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const keys = ["id", "practice_area_id", "question", "question_sw", "answer", "answer_sw"];
  const p = faqSchema.safeParse(Object.fromEntries(keys.map((k) => [k, text(fd, k)])));
  if (!p.success) return fail(p.error.issues[0].message);
  const v = p.data;
  const row = {
    practice_area_id: v.practice_area_id || null, question: v.question, question_sw: v.question_sw || null,
    answer: v.answer, answer_sw: v.answer_sw || null, sort_order: sort.parse(fd.get("sort_order")), published: fd.get("published") === "on",
  };
  const supabase = await createClient();
  const { error } = v.id ? await supabase.from("faqs").update(row).eq("id", v.id) : await supabase.from("faqs").insert(row);
  if (error) return fail("Could not save. Please try again.");
  refreshSite();
  return done(v.id ? "Saved." : "FAQ added.");
}

export async function deleteFaq(fd: FormData) {
  await requireAdmin();
  const id = z.uuid().safeParse(fd.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from("faqs").delete().eq("id", id.data);
  refreshSite();
}

/* ───────── testimonials ───────── */

const tSchema = z.object({
  id: z.string().refine((v) => v === "" || z.uuid().safeParse(v).success, "Invalid testimonial."),
  author_name: z.string().trim().min(1, "Enter the client's name or initials.").max(80),
  author_role: z.string().trim().max(120),
  quote: z.string().trim().min(10, "Enter the testimonial (at least 10 characters).").max(600),
  quote_sw: z.string().trim().max(600),
});

export async function saveTestimonial(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const keys = ["id", "author_name", "author_role", "quote", "quote_sw"];
  const p = tSchema.safeParse(Object.fromEntries(keys.map((k) => [k, text(fd, k)])));
  if (!p.success) return fail(p.error.issues[0].message);
  const v = p.data;
  const row = {
    author_name: v.author_name, author_role: v.author_role || null, quote: v.quote, quote_sw: v.quote_sw || null,
    sort_order: sort.parse(fd.get("sort_order")), published: fd.get("published") === "on",
  };
  const supabase = await createClient();
  const { error } = v.id ? await supabase.from("testimonials").update(row).eq("id", v.id) : await supabase.from("testimonials").insert(row);
  if (error) return fail("Could not save. Please try again.");
  refreshSite();
  return done(v.id ? "Saved." : "Testimonial added (unpublished until you tick Published).");
}

export async function deleteTestimonial(fd: FormData) {
  await requireAdmin();
  const id = z.uuid().safeParse(fd.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from("testimonials").delete().eq("id", id.data);
  refreshSite();
}
