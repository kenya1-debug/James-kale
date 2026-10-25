import Link from "next/link";
import { Pagination, STATUSES, StatusBadge, btnCls, inputCls } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

export const PAGE_SIZE = 20;

/** Strip characters that have meaning inside a PostgREST filter expression */
export const cleanQuery = (q: string) => q.replace(/[,()*%\\"':]/g, " ").trim().slice(0, 60);

export type Row = {
  id: string;
  name: string;
  contact: string;
  extra: string;
  when: string;
  status: string;
  received: string;
};

export function RequestList({
  base,
  rows,
  total,
  page,
  q,
  status,
  extraLabel,
  exportHref,
}: {
  base: string;
  rows: Row[];
  total: number;
  page: number;
  q: string;
  status: string;
  extraLabel: string;
  exportHref: string;
}) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (p: number, s = status) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (s) sp.set("status", s);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${base}?${qs}` : base;
  };

  return (
    <>
      <form className="mb-5 flex flex-wrap gap-3" action={base} method="get">
        <input type="search" name="q" defaultValue={q} placeholder="Search name, phone or email" aria-label="Search" className={cn(inputCls, "max-w-xs")} />
        {status && <input type="hidden" name="status" value={status} />}
        <button className={btnCls.primary}>Search</button>
        {(q || status) && <Link href={base} className={btnCls.ghost}>Clear</Link>}
        <a href={`${exportHref}${exportHref.includes("?") ? "&" : "?"}${new URLSearchParams({ q, status }).toString()}`} className={cn(btnCls.ghost, "ml-auto")}>
          Export CSV
        </a>
      </form>

      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
        {["", ...STATUSES].map((s) => (
          <Link
            key={s || "all"}
            href={href(1, s)}
            className={cn("rounded-full border px-4 py-1.5 text-sm capitalize transition", status === s ? "border-forest bg-forest text-ivory" : "border-forest/30 text-forest hover:border-forest")}
          >
            {s || "All"}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto border border-stone bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-stone bg-ivory text-xs uppercase tracking-wide text-charcoal/70">
            <tr>
              <th className="px-4 py-3">Received</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">{extraLabel}</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone">
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-charcoal/70">Nothing here yet.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-ivory/60">
                <td className="whitespace-nowrap px-4 py-3 text-charcoal/70">{r.received}</td>
                <td className="px-4 py-3 font-medium"><Link href={`${base}/${r.id}`} className="text-forest hover:underline">{r.name}</Link></td>
                <td className="px-4 py-3">{r.extra}<span className="block text-xs text-charcoal/70">{r.when}</span></td>
                <td className="px-4 py-3">{r.contact}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-charcoal/70">{total} total</p>
      <Pagination page={page} pages={pages} hrefFor={(p) => href(p)} />
    </>
  );
}
