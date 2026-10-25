import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { mergeSettings, storageUrl } from "@/lib/data";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { ImageUpload } from "@/components/admin/image-upload";
import { AField, Card, PageTitle, inputCls } from "@/components/admin/ui";
import { saveSettings } from "../_actions/settings";

export const metadata: Metadata = { title: "Site settings" };

export default async function SettingsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("key, value, updated_at");
  const rows = data ?? [];
  const s = mergeSettings(Object.fromEntries(rows.map((r: any) => [r.key, r.value])));
  const stamp = (k: string) => rows.find((r: any) => r.key === k)?.updated_at ?? "new";
  const grid = "grid gap-4 sm:grid-cols-2";

  return (
    <>
      <PageTitle title="Site settings" subtitle="Details that appear across the website. Saving updates the site straight away." />
      <div className="space-y-6">
        <Card>
          <h2 className="mb-4 font-serif text-h3 text-forest">Firm and contact details</h2>
          <ActionForm action={saveSettings}>
            <div key={stamp("firm")} className={grid}>
              <input type="hidden" name="section" value="firm" />
              <AField label="Firm name"><input name="name" defaultValue={s.firm.name} required maxLength={100} className={inputCls} /></AField>
              <AField label="Short name"><input name="short_name" defaultValue={s.firm.short_name} maxLength={40} className={inputCls} /></AField>
              <AField label="Tagline" className="sm:col-span-2"><input name="tagline" defaultValue={s.firm.tagline} maxLength={120} className={inputCls} /></AField>
              <AField label="Office address" className="sm:col-span-2"><input name="address" defaultValue={s.firm.address} required maxLength={250} className={inputCls} /></AField>
              <AField label="Phone" hint="Powers the Call buttons. Leave empty to hide them."><input name="phone" type="tel" defaultValue={s.firm.phone} placeholder="0712 345 678" className={inputCls} /></AField>
              <AField label="WhatsApp number" hint="Leave empty to use the phone number."><input name="whatsapp" type="tel" defaultValue={s.firm.whatsapp} className={inputCls} /></AField>
              <AField label="Email" hint="Shown on the website. Booking notifications use a separate setting."><input name="email" type="email" defaultValue={s.firm.email} className={inputCls} /></AField>
              <div className={grid}>
                <AField label="Map latitude"><input name="lat" inputMode="decimal" defaultValue={s.firm.lat} className={inputCls} /></AField>
                <AField label="Map longitude"><input name="lng" inputMode="decimal" defaultValue={s.firm.lng} className={inputCls} /></AField>
              </div>
              <div className="sm:col-span-2"><SubmitButton>Save</SubmitButton></div>
            </div>
          </ActionForm>
        </Card>

        <Card>
          <h2 className="mb-4 font-serif text-h3 text-forest">The advocate</h2>
          <ActionForm action={saveSettings}>
            <div key={stamp("advocate")} className={grid}>
              <input type="hidden" name="section" value="advocate" />
              <AField label="Name"><input name="name" defaultValue={s.advocate.name} required maxLength={100} className={inputCls} /></AField>
              <AField label="Title"><input name="title" defaultValue={s.advocate.title} maxLength={120} className={inputCls} /></AField>
              <AField label="Qualifications" hint="For example: LL.B (University of Nairobi), Diploma in Law (Kenya School of Law)" className="sm:col-span-2"><input name="qualifications" defaultValue={s.advocate.qualifications} maxLength={300} className={inputCls} /></AField>
              <AField label="Year admitted to the Bar"><input name="admission_year" inputMode="numeric" defaultValue={s.advocate.admission_year ?? ""} className={inputCls} /></AField>
              <AField label="Years in practice"><input name="years_experience" inputMode="numeric" defaultValue={s.advocate.years_experience ?? ""} className={inputCls} /></AField>
              <AField label="Biography" hint="Shown on the About page and the home page. Leave empty for the default text." className="sm:col-span-2"><textarea name="bio" rows={6} defaultValue={s.advocate.bio} maxLength={3000} className={inputCls} /></AField>
              <div className="sm:col-span-2"><ImageUpload name="photo_path" folder="advocate" initialPath={s.advocate.photo_path} initialUrl={storageUrl(s.advocate.photo_path)} label="Portrait photo" /></div>
              <div className="sm:col-span-2"><SubmitButton>Save</SubmitButton></div>
            </div>
          </ActionForm>
        </Card>

        <Card>
          <h2 className="mb-4 font-serif text-h3 text-forest">Numbers on the home page</h2>
          <ActionForm action={saveSettings}>
            <div key={stamp("stats")} className={grid}>
              <input type="hidden" name="section" value="stats" />
              <AField label="Years in practice" hint="Leave empty to hide."><input name="years" inputMode="numeric" defaultValue={s.stats.years ?? ""} className={inputCls} /></AField>
              <AField label="Matters handled" hint="Leave empty to hide."><input name="matters" inputMode="numeric" defaultValue={s.stats.matters ?? ""} className={inputCls} /></AField>
              <AField label="Areas served" className="sm:col-span-2"><input name="areas_served" defaultValue={s.stats.areas_served} required maxLength={200} className={inputCls} /></AField>
              <div className="sm:col-span-2"><SubmitButton>Save</SubmitButton></div>
            </div>
          </ActionForm>
        </Card>

        <Card>
          <h2 className="mb-4 font-serif text-h3 text-forest">Memberships and courts</h2>
          <ActionForm action={saveSettings}>
            <div key={`${stamp("memberships")}${stamp("courts")}`} className={grid}>
              <input type="hidden" name="section" value="lists" />
              <AField label="Professional memberships" hint="One per line. For example: Law Society of Kenya"><textarea name="memberships" rows={5} defaultValue={s.memberships.join("\n")} className={inputCls} /></AField>
              <AField label="Courts of appearance" hint="One per line. For example: Kabarnet Law Courts"><textarea name="courts" rows={5} defaultValue={s.courts.join("\n")} className={inputCls} /></AField>
              <div className="sm:col-span-2"><SubmitButton>Save</SubmitButton></div>
            </div>
          </ActionForm>
        </Card>

        <Card>
          <h2 className="mb-4 font-serif text-h3 text-forest">Office hours text</h2>
          <ActionForm action={saveSettings}>
            <div key={stamp("hours")} className="space-y-4">
              <input type="hidden" name="section" value="hours" />
              <AField label="Shown in the footer and on the Contact page" hint="The days and times people can book are set under Availability."><input name="summary" defaultValue={s.hours.summary} required maxLength={200} className={inputCls} /></AField>
              <SubmitButton>Save</SubmitButton>
            </div>
          </ActionForm>
        </Card>

        <Card>
          <h2 className="mb-4 font-serif text-h3 text-forest">Website options</h2>
          <ActionForm action={saveSettings}>
            <div key={stamp("features")} className="space-y-4">
              <input type="hidden" name="section" value="features" />
              <label className="flex items-center gap-3"><input type="checkbox" name="show_testimonials" defaultChecked={s.features.show_testimonials} className="h-5 w-5 accent-[#17382c]" /><span>Show testimonials on the home page</span></label>
              <label className="flex items-center gap-3"><input type="checkbox" name="kiswahili" defaultChecked={s.features.kiswahili} className="h-5 w-5 accent-[#17382c]" /><span>Show the Kiswahili language switch</span></label>
              <SubmitButton>Save</SubmitButton>
            </div>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
