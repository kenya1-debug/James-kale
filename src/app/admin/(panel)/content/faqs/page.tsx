import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ActionForm, DeleteForm, SubmitButton } from "@/components/admin/action-form";
import { AField, Card, PageTitle, inputCls } from "@/components/admin/ui";
import { deleteFaq, saveFaq } from "../../_actions/content";

export const metadata: Metadata = { title: "FAQs" };

function FaqFields({ f, areas }: { f?: any; areas: { id: string; title: string }[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="id" value={f?.id ?? ""} />
      <AField label="Where it appears" className="sm:col-span-2">
        <select name="practice_area_id" defaultValue={f?.practice_area_id ?? ""} className={inputCls}>
          <option value="">Home page (general question)</option>
          {areas.map((a) => <option key={a.id} value={a.id}>{a.title} page</option>)}
        </select>
      </AField>
      <AField label="Question"><input name="question" defaultValue={f?.question ?? ""} maxLength={300} required className={inputCls} /></AField>
      <AField label="Question (Kiswahili)"><input name="question_sw" defaultValue={f?.question_sw ?? ""} maxLength={300} className={inputCls} /></AField>
      <AField label="Answer"><textarea name="answer" rows={4} defaultValue={f?.answer ?? ""} maxLength={2000} required className={inputCls} /></AField>
      <AField label="Answer (Kiswahili)"><textarea name="answer_sw" rows={4} defaultValue={f?.answer_sw ?? ""} maxLength={2000} className={inputCls} /></AField>
      <AField label="Order (smaller shows first)"><input type="number" name="sort_order" min={0} max={9999} defaultValue={f?.sort_order ?? 0} className={inputCls} /></AField>
      <label className="flex items-center gap-3 self-end pb-2"><input type="checkbox" name="published" defaultChecked={f ? f.published : true} className="h-5 w-5 accent-[#17382c]" /><span>Published</span></label>
    </div>
  );
}

export default async function FaqsAdmin() {
  await requireAdmin();
  const supabase = await createClient();
  const [faqs, areas] = await Promise.all([
    supabase.from("faqs").select("*, area:practice_areas(title)").order("sort_order"),
    supabase.from("practice_areas").select("id, title").order("sort_order"),
  ]);
  const areaList = areas.data ?? [];

  return (
    <>
      <PageTitle title="FAQs" subtitle="Questions shown on the home page and on practice area pages." />
      <div className="space-y-4">
        {(faqs.data ?? []).map((f: any) => (
          <details key={f.id} className="border border-stone bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
              <span className="font-medium text-forest">{f.question}</span>
              <span className="shrink-0 text-xs text-charcoal/70">{f.area?.title ?? "Home"}{f.published ? "" : " · hidden"}</span>
            </summary>
            <div className="border-t border-stone p-5">
              <ActionForm action={saveFaq}>
                <div key={f.updated_at}><FaqFields f={f} areas={areaList} /></div>
                <div className="mt-4"><SubmitButton>Save changes</SubmitButton></div>
              </ActionForm>
              <div className="mt-4 border-t border-stone pt-4"><DeleteForm action={deleteFaq} id={f.id} confirmText="Delete this FAQ?" /></div>
            </div>
          </details>
        ))}
        {(faqs.data ?? []).length === 0 && <p className="text-charcoal/70">No FAQs yet.</p>}
      </div>

      <Card className="mt-8">
        <h2 className="mb-4 font-serif text-h3 text-forest">Add a FAQ</h2>
        <ActionForm action={saveFaq}>
          <FaqFields areas={areaList} />
          <div className="mt-4"><SubmitButton pendingText="Adding…">Add FAQ</SubmitButton></div>
        </ActionForm>
      </Card>
    </>
  );
}
