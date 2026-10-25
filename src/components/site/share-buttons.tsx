const pill =
  "rounded-full border border-forest/30 px-4 py-1.5 text-sm text-forest transition hover:bg-forest hover:text-ivory";

export function ShareButtons({ url, title, label }: { url: string; title: string; label: string }) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const links = [
    { name: "WhatsApp", href: `https://wa.me/?text=${t}%20${u}` },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { name: "X", href: `https://x.com/intent/post?text=${t}&url=${u}` },
    { name: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
  ];
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-charcoal/70">{label}</span>
      {links.map((l) => (
        <a key={l.name} href={l.href} target="_blank" rel="noopener noreferrer" className={pill}>
          {l.name}
        </a>
      ))}
    </div>
  );
}
