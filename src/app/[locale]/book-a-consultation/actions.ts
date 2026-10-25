"use server";

import { after } from "next/server";
import { supabasePublic as db } from "@/lib/supabase/public";
import { getPracticeAreas } from "@/lib/data";
import { consultationSchema, FIELD_STEP, firstErrors, type FormState, type SlotResult } from "@/lib/forms/schemas";
import { getSlotsForDate } from "@/lib/forms/slots";
import { allowRequest, field, looksLikeBot, verifyTurnstile } from "@/lib/forms/guard";
import { notifyConsultation } from "@/lib/notify";

export async function getSlotsAction(date: string): Promise<SlotResult> {
  if (typeof date !== "string" || date.length > 10) return { date: "", open: false, reason: "invalid", slots: [] };
  return getSlotsForDate(date);
}

const fakeRef = () => crypto.randomUUID().slice(0, 8).toUpperCase();

export async function submitConsultation(_prev: FormState, fd: FormData): Promise<FormState> {
  // 1. Bots get a convincing "success" and nothing is stored
  if (looksLikeBot(fd)) return { status: "success", reference: fakeRef() };

  // 2. Validate (same schema the browser uses)
  const parsed = consultationSchema.safeParse({
    practiceAreaId: field(fd, "practiceAreaId"),
    preferredDate: field(fd, "preferredDate"),
    preferredTime: field(fd, "preferredTime"),
    description: field(fd, "description"),
    fullName: field(fd, "fullName"),
    phone: field(fd, "phone"),
    email: field(fd, "email"),
    consent: field(fd, "consent"),
  });
  if (!parsed.success) {
    const fieldErrors = firstErrors(parsed.error.issues);
    const steps = Object.keys(fieldErrors).map((k) => FIELD_STEP[k] ?? 3);
    return { status: "error", fieldErrors, goToStep: Math.min(...steps) };
  }
  const v = parsed.data;

  // 3. Rate limit, then optional Turnstile
  if (!(await allowRequest("consultation", 5, 3600))) return { status: "error", code: "rate_limited" };
  if (!(await verifyTurnstile(field(fd, "turnstileToken")))) return { status: "error", code: "captcha" };

  // 4. The slot must still be genuinely available (authoritative server-side check)
  const slots = await getSlotsForDate(v.preferredDate);
  if (!slots.open || !slots.slots.includes(v.preferredTime)) {
    return { status: "error", code: "slot_invalid", goToStep: 1 };
  }

  // 5. Store. The public role can only INSERT (RLS), so no .select() afterwards.
  const id = crypto.randomUUID();
  const { error } = await db.from("consultations").insert({
    id,
    full_name: v.fullName,
    phone: v.phone,
    email: v.email || null,
    practice_area_id: v.practiceAreaId || null,
    preferred_date: v.preferredDate,
    preferred_time: v.preferredTime,
    description: v.description,
    consent_given: true,
  });
  if (error) {
    // Log the error code only: never log personal data
    console.error("[consultation] insert failed:", error.code);
    if (error.code === "23505") return { status: "error", code: "slot_taken", goToStep: 1 };
    return { status: "error", code: "server" };
  }

  // 6. Email after the response is sent; failures never affect the client
  const reference = id.slice(0, 8).toUpperCase();
  after(async () => {
    const areas = await getPracticeAreas();
    const area = areas.find((a) => a.id === v.practiceAreaId);
    const dateLabel = new Intl.DateTimeFormat("en-KE", { dateStyle: "full", timeZone: "UTC" }).format(new Date(`${v.preferredDate}T00:00:00Z`));
    await notifyConsultation({
      reference,
      fullName: v.fullName,
      phone: v.phone,
      email: v.email,
      areaTitle: area?.title ?? "Not sure yet",
      dateLabel,
      time: v.preferredTime,
      description: v.description,
    });
  });

  return { status: "success", reference };
}
