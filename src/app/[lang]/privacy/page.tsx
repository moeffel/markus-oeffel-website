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
    title: "Privacy",
    description: "Privacy policy.",
    alternates: alternatesForPath({ lang, pathAfterLang: "/privacy" }),
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ lang: Language }>;
}) {
  const { lang } = await params;
  if (lang !== "en") {
    redirect(`/${lang}/datenschutz`);
  }

  return (
    <LegalPageTemplate
      eyebrow={LEGAL_COPY.privacy_en.eyebrow}
      title={LEGAL_COPY.privacy_en.title}
      subtitle={LEGAL_COPY.privacy_en.subtitle}
      chips={LEGAL_COPY.privacy_en.chips}
      sections={LEGAL_COPY.privacy_en.sections}
      note={LEGAL_COPY.privacy_en.note}
    />
  );
}
