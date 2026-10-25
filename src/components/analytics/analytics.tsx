"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { CONSENT_EVENT, getConsent, trackEvent, type Consent } from "@/lib/analytics";

const GA_ID = /^G-[A-Z0-9]{4,20}$/;
const DOMAIN = /^[a-z0-9.-]+\.[a-z]{2,}$/i;

const LABELS: Record<string, string> = { whatsapp: "WhatsApp Click", call: "Call Click" };

/** Loads analytics ONLY after the visitor accepts, and tracks clicks on any element marked data-track="…". */
export function Analytics({ plausibleDomain, gaId }: { plausibleDomain?: string; gaId?: string }) {
  const [consent, setConsent] = useState<Consent>(null);

  useEffect(() => {
    const sync = () => setConsent(getConsent());
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CONSENT_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (consent !== "granted") return;
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("[data-track]");
      const key = el?.getAttribute("data-track");
      if (key) trackEvent(LABELS[key] ?? key);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [consent]);

  if (consent !== "granted") return null;
  const plausible = plausibleDomain && DOMAIN.test(plausibleDomain) ? plausibleDomain : null;
  const ga = gaId && GA_ID.test(gaId) ? gaId : null;

  return (
    <>
      {plausible && <Script defer data-domain={plausible} src="https://plausible.io/js/script.js" strategy="afterInteractive" />}
      {ga && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${ga}',{anonymize_ip:true});`}
          </Script>
        </>
      )}
    </>
  );
}
