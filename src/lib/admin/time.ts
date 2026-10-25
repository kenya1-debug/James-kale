// Kenya has no daylight saving: always UTC+3
const TZ = "Africa/Nairobi";

export function formatNairobi(iso: string, opts: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" }) {
  return new Intl.DateTimeFormat("en-KE", { timeZone: TZ, ...opts }).format(new Date(iso));
}

function parts(d: Date) {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(d);
  const g = (t: string) => p.find((x) => x.type === t)!.value;
  return { y: g("year"), m: g("month"), d: g("day"), h: g("hour"), min: g("minute") };
}

export const nairobiToday = () => {
  const p = parts(new Date());
  return `${p.y}-${p.m}-${p.d}`;
};

/** ISO timestamp → value for <input type="datetime-local"> in Kenya time */
export function toNairobiInput(iso: string | null | undefined) {
  if (!iso) return "";
  const p = parts(new Date(iso));
  return `${p.y}-${p.m}-${p.d}T${p.h}:${p.min}`;
}

/** <input type="datetime-local"> value (Kenya time) → ISO timestamp, or null if invalid/empty */
export function fromNairobiInput(v: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return null;
  const d = new Date(`${v}:00+03:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export const fmtClock = (t: string) => {
  const [h, m] = t.slice(0, 5).split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};
