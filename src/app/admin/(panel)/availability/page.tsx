import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { nairobiToday } from "@/lib/admin/time";
import { ActionForm, DeleteForm, SubmitButton } from "@/components/admin/action-form";
import { AField, Card, PageTitle, inputCls } from "@/components/admin/ui";
import { addException, deleteException, saveAvailability } from "../_actions/availability";

export const metadata: Metadata = { title: "Availability" };
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ORDER = [1, 2, 3, 4, 5, 6, 0]; // show Monday first
const hhmm = (t: string | null) => (t ? t.slice(0, 5) : "");

export default async function AvailabilityPage() {
  await requireAdmin();
  const supabase = await createClient();
  const [avail, exc] = await Promise.all([
    supabase.from("availability").select("*"),
    supabase.from("availability_exceptions").select("id, on_date, reason").gte("on_date", nairobiToday()).order("on_date"),
  ]);
  const byDay = new Map<number, any>((avail.data ?? []).map((a: any) => [a.day_of_week, a]));
  const stamp = (avail.data ?? []).map((a: any) => a.updated_at).sort().at(-1) ?? "new";
  const t = `${inputCls} w-28`;

  return (
    <>
      <PageTitle title="Availability" subtitle="These times control which slots clients can book. All times are Kenya time." />
      <Card>
        <ActionForm action={saveAvailability}>
          <div key={stamp} className="space-y-4">
            {ORDER.map((d) => {
              const a = byDay.get(d);
              return (
                <fieldset key={d} className="grid gap-3 border-b border-stone pb-4 sm:grid-cols-[9rem_1fr] sm:items-center">
                  <legend className="sr-only">{DAYS[d]}</legend>
                  <label className="flex items-center gap-3 font-medium">
                    <input type="checkbox" name={`open_${d}`} defaultChecked={a?.is_open ?? false} className="h-5 w-5 accent-[#17382c]" />
                    {DAYS[d]}
                  </label>
                  <div className="flex flex-wrap items-end gap-3">
                    <label className="text-xs text-charcoal/65">Opens<input type="time" name={`from_${d}`} defaultValue={hhmm(a?.open_time)} className={t} /></label>
                    <label className="text-xs text-charcoal/65">Closes<input type="time" name={`to_${d}`} defaultValue={hhmm(a?.close_time)} className={t} /></label>
                    <label className="text-xs text-charcoal/65">Break from<input type="time" name={`bstart_${d}`} defaultValue={hhmm(a?.break_start)} className={t} /></label>
                    <label className="text-xs text-charcoal/65">Break to<input type="time" name={`bend_${d}`} defaultValue={hhmm(a?.break_end)} className={t} /></label>
                    <label className="text-xs text-charcoal/65">Appointment
                      <select name={`slot_${d}`} defaultValue={String(a?.slot_minutes ?? 60)} className={`${inputCls} w-32`}>
                        {[15, 20, 30, 45, 60, 90].map((m) => <option key={m} value={m}>{m} minutes</option>)}
                      </select>
                    </label>
                  </div>
                </fieldset>
              );
            })}
            <SubmitButton>Save availability</SubmitButton>
          </div>
        </ActionForm>
      </Card>

      <Card className="mt-6">
        <h2 className="font-serif text-h3 text-forest">Days off</h2>
        <p className="mt-1 text-sm text-charcoal/65">Block public holidays, court days or leave. Clients cannot book these dates.</p>
        <ul className="mt-4 divide-y divide-stone">
          {(exc.data ?? []).length === 0 && <li className="py-3 text-charcoal/70">No upcoming days off.</li>}
          {(exc.data ?? []).map((e: any) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <span>
                {new Intl.DateTimeFormat("en-KE", { dateStyle: "full", timeZone: "UTC" }).format(new Date(`${e.on_date}T00:00:00Z`))}
                {e.reason && <span className="text-charcoal/70"> · {e.reason}</span>}
              </span>
              <DeleteForm action={deleteException} id={e.id} label="Remove" confirmText="Allow bookings on this date again?" />
            </li>
          ))}
        </ul>
        <ActionForm action={addException}>
          <div className="mt-5 flex flex-wrap items-end gap-3">
            <AField label="Date"><input type="date" name="on_date" min={nairobiToday()} required className={`${inputCls} w-48`} /></AField>
            <AField label="Reason (optional)"><input name="reason" maxLength={120} placeholder="e.g. Madaraka Day" className={`${inputCls} w-64`} /></AField>
            <SubmitButton pendingText="Adding…">Block date</SubmitButton>
          </div>
        </ActionForm>
      </Card>
    </>
  );
}
