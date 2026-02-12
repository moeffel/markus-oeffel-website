import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LegalPageTemplate } from "@/components/legal-page-template";
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

  const sections = [
    {
      title: "Provider",
      description: "Website operator details for legal contact and notices.",
      infoItems: [
        { label: "Name", value: "Markus Öffel (Markus Öffel's Website)" },
        {
          label: "Address",
          value: "Ausstellungsstraße 55, 1020 Vienna, Austria",
        },
      ],
    },
    {
      title: "Contact",
      description: "Primary legal and operational contact channel.",
      infoItems: [{ label: "Email", value: "markus.oeffel@gmail.com" }],
      paragraphs: [
        "For project inquiries, include context, objective, and timeline in your message.",
      ],
    },
    {
      title: "Content responsibility",
      paragraphs: [
        "The website content is created with care. No guarantee is provided for completeness, correctness, or uninterrupted availability.",
      ],
    },
    {
      title: "Liability for links",
      listItems: [
        "External links are reviewed when they are added.",
        "Permanent monitoring of linked third-party content is not feasible without concrete indications of legal issues.",
      ],
    },
  ] as const;

  return (
    <LegalPageTemplate
      eyebrow="Legal Notice"
      title="Imprint"
      subtitle="Legal notice for Markus Öffel's Website."
      chips={["Owner-managed", `${sections.length} sections`, "Updated 2026-02-11"]}
      sections={sections}
      note={
        "This legal notice is provided for transparency of operator and contact details."
      }
    />
  );
}
