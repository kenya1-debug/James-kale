import { cn } from "@/lib/utils";

export function Container({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8", className)}>{children}</div>;
}

export function Eyebrow({ children, tone = "light" }: { children: React.ReactNode; tone?: "light" | "dark" }) {
  return (
    <p className={cn("mb-3 text-sm font-medium uppercase tracking-[0.2em]", tone === "dark" ? "text-brass" : "text-brass-text")}>
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  tone = "light",
  className,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      {eyebrow && <Eyebrow tone={tone}>{eyebrow}</Eyebrow>}
      <h2 className={cn("font-serif text-h2", tone === "dark" ? "text-ivory" : "text-forest")}>{title}</h2>
      {intro && <p className={cn("mt-4 text-lg", tone === "dark" ? "text-ivory/75" : "text-charcoal/75")}>{intro}</p>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, intro }: { eyebrow?: string; title: string; intro?: string }) {
  return (
    <header className="bg-ink pb-16 pt-20 text-ivory sm:pb-20 sm:pt-28">
      <Container>
        <div className="max-w-3xl">
          {eyebrow && <Eyebrow tone="dark">{eyebrow}</Eyebrow>}
          <h1 className="font-serif text-h1">{title}</h1>
          {intro && <p className="mt-5 text-lg text-ivory/75">{intro}</p>}
        </div>
      </Container>
    </header>
  );
}
