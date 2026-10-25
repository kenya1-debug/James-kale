import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatNairobi } from "@/lib/admin/time";
import { PageTitle } from "@/components/admin/ui";
import { PAGE_SIZE, RequestList, cleanQuery, type Row } from "@/components/admin/request-list";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  await requireStaff();
  const sp = await searchParams;
  const q = cleanQuery(sp.q ?? "");
  const status = ["new", "contacted", "scheduled", "closed"].includes(sp.status ?? "") ? sp.status! : "";
  const page = Math.max(1, Number(sp.page) || 1);

  const supabase = await createClient();
  let query = supabase
    .from("contact_messages")
    .select("id, full_name, phone, email, subject, message, status, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (status) query = query.eq("status", status);
  if (q) query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%,subject.ilike.%${q}%`);
  const { data, count } = await query;

  const rows: Row[] = (data ?? []).map((m: any) => ({
    id: m.id,
    name: m.full_name,
    contact: m.phone || m.email || "",
    extra: m.subject || "(no subject)",
    when: String(m.message).slice(0, 60) + (m.message.length > 60 ? "…" : ""),
    status: m.status,
    received: formatNairobi(m.created_at, { dateStyle: "medium" }),
  }));

  return (
    <>
      <PageTitle title="Contact messages" subtitle="Messages from the contact form." />
      <RequestList base="/admin/messages" rows={rows} total={count ?? 0} page={page} q={q} status={status} extraLabel="Subject / preview" exportHref="/admin/messages/export" />
    </>
  );
}
