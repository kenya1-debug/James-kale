import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PracticeIcon } from "./practice-icon";

export function PracticeCard({
  href,
  icon,
  title,
  summary,
  cta,
}: {
  href: string;
  icon: string | null;
  title: string;
  summary: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col border border-stone bg-white/60 p-7 transition duration-300 hover:-translate-y-1 hover:border-brass hover:bg-white hover:shadow-lg"
    >
      <PracticeIcon name={icon} className="mb-5 h-8 w-8 text-brass-text" />
      <h3 className="font-serif text-h3 text-forest">{title}</h3>
      <p className="mt-3 flex-1 text-charcoal/75">{summary}</p>
      <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-forest">
        {cta}
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
      </span>
    </Link>
  );
}
