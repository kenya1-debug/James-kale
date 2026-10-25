"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { localePath, type Locale } from "@/lib/i18n/config";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Wordmark } from "./wordmark";

type Labels = {
  home: string;
  about: string;
  practice: string;
  insights: string;
  contact: string;
  book: string;
  menu: string;
  close: string;
  switchLang: string;
  switchLangLabel: string;
};

export function Header({
  locale,
  labels,
  showLanguageToggle,
}: {
  locale: Locale;
  labels: Labels;
  showLanguageToggle: boolean;
}) {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);

  // English path regardless of current locale, used for active state + language switch
  const base = pathname === "/sw" ? "/" : pathname.startsWith("/sw/") ? pathname.slice(3) : pathname;
  const switchHref = locale === "en" ? (base === "/" ? "/sw" : `/sw${base}`) : base;

  const links = [
    { path: "/", label: labels.home },
    { path: "/about", label: labels.about },
    { path: "/practice-areas", label: labels.practice },
    { path: "/insights", label: labels.insights },
    { path: "/contact", label: labels.contact },
  ];
  const isActive = (p: string) => (p === "/" ? base === "/" : base === p || base.startsWith(`${p}/`));

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const langLink = showLanguageToggle && (
    <Link
      href={switchHref}
      hrefLang={locale === "en" ? "sw" : "en"}
      lang={locale === "en" ? "sw" : "en"}
      aria-label={labels.switchLangLabel}
      className="rounded-sm border border-ivory/30 px-3 py-1.5 text-sm text-ivory/90 transition hover:border-brass hover:text-brass"
    >
      {labels.switchLang}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/95 text-ivory backdrop-blur">
      <div className="mx-auto flex h-[4.5rem] w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href={localePath(locale, "/")} aria-label="James Kale & Co. Advocates, home">
          <Wordmark />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <Link
              key={l.path}
              href={localePath(locale, l.path)}
              aria-current={isActive(l.path) ? "page" : undefined}
              className={cn(
                "relative py-1 text-[0.95rem] transition-colors hover:text-brass",
                isActive(l.path) ? "text-brass" : "text-ivory/85",
              )}
            >
              {l.label}
            </Link>
          ))}
          {langLink}
          <Link href={localePath(locale, "/book-a-consultation")} className={buttonClass("primary", "px-5 py-2.5 text-[0.95rem]")}>
            {labels.book}
          </Link>
        </nav>

        <div className="flex items-center gap-3 lg:hidden">
          {langLink}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? labels.close : labels.menu}
            className="grid h-11 w-11 place-items-center rounded-sm border border-ivory/30"
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-white/10 bg-ink lg:hidden">
          <ul className="mx-auto max-w-6xl px-5 py-4 sm:px-8">
            {links.map((l) => (
              <li key={l.path}>
                <Link
                  href={localePath(locale, l.path)}
                  aria-current={isActive(l.path) ? "page" : undefined}
                  className={cn(
                    "block border-b border-white/10 py-4 font-serif text-2xl",
                    isActive(l.path) ? "text-brass" : "text-ivory",
                  )}
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="py-5">
              <Link href={localePath(locale, "/book-a-consultation")} className={buttonClass("primary", "w-full")}>
                {labels.book}
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
