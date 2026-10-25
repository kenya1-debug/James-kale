import Link from "next/link";
import { MessageCircle, Phone } from "lucide-react";
import { buttonClass } from "@/components/ui/button";

/** Fixed call/WhatsApp bar for phones. Falls back to a Book button until contact numbers are set. */
export function StickyContactBar({
  tel,
  wa,
  bookHref,
  labels,
}: {
  tel: string | null;
  wa: string | null;
  bookHref: string;
  labels: { call: string; whatsapp: string; book: string };
}) {
  const item = "flex-1 px-3 py-3 text-[0.95rem]";
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-white/10 bg-ink/95 p-2 backdrop-blur md:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      {tel && (
        <a href={tel} className={buttonClass("primary", item)} data-track="call">
          <Phone className="h-4 w-4" aria-hidden="true" /> {labels.call}
        </a>
      )}
      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer" className={buttonClass("whatsapp", item)} data-track="whatsapp">
          <MessageCircle className="h-4 w-4" aria-hidden="true" /> {labels.whatsapp}
        </a>
      )}
      {!tel && !wa && (
        <Link href={bookHref} className={buttonClass("primary", item)}>
          {labels.book}
        </Link>
      )}
    </div>
  );
}
