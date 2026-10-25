export type CsvColumn = { key: string; label: string };

/** Excel-safe CSV: guards against formula injection and adds a BOM so Excel reads UTF-8. */
export function toCsv(rows: Record<string, unknown>[], columns: CsvColumn[]) {
  const esc = (v: unknown) => {
    let s = v == null ? "" : String(v);
    // Neutralise cells that spreadsheets would treat as formulas (phone numbers like +254… are fine)
    if (/^[=+\-@\t\r]/.test(s) && !/^\+?[\d\s-]+$/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const lines = [columns.map((c) => esc(c.label)).join(","), ...rows.map((r) => columns.map((c) => esc(r[c.key])).join(","))];
  return `\uFEFF${lines.join("\r\n")}`;
}
