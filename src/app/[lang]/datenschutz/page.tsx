import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LegalPageTemplate } from "@/components/legal-page-template";
import { LEGAL_COPY } from "@/lib/content/site-copy";
import type { Language } from "@/lib/i18n";
import { alternatesForPath } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Language }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: "Datenschutz",
    description: "Informationen zum Datenschutz.",
    alternates: alternatesForPath({ lang, pathAfterLang: "/datenschutz" }),
  };
}

export default async function DatenschutzPage({
  params,
}: {
  params: Promise<{ lang: Language }>;
}) {
  const { lang } = await params;
  if (lang !== "de") {
    redirect(`/${lang}/privacy`);
  }

  return (
    <LegalPageTemplate
      eyebrow={LEGAL_COPY.datenschutz_de.eyebrow}
      title={LEGAL_COPY.datenschutz_de.title}
      subtitle={LEGAL_COPY.datenschutz_de.subtitle}
      chips={LEGAL_COPY.datenschutz_de.chips}
      sections={LEGAL_COPY.datenschutz_de.sections}
      note={LEGAL_COPY.datenschutz_de.note}
    />
  );
}
