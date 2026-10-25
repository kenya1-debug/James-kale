import Link from "next/link";
import { cn } from "@/lib/utils";

export const inputCls =
  "w-full rounded-sm border border-stone bg-white px-3 py-2 text-base outline-none focus:border-forest focus:ring-2 focus:ring-brass/40";
export const labelCls = "mb-1 block text-sm font-medium text-charcoal";

export const btnCls = {
  primary: "inline-flex items-center justify-center gap-2 rounded-sm bg-forest px-5 py-2.5 text-sm font-medium text-ivory transition hover:bg-ink disabled:opacity-60",
  ghost: "inline-flex items-center justify-center gap-2 rounded-sm border border-forest/40 px-5 py-2.5 text-sm font-medium text-forest transition hover:bg-forest hover:text-ivory",
  danger: "inline-flex items-center justify-center gap-2 rounded-sm border border-red-300 px-5 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-700 hover:text-white",
};

export const STATUSES = ["new", "contacted", "scheduled", "closed"] as const;

export function PageTitle({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-serif text-h2 text-forest">{title}</h1>
        {subtitle && <p className="mt-1 text-charcoal/65">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("border border-stone bg-white p-5 sm:p-6", className)}>{children}</section>;
}

export function AField({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className={labelCls}>{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-charcoal/70">{hint}</span>}
    </label>
  );
}

const badge: Record<string, string> = {
  new: "bg-amber-100 text-amber-900",
  contacted: "bg-sky-100 text-sky-900",
  scheduled: "bg-emerald-100 text-emerald-900",
  closed: "bg-stone text-charcoal/70",
  draft: "bg-stone text-charcoal/70",
  published: "bg-emerald-100 text-emerald-900",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", badge[status] ?? badge.closed)}>{status}</span>;
}

export function Pagination({ page, pages, hrefFor }: { page: number; pages: number; hrefFor: (p: number) => string }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-between text-sm">
      {page > 1 ? <Link href={hrefFor(page - 1)} className={btnCls.ghost}>← Previous</Link> : <span />}
      <span className="text-charcoal/65">Page {page} of {pages}</span>
      {page < pages ? <Link href={hrefFor(page + 1)} className={btnCls.ghost}>Next →</Link> : <span />}
    </nav>
  );
}
