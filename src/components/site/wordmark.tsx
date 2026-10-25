import { cn } from "@/lib/utils";

/** Typographic logo until the client supplies one */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex flex-col leading-none", className)}>
      <span className="font-serif text-2xl font-semibold tracking-tight">
        James Kale <span className="text-brass">&amp;</span> Co.
      </span>
      <span className="mt-1 text-[0.65rem] font-medium uppercase tracking-[0.32em] opacity-70">Advocates</span>
    </span>
  );
}
