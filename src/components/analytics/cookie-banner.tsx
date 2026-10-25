"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { OPEN_SETTINGS_EVENT, getConsent, setConsent } from "@/lib/analytics";
import { buttonClass } from "@/components/ui/button";

type T = { title: string; text: string; accept: string; decline: string; privacy: string };

/** Equal-weight Accept / Decline. Rendered only when an analytics tool is configured. */
export function CookieBanner({ t, privacyHref }: { t: T; privacyHref: string }) {
  const [open, setOpen] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const reopened = useRef(false);

  useEffect(() => {
    setOpen(getConsent() === null);
    const reopen = () => {
      reopened.current = true;
      setOpen(true);
    };
    window.addEventListener(OPEN_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, reopen);
  }, []);

  useEffect(() => {
    if (open && reopened.current) heading.current?.focus();
  }, [open]);

  if (!open) return null;
  const choose = (v: "granted" | "denied") => {
    setConsent(v);
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-title"
      aria-describedby="cookie-text"
      className="fixed inset-x-3 bottom-[4.75rem] z-50 border border-brass/40 bg-ink p-5 text-ivory shadow-2xl md:inset-x-auto md:bottom-6 md:left-6 md:max-w-md"
    >
      <h2 id="cookie-title" ref={heading} tabIndex={-1} className="font-serif text-xl outline-none">{t.title}</h2>
      <p id="cookie-text" className="mt-2 text-sm text-ivory/80">
        {t.text}{" "}
        <Link href={privacyHref} className="text-brass underline underline-offset-4">{t.privacy}</Link>
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={() => choose("granted")} className={buttonClass("primary", "px-5 py-2.5 text-sm")}>{t.accept}</button>
        <button type="button" onClick={() => choose("denied")} className={buttonClass("outline", "px-5 py-2.5 text-sm")}>{t.decline}</button>
      </div>
    </div>
  );
}

export function CookieSettingsButton({ label }: { label: string }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT))} className="text-ivory/75 transition hover:text-brass">
      {label}
    </button>
  );
}
