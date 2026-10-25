"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { done, fail, type ActionState } from "@/lib/admin/result";
import { refreshSite } from "@/lib/admin/revalidate";

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const PHONE = /^\+?[0-9][0-9\s-]{6,19}$/;
const phone = z.string().refine((v) => v === "" || PHONE.test(v), "Enter a valid phone number, for example 0712 345 678.");
const email = z.string().max(254).refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email address.");
const optInt = (label: string, max: number) =>
  z.string().refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) <= max), `${label} must be a whole number.`).transform((v) => (v === "" ? null : Number(v)));

const lines = (src: string) => src.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, 20).map((l) => l.slice(0, 120));

async function save(key: string, value: unknown) {
  const supabase = await createClient();
  const { error } = await supabase.from("site_settings").upsert({ key, value }, { onConflict: "key" });
  if (error) return fail("Could not save. Please try again.");
  refreshSite();
  return done();
}

export async function saveSettings(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const section = s(fd, "section");

  if (section === "firm") {
    const p = z
      .object({
        name: z.string().min(2, "Enter the firm name.").max(100),
        short_name: z.string().max(40),
        tagline: z.string().max(120),
        address: z.string().min(5, "Enter the office address.").max(250),
        phone, whatsapp: phone, email,
        lat: z.coerce.number().min(-90).max(90),
        lng: z.coerce.number().min(-180).max(180),
      })
      .safeParse(Object.fromEntries(["name", "short_name", "tagline", "address", "phone", "whatsapp", "email", "lat", "lng"].map((k) => [k, s(fd, k)])));
    if (!p.success) return fail(p.error.issues[0].message);
    return save("firm", p.data);
  }

  if (section === "advocate") {
    const p = z
      .object({
        name: z.string().min(2, "Enter the advocate's name.").max(100),
        title: z.string().max(120),
        qualifications: z.string().max(300),
        admission_year: optInt("Year of admission", 2100),
        years_experience: optInt("Years of experience", 80),
        bio: z.string().max(3000, "The biography is too long (3000 characters at most)."),
        photo_path: z.string().max(200).regex(/^([a-z0-9_-]+\/)*[a-z0-9_-]+\.(webp|jpe?g|png)$/i, "Invalid photo.").or(z.literal("")),
      })
      .safeParse(Object.fromEntries(["name", "title", "qualifications", "admission_year", "years_experience", "bio", "photo_path"].map((k) => [k, s(fd, k)])));
    if (!p.success) return fail(p.error.issues[0].message);
    return save("advocate", { ...p.data, photo_path: p.data.photo_path || null });
  }

  if (section === "stats") {
    const p = z
      .object({ years: optInt("Years in practice", 80), matters: optInt("Matters handled", 1_000_000), areas_served: z.string().min(2, "Enter the areas served.").max(200) })
      .safeParse({ years: s(fd, "years"), matters: s(fd, "matters"), areas_served: s(fd, "areas_served") });
    if (!p.success) return fail(p.error.issues[0].message);
    return save("stats", p.data);
  }

  if (section === "lists") {
    const supabase = await createClient();
    const rows = [
      { key: "memberships", value: lines(s(fd, "memberships")) },
      { key: "courts", value: lines(s(fd, "courts")) },
    ];
    const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
    if (error) return fail("Could not save. Please try again.");
    refreshSite();
    return done();
  }

  if (section === "hours") {
    const t = z.string().min(5, "Enter the office hours text.").max(200).safeParse(s(fd, "summary"));
    if (!t.success) return fail(t.error.issues[0].message);
    return save("hours", { summary: t.data });
  }

  if (section === "features") {
    return save("features", { show_testimonials: fd.get("show_testimonials") === "on", kiswahili: fd.get("kiswahili") === "on" });
  }

  return fail("Unknown section.");
}
