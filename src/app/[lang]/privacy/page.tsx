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

  const sections = [
    {
      title: "Controller",
      paragraphs: [
        "Controller: Markus Öffel (Markus Öffel's Website), Ausstellungsstraße 55, 1020 Vienna, Austria.",
        "Contact: markus.oeffel@gmail.com",
      ],
    },
    {
      title: "Data processing context",
      description: "This section describes what data is processed in the current setup.",
      listItems: [
        "Contact form submissions (name, email, message, optional company/intent).",
        "Operational request logs for stability and abuse prevention.",
        "No intentional profiling in the current implementation.",
      ],
    },
    {
      title: "Security controls",
      listItems: [
        "Input validation and request schema checks.",
        "Rate limiting to reduce abuse of forms and APIs.",
        "Optional captcha/turnstile checks in hardened mode.",
      ],
    },
    {
      title: "Retention and deletion",
      paragraphs: [
        "Contact and operational data are retained only as long as needed for support, security, and legal obligations.",
        "Delete or anonymize records when retention purpose no longer applies.",
      ],
    },
  ] as const;

  return (
    <LegalPageTemplate
      eyebrow="Privacy baseline"
      title="Privacy policy"
      subtitle="Transparency notice for contact handling, security controls, and data retention in this portfolio setup."
      chips={["No profiling", `${sections.length} sections`, "Updated 2026-02-11"]}
      sections={sections}
      note="If this setup changes, this policy is updated accordingly."
    />
  );
}
