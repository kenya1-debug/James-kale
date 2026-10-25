import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtClock, nairobiToday } from "@/lib/admin/time";
import { Card, PageTitle, StatusBadge } from "@/components/admin/ui";

function lastMondays(n: number) {
  const t = new Date(`${nairobiToday()}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7));
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(t);
    d.setUTCDate(d.getUTCDate() - 7 * (n - 1 - i));
    return d.toISOString().slice(0, 10);
  });
}

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const me = await requireStaff();
  const { error } = await searchParams;
  const supabase = await createClient();

  const [newC, newM, total, upcoming, weekly, top] = await Promise.all([
    supabase.from("consultations").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("consultations").select("id", { count: "exact", head: true }),
    supabase
      .from("consultations")
      .select("id, full_name, preferred_date, preferred_time, status, practice_area:practice_areas(title)")
      .in("status", ["new", "contacted", "scheduled"])
      .gte("preferred_date", nairobiToday())
      .order("preferred_date")
      .order("preferred_time")
      .limit(6),
    supabase.from("v_requests_per_week").select("week_start, total").order("week_start", { ascending: false }).limit(12),
    supabase.from("v_top_practice_areas").select("title, total").limit(6),
  ]);

  const byWeek = new Map<string, number>((weekly.data ?? []).map((w: any) => [String(w.week_start).slice(0, 10), Number(w.total)]));
  const weeks = lastMondays(8).map((w) => ({ week: w, total: byWeek.get(w) ?? 0 }));
  const maxWeek = Math.max(1, ...weeks.map((w) => w.total));
  const topRows = (top.data ?? []).map((t: any) => ({ title: t.title as string, total: Number(t.total) }));
  const maxTop = Math.max(1, ...topRows.map((t) => t.total));
  const fmtWeek = (d: string) => new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`));

  const stat = (label: string, value: number, href: string) => (
    <Link href={href} className="block border border-stone bg-white p-5 transition hover:border-forest">
      <p className="font-serif text-5xl text-forest">{value}</p>
      <p className="mt-1 text-sm text-charcoal/65">{label}</p>
    </Link>
  );

  return (
    <>
      {error === "forbidden" && <p role="alert" className="mb-6 rounded-sm bg-red-50 px-4 py-3 text-sm text-red-800">You do not have permission to view that page.</p>}
      <PageTitle title={`Welcome${me.full_name ? `, ${me.full_name}` : ""}`} subtitle="A quick look at your practice website." />

      <div className="grid gap-4 sm:grid-cols-3">
        {stat("New consultation requests", newC.count ?? 0, "/admin/consultations?status=new")}
        {stat("New messages", newM.count ?? 0, "/admin/messages?status=new")}
        {stat("All requests, all time", total.count ?? 0, "/admin/consultations")}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-serif text-h3 text-forest">Requests per week</h2>
          <div className="mt-6 flex h-40 items-end gap-2" role="img" aria-label={`Requests per week for the last 8 weeks: ${weeks.map((w) => `${fmtWeek(w.week)}: ${w.total}`).join(", ")}`}>
            {weeks.map((w) => (
              <div key={w.week} className="flex h-full flex-1 flex-col justify-end text-center">
                <span className="mb-1 text-xs text-charcoal/70">{w.total}</span>
                <div className="w-full bg-forest" style={{ height: `${(w.total / maxWeek) * 100}%`, minHeight: w.total ? 4 : 2, opacity: w.total ? 1 : 0.2 }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2 text-center text-[0.65rem] text-charcoal/70" aria-hidden="true">
            {weeks.map((w) => <span key={w.week} className="flex-1">{fmtWeek(w.week)}</span>)}
          </div>
        </Card>

        <Card>
          <h2 className="font-serif text-h3 text-forest">Top practice areas</h2>
          {topRows.every((t) => t.total === 0) ? (
            <p className="mt-6 text-charcoal/70">No requests yet.</p>
          ) : (
            <ul className="mt-5 space-y-4">
              {topRows.map((t) => (
                <li key={t.title}>
                  <div className="mb-1 flex justify-between text-sm"><span>{t.title}</span><span className="text-charcoal/70">{t.total}</span></div>
                  <div className="h-2 bg-stone"><div className="h-full bg-brass" style={{ width: `${(t.total / maxTop) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="font-serif text-h3 text-forest">Upcoming requested appointments</h2>
        {(upcoming.data ?? []).length === 0 ? (
          <p className="mt-4 text-charcoal/70">Nothing upcoming.</p>
        ) : (
          <ul className="mt-4 divide-y divide-stone">
            {(upcoming.data ?? []).map((u: any) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <Link href={`/admin/consultations/${u.id}`} className="font-medium text-forest hover:underline">{u.full_name}</Link>
                  <p className="text-sm text-charcoal/70">{u.practice_area?.title ?? "Not sure yet"}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span>{new Intl.DateTimeFormat("en-KE", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${u.preferred_date}T00:00:00Z`))}, {fmtClock(u.preferred_time)}</span>
                  <StatusBadge status={u.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
