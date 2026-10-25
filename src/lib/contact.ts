import type { Settings } from "@/lib/data";

/** Normalise a Kenyan number to international digits, e.g. 0712 345 678 → 254712345678 */
export function normalizeNumber(raw: string) {
  const d = raw.replace(/\D/g, "");
  if (d.startsWith("254")) return d;
  if (d.startsWith("0")) return `254${d.slice(1)}`;
  if (d.length === 9 && /^[17]/.test(d)) return `254${d}`;
  return d;
}

export const telHref = (phone: string) => `tel:+${normalizeNumber(phone)}`;

export const waHref = (phone: string, text?: string) =>
  `https://wa.me/${normalizeNumber(phone)}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

export function getContact(s: Settings) {
  const phone = s.firm.phone.trim();
  const whatsapp = (s.firm.whatsapp || s.firm.phone).trim();
  const email = s.firm.email.trim();
  return {
    phone: phone || null,
    email: email || null,
    tel: phone ? telHref(phone) : null,
    wa: whatsapp ? waHref(whatsapp, "Hello, I would like to ask about a legal matter.") : null,
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${s.firm.lat},${s.firm.lng}`,
    osmEmbed: `https://www.openstreetmap.org/export/embed.html?bbox=${s.firm.lng - 0.004}%2C${s.firm.lat - 0.003}%2C${s.firm.lng + 0.004}%2C${s.firm.lat + 0.003}&layer=mapnik&marker=${s.firm.lat}%2C${s.firm.lng}`,
  };
}
