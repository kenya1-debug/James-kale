import { LEGAL_UPDATED, type LegalDoc } from "@/content/legal";
import { Container, PageHeader } from "./section";

export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <main id="main">
      <PageHeader title={doc.title} intro={doc.intro} />
      <article className="py-16 sm:py-20">
        <Container className="max-w-3xl">
          <p className="mb-10 text-sm text-charcoal/70">Last updated: {LEGAL_UPDATED}</p>
          <div className="space-y-10">
            {doc.sections.map((s) => (
              <section key={s.heading}>
                <h2 className="font-serif text-h3 text-forest">{s.heading}</h2>
                {s.paragraphs?.map((p, i) => (
                  <p key={i} className="mt-3 text-charcoal/85">{p}</p>
                ))}
                {s.bullets && (
                  <ul className="mt-3 list-disc space-y-2 pl-6 text-charcoal/85">
                    {s.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </Container>
      </article>
    </main>
  );
}
