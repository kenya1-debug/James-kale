import { ButtonLink } from "@/components/ui/button";
import { Container } from "./section";

export function CtaBand({
  title,
  text,
  bookHref,
  bookLabel,
  waHref,
  waLabel,
}: {
  title: string;
  text: string;
  bookHref: string;
  bookLabel: string;
  waHref: string | null;
  waLabel: string;
}) {
  return (
    <section className="bg-forest py-20 text-ivory sm:py-24">
      <Container className="text-center">
        <h2 className="mx-auto max-w-2xl font-serif text-h2">{title}</h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ivory/75">{text}</p>
        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <ButtonLink href={bookHref}>{bookLabel}</ButtonLink>
          {waHref && (
            <ButtonLink href={waHref} variant="whatsapp" data-track="whatsapp">
              {waLabel}
            </ButtonLink>
          )}
        </div>
      </Container>
    </section>
  );
}
