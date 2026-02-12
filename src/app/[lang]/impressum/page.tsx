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

  const sections = [
    {
      title: "Angaben gemäß § 5 TMG",
      description: "Basisdaten zum Anbieter für den aktuellen Projektstand.",
      infoItems: [
        { label: "Name", value: "Markus Öffel (Markus Öffel's Website)" },
        {
          label: "Anschrift",
          value: "Ausstellungsstraße 55, 1020 Wien, Österreich",
        },
      ],
    },
    {
      title: "Kontakt",
      infoItems: [{ label: "E-Mail", value: "markus.oeffel@gmail.com" }],
      paragraphs: [
        "Bei Projektanfragen bitte Kontext, Ziel und gewünschte Timeline angeben.",
      ],
    },
    {
      title: "Haftung für Inhalte",
      paragraphs: [
        "Die Inhalte dieser Website werden mit Sorgfalt erstellt. Für Richtigkeit, Vollständigkeit und Aktualität kann dennoch keine Gewähr übernommen werden.",
      ],
    },
    {
      title: "Haftung für Links",
      listItems: [
        "Externe Links werden bei Aufnahme geprüft.",
        "Eine permanente inhaltliche Kontrolle verlinkter Seiten ist ohne konkrete Hinweise auf Rechtsverletzungen nicht zumutbar.",
      ],
    },
  ] as const;

  return (
    <LegalPageTemplate
      eyebrow="Rechtliche Angaben"
      title="Impressum"
      subtitle="Rechtliche Anbieterangaben für Markus Öffel's Website."
      chips={["Inhabergeführt", `${sections.length} Abschnitte`, "Stand 11.02.2026"]}
      sections={sections}
      note="Diese Seite dient der transparenten Anbieterkennzeichnung und Kontaktaufnahme."
    />
  );
}
