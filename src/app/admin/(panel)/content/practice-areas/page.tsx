import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { AField, Card, PageTitle, inputCls } from "@/components/admin/ui";
import { createPracticeArea, savePracticeArea } from "../../_actions/content";

export const metadata: Metadata = { title: "Practice areas" };
const ICONS = ["landmark", "users", "shield", "briefcase", "handshake", "coins", "scale"];

export default async function PracticeAreasAdmin() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("practice_areas").select("*").order("sort_order");

  return (
    <>
      <PageTitle title="Practice areas" subtitle="Edit what appears on the website. Kiswahili fields are optional; English is shown when empty." />
      <div className="space-y-4">
        {(data ?? []).map((a: any) => (
          <details key={a.id} className="group border border-stone bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
              <span className="font-serif text-xl text-forest">{a.title}</span>
              <span className={`text-xs font-medium ${a.published ? "text-emerald-700" : "text-charcoal/70"}`}>{a.published ? "Published" : "Hidden"}</span>
            </summary>
            <div className="border-t border-stone p-5">
              <ActionForm action={savePracticeArea}>
                <div key={a.updated_at} className="grid gap-5 sm:grid-cols-2">
                  <input type="hidden" name="id" value={a.id} />
                  <AField label="Title"><input name="title" defaultValue={a.title} maxLength={100} required className={inputCls} /></AField>
                  <AField label="Title (Kiswahili)"><input name="title_sw" defaultValue={a.title_sw ?? ""} maxLength={100} className={inputCls} /></AField>
                  <AField label="Short summary"><textarea name="summary" rows={3} defaultValue={a.summary} maxLength={300} required className={inputCls} /></AField>
                  <AField label="Short summary (Kiswahili)"><textarea name="summary_sw" rows={3} defaultValue={a.summary_sw ?? ""} maxLength={300} className={inputCls} /></AField>
                  <AField label="Page text" hint="Separate paragraphs with a blank line." className="sm:col-span-1"><textarea name="body_md" rows={8} defaultValue={a.body_md} maxLength={8000} className={inputCls} /></AField>
                  <AField label="Page text (Kiswahili)" hint="Separate paragraphs with a blank line."><textarea name="body_md_sw" rows={8} defaultValue={a.body_md_sw ?? ""} maxLength={8000} className={inputCls} /></AField>
                  <AField label="How we help: one step per line" hint="Format: Step title | What happens. Up to 8 steps." className="sm:col-span-2">
                    <textarea name="steps" rows={5} defaultValue={(a.how_we_help ?? []).map((s: any) => `${s.title} | ${s.text}`).join("\n")} className={inputCls} />
                  </AField>
                  <AField label="Search title" hint="Up to 70 characters. Optional."><input name="seo_title" defaultValue={a.seo_title ?? ""} maxLength={70} className={inputCls} /></AField>
                  <AField label="Search description" hint="Up to 170 characters. Optional."><input name="seo_description" defaultValue={a.seo_description ?? ""} maxLength={170} className={inputCls} /></AField>
                  <AField label="Icon">
                    <select name="icon" defaultValue={a.icon ?? "scale"} className={inputCls}>{ICONS.map((i) => <option key={i}>{i}</option>)}</select>
                  </AField>
                  <AField label="Order (smaller shows first)"><input type="number" name="sort_order" min={0} max={9999} defaultValue={a.sort_order} className={inputCls} /></AField>
                  <label className="flex items-center gap-3 sm:col-span-2"><input type="checkbox" name="published" defaultChecked={a.published} className="h-5 w-5 accent-[#17382c]" /><span>Published (visible on the website)</span></label>
                  <p className="text-xs text-charcoal/70 sm:col-span-2">Web address: /practice-areas/{a.slug} (cannot be changed, so links never break).</p>
                  <div className="sm:col-span-2"><SubmitButton>Save changes</SubmitButton></div>
                </div>
              </ActionForm>
            </div>
          </details>
        ))}
      </div>

      <Card className="mt-8">
        <h2 className="font-serif text-h3 text-forest">Add a practice area</h2>
        <ActionForm action={createPracticeArea}>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <AField label="Title"><input name="title" maxLength={100} required className={inputCls} /></AField>
            <AField label="Web address" hint="Lowercase, e.g. immigration-law"><input name="slug" maxLength={60} required className={inputCls} /></AField>
            <AField label="Short summary" className="sm:col-span-2"><textarea name="summary" rows={2} maxLength={300} required className={inputCls} /></AField>
            <div className="sm:col-span-2"><SubmitButton pendingText="Adding…">Add practice area</SubmitButton></div>
          </div>
        </ActionForm>
      </Card>
    </>
  );
}
