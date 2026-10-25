import "server-only";
import { supabasePublic as db } from "@/lib/supabase/public";
import type { SlotResult } from "./schemas";

const TZ = "Africa/Nairobi";
export const MAX_DAYS_AHEAD = 60;
const LEAD_MINUTES = 120; // same-day bookings need at least 2 hours' notice

function nairobiNow() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return { date: `${get("year")}-${get("month")}-${get("day")}`, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export async function getSlotsForDate(date: string): Promise<SlotResult> {
  const fail = (reason: SlotResult["reason"]): SlotResult => ({ date, open: false, reason, slots: [] });

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail("invalid");
  const d = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== date) return fail("invalid");

  const now = nairobiNow();
  if (date < now.date) return fail("past");
  const last = new Date(`${now.date}T00:00:00Z`);
  last.setUTCDate(last.getUTCDate() + MAX_DAYS_AHEAD);
  if (d > last) return fail("too_far");

  const dow = d.getUTCDay(); // calendar weekday of that date, independent of server timezone

  const [avail, exception, booked] = await Promise.all([
    db.from("availability").select("is_open, open_time, close_time, break_start, break_end, slot_minutes").eq("day_of_week", dow).maybeSingle(),
    db.from("availability_exceptions").select("id").eq("on_date", date).maybeSingle(),
    db.rpc("get_booked_slots", { p_date: date }),
  ]);

  if (exception.data) return fail("holiday");
  const a = avail.data;
  if (!a || !a.is_open || !a.open_time || !a.close_time) return fail("closed");

  const taken = new Set<number>(((booked.data ?? []) as { slot: string }[]).map((r) => toMin(r.slot.slice(0, 5))));
  const open = toMin(a.open_time.slice(0, 5));
  const close = toMin(a.close_time.slice(0, 5));
  const len = Number(a.slot_minutes) || 60;
  const bStart = a.break_start ? toMin(a.break_start.slice(0, 5)) : null;
  const bEnd = a.break_end ? toMin(a.break_end.slice(0, 5)) : null;

  const slots: string[] = [];
  for (let t = open; t + len <= close; t += len) {
    if (bStart !== null && bEnd !== null && t < bEnd && t + len > bStart) continue;
    if (taken.has(t)) continue;
    if (date === now.date && t < now.minutes + LEAD_MINUTES) continue;
    slots.push(fmt(t));
  }
  return { date, open: true, slots };
}
