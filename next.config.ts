import path from "node:path";
import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : undefined;
const supabase = supabaseHost ? `https://${supabaseHost}` : "";

const isProd = process.env.NODE_ENV === "production";
const plausible = Boolean(process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN);
const ga = Boolean(process.env.NEXT_PUBLIC_GA_ID);
const turnstile = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

/**
 * Content-Security-Policy. Only the services actually configured are allowed.
 * Scripts need 'unsafe-inline' because Next.js injects inline hydration scripts and nonces would force every page
 * to render dynamically (no static/ISR speed). The other directives (frames, objects, base, forms) stay strict.
 */
const csp = [
  "default-src 'self'",
  ["script-src 'self' 'unsafe-inline'", plausible && "https://plausible.io", ga && "https://www.googletagmanager.com", turnstile && "https://challenges.cloudflare.com"].filter(Boolean).join(" "),
  "style-src 'self' 'unsafe-inline'",
  ["img-src 'self' data: blob:", supabase, ga && "https://www.google-analytics.com https://www.googletagmanager.com"].filter(Boolean).join(" "),
  "font-src 'self' data:",
  ["connect-src 'self'", supabase, plausible && "https://plausible.io", ga && "https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com", turnstile && "https://challenges.cloudflare.com"].filter(Boolean).join(" "),
  ["frame-src https://www.openstreetmap.org", turnstile && "https://challenges.cloudflare.com"].filter(Boolean).join(" "),
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Production only: the dev server needs eval for hot reloading. Set CSP_REPORT_ONLY=1 to trial it without blocking anything.
  ...(isProd
    ? [{ key: process.env.CSP_REPORT_ONLY === "1" ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy", value: csp }]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Pin the project root so Turbopack never picks a parent folder (such as /root) with stray lockfiles or node_modules
  turbopack: { root: path.resolve(process.cwd()) },
  // Low-memory machines only: LOW_MEMORY=1 npm run build (never set this on Vercel)
  ...(process.env.LOW_MEMORY ? { experimental: { cpus: 2 } } : {}),
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: supabaseHost ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }] : [],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
