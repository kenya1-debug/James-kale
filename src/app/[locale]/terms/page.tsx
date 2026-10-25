import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, localePath } from "@/lib/i18n/config";
import { terms as doc } from "@/content/legal";
import { LegalPage } from "@/components/site/legal-page";
import { withSeo } from "@/lib/seo";

export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return withSeo(locale, "/terms", { title: doc.title, description: doc.description });
}

// Legal text is English-only for now; have a native speaker translate before enabling /sw versions.
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <LegalPage doc={doc} />;
}
