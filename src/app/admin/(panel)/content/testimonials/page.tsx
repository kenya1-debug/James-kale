import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ActionForm, DeleteForm, SubmitButton } from "@/components/admin/action-form";
import { AField, Card, PageTitle, inputCls } from "@/components/admin/ui";
import { deleteTestimonial, saveTestimonial } from "../../_actions/content";

export const metadata: Metadata = { title: "Testimonials" };

function Fields({ t }: { t?: any }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="id" value={t?.id ?? ""} />
      <AField label="Client name or initials"><input name="author_name" defaultValue={t?.author_name ?? ""} maxLength={80} required className={inputCls} /></AField>
      <AField label="Description" hint="For example: Landowner, Baringo"><input name="author_role" defaultValue={t?.author_role ?? ""} maxLength={120} className={inputCls} /></AField>
      <AField label="Testimonial"><textarea name="quote" rows={4} defaultValue={t?.quote ?? ""} maxLength={600} required className={inputCls} /></AField>
      <AField label="Testimonial (Kiswahili)"><textarea name="quote_sw" rows={4} defaultValue={t?.quote_sw ?? ""} maxLength={600} className={inputCls} /></AField>
      <AField label="Order (smaller shows first)"><input type="number" name="sort_order" min={0} max={9999} defaultValue={t?.sort_order ?? 0} className={inputCls} /></AField>
      <label className="flex items-center gap-3 self-end pb-2"><input type="checkbox" name="published" defaultChecked={t?.published ?? false} className="h-5 w-5 accent-[#17382c]" /><span>Published</span></label>
    </div>
  );
}

export default async function TestimonialsAdmin() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("testimonials").select("*").order("sort_order");

  return (
    <>
      <PageTitle title="Testimonials" subtitle="Client feedback shown on the home page." />
      <p className="mb-6 border-l-4 border-brass bg-white px-4 py-3 text-sm text-charcoal/80">
        Only publish a testimonial with the client&apos;s written consent, and check that it complies with the Law Society of Kenya&apos;s rules on advocate advertising. The section stays hidden on the website until you switch it on in{" "}
        <Link href="/admin/settings" className="text-forest underline">Site settings</Link> and at least one testimonial is published.
      </p>
      <div className="space-y-4">
        {(data ?? []).map((t: any) => (
          <details key={t.id} className="border border-stone bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
              <span className="font-medium text-forest">{t.author_name}</span>
              <span className={`text-xs ${t.published ? "text-emerald-700" : "text-charcoal/70"}`}>{t.published ? "Published" : "Hidden"}</span>
            </summary>
            <div className="border-t border-stone p-5">
              <ActionForm action={saveTestimonial}>
                <div key={t.updated_at}><Fields t={t} /></div>
                <div className="mt-4"><SubmitButton>Save changes</SubmitButton></div>
              </ActionForm>
              <div className="mt-4 border-t border-stone pt-4"><DeleteForm action={deleteTestimonial} id={t.id} confirmText="Delete this testimonial?" /></div>
            </div>
          </details>
        ))}
        {(data ?? []).length === 0 && <p className="text-charcoal/70">No testimonials yet.</p>}
      </div>
      <Card className="mt-8">
        <h2 className="mb-4 font-serif text-h3 text-forest">Add a testimonial</h2>
        <ActionForm action={saveTestimonial}>
          <Fields />
          <div className="mt-4"><SubmitButton pendingText="Adding…">Add testimonial</SubmitButton></div>
        </ActionForm>
      </Card>
    </>
  );
}
