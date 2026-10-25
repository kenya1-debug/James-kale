"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string; badge?: number };

export function AdminNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const active = (h: string) => (h === "/admin" ? pathname === "/admin" : pathname.startsWith(h));
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          aria-current={active(i.href) ? "page" : undefined}
          className={cn(
            "flex shrink-0 items-center justify-between gap-3 rounded-sm px-3 py-2 text-sm transition",
            active(i.href) ? "bg-forest text-ivory" : "text-charcoal/80 hover:bg-stone",
          )}
        >
          {i.label}
          {!!i.badge && <span className="rounded-full bg-brass px-2 text-xs font-semibold text-ink">{i.badge}</span>}
        </Link>
      ))}
    </nav>
  );
}
