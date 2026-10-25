"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useCallback, useEffect, useRef, useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { localePath, type Locale } from "@/lib/i18n/config";
import { consultationSchema, firstErrors, type FormState, type SlotResult } from "@/lib/forms/schemas";
import { Field, Honeypot, inputClass } from "@/components/forms/fields";
import { Turnstile } from "@/components/forms/turnstile";
import { ButtonLink, buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { getSlotsAction, submitConsultation } from "./actions";

type Area = { id: string; slug: string; title: string };
type Props = {
  locale: Locale;
  t: Dictionary["form"];
  areas: Area[];
  siteKey: string | null;
  tel: string | null;
  wa: string | null;
};

const STEP_FIELDS = [["practiceAreaId"], ["preferredDate", "preferredTime"], ["description"], ["fullName", "phone", "email", "consent"]];
const LAST = 3;

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const daysFromToday = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return ymd(d);
};
const fmtTime = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

export function BookingForm({ locale, t, areas, siteKey, tel, wa }: Props) {
  const params = useSearchParams();
  const [step, setStep] = useState(0);
  const [area, setArea] = useState<string | null>(() => areas.find((a) => a.slug === params.get("area"))?.id ?? null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<SlotResult | null>(null);
  const [loadingSlots, startSlots] = useTransition();
  const [description, setDescription] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [token, setToken] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState<FormState, FormData>(submitConsultation, { status: "idle" });

  const latestDate = useRef("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);

  const err = (k: string) => (errors[k] ? (t.errors as Record<string, string>)[errors[k]] ?? t.errors.required : undefined);

  const loadSlots = useCallback((d: string) => {
    latestDate.current = d;
    startSlots(async () => {
      const r = await getSlotsAction(d);
      if (latestDate.current === d) setSlots(r);
    });
  }, []);

  function onDateChange(v: string) {
    setDate(v);
    setTime("");
    setSlots(null);
    setErrors((e) => ({ ...e, preferredDate: "", preferredTime: "" }));
    if (v) loadSlots(v);
  }

  // Move focus to the step heading for keyboard and screen-reader users
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  // Conversion event (only sent if the visitor accepted analytics)
  useEffect(() => {
    if (state.status === "success") trackEvent("Consultation Booked");
  }, [state.status]);

  // Apply server-side results
  useEffect(() => {
    if (state.status !== "error") return;
    if (state.fieldErrors) setErrors((e) => ({ ...e, ...state.fieldErrors }));
    if (state.goToStep !== undefined) setStep(state.goToStep);
    if (state.code) setFormError(state.code);
    if (state.code === "slot_taken" || state.code === "slot_invalid") {
      setTime("");
      if (date) loadSlots(date);
    }
    setToken("");
    setAttempt((n) => n + 1); // remount Turnstile: its token is single-use
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function validate(s: number) {
    const next: Record<string, string> = {};
    if (s === 0 && area === null) next.practiceAreaId = "area";
    const r = consultationSchema.safeParse({
      practiceAreaId: area ?? "",
      preferredDate: date,
      preferredTime: time,
      description,
      fullName,
      phone,
      email,
      consent: consent ? "on" : "",
    });
    if (!r.success) {
      const all = firstErrors(r.error.issues);
      for (const k of STEP_FIELDS[s]) if (all[k]) next[k] = all[k];
    }
    setErrors((prev) => ({ ...prev, ...Object.fromEntries(STEP_FIELDS[s].map((k) => [k, ""])), ...next }));
    return Object.keys(next).length === 0;
  }

  function goNext() {
    setFormError(null);
    if (validate(step)) setStep(step + 1);
  }

  function submit(fd: FormData) {
    setFormError(null);
    if (!validate(LAST)) return;
    if (siteKey && !token) {
      setFormError("captcha");
      return;
    }
    fd.set("practiceAreaId", area ?? "");
    fd.set("preferredDate", date);
    fd.set("preferredTime", time);
    fd.set("description", description);
    fd.set("fullName", fullName);
    fd.set("phone", phone);
    fd.set("email", email);
    fd.set("consent", consent ? "on" : "");
    fd.set("turnstileToken", token);
    fd.set("elapsedMs", String(Math.round(performance.now())));
    formAction(fd);
  }

  const areaTitle = areas.find((a) => a.id === area)?.title ?? t.notSure;
  const dateLabel = date
    ? new Intl.DateTimeFormat(locale === "sw" ? "sw-KE" : "en-KE", { dateStyle: "full", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`))
    : "";

  /* ───────────── success ───────────── */
  if (state.status === "success") {
    return (
      <div role="status" className="border border-stone bg-white p-8 sm:p-10">
        <CheckCircle2 className="h-12 w-12 text-whatsapp" aria-hidden="true" />
        <h2 className="mt-4 font-serif text-h2 text-forest">{t.successTitle}</h2>
        <p className="mt-3 text-lg text-charcoal/80">{t.successText}</p>
        {state.reference && (
          <p className="mt-5 text-charcoal/70">
            {t.reference}: <strong className="font-mono text-charcoal">{state.reference}</strong>
          </p>
        )}
        <p className="mt-5 text-charcoal/80">{t.successUrgent}</p>
        <div className="mt-8 flex flex-wrap gap-4">
          {tel && <ButtonLink href={tel} variant="dark">{t.call}</ButtonLink>}
          {wa && <ButtonLink href={wa} variant="whatsapp" data-track="whatsapp">WhatsApp</ButtonLink>}
          <ButtonLink href={localePath(locale, "/")} variant="outlineDark">{t.backHome}</ButtonLink>
        </div>
      </div>
    );
  }

  const heading = [t.areaTitle, t.dateTitle, t.matterTitle, t.detailsTitle][step];
  const card = "block cursor-pointer";
  const cardFace =
    "block h-full rounded-sm border border-stone bg-white p-5 transition hover:border-forest peer-checked:border-forest peer-checked:bg-forest peer-checked:text-ivory peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brass";

  const reasonText: Record<string, string> = {
    invalid: t.invalid,
    past: t.past,
    too_far: t.tooFar,
    closed: t.closed,
    holiday: t.holiday,
  };

  return (
    <form
      action={submit}
      onSubmit={(e) => {
        if (step < LAST) {
          e.preventDefault(); // Enter key on an earlier step must not submit
          goNext();
        }
      }}
      noValidate
      className="relative"
    >
      {/* progress */}
      <p className="mb-3 text-sm font-medium text-charcoal/70">
        {t.step} {step + 1} / {LAST + 1} · {t.steps[step]}
      </p>
      <div className="mb-10 grid grid-cols-4 gap-2" aria-hidden="true">
        {t.steps.map((s, i) => (
          <span key={s} className={cn("h-1.5 rounded-full transition-colors", i <= step ? "bg-brass" : "bg-stone")} />
        ))}
      </div>

      <h2 ref={headingRef} tabIndex={-1} className="mb-8 font-serif text-h2 text-forest outline-none">
        {heading}
      </h2>

      {/* STEP 0: practice area */}
      {step === 0 && (
        <fieldset>
          <legend className="sr-only">{t.areaTitle}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {areas.map((a) => (
              <label key={a.id} className={card}>
                <input type="radio" name="area" value={a.id} checked={area === a.id} onChange={() => { setArea(a.id); setErrors((e) => ({ ...e, practiceAreaId: "" })); }} className="peer sr-only" />
                <span className={cardFace}>
                  <span className="font-serif text-xl">{a.title}</span>
                </span>
              </label>
            ))}
            <label className={card}>
              <input type="radio" name="area" value="" checked={area === ""} onChange={() => { setArea(""); setErrors((e) => ({ ...e, practiceAreaId: "" })); }} className="peer sr-only" />
              <span className={cardFace}>
                <span className="font-serif text-xl">{t.areaNotSure}</span>
                <span className="mt-1 block text-sm opacity-75">{t.areaNotSureHint}</span>
              </span>
            </label>
          </div>
          {err("practiceAreaId") && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{err("practiceAreaId")}</p>}
        </fieldset>
      )}

      {/* STEP 1: date + time */}
      {step === 1 && (
        <div className="space-y-6">
          <Field id="preferredDate" label={t.dateLabel} error={err("preferredDate")}>
            <input
              id="preferredDate"
              type="date"
              value={date}
              min={daysFromToday(0)}
              max={daysFromToday(60)}
              onChange={(e) => onDateChange(e.target.value)}
              aria-invalid={Boolean(err("preferredDate"))}
              aria-describedby={err("preferredDate") ? "preferredDate-error" : undefined}
              className={inputClass(Boolean(err("preferredDate")))}
            />
          </Field>

          <div aria-live="polite">
            <p className="mb-2 text-sm font-medium text-charcoal">{t.timeLabel}</p>
            {!date && <p className="text-charcoal/65">{t.pickDate}</p>}
            {date && loadingSlots && <p className="text-charcoal/65">{t.loadingSlots}</p>}
            {date && !loadingSlots && slots && !slots.open && <p className="text-charcoal/80">{reasonText[slots.reason ?? "invalid"]}</p>}
            {date && !loadingSlots && slots?.open && slots.slots.length === 0 && <p className="text-charcoal/80">{t.noSlots}</p>}
            {date && !loadingSlots && slots?.open && slots.slots.length > 0 && (
              <div role="radiogroup" aria-label={t.timeLabel} className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {slots.slots.map((s) => (
                  <label key={s} className="cursor-pointer">
                    <input type="radio" name="slot" value={s} checked={time === s} onChange={() => { setTime(s); setErrors((e) => ({ ...e, preferredTime: "" })); }} className="peer sr-only" />
                    <span className="block rounded-sm border border-stone bg-white px-2 py-3 text-center text-sm font-medium transition hover:border-forest peer-checked:border-forest peer-checked:bg-forest peer-checked:text-ivory peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brass">
                      {fmtTime(s)}
                    </span>
                  </label>
                ))}
              </div>
            )}
            {err("preferredTime") && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{err("preferredTime")}</p>}
            <p className="mt-4 text-sm text-charcoal/70">{t.tz}</p>
          </div>
        </div>
      )}

      {/* STEP 2: matter */}
      {step === 2 && (
        <Field id="description" label={t.matterLabel} hint={t.matterHint} error={err("description")}>
          <textarea
            id="description"
            rows={7}
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-invalid={Boolean(err("description"))}
            aria-describedby={err("description") ? "description-error" : "description-hint"}
            className={inputClass(Boolean(err("description")))}
          />
        </Field>
      )}

      {/* STEP 3: details + review */}
      {step === 3 && (
        <div className="space-y-6">
          <dl className="grid gap-x-8 gap-y-3 border border-stone bg-white/70 p-5 text-sm sm:grid-cols-2">
            <div><dt className="font-medium text-brass-text">{t.area}</dt><dd>{areaTitle}</dd></div>
            <div><dt className="font-medium text-brass-text">{t.when}</dt><dd>{dateLabel}, {fmtTime(time)}</dd></div>
          </dl>

          <Field id="fullName" label={t.name} error={err("fullName")}>
            <input id="fullName" type="text" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={120}
              aria-invalid={Boolean(err("fullName"))} aria-describedby={err("fullName") ? "fullName-error" : undefined} className={inputClass(Boolean(err("fullName")))} />
          </Field>
          <Field id="phone" label={t.phone} hint={t.phoneHint} error={err("phone")}>
            <input id="phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20}
              aria-invalid={Boolean(err("phone"))} aria-describedby={err("phone") ? "phone-error" : "phone-hint"} className={inputClass(Boolean(err("phone")))} />
          </Field>
          <Field id="email" label={t.email} error={err("email")}>
            <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254}
              aria-invalid={Boolean(err("email"))} aria-describedby={err("email") ? "email-error" : undefined} className={inputClass(Boolean(err("email")))} />
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
        </div>
      )}

      {formError && (
        <p role="alert" className="mt-6 rounded-sm bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {(t.errors as Record<string, string>)[formError] ?? t.errors.server}
        </p>
      )}

      <div className="mt-10 flex items-center justify-between gap-4">
        {step > 0 ? (
          <button type="button" onClick={() => { setFormError(null); setStep(step - 1); }} className={buttonClass("outlineDark")}>
            {t.back}
          </button>
        ) : (
          <span />
        )}
        {step < LAST ? (
          <button type="submit" className={buttonClass("dark")}>{t.next}</button>
        ) : (
          <button type="submit" disabled={pending} className={buttonClass("primary", "disabled:opacity-60")}>
            {pending ? t.submitting : t.submit}
          </button>
        )}
      </div>
    </form>
  );
}
