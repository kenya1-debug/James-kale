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
    .from("contact_messages")
    .select("id, full_name, phone, email, subject, message, status, admin_notes, created_at")
    .order("created_at", { ascending: false })
    .limit(5000);
  if (["new", "contacted", "scheduled", "closed"].includes(status)) query = query.eq("status", status);
  if (q) query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%,subject.ilike.%${q}%`);
  const { data } = await query;

  const rows = (data ?? []).map((m: any) => ({
    received: formatNairobi(m.created_at), name: m.full_name, phone: m.phone ?? "", email: m.email ?? "",
    subject: m.subject ?? "", message: m.message, status: m.status, notes: m.admin_notes ?? "",
  }));
  const csv = toCsv(rows, [
    { key: "received", label: "Received (EAT)" }, { key: "name", label: "Name" }, { key: "phone", label: "Phone" },
    { key: "email", label: "Email" }, { key: "subject", label: "Subject" }, { key: "message", label: "Message" },
    { key: "status", label: "Status" }, { key: "notes", label: "Notes" },
  ]);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="messages-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
