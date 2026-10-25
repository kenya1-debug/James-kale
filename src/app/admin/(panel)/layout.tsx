import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminNav, type NavItem } from "@/components/admin/nav";
import { signOut } from "./actions";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const me = await requireStaff();
  const supabase = await createClient();

  const [c, m] = await Promise.all([
    supabase.from("consultations").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);

  const items: NavItem[] = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/consultations", label: "Consultations", badge: c.count ?? 0 },
    { href: "/admin/messages", label: "Messages", badge: m.count ?? 0 },
  ];
  if (me.role === "admin") {
    items.push(
      { href: "/admin/posts", label: "Blog posts" },
      { href: "/admin/content/practice-areas", label: "Practice areas" },
      { href: "/admin/content/faqs", label: "FAQs" },
      { href: "/admin/content/testimonials", label: "Testimonials" },
      { href: "/admin/availability", label: "Availability" },
      { href: "/admin/settings", label: "Site settings" },
      { href: "/admin/team", label: "Team" },
    );
  }

  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between bg-ink px-5 py-4 text-ivory sm:px-8">
        <span className="font-serif text-xl">Kale &amp; Co. · Admin</span>
        <div className="flex items-center gap-4 text-sm">
          <span className="hidden text-ivory/70 sm:inline">{me.full_name ?? me.email} · {me.role}</span>
          <a href="/" target="_blank" rel="noopener" className="hidden text-ivory/70 underline sm:inline">View site</a>
          <form action={signOut}>
            <button className="rounded-sm border border-brass px-3 py-1.5 text-brass transition hover:bg-brass hover:text-ink">Sign out</button>
          </form>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
        <aside className="mb-6 lg:mb-0"><AdminNav items={items} /></aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
