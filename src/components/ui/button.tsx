import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const base =
  "inline-flex items-center justify-center gap-2 rounded-sm px-6 py-3 text-base font-medium transition duration-200";

const variants = {
  primary: "bg-brass text-ink hover:bg-[#c9a35a]",
  dark: "bg-forest text-ivory hover:bg-ink",
  outline: "border border-current hover:bg-white/10",
  outlineDark: "border border-forest text-forest hover:bg-forest hover:text-ivory",
  whatsapp: "bg-whatsapp text-white hover:bg-[#186a42]",
} as const;

export type ButtonVariant = keyof typeof variants;

export function buttonClass(variant: ButtonVariant = "primary", className?: string) {
  return cn(base, variants[variant], className);
}

type Props = Omit<ComponentProps<"a">, "href"> & { href: string; variant?: ButtonVariant };

/** Internal paths use next/link; http(s), tel: and mailto: use a plain anchor. */
export function ButtonLink({ href, variant = "primary", className, children, ...rest }: Props) {
  const cls = buttonClass(variant, className);
  const external = /^(https?:|tel:|mailto:)/.test(href);
  if (external) {
    const isHttp = href.startsWith("http");
    return (
      <a href={href} className={cls} {...(isHttp ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} {...rest}>
      {children}
    </Link>
  );
}
