import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatNairobi } from "@/lib/admin/time";
import { normalizeNumber } from "@/lib/contact";
import { ActionForm, DeleteForm, SubmitButton } from "@/components/admin/action-form";
import { AField, Card, PageTitle, STATUSES, StatusBadge, btnCls, inputCls } from "@/components/admin/ui";
import { deleteMessage, updateMessage } from "../../_actions/requests";

export const metadata: Metadata = { title: "Message" };

export default async function MessageDetail({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireStaff();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const { data: m } = await supabase.from("contact_messages").select("*").eq("id", id).maybeSingle();
  if (!m) notFound();
  const dl = "grid gap-1 border-b border-stone py-3 sm:grid-cols-[10rem_1fr] sm:gap-4";

  return (
    <>
      <PageTitle title={m.full_name} subtitle={`Received ${formatNairobi(m.created_at)}`} actions={<Link href="/admin/messages" className={btnCls.ghost}>← All messages</Link>} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card>
          <dl>
            <div className={dl}><dt className="text-sm text-charcoal/70">Status</dt><dd><StatusBadge status={m.status} /></dd></div>
            <div className={dl}><dt className="text-sm text-charcoal/70">Subject</dt><dd>{m.subject || "(none)"}</dd></div>
            <div className={dl}>
              <dt className="text-sm text-charcoal/70">Phone</dt>
              <dd className="flex flex-wrap items-center gap-3">
                {m.phone ? (<>
                  <a href={`tel:+${normalizeNumber(m.phone)}`} className="text-forest underline">{m.phone}</a>
                  <a href={`https://wa.me/${normalizeNumber(m.phone)}`} target="_blank" rel="noopener noreferrer" className="text-sm text-whatsapp underline">WhatsApp</a>
                </>) : "Not given"}
              </dd>
            </div>
            <div className={dl}><dt className="text-sm text-charcoal/70">Email</dt><dd>{m.email ? <a href={`mailto:${m.email}`} className="text-forest underline">{m.email}</a> : "Not given"}</dd></div>
            <div className={dl}><dt className="text-sm text-charcoal/70">Message</dt><dd className="whitespace-pre-wrap">{m.message}</dd></div>
          </dl>
        </Card>
        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 font-serif text-h3 text-forest">Follow-up</h2>
            <ActionForm action={updateMessage}>
              <div key={m.updated_at} className="space-y-4">
              <input type="hidden" name="id" value={m.id} />
              <AField label="Status">
                <select name="status" defaultValue={m.status} className={inputCls}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </AField>
              <AField label="Private notes" hint="Only staff can see these.">
                <textarea name="admin_notes" rows={6} maxLength={4000} defaultValue={m.admin_notes ?? ""} className={inputCls} />
              </AField>
              <SubmitButton>Save</SubmitButton>
              </div>
            </ActionForm>
          </Card>
          {me.role === "admin" && (
            <Card>
              <h2 className="mb-3 font-serif text-h3 text-forest">Delete</h2>
              <p className="mb-4 text-sm text-charcoal/70">Removes this message permanently.</p>
              <DeleteForm action={deleteMessage} id={m.id} />
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
