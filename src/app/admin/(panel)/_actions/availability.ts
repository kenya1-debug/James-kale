"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { done, fail, type ActionState } from "@/lib/admin/result";
import { nairobiToday } from "@/lib/admin/time";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export async function saveAvailability(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const rows = [];
  for (let d = 0; d < 7; d++) {
    const is_open = fd.get(`open_${d}`) === "on";
    const g = (k: string) => String(fd.get(`${k}_${d}`) ?? "").trim();
    const slot = Number(g("slot"));
    if (![15, 20, 30, 45, 60, 90].includes(slot)) return fail(`${DAYS[d]}: choose a valid appointment length.`);

    if (!is_open) {
      rows.push({ day_of_week: d, is_open: false, open_time: null, close_time: null, break_start: null, break_end: null, slot_minutes: slot });
      continue;
    }
    const [o, c, bs, be] = [g("from"), g("to"), g("bstart"), g("bend")];
    if (!TIME.test(o) || !TIME.test(c)) return fail(`${DAYS[d]}: enter the opening and closing times.`);
    if (toMin(o) >= toMin(c)) return fail(`${DAYS[d]}: closing time must be after opening time.`);
    if (toMin(c) - toMin(o) < slot) return fail(`${DAYS[d]}: the open period is shorter than one appointment.`);
    if ((bs && !be) || (!bs && be)) return fail(`${DAYS[d]}: give both a break start and a break end, or leave both empty.`);
    if (bs && be && (!TIME.test(bs) || !TIME.test(be) || toMin(bs) >= toMin(be))) return fail(`${DAYS[d]}: the break end must be after the break start.`);
    rows.push({ day_of_week: d, is_open: true, open_time: o, close_time: c, break_start: bs || null, break_end: be || null, slot_minutes: slot });
  }
  const supabase = await createClient();
  const { error } = await supabase.from("availability").upsert(rows, { onConflict: "day_of_week" });
  if (error) return fail("Could not save. Please try again.");
  return done("Availability saved. The booking form uses it immediately.");
}

export async function addException(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const p = z
    .object({ on_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."), reason: z.string().trim().max(120) })
    .safeParse({ on_date: String(fd.get("on_date") ?? ""), reason: String(fd.get("reason") ?? "") });
  if (!p.success) return fail(p.error.issues[0].message);
  if (p.data.on_date < nairobiToday()) return fail("Choose a date that has not passed.");
  const supabase = await createClient();
  const { error } = await supabase.from("availability_exceptions").insert({ on_date: p.data.on_date, reason: p.data.reason || null });
  if (error) return fail(error.code === "23505" ? "That date is already blocked." : "Could not add the date.");
  return done("Date blocked.");
}

export async function deleteException(fd: FormData) {
  await requireAdmin();
  const id = z.uuid().safeParse(fd.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from("availability_exceptions").delete().eq("id", id.data);
}
