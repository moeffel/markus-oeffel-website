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

type LandingFocusArea = {
  title: string;
  note: string;
};

export const LANDING_COPY: Record<
  Language,
  {
    headline: string;
    sub: string;
    proofChips: readonly string[];
    trustPoints: readonly string[];
    aboutEyebrow: string;
    aboutTitle: string;
    aboutSubtitle: string;
    aboutParagraphs: readonly string[];
    aboutHighlights: readonly string[];
    askTitle: string;
    askSubtitle: string;
    askExamplePrompts: readonly string[];
    ragTitle: string;
    ragSteps: readonly string[];
    ragGuardrails: readonly string[];
    focusTitle: string;
    focusAreas: readonly LandingFocusArea[];
  }
> = {
  de: {
    headline: "Hi, ich bin Markus Öffel.",
    sub: "Ich arbeite an FinTech-, Quant- und AI-Projekten mit Fokus auf nachvollziehbare Modelle, klare Datenflüsse und reale Umsetzbarkeit.",
    proofChips: [
      "MSc Finance",
      "BSc Innovationsmanagement",
      "Google Advanced Data Analytics",
      "Gewerblicher Vermögensberater (WKO-Prüfung)",
    ],
    trustPoints: [
      "Architektur zuerst: erst klare Systemgrenzen, dann Features.",
      "Messbar liefern: KPIs, SLOs und saubere Runbooks statt Roadmap-Show.",
      "AI mit Belegen: RAG + Citations statt Halluzinationen.",
      "Regulatorische Realität: Datenschutz, Auditability und Kostenkontrolle von Anfang an.",
    ],
    aboutEyebrow: "Über mich",
    aboutTitle: "MSc Finance mit Tech-, Quant- und Delivery-Fokus.",
    aboutSubtitle:
      "Ich verbinde Finance-Ausbildung, Produktarbeit und datenbasierte Umsetzung – pragmatisch, strukturiert und lernorientiert.",
    aboutParagraphs: [
      "Aktuell arbeite ich als Product Owner im Finanzierungsumfeld und treibe in einer internen AI-Taskforce erste Agentic- und Automations-Workflows voran.",
      "In meiner täglichen Arbeit verbinde ich Sales-, Finance- und Produktperspektive: von sauberer Datengrundlage bis zur Entscheidungsvorlage für Management und Vertrieb.",
      "Mein quantitativer Schwerpunkt liegt auf Zeitreihen, Volatilität und Risikoevaluation – umgesetzt in reproduzierbaren Analysen statt Einmal-Auswertungen.",
      "Innovation Management ist für mich praktische Routine: neue Perspektiven testen, Annahmen explizit machen, und schnell in belastbare Prototypen überführen.",
      "Die Masterarbeit zu ARIMA-GARCH ergänzt das Profil durch methodische Tiefe in Forecasting, Backtesting und VaR-Logik.",
    ],
    aboutHighlights: [
      "Agentic Engineering: Orchestrierung, Spezifikation, Testing und geschlossene agentische Loops.",
      "Innovation Management: kreative Ansätze, neue Blickwinkel, strukturierte Experimente.",
      "Sales Enablement: kundenzentrierte Insights und Werkzeuge für data-driven Decisions.",
      "Quant/Data: Zeitreihen, Volatilitätsmodelle, Backtesting, Statistik, SQL/Python.",
    ],
    askTitle: "Ask me anything.",
    askSubtitle:
      "Frag zu Projekten, Werdegang, Thesis oder Skills. Antworten basieren auf den Website-Inhalten mit Quellen.",
    askExamplePrompts: [
      "Welche Skills kommen direkt aus MSc, BSc und Zertifikaten?",
      "Wie bist du methodisch in der Masterarbeit vorgegangen?",
      "Welche Themen deckt die WKO-Prüfung zum Vermögensberater ab?",
    ],
    ragTitle: "RAG in 3 Schritten",
    ragSteps: [
      "Frage analysieren und relevante Content-Abschnitte abrufen.",
      "Antwort aus belegten Quellen zusammenstellen.",
      "Ergebnis mit Citations und sinnvollen Next Steps ausgeben.",
    ],
    ragGuardrails: [
      "Antworten basieren auf den publizierten Seiteninhalten, nicht auf freier Spekulation.",
      "Relevante Aussagen kommen mit Quellenhinweis.",
      "Wenn Informationen fehlen, wird das transparent benannt.",
    ],
    focusTitle: "Core Focus",
    focusAreas: [
      {
        title: "Agentic Engineering",
        note: "Orchestrierung, Spezifikation, Testing und geschlossene agentische Loops.",
      },
      {
        title: "Quant & Risk",
        note: "Zeitreihen, Volatilität, Backtesting, decision-ready metrics.",
      },
      {
        title: "Innovation Management",
        note: "Kreative Perspektiven, strukturierte Experimente und schnelle Lernzyklen.",
      },
      {
        title: "Sales Enablement",
        note: "Kundenzentrierte Insights und Werkzeuge für datenbasierte Entscheidungen.",
      },
    ],
  },
  en: {
    headline: "Hi, I’m Markus Öffel.",
    sub: "I work on fintech, quant, and AI projects with a focus on transparent models, clean data flows, and practical delivery.",
    proofChips: [
      "MSc Finance",
      "BSc Innovation Management",
      "Google Advanced Data Analytics",
      "Commercial Asset Advisor Exam (WKO)",
    ],
    trustPoints: [
      "Architecture first: clear system boundaries before feature volume.",
      "Delivery that is measurable: KPIs, SLOs, and real runbooks.",
      "AI with evidence: RAG and citations over hallucinations.",
      "Regulatory reality built in: privacy, auditability, and cost control.",
    ],
    aboutEyebrow: "About me",
    aboutTitle: "MSc finance profile with tech and quant focus.",
    aboutSubtitle:
      "I combine finance education, product execution, and data-driven delivery in one practical operating style.",
    aboutParagraphs: [
      "I currently work as a product owner in financing and help shape first agentic and automation workflows in an internal AI taskforce.",
      "In daily execution, I connect sales, finance, and product views—from clean data foundations to management-ready decision input.",
      "My quantitative focus is time series, volatility, and risk evaluation delivered through reproducible analysis rather than one-off reports.",
      "Innovation management is part of my operating model: test new perspectives, make assumptions explicit, and turn learnings into practical prototypes.",
      "My ARIMA-GARCH thesis adds method depth in forecasting, backtesting, and VaR logic.",
    ],
    aboutHighlights: [
      "Agentic Engineering: orchestration, specification, testing, and closed agentic loops.",
      "Innovation Management: creative approaches, new perspectives, and structured experimentation.",
      "Sales Enablement: customer-centered insights and tooling for data-driven decisions.",
      "Quant/Data: time series, volatility models, backtesting, statistics, SQL/Python.",
    ],
    askTitle: "Ask me anything.",
    askSubtitle:
      "Ask about projects, career, thesis, or skills. Answers stay grounded in site content with citations.",
    askExamplePrompts: [
      "Which skills come directly from your MSc, BSc, and certificates?",
      "What was your thesis method step by step?",
      "What does the commercial asset advisor exam cover?",
    ],
    ragTitle: "RAG in 3 steps",
    ragSteps: [
      "Analyze the question and retrieve relevant content chunks.",
      "Compose the answer from evidence-backed sources.",
      "Return output with citations and actionable next steps.",
    ],
    ragGuardrails: [
      "Answers are grounded in published site content, not free-form speculation.",
      "Relevant claims are returned with source references.",
      "Missing context is explicitly called out instead of guessed.",
    ],
    focusTitle: "Core Focus",
    focusAreas: [
      {
        title: "Agentic Engineering",
        note: "Orchestration, specification, testing, and closed agentic loops.",
      },
      {
        title: "Quant & Risk",
        note: "Time series, volatility, backtesting, decision-ready metrics.",
      },
      {
        title: "Innovation Management",
        note: "Creative approaches, new perspectives, and structured experimentation.",
      },
      {
        title: "Sales Enablement",
        note: "Customer-centered insights and tooling for data-driven decisions.",
      },
    ],
  },
};

export const CONTACT_COPY: Record<
  Language,
  {
    eyebrow: string;
    title: string;
    subtitle: string;
    contactNotes: readonly string[];
  }
> = {
  de: {
    eyebrow: "Start a project",
    title: "Kontakt",
    subtitle: "Schreib kurz, worum es geht.",
    contactNotes: [
      "Pflichtfelder: Name, E-Mail, Nachricht.",
      "CV-Anfrage direkt über den vorbereiteten Contact-Flow möglich.",
      "Fokus: FinTech, Quant, AI, Innovation und Sales Enablement.",
    ],
  },
  en: {
    eyebrow: "Start a project",
    title: "Contact",
    subtitle: "Send a short note.",
    contactNotes: [
      "Required fields: name, email, and message.",
      "CV request is supported via the prefilled contact flow.",
      "Focus: fintech, quant, AI, innovation, and sales enablement.",
    ],
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
