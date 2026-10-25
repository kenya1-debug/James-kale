"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { localePath, type Locale } from "@/lib/i18n/config";
import { contactSchema, firstErrors, type FormState } from "@/lib/forms/schemas";
import { Field, Honeypot, inputClass } from "@/components/forms/fields";
import { Turnstile } from "@/components/forms/turnstile";
import { buttonClass } from "@/components/ui/button";
import { submitContact } from "./actions";

export function ContactForm({ locale, t, siteKey }: { locale: Locale; t: Dictionary["form"]; siteKey: string | null }) {
  const [v, setV] = useState({ fullName: "", phone: "", email: "", subject: "", message: "" });
  const [consent, setConsent] = useState(false);
  const [token, setToken] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState<FormState, FormData>(submitContact, { status: "idle" });

  const err = (k: string) => (errors[k] ? (t.errors as Record<string, string>)[errors[k]] ?? t.errors.required : undefined);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setV((p) => ({ ...p, [k]: e.target.value }));
    setErrors((p) => ({ ...p, [k]: "" }));
  };

  useEffect(() => {
    if (state.status !== "error") return;
    if (state.fieldErrors) setErrors((e) => ({ ...e, ...state.fieldErrors }));
    if (state.code) setFormError(state.code);
    setToken("");
    setAttempt((n) => n + 1);
  }, [state]);

  function submit(fd: FormData) {
    setFormError(null);
    const r = contactSchema.safeParse({ ...v, consent: consent ? "on" : "" });
    if (!r.success) {
      setErrors(firstErrors(r.error.issues));
      return;
    }
    if (siteKey && !token) {
      setFormError("captcha");
      return;
    }
    for (const [k, val] of Object.entries(v)) fd.set(k, val);
    fd.set("consent", consent ? "on" : "");
    fd.set("turnstileToken", token);
    fd.set("elapsedMs", String(Math.round(performance.now())));
    formAction(fd);
  }

  if (state.status === "success") {
    return (
      <div role="status" className="border border-stone bg-white p-8">
        <CheckCircle2 className="h-10 w-10 text-whatsapp" aria-hidden="true" />
        <h3 className="mt-3 font-serif text-h3 text-forest">{t.contact.successTitle}</h3>
        <p className="mt-2 text-charcoal/80">{t.contact.successText}</p>
      </div>
    );
  }

  return (
    <form action={submit} noValidate className="space-y-6">
      <Field id="c-name" label={t.name} error={err("fullName")}>
        <input id="c-name" type="text" autoComplete="name" value={v.fullName} onChange={set("fullName")} maxLength={120}
          aria-invalid={Boolean(err("fullName"))} aria-describedby={err("fullName") ? "c-name-error" : undefined} className={inputClass(Boolean(err("fullName")))} />
      </Field>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="c-phone" label={t.phone} hint={t.contact.methodHint} error={err("phone")}>
          <input id="c-phone" type="tel" inputMode="tel" autoComplete="tel" value={v.phone} onChange={set("phone")} maxLength={20}
            aria-invalid={Boolean(err("phone"))} aria-describedby={err("phone") ? "c-phone-error" : "c-phone-hint"} className={inputClass(Boolean(err("phone")))} />
        </Field>
        <Field id="c-email" label={t.email} error={err("email")}>
          <input id="c-email" type="email" autoComplete="email" value={v.email} onChange={set("email")} maxLength={254}
            aria-invalid={Boolean(err("email"))} aria-describedby={err("email") ? "c-email-error" : undefined} className={inputClass(Boolean(err("email")))} />
        </Field>
      </div>
      <Field id="c-subject" label={t.contact.subject} error={err("subject")}>
        <input id="c-subject" type="text" value={v.subject} onChange={set("subject")} maxLength={200}
          aria-invalid={Boolean(err("subject"))} aria-describedby={err("subject") ? "c-subject-error" : undefined} className={inputClass(Boolean(err("subject")))} />
      </Field>
      <Field id="c-message" label={t.contact.message} hint={t.matterHint} error={err("message")}>
        <textarea id="c-message" rows={6} value={v.message} onChange={set("message")} maxLength={3000}
          aria-invalid={Boolean(err("message"))} aria-describedby={err("message") ? "c-message-error" : "c-message-hint"} className={inputClass(Boolean(err("message")))} />
      </Field>

      <div>
        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" checked={consent} onChange={(e) => { setConsent(e.target.checked); setErrors((x) => ({ ...x, consent: "" })); }}
            aria-invalid={Boolean(err("consent"))} aria-describedby={err("consent") ? "consent-error" : undefined} className="mt-1 h-5 w-5 shrink-0 accent-[#17382c]" />
          <span className="text-sm text-charcoal/80">{t.consent}</span>
        </label>
        <Link href={localePath(locale, "/privacy")} target="_blank" className="mt-2 inline-block pl-8 text-sm text-forest underline underline-offset-4">{t.privacy}</Link>
        {err("consent") && <p id="consent-error" role="alert" className="mt-2 pl-8 text-sm font-medium text-red-700">{err("consent")}</p>}
      </div>

      <Honeypot />
      {siteKey && <Turnstile key={attempt} siteKey={siteKey} onToken={setToken} />}

      {formError && (
        <p role="alert" className="rounded-sm bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {(t.errors as Record<string, string>)[formError] ?? t.errors.server}
        </p>
      )}

      <button type="submit" disabled={pending} className={buttonClass("dark", "disabled:opacity-60")}>
        {pending ? t.contact.sending : t.contact.send}
      </button>
    </form>
  );
}
