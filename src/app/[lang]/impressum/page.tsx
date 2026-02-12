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
    title: "Impressum",
    description: "Anbieterkennzeichnung gemäß §5 TMG.",
    alternates: alternatesForPath({ lang, pathAfterLang: "/impressum" }),
  };
}

export default async function ImpressumPage({
  params,
}: {
  params: Promise<{ lang: Language }>;
}) {
  const { lang } = await params;
  if (lang !== "de") {
    redirect(`/${lang}/imprint`);
  }

  return (
    <LegalPageTemplate
      eyebrow={LEGAL_COPY.impressum_de.eyebrow}
      title={LEGAL_COPY.impressum_de.title}
      subtitle={LEGAL_COPY.impressum_de.subtitle}
      chips={LEGAL_COPY.impressum_de.chips}
      sections={LEGAL_COPY.impressum_de.sections}
      note={LEGAL_COPY.impressum_de.note}
    />
  );
}
