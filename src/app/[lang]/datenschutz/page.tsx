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

  const sections = [
    {
      title: "Verantwortlicher",
      paragraphs: [
        "Verantwortlicher: Markus Öffel (Markus Öffel's Website), Ausstellungsstraße 55, 1020 Wien, Österreich.",
        "Kontakt: markus.oeffel@gmail.com",
      ],
    },
    {
      title: "Verarbeitungszwecke",
      description: "Welche Daten im aktuellen Stand verarbeitet werden.",
      listItems: [
        "Kontaktanfragen über das Formular (Name, E-Mail, Nachricht, optional Unternehmen/Anliegen).",
        "Technische Logs zur Stabilität und zum Missbrauchsschutz.",
        "Keine beabsichtigte personenbezogene Profilbildung.",
      ],
    },
    {
      title: "Sicherheitsmaßnahmen",
      listItems: [
        "Eingabevalidierung und API-Schema-Prüfungen.",
        "Rate Limiting für Formulare und API-Endpunkte.",
        "Optionale Captcha-/Turnstile-Prüfungen im Hardening.",
      ],
    },
    {
      title: "Speicherdauer und Löschung",
      paragraphs: [
        "Daten werden nur so lange gespeichert, wie es für Anfragebearbeitung, Sicherheit und gesetzliche Pflichten erforderlich ist.",
        "Nicht mehr erforderliche Datensätze werden gelöscht oder anonymisiert.",
      ],
    },
  ] as const;

  return (
    <LegalPageTemplate
      eyebrow="Datenschutz-Basis"
      title="Datenschutzerklärung"
      subtitle="Transparenztext für Kontaktverarbeitung, Sicherheitsmaßnahmen und Aufbewahrung."
      chips={["Kein Profiling", `${sections.length} Abschnitte`, "Stand 11.02.2026"]}
      sections={sections}
      note="Bei Änderungen am Verarbeitungsumfang wird diese Datenschutzerklärung angepasst."
    />
  );
}
