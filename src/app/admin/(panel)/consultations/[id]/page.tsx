import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatNairobi, fmtClock } from "@/lib/admin/time";
import { normalizeNumber } from "@/lib/contact";
import { ActionForm, DeleteForm, SubmitButton } from "@/components/admin/action-form";
import { AField, Card, PageTitle, STATUSES, StatusBadge, btnCls, inputCls } from "@/components/admin/ui";
import { deleteConsultation, updateConsultation } from "../../_actions/requests";

export const metadata: Metadata = { title: "Consultation" };

export default async function ConsultationDetail({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireStaff();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const { data: c } = await supabase
    .from("consultations")
    .select("*, practice_area:practice_areas(title)")
    .eq("id", id)
    .maybeSingle();
  if (!c) notFound();

  const wa = `https://wa.me/${normalizeNumber(c.phone)}`;
  const dateLabel = new Intl.DateTimeFormat("en-KE", { dateStyle: "full", timeZone: "UTC" }).format(new Date(`${c.preferred_date}T00:00:00Z`));
  const dl = "grid gap-1 border-b border-stone py-3 sm:grid-cols-[10rem_1fr] sm:gap-4";

  return (
    <>
      <PageTitle
        title={c.full_name}
        subtitle={`Reference ${c.id.slice(0, 8).toUpperCase()} · received ${formatNairobi(c.created_at)}`}
        actions={<Link href="/admin/consultations" className={btnCls.ghost}>← All requests</Link>}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card>
          <dl>
            <div className={dl}><dt className="text-sm text-charcoal/70">Status</dt><dd><StatusBadge status={c.status} /></dd></div>
            <div className={dl}><dt className="text-sm text-charcoal/70">Practice area</dt><dd>{c.practice_area?.title ?? "Not sure yet"}</dd></div>
            <div className={dl}><dt className="text-sm text-charcoal/70">Requested</dt><dd>{dateLabel}, {fmtClock(c.preferred_time)}</dd></div>
            <div className={dl}>
              <dt className="text-sm text-charcoal/70">Phone</dt>
              <dd className="flex flex-wrap items-center gap-3">
                <a href={`tel:+${normalizeNumber(c.phone)}`} className="text-forest underline">{c.phone}</a>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="text-sm text-whatsapp underline">WhatsApp</a>
              </dd>
            </div>
            <div className={dl}><dt className="text-sm text-charcoal/70">Email</dt><dd>{c.email ? <a href={`mailto:${c.email}`} className="text-forest underline">{c.email}</a> : "Not given"}</dd></div>
            <div className={dl}><dt className="text-sm text-charcoal/70">Matter</dt><dd className="whitespace-pre-wrap">{c.description}</dd></div>
          </dl>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 font-serif text-h3 text-forest">Follow-up</h2>
            <ActionForm action={updateConsultation}>
              <div key={c.updated_at} className="space-y-4">
              <input type="hidden" name="id" value={c.id} />
              <AField label="Status">
                <select name="status" defaultValue={c.status} className={inputCls}>
                  {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                </select>
              </AField>
              <AField label="Private notes" hint="Only staff can see these.">
                <textarea name="admin_notes" rows={6} maxLength={4000} defaultValue={c.admin_notes ?? ""} className={inputCls} />
              </AField>
              <SubmitButton>Save</SubmitButton>
              </div>
            </ActionForm>
          </Card>
          {me.role === "admin" && (
            <Card>
              <h2 className="mb-3 font-serif text-h3 text-forest">Delete</h2>
              <p className="mb-4 text-sm text-charcoal/70">Removes this request permanently. Closing it keeps the record.</p>
              <DeleteForm action={deleteConsultation} id={c.id} />
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
