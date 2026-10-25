import { z } from "zod";

// Error messages are KEYS into the dictionary (t.form.errors), so one schema serves both languages.

const PHONE = /^\+?[0-9][0-9\s-]{6,19}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const optionalEmail = z
  .string()
  .trim()
  .max(254, "email")
  .refine((v) => v === "" || z.email().safeParse(v).success, "email");

const consent = z.string().refine((v) => v === "on", "consent");

export const consultationSchema = z.object({
  practiceAreaId: z.string().refine((v) => v === "" || z.uuid().safeParse(v).success, "area"),
  preferredDate: z.string().regex(DATE, "date"),
  preferredTime: z.string().regex(TIME, "time"),
  description: z.string().trim().min(10, "description").max(2000, "description"),
  fullName: z.string().trim().min(2, "name").max(120, "name"),
  phone: z.string().trim().min(1, "required").refine((v) => PHONE.test(v), "phone"),
  email: optionalEmail,
  consent,
});

export const contactSchema = z
  .object({
    fullName: z.string().trim().min(2, "name").max(120, "name"),
    phone: z.string().trim().refine((v) => v === "" || PHONE.test(v), "phone"),
    email: optionalEmail,
    subject: z.string().trim().max(200, "subject"),
    message: z.string().trim().min(10, "message").max(3000, "message"),
    consent,
  })
  .superRefine((v, ctx) => {
    if (!v.phone && !v.email) ctx.addIssue({ code: "custom", path: ["phone"], message: "contactMethod" });
  });

export type FormState = {
  status: "idle" | "error" | "success";
  /** key into t.form.errors for form-level problems */
  code?: string;
  fieldErrors?: Record<string, string>;
  goToStep?: number;
  reference?: string;
};

export const FIELD_STEP: Record<string, number> = {
  practiceAreaId: 0,
  preferredDate: 1,
  preferredTime: 1,
  description: 2,
  fullName: 3,
  phone: 3,
  email: 3,
  consent: 3,
};

/** First error per field */
export function firstErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const k = String(i.path[0] ?? "form");
    if (!(k in out)) out[k] = i.message;
  }
  return out;
}

export type SlotResult = {
  date: string;
  open: boolean;
  reason?: "invalid" | "past" | "too_far" | "closed" | "holiday";
  slots: string[];
};
