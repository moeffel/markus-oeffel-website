import type { Language } from "@/lib/i18n";

export type LegalInfoItem = {
  label: string;
  value: string;
};

export type LegalSection = {
  title: string;
  description?: string;
  paragraphs?: readonly string[];
  listItems?: readonly string[];
  infoItems?: readonly LegalInfoItem[];
};

export const LANDING_COPY: Record<
  Language,
  {
    headline: string;
    sub: string;
    trustPoints: readonly string[];
    askSignalLine: string;
  }
> = {
  de: {
    headline: "FinTech Builder. Trust-first. Subtil frech.",
    sub: "Premium Engineering für Payments, Risk & AI—ohne Buzzword-Wolke.",
    trustPoints: [
      "Trust-first Architektur für regulierte Umgebungen",
      "Delivery mit klaren KPIs statt Buzzword-Roadmaps",
      "AI nur mit belastbaren Quellen und Kostenkontrolle",
      "CFA Level I Kandidat — Prüfung geplant für August 2026",
    ],
    askSignalLine: "Antworten mit Quellen, nicht mit Halluzinationen.",
  },
  en: {
    headline: "FinTech builder. Trust-first. Subtly bold.",
    sub: "Premium engineering for payments, risk & AI—without the buzzword fog.",
    trustPoints: [
      "Trust-first architecture for regulated environments",
      "Delivery with clear KPIs instead of buzzword roadmaps",
      "AI only with reliable sources and cost controls",
      "CFA Level I candidate — exam planned for August 2026",
    ],
    askSignalLine: "Answers with citations, not hallucinations.",
  },
};

export const CONTACT_COPY: Record<
  Language,
  {
    eyebrow: string;
    title: string;
    subtitle: string;
    asideTitle: string;
    asideBody: string;
    responseLabel: string;
    responseValue: string;
    scopeLabel: string;
    scopeValue: string;
  }
> = {
  de: {
    eyebrow: "Start a project",
    title: "Kontakt",
    subtitle: "Schreib kurz, worum es geht.",
    asideTitle: "Prefer async?",
    asideBody:
      "Schick Kontext + Ziel + Deadline. Du bekommst einen klaren Plan als Antwort.",
    responseLabel: "Response",
    responseValue: "Innerhalb von 24h",
    scopeLabel: "Scope",
    scopeValue: "FinTech, Risk, AI, Data",
  },
  en: {
    eyebrow: "Start a project",
    title: "Contact",
    subtitle: "Send a short note.",
    asideTitle: "Prefer async?",
    asideBody: "Send context + goal + deadline. You’ll get a clear execution plan.",
    responseLabel: "Response",
    responseValue: "Within 24h",
    scopeLabel: "Scope",
    scopeValue: "FinTech, risk, AI, data",
  },
};

export const LEGAL_COPY = {
  privacy_en: {
    href: "/en/privacy",
    eyebrow: "Privacy baseline",
    title: "Privacy policy",
    subtitle:
      "Transparency notice for contact handling, security controls, and data retention in this portfolio setup.",
    chips: ["No profiling", "4 sections", "Updated 2026-02-11"],
    note: "If this setup changes, this policy is updated accordingly.",
    sections: [
      {
        title: "Controller",
        paragraphs: [
          "Controller: Markus Öffel (Markus Öffel's Website), Ausstellungsstraße 55, 1020 Vienna, Austria.",
          "Contact: markus.oeffel@gmail.com",
        ],
      },
      {
        title: "Data processing context",
        description:
          "This section describes what data is processed in the current setup.",
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
    ] as const satisfies readonly LegalSection[],
  },
  imprint_en: {
    href: "/en/imprint",
    eyebrow: "Legal Notice",
    title: "Imprint",
    subtitle: "Legal notice for Markus Öffel's Website.",
    chips: ["Owner-managed", "4 sections", "Updated 2026-02-11"],
    note:
      "This legal notice is provided for transparency of operator and contact details.",
    sections: [
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
    ] as const satisfies readonly LegalSection[],
  },
  impressum_de: {
    href: "/de/impressum",
    eyebrow: "Rechtliche Angaben",
    title: "Impressum",
    subtitle: "Rechtliche Anbieterangaben für Markus Öffel's Website.",
    chips: ["Inhabergeführt", "4 Abschnitte", "Stand 11.02.2026"],
    note:
      "Diese Seite dient der transparenten Anbieterkennzeichnung und Kontaktaufnahme.",
    sections: [
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
    ] as const satisfies readonly LegalSection[],
  },
  datenschutz_de: {
    href: "/de/datenschutz",
    eyebrow: "Datenschutz-Basis",
    title: "Datenschutzerklärung",
    subtitle:
      "Transparenztext für Kontaktverarbeitung, Sicherheitsmaßnahmen und Aufbewahrung.",
    chips: ["Kein Profiling", "4 Abschnitte", "Stand 11.02.2026"],
    note:
      "Bei Änderungen am Verarbeitungsumfang wird diese Datenschutzerklärung angepasst.",
    sections: [
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
    ] as const satisfies readonly LegalSection[],
  },
} as const;

