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
    title: "Imprint",
    description: "Legal notice.",
    alternates: alternatesForPath({ lang, pathAfterLang: "/imprint" }),
  };
}

export default async function ImprintPage({
  params,
}: {
  params: Promise<{ lang: Language }>;
}) {
  const { lang } = await params;
  if (lang !== "en") {
    redirect(`/${lang}/impressum`);
  }

  return (
    <LegalPageTemplate
      eyebrow={LEGAL_COPY.imprint_en.eyebrow}
      title={LEGAL_COPY.imprint_en.title}
      subtitle={LEGAL_COPY.imprint_en.subtitle}
      chips={LEGAL_COPY.imprint_en.chips}
      sections={LEGAL_COPY.imprint_en.sections}
      note={LEGAL_COPY.imprint_en.note}
    />
  );
}
