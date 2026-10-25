export const CONSENT_KEY = "kale-consent";
export const CONSENT_EVENT = "kale-consent-change";
export const OPEN_SETTINGS_EVENT = "kale-open-cookie-settings";
export type Consent = "granted" | "denied" | null;

declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: Record<string, unknown> }) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function getConsent(): Consent {
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(value: Exclude<Consent, null>) {
  try {
    window.localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* storage unavailable: choice applies for this visit only */
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

/** Sends a custom event to whichever analytics tools are loaded. A no-op unless the visitor accepted analytics. */
export function trackEvent(name: string, props?: Record<string, unknown>) {
  if (getConsent() !== "granted") return;
  window.plausible?.(name, props ? { props } : undefined);
  window.gtag?.("event", name, props);
}
