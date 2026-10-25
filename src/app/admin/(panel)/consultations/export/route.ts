import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/admin/csv";
import { formatNairobi } from "@/lib/admin/time";
import { cleanQuery } from "@/components/admin/request-list";

export async function GET(req: Request) {
  await requireStaff();
  const url = new URL(req.url);
  const q = cleanQuery(url.searchParams.get("q") ?? "");
  const status = url.searchParams.get("status") ?? "";

  const supabase = await createClient();
  let query = supabase
    .from("consultations")
    .select("id, full_name, phone, email, preferred_date, preferred_time, description, status, admin_notes, created_at, practice_area:practice_areas(title)")
    .order("created_at", { ascending: false })
    .limit(5000);
  if (["new", "contacted", "scheduled", "closed"].includes(status)) query = query.eq("status", status);
  if (q) query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`);
  const { data } = await query;

  const rows = (data ?? []).map((c: any) => ({
    ref: c.id.slice(0, 8).toUpperCase(),
    received: formatNairobi(c.created_at),
    name: c.full_name,
    phone: c.phone,
    email: c.email ?? "",
    area: c.practice_area?.title ?? "Not sure yet",
    date: c.preferred_date,
    time: String(c.preferred_time).slice(0, 5),
    status: c.status,
    description: c.description,
    notes: c.admin_notes ?? "",
  }));

  const csv = toCsv(rows, [
    { key: "ref", label: "Reference" }, { key: "received", label: "Received (EAT)" }, { key: "name", label: "Name" },
    { key: "phone", label: "Phone" }, { key: "email", label: "Email" }, { key: "area", label: "Practice area" },
    { key: "date", label: "Requested date" }, { key: "time", label: "Requested time" }, { key: "status", label: "Status" },
    { key: "description", label: "Description" }, { key: "notes", label: "Notes" },
  ]);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="consultations-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
