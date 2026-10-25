import "server-only";
import { cache } from "react";
import { supabasePublic as db } from "@/lib/supabase/public";
import { publicEnv } from "@/lib/env";

export type HowStep = { title: string; text: string };

export type PracticeArea = {
  id: string;
  slug: string;
  title: string;
  title_sw: string | null;
  summary: string;
  summary_sw: string | null;
  icon: string | null;
  body_md: string;
  body_md_sw: string | null;
  how_we_help: HowStep[];
  seo_title: string | null;
  seo_description: string | null;
  sort_order: number;
};

export type Faq = {
  id: string;
  question: string;
  question_sw: string | null;
  answer: string;
  answer_sw: string | null;
};

export type Testimonial = {
  id: string;
  author_name: string;
  author_role: string | null;
  quote: string;
  quote_sw: string | null;
};

export type Category = { id: string; slug: string; name: string };

export type PostSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image: string | null;
  cover_alt: string | null;
  published_at: string;
  reading_minutes: number;
  category: { slug: string; name: string } | null;
};

export type Post = PostSummary & {
  content_html: string;
  seo_title: string | null;
  seo_description: string | null;
  updated_at: string;
};

export type Settings = {
  firm: {
    name: string;
    short_name: string;
    tagline: string;
    address: string;
    lat: number;
    lng: number;
    phone: string;
    whatsapp: string;
    email: string;
  };
  hours: { summary: string };
  advocate: {
    name: string;
    title: string;
    qualifications: string;
    admission_year: number | null;
    years_experience: number | null;
    bio: string;
    photo_path: string | null;
  };
  memberships: string[];
  courts: string[];
  stats: { years: number | null; matters: number | null; areas_served: string };
  features: { show_testimonials: boolean; kiswahili: boolean };
};

export const DEFAULTS: Settings = {
  firm: {
    name: "James Kale & Co. Advocates",
    short_name: "Kale & Co.",
    tagline: "Clear counsel. Careful representation.",
    address: "Lelbatai Building, 2nd Floor, Room 4, Kabarnet Town, Baringo County, Kenya",
    lat: 0.4929,
    lng: 35.742915,
    phone: "",
    whatsapp: "",
    email: "",
  },
  hours: { summary: "Monday to Friday, 8:00 am – 5:00 pm. Closed on Saturdays and Sundays." },
  advocate: {
    name: "James Kale",
    title: "Advocate of the High Court of Kenya",
    qualifications: "",
    admission_year: null,
    years_experience: null,
    bio: "",
    photo_path: null,
  },
  memberships: [],
  courts: [],
  stats: { years: null, matters: null, areas_served: "Kabarnet, Baringo County and the wider Rift Valley" },
  features: { show_testimonials: false, kiswahili: true },
};

function warn(scope: string, error: unknown) {
  if (error) console.error(`[data:${scope}]`, error);
}

/** Pick the Kiswahili value when viewing in Kiswahili and one exists, else English. */
export function loc(locale: string, en: string | null | undefined, sw: string | null | undefined) {
  return (locale === "sw" && sw ? sw : en) ?? "";
}

export function storageUrl(path: string | null | undefined) {
  if (!path) return null;
  return `${publicEnv.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/blog-images/${path}`;
}

export function mergeSettings(map: Record<string, any>): Settings {
  return {
    firm: { ...DEFAULTS.firm, ...(map.firm ?? {}) },
    hours: { ...DEFAULTS.hours, ...(map.hours ?? {}) },
    advocate: { ...DEFAULTS.advocate, ...(map.advocate ?? {}) },
    memberships: Array.isArray(map.memberships) ? map.memberships : [],
    courts: Array.isArray(map.courts) ? map.courts : [],
    stats: { ...DEFAULTS.stats, ...(map.stats ?? {}) },
    features: { ...DEFAULTS.features, ...(map.features ?? {}) },
  };
}

export const getSettings = cache(async (): Promise<Settings> => {
  const { data, error } = await db.from("site_settings").select("key, value");
  warn("settings", error);
  return mergeSettings(Object.fromEntries((data ?? []).map((r: { key: string; value: any }) => [r.key, r.value])));
});

export const getPracticeAreas = cache(async (): Promise<PracticeArea[]> => {
  const { data, error } = await db
    .from("practice_areas")
    .select("id, slug, title, title_sw, summary, summary_sw, icon, body_md, body_md_sw, how_we_help, seo_title, seo_description, sort_order")
    .order("sort_order", { ascending: true });
  warn("practice_areas", error);
  return (data ?? []) as PracticeArea[];
});

export async function getPracticeArea(slug: string): Promise<PracticeArea | null> {
  const all = await getPracticeAreas();
  return all.find((a) => a.slug === slug) ?? null;
}

/** practiceAreaId = null returns the general FAQs shown on the home page */
export async function getFaqs(practiceAreaId: string | null): Promise<Faq[]> {
  let q = db.from("faqs").select("id, question, question_sw, answer, answer_sw").order("sort_order", { ascending: true });
  q = practiceAreaId ? q.eq("practice_area_id", practiceAreaId) : q.is("practice_area_id", null);
  const { data, error } = await q;
  warn("faqs", error);
  return (data ?? []) as Faq[];
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const { data, error } = await db
    .from("testimonials")
    .select("id, author_name, author_role, quote, quote_sw")
    .order("sort_order", { ascending: true });
  warn("testimonials", error);
  return (data ?? []) as Testimonial[];
}

export const getCategories = cache(async (): Promise<Category[]> => {
  const { data, error } = await db.from("categories").select("id, slug, name").order("name", { ascending: true });
  warn("categories", error);
  return (data ?? []) as Category[];
});

const POST_SUMMARY_FIELDS =
  "id, slug, title, excerpt, cover_image, cover_alt, published_at, reading_minutes, category:categories(slug, name)";

export async function getPosts(opts: { categorySlug?: string; limit?: number } = {}): Promise<PostSummary[]> {
  let selectStr = POST_SUMMARY_FIELDS;
  if (opts.categorySlug) selectStr = POST_SUMMARY_FIELDS.replace("category:categories", "category:categories!inner");
  let q = db.from("posts").select(selectStr).order("published_at", { ascending: false });
  if (opts.categorySlug) q = q.eq("category.slug", opts.categorySlug);
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  warn("posts", error);
  return (data ?? []) as unknown as PostSummary[];
}

export async function getPost(slug: string): Promise<Post | null> {
  const { data, error } = await db
    .from("posts")
    .select(`${POST_SUMMARY_FIELDS}, content_html, seo_title, seo_description, updated_at`)
    .eq("slug", slug)
    .maybeSingle();
  warn("post", error);
  return (data as unknown as Post) ?? null;
}

export type AvailabilityRow = {
  day_of_week: number;
  is_open: boolean;
  open_time: string | null;
  close_time: string | null;
  break_start: string | null;
  break_end: string | null;
};

export const getAvailability = cache(async (): Promise<AvailabilityRow[]> => {
  const { data, error } = await db
    .from("availability")
    .select("day_of_week, is_open, open_time, close_time, break_start, break_end")
    .order("day_of_week");
  warn("availability", error);
  return (data ?? []) as AvailabilityRow[];
});

export function formatDate(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "sw" ? "sw-KE" : "en-KE", { dateStyle: "long" }).format(new Date(iso));
}
