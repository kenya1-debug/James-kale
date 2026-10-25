import { Plus } from "lucide-react";

/** Native <details>: keyboard accessible, works without JavaScript */
export function FaqList({ items }: { items: { id: string; q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-stone border-y border-stone">
      {items.map((item) => (
        <details key={item.id} className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-left font-serif text-xl text-forest [&::-webkit-details-marker]:hidden">
            {item.q}
            <Plus className="h-5 w-5 shrink-0 text-brass-text transition-transform duration-300 group-open:rotate-45" aria-hidden="true" />
          </summary>
          <p className="mt-3 max-w-3xl text-charcoal/80">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
