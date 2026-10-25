import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatNairobi, fmtClock } from "@/lib/admin/time";
import { PageTitle } from "@/components/admin/ui";
import { PAGE_SIZE, RequestList, cleanQuery, type Row } from "@/components/admin/request-list";

export const metadata: Metadata = { title: "Consultations" };

export default async function ConsultationsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  await requireStaff();
  const sp = await searchParams;
  const q = cleanQuery(sp.q ?? "");
  const status = ["new", "contacted", "scheduled", "closed"].includes(sp.status ?? "") ? sp.status! : "";
  const page = Math.max(1, Number(sp.page) || 1);

  const supabase = await createClient();
  let query = supabase
    .from("consultations")
    .select("id, full_name, phone, email, preferred_date, preferred_time, status, created_at, practice_area:practice_areas(title)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (status) query = query.eq("status", status);
  if (q) query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`);
  const { data, count } = await query;

  const rows: Row[] = (data ?? []).map((c: any) => ({
    id: c.id,
    name: c.full_name,
    contact: c.phone,
    extra: c.practice_area?.title ?? "Not sure yet",
    when: `${new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${c.preferred_date}T00:00:00Z`))}, ${fmtClock(c.preferred_time)}`,
    status: c.status,
    received: formatNairobi(c.created_at, { dateStyle: "medium" }),
  }));

  return (
    <>
      <PageTitle title="Consultation requests" subtitle="Requests from the booking form." />
      <RequestList base="/admin/consultations" rows={rows} total={count ?? 0} page={page} q={q} status={status} extraLabel="Practice area / requested time" exportHref="/admin/consultations/export" />
    </>
  );
}
