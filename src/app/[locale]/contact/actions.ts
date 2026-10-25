"use server";

import { after } from "next/server";
import { supabasePublic as db } from "@/lib/supabase/public";
import { contactSchema, firstErrors, type FormState } from "@/lib/forms/schemas";
import { allowRequest, field, looksLikeBot, verifyTurnstile } from "@/lib/forms/guard";
import { notifyContact } from "@/lib/notify";

export async function submitContact(_prev: FormState, fd: FormData): Promise<FormState> {
  if (looksLikeBot(fd)) return { status: "success" };

  const parsed = contactSchema.safeParse({
    fullName: field(fd, "fullName"),
    phone: field(fd, "phone"),
    email: field(fd, "email"),
    subject: field(fd, "subject"),
    message: field(fd, "message"),
    consent: field(fd, "consent"),
  });
  if (!parsed.success) return { status: "error", fieldErrors: firstErrors(parsed.error.issues) };
  const v = parsed.data;

  if (!(await allowRequest("contact", 8, 3600))) return { status: "error", code: "rate_limited" };
  if (!(await verifyTurnstile(field(fd, "turnstileToken")))) return { status: "error", code: "captcha" };

  const { error } = await db.from("contact_messages").insert({
    full_name: v.fullName,
    phone: v.phone || null,
    email: v.email || null,
    subject: v.subject || null,
    message: v.message,
    consent_given: true,
  });
  if (error) {
    console.error("[contact] insert failed:", error.code);
    return { status: "error", code: "server" };
  }

  after(() => notifyContact({ fullName: v.fullName, phone: v.phone, email: v.email, subject: v.subject, message: v.message }));
  return { status: "success" };
}
